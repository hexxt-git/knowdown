"use server";

import { protectAction } from "./protect-action";
import { prisma } from "@/lib/prisma";
import { Card } from "@/lib/types/card";

type GameResult = {
  result: "won" | "lost";
  playerCards: Card[];
  opponentId: string;
  opponentCards: Card[];
};

/**
 * Updates the database with game results
 * - Updates wins/losses counters
 * - Transfers cards between players
 */
export async function updateGameResults(gameResult: GameResult) {
  // Authenticate the current user
  const user = await protectAction("updateGameResults", true);
  const currentUserId = user.userId;

  // Begin transaction to ensure all updates succeed or fail together
  try {
    await prisma.$transaction(async (tx) => {
      // 1. Update current user stats
      await tx.user.update({
        where: { id: currentUserId },
        data: {
          gamesPlayed: { increment: 1 },
          ...(gameResult.result === "won"
            ? { gamesWon: { increment: 1 } }
            : { gamesLost: { increment: 1 } }),
        },
      });

      // 2. If opponent is a real user, update their stats too
      await tx.user.update({
        where: { id: gameResult.opponentId },
        data: {
          gamesPlayed: { increment: 1 },
          ...(gameResult.result === "won"
            ? { gamesLost: { increment: 1 } }
            : { gamesWon: { increment: 1 } }),
        },
      });

      // 3. Transfer cards - only if there are cards to transfer
      if (
        gameResult.playerCards.length > 0 ||
        gameResult.opponentCards.length > 0
      ) {
        // Get current user with their card collection
        const currentUser = await tx.user.findUnique({
          where: { id: currentUserId },
          include: { cardCollection: true },
        });

        if (!currentUser) {
          throw new Error("Current user not found");
        }

        // If player won, add opponent's cards to player's collection
        if (
          gameResult.result === "won" &&
          gameResult.opponentCards.length > 0
        ) {
          // Connect the cards to the winner
          await tx.user.update({
            where: { id: currentUserId },
            data: {
              cardCollection: {
                connect: gameResult.opponentCards.map((card) => ({
                  id: card.id,
                })),
              },
            },
          });

          // If opponent is real, disconnect cards from them
          await tx.user.update({
            where: { id: gameResult.opponentId },
            data: {
              cardCollection: {
                disconnect: gameResult.opponentCards.map((card) => ({
                  id: card.id,
                })),
              },
            },
          });
        }

        // If player lost, add player's cards to opponent's collection
        if (gameResult.result === "lost" && gameResult.playerCards.length > 0) {
          // Disconnect the cards from the loser
          await tx.user.update({
            where: { id: currentUserId },
            data: {
              cardCollection: {
                disconnect: gameResult.playerCards.map((card) => ({
                  id: card.id,
                })),
              },
            },
          });

          // If opponent is real, connect cards to them
          await tx.user.update({
            where: { id: gameResult.opponentId },
            data: {
              cardCollection: {
                connect: gameResult.playerCards.map((card) => ({
                  id: card.id,
                })),
              },
            },
          });
        }
      }
    });

    return { success: true };
  } catch (error) {
    console.error("Error updating game results:", error);
    return { success: false, error: "Failed to update game results" };
  }
}
