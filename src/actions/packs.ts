"use server";

import { protectAction } from "./protect-action";
import { prisma } from "@/lib/prisma";
import { Card } from "@/lib/types/card";
import { clerkClient } from "@clerk/nextjs/server";

const COOLDOWN_MINUTES = 20;

type PackStatus = {
  canOpen: boolean;
  cooldownRemaining: number; // in seconds
  lastOpenedAt: Date | null;
};

type PackResult = {
  cards: Card[];
  nextPackAvailableAt: Date;
};

export async function getPackStatus(): Promise<PackStatus> {
  const user = await protectAction("getPackStatus", true);

  // Get the user's last pack opening time
  const userData = await prisma.user.findUnique({
    where: { id: user.userId },
    select: { lastPackOpenedAt: true },
  });

  if (!userData?.lastPackOpenedAt) {
    return {
      canOpen: true,
      cooldownRemaining: 0,
      lastOpenedAt: null,
    };
  }

  const lastOpenedAt = userData.lastPackOpenedAt;
  const now = new Date();
  const cooldownMs = COOLDOWN_MINUTES * 60 * 1000;
  const elapsedMs = now.getTime() - lastOpenedAt.getTime();
  const remainingMs = Math.max(0, cooldownMs - elapsedMs);

  return {
    canOpen: remainingMs === 0,
    cooldownRemaining: Math.ceil(remainingMs / 1000), // convert to seconds
    lastOpenedAt,
  };
}

export async function openPack(): Promise<PackResult> {
  const user = await protectAction("openPack", true);

  // Check if user can open a pack
  const status = await getPackStatus();
  if (!status.canOpen) {
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

  // Add cards to user collection
  await prisma.user.update({
    where: { id: user.userId },
    data: {
      cardCollection: {
        connect: randomCards.map((card) => ({ id: card.id })),
      },
      lastPackOpenedAt: new Date(),
    },
  });

  // Calculate next available time
  const nextPackAvailableAt = new Date();
  nextPackAvailableAt.setMinutes(
    nextPackAvailableAt.getMinutes() + COOLDOWN_MINUTES
  );

  return {
    cards: randomCards,
    nextPackAvailableAt,
  };
}
