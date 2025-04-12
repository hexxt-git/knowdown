"use server";

import { protectAction } from "./protect-action";
import { prisma } from "@/lib/prisma";
import { clerkClient } from "@clerk/nextjs/server";
import { Card } from "@/lib/types/card";
import { getAllCards, getCardsByLevel } from "./cards";

type Opponent = {
  id: string;
  username: string;
  rank: number;
  cardCollection: Card[];
};

/**
 * Get a random opponent for matchmaking
 */
export async function getRandomOpponent(): Promise<{
  currentUser: { id: string; username: string };
  opponent: Opponent;
  allCards: Card[]; // Real cards from database
}> {
  // Authenticate the current user
  const user = await protectAction("getRandomOpponent", true);

  // Get all cards from the database
  const allCards = await getAllCards();

  // If no cards found, throw error
  if (allCards.length === 0) {
    throw new Error("No cards found in the database");
  }

  // Get current user details from Clerk
  const clerk = await clerkClient();
  const currentUserClerk = await clerk.users.getUser(user.userId);

  const currentUserName =
    currentUserClerk.firstName && currentUserClerk.lastName
      ? `${currentUserClerk.firstName} ${currentUserClerk.lastName}`
      : currentUserClerk.username ||
        currentUserClerk.emailAddresses[0]?.emailAddress ||
        "You";

  // Get a random user who is not the current user that has the most cards
  const randomUser = await prisma.user.findFirst({
    where: {
      id: {
        not: user.userId,
      },
    },
    include: {
      cardCollection: true,
    },
    orderBy: {
      cardCollection: {
        _count: "desc",
      },
    },
    take: 1,
  });

  // If no other users are found, create a bot opponent
  if (!randomUser) {
    // Generate some pre-defined cards for the bot
    const botCards = await getCardsByLevel(undefined, 10);

    return {
      currentUser: {
        id: user.userId,
        username: currentUserName,
      },
      opponent: {
        id: "bot-opponent",
        username: "AI Opponent",
        rank: 1,
        cardCollection: botCards.length > 0 ? botCards : allCards.slice(0, 10),
      },
      allCards,
    };
  }

  // Get user details from Clerk
  const opponentClerk = await clerk.users.getUser(randomUser.id);

  const opponentName =
    opponentClerk.firstName && opponentClerk.lastName
      ? `${opponentClerk.firstName} ${opponentClerk.lastName}`
      : opponentClerk.username ||
        opponentClerk.emailAddresses[0]?.emailAddress ||
        "Opponent";

  // Calculate a simple rank based on win ratio and games played
  const opponentRank =
    randomUser.gamesPlayed > 0
      ? Math.ceil((randomUser.gamesWon / randomUser.gamesPlayed) * 5)
      : 1;

  // If the opponent has no cards, provide some from the global card pool
  const opponentCards =
    randomUser.cardCollection.length > 0
      ? randomUser.cardCollection
      : allCards.slice(0, 10);

  return {
    currentUser: {
      id: user.userId,
      username: currentUserName,
    },
    opponent: {
      id: randomUser.id,
      username: opponentName,
      rank: opponentRank,
      cardCollection: opponentCards,
    },
    allCards,
  };
}
