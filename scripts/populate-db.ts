import { prisma } from "@/lib/prisma";
import cards from "./cards.json";

const populateDb = async () => {
  await prisma.card.deleteMany();

  await prisma.card.createMany({
    data: cards,
  });
};

populateDb();
