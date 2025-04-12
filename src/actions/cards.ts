"use server";

import { Card } from "@/lib/types/card";
import { protectAction } from "./protect-action";
import { prisma } from "@/lib/prisma";

export async function getCardCollection(): Promise<Card[]> {
  const user = await protectAction("getCardCollection", true);

  const cardCollection = await prisma.card.findMany({
    where: {
      users: {
        some: {
          id: user.userId,
        },
      },
    },
  });

  return cardCollection;
}

export async function giveCards(cardIds: string[]) {
  const user = await protectAction("giveCards", true);

  const existingUser = await prisma.user.findUnique({
    where: { id: user.userId },
  });

  if (!existingUser) {
    await prisma.user.create({
      data: {
        id: user.userId,
        cardCollection: { connect: cardIds.map((id) => ({ id })) },
      },
    });
  } else {
    await prisma.user.update({
      where: { id: user.userId },
      data: {
        cardCollection: { connect: cardIds.map((id) => ({ id })) },
      },
    });
  }
}

export async function getAllCards(): Promise<Card[]> {
  try {
    const cards = await prisma.card.findMany({
      take: 100, // Limit to 100 cards for performance
    });
    return cards;
  } catch (error) {
    console.error("Error fetching cards:", error);
    return [];
  }
}

export async function getCardsByLevel(
  level?: number,
  count: number = 5
): Promise<Card[]> {
  try {
    // If level is specified, filter by level, otherwise get random cards
    const cards = await prisma.card.findMany({
      where: level ? { level } : undefined,
      orderBy: {
        // Use a random ordering to get different cards each time
        id: "asc",
      },
      take: count,
    });

    // If no cards found for specific level, fallback to any level
    if (cards.length === 0 && level) {
      return getCardsByLevel(undefined, count);
    }

    return cards;
  } catch (error) {
    console.error("Error fetching cards by level:", error);
    return [];
  }
}
