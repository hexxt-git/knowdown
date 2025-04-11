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

  const randomCards = await prisma.card.findMany({
    take: 100,
    include: {
      users: false,
    },
  });

  return randomCards;
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
