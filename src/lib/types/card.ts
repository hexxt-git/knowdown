import { Card as PrismaCard } from "@prisma/client";

export type Card = Omit<PrismaCard, "users">;
export type CardThumbnail = Pick<Card, "thumbnail" | "level" | "subject">;
export type CardClosed = Pick<
  Card,
  "id" | "thumbnail" | "level" | "subject" | "question" | "answers"
>;
