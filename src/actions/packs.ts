"use server";

import { protectAction } from "./protect-action";
import { prisma } from "@/lib/prisma";
import { Card, CardClosed } from "@/lib/types/card";

const COOLDOWN_MINUTES = 20;
const SESSION_EXPIRY_HOURS = 24;

type PackStatus = {
  canOpen: boolean;
  cooldownRemaining: number; // in seconds
  lastOpenedAt: Date | null;
  activeSession: {
    id: string;
    cardsTotal: number;
    cardsAnswered: number;
    cardsClaimed: number;
    expiresAt: Date;
  } | null;
};

type PackResult = {
  cards: CardClosed[];
  packId: string;
};

type PackCardStatus = {
  cardId: string;
  answered: boolean;
  claimed: boolean;
};

type SessionResult = {
  cards: CardClosed[];
  packId: string;
  cardStatus: PackCardStatus[];
};

export async function getPackStatus(): Promise<PackStatus> {
  const user = await protectAction("getPackStatus", true);

  // Get current date
  const now = new Date();

  // Mark expired sessions as completed
  await prisma.packSession.updateMany({
    where: {
      userId: user.userId,
      isCompleted: false,
      expiresAt: {
        lt: now,
      },
    },
    data: {
      isCompleted: true,
    },
  });

  // Check for active pack session
  const activeSession = await prisma.packSession.findUnique({
    where: {
      userId: user.userId,
      isCompleted: false,
      expiresAt: {
        gt: now,
      },
    },
    include: {
      packCards: true,
      _count: {
        select: {
          packCards: true,
        },
      },
    },
  });

  // Get the user's last pack opening time
  const userData = await prisma.user.findUnique({
    where: { id: user.userId },
    select: { lastPackOpenedAt: true },
  });

  // Calculate cooldown and active session stats
  const lastOpenedAt = userData?.lastPackOpenedAt;
  const cooldownMs = COOLDOWN_MINUTES * 60 * 1000;
  const elapsedMs = lastOpenedAt
    ? now.getTime() - lastOpenedAt.getTime()
    : cooldownMs;
  const remainingMs = Math.max(0, cooldownMs - elapsedMs);

  // If there's an active session, user cannot open a new pack regardless of cooldown
  const canOpen = remainingMs === 0 && !activeSession;

  // Format active session data if exists
  const activeSessionData = activeSession
    ? {
        id: activeSession.id,
        cardsTotal: activeSession._count.packCards,
        cardsAnswered: activeSession.packCards.filter((card) => card.answered)
          .length,
        cardsClaimed: activeSession.packCards.filter((card) => card.claimed)
          .length,
        expiresAt: activeSession.expiresAt,
      }
    : null;

  return {
    canOpen,
    cooldownRemaining: Math.ceil(remainingMs / 1000), // convert to seconds
    lastOpenedAt: lastOpenedAt || null,
    activeSession: activeSessionData,
  };
}

export async function openPack(): Promise<PackResult> {
  const user = await protectAction("openPack", true);

  // Check if user can open a pack
  const status = await getPackStatus();
  if (!status.canOpen) {
    if (status.activeSession) {
      throw new Error(
        "You have an active pack session. Complete or dismiss it before opening a new pack."
      );
    }
    throw new Error(
      `You can open another pack in ${Math.ceil(
        status.cooldownRemaining / 60
      )} minutes`
    );
  }

  // Get 5 random cards
  const totalCards = await prisma.card.count();
  const randomCards = await prisma.card.findMany({
    take: 5,
    skip: Math.floor(Math.random() * Math.max(1, totalCards - 5)),
  });

  // Calculate expiry date (24 hours from now)
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + SESSION_EXPIRY_HOURS);

  // make sure User exists
  const userData = await prisma.user.findUnique({
    where: { id: user.userId },
  });

  if (!userData) {
    await prisma.user.create({
      data: {
        id: user.userId,
      },
    });
  }

  // Check for and clean up any existing pack sessions for this user (even expired or completed ones)
  await prisma.packSession.deleteMany({
    where: {
      userId: user.userId,
    },
  });

  // Create pack session in the database
  const packSession = await prisma.packSession.create({
    data: {
      userId: user.userId,
      expiresAt,
      packCards: {
        create: randomCards.map((card) => ({
          cardId: card.id,
          correctAnswer: card.correctAnswer,
        })),
      },
    },
    include: {
      packCards: true,
    },
  });

  // Update last pack opened time
  await prisma.user.update({
    where: { id: user.userId },
    data: {
      lastPackOpenedAt: new Date(),
    },
  });

  // Return cards without correctAnswer
  const closedCards: CardClosed[] = randomCards.map((card) => ({
    id: card.id,
    thumbnail: card.thumbnail,
    level: card.level,
    subject: card.subject,
    question: card.question,
    answers: card.answers,
  }));

  return {
    cards: closedCards,
    packId: packSession.id,
  };
}

export async function answerPackCard(
  packId: string,
  cardId: string,
  answerIndex: number
): Promise<boolean> {
  const user = await protectAction("answerPackCard", true);

  // Get current date
  const now = new Date();

  // Get pack session
  const packSession = await prisma.packSession.findUnique({
    where: {
      id: packId,
      userId: user.userId,
      isCompleted: false,
      expiresAt: {
        gt: now,
      },
    },
    include: {
      packCards: true,
    },
  });

  if (!packSession) {
    // Mark as completed if expired
    await prisma.packSession.updateMany({
      where: {
        id: packId,
        userId: user.userId,
        isCompleted: false,
      },
      data: {
        isCompleted: true,
      },
    });
    throw new Error("Pack session not found or expired");
  }

  // Find the card
  const packCard = packSession.packCards.find((pc) => pc.cardId === cardId);
  if (!packCard) {
    throw new Error("Card not found in this pack");
  }

  // Check if card was already answered
  if (packCard.answered) {
    throw new Error("You've already answered this card");
  }

  // Check if answer is correct
  const isCorrect = packCard.correctAnswer === answerIndex;

  // Update card in database
  await prisma.packCard.update({
    where: { id: packCard.id },
    data: {
      answered: true,
      claimed: isCorrect,
    },
  });

  // If correct, add to user's collection
  if (isCorrect) {
    await prisma.user.update({
      where: { id: user.userId },
      data: {
        cardCollection: {
          connect: [{ id: cardId }],
        },
      },
    });
  }

  return isCorrect;
}

export async function dismissPackSession(packId: string): Promise<boolean> {
  const user = await protectAction("dismissPackSession", true);

  // Get and validate pack session
  const packSession = await prisma.packSession.findUnique({
    where: {
      id: packId,
      userId: user.userId,
    },
  });

  if (!packSession) {
    throw new Error("Pack session not found");
  }

  // Mark session as completed
  await prisma.packSession.update({
    where: { id: packId },
    data: { isCompleted: true },
  });

  return true;
}

export async function getSessionCards(
  sessionId: string
): Promise<SessionResult> {
  const user = await protectAction("getSessionCards", true);

  // Get current date
  const now = new Date();

  // First get the session to verify it exists
  const session = await prisma.packSession.findUnique({
    where: {
      id: sessionId,
      userId: user.userId,
      isCompleted: false,
      expiresAt: {
        gt: now,
      },
    },
  });

  if (!session) {
    // Mark as completed if expired
    await prisma.packSession.updateMany({
      where: {
        id: sessionId,
        userId: user.userId,
        isCompleted: false,
      },
      data: {
        isCompleted: true,
      },
    });
    throw new Error("Session not found or expired");
  }

  // Get the pack cards for this session with their status
  const packCards = await prisma.packCard.findMany({
    where: {
      packSessionId: sessionId,
    },
    select: {
      cardId: true,
      answered: true,
      claimed: true,
    },
  });

  // Get the card details
  const cardIds = packCards.map((pc) => pc.cardId);
  const cards = await prisma.card.findMany({
    where: {
      id: {
        in: cardIds,
      },
    },
  });

  // Format cards without correct answer
  const closedCards: CardClosed[] = cards.map((card) => ({
    id: card.id,
    thumbnail: card.thumbnail,
    level: card.level,
    subject: card.subject,
    question: card.question,
    answers: card.answers,
  }));

  // Format card status
  const cardStatus: PackCardStatus[] = packCards.map((pc) => ({
    cardId: pc.cardId,
    answered: pc.answered,
    claimed: pc.claimed,
  }));

  return {
    cards: closedCards,
    packId: sessionId,
    cardStatus,
  };
}

/**
 * Helper function to clean up expired sessions
 */
export async function cleanupExpiredSessions(): Promise<void> {
  const now = new Date();

  // Mark expired sessions as completed
  await prisma.packSession.updateMany({
    where: {
      isCompleted: false,
      expiresAt: {
        lt: now,
      },
    },
    data: {
      isCompleted: true,
    },
  });
}
