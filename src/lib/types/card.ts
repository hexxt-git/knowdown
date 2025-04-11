import { Card as PrismaCard } from "@prisma/client";

export type Card = Omit<PrismaCard, "users">;
