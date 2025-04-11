"use server";

import { protectAction } from "./protect-action";
import { prisma } from "@/lib/prisma";
export async function getCardCollection() {
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
