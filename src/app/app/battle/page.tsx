"use client";

import { useEffect, useState } from "react";
import type * as Types from "@/lib/types/game";
import CardGame from "@/components/game/main/Game";

import {
  MAX_HEALTH,
  MAX_POWER,
  POWER_GAIN_PER_TICK,
  POWER_TICK_INTERVAL,
  calculateWrongAnswerDamage,
} from "@/lib/constants";
import { getRandomOpponent } from "@/actions/matchmaking";
import { updateGameResults } from "@/actions/game";
import { Card } from "@/lib/types/card";

export default function BattlePage() {
  const [game, setGame] = useState<Types.Game | null>(null);
  const [results, setResults] = useState<"won" | "lost" | "draw" | "">("");
  const [isLoading, setIsLoading] = useState(true);
  const [playerName, setPlayerName] = useState("You");
  const [opponentName, setOpponentName] = useState("Opponent");
  const [opponentId, setOpponentId] = useState("");
  const [resultsSubmitted, setResultsSubmitted] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    success?: boolean;
    error?: string;
  }>({});

  // importing the game from server
  useEffect(() => {
    async function initializeGame() {
      setIsLoading(true);

      try {
        // Fetch a random opponent and cards from the server
        const matchData = await getRandomOpponent();

        // Set player names
        setPlayerName(matchData.currentUser.username);
        setOpponentName(matchData.opponent.username);
        setOpponentId(matchData.opponent.id);

        // Helper function to get random cards from a collection
        const getRandomCards = (cards: Card[], count: number) => {
          const shuffled = [...cards].sort(() => 0.5 - Math.random());
          return shuffled.slice(0, count);
        };

        // Get cards for player and opponent
        const allCards = matchData.allCards;

        // Generate player hand (5 cards) and bag (15 cards)
        const playerHand = getRandomCards(allCards, 5);
        const playerBag = getRandomCards(allCards, 15);

        // Generate enemy hand from opponent's collection or all cards
        const opponentCards =
          matchData.opponent.cardCollection.length > 0
            ? matchData.opponent.cardCollection
            : allCards;

        const enemyHand = getRandomCards(opponentCards, 5);
        const enemyBag = getRandomCards(opponentCards, 15);

        const gameData: Types.Game = {
          id: 1,
          type: "casual",
          player: {
            health: MAX_HEALTH,
            power: 20,
            hand: playerHand,
            stash: [],
            bag: playerBag,
          },
          enemy: {
            health: MAX_HEALTH,
            power: 20,
            hand: enemyHand,
            stash: [],
            bag: enemyBag,
          },
          table: {
            playerSide: [],
            enemySide: [],
          },
        };

        // Simulate a delay for loading
        setTimeout(() => {
          setGame(gameData);
          setIsLoading(false);
        }, 1000);
      } catch (error) {
        console.error("Failed to initialize game:", error);
        setIsLoading(false);
        setResults("draw"); // Show error state
      }
    }

    initializeGame();

    return () => {
      // Cleanup
    };
  }, []);

  // Check for game end conditions
  useEffect(() => {
    if (!game) return;

    if (game.player.health <= 0) {
      setResults("lost");
    } else if (game.enemy.health <= 0) {
      setResults("won");
    }
  }, [game]);

  // Submit game results to the server when the game ends
  useEffect(() => {
    async function submitGameResults() {
      if (!game || !results || results === "draw" || resultsSubmitted) return;

      try {
        // Prepare the game result data
        const gameResult = {
          result: results as "won" | "lost",
          playerCards: game.player.stash,
          opponentId: opponentId,
          opponentCards: game.enemy.stash,
        };

        // Submit the results to the server
        const response = await updateGameResults(gameResult);

        setResultsSubmitted(true);
        setSubmitStatus(response);

        if (!response.success) {
          console.error("Failed to update game results:", response.error);
        }
      } catch (error) {
        console.error("Error submitting game results:", error);
        setSubmitStatus({ success: false, error: "Failed to submit results" });
      }
    }

    submitGameResults();
  }, [game, results, opponentId, resultsSubmitted]);

  // Update player and enemy power
  useEffect(() => {
    const interval = setInterval(() => {
      if (!game || results) return;

      setGame((prev) => {
        if (!prev) return prev;

        return {
          ...prev,
          player: {
            ...prev.player,
            power: Math.min(prev.player.power + POWER_GAIN_PER_TICK, MAX_POWER),
          },
          enemy: {
            ...prev.enemy,
            power: Math.min(prev.enemy.power + POWER_GAIN_PER_TICK, MAX_POWER),
          },
        };
      });
    }, POWER_TICK_INTERVAL);

    return () => clearInterval(interval);
  }, [game, results]);

  function onAnswer(
    cardId: string,
    answerIndex: number
  ): Promise<{
    isCorrect: boolean;
    explanation: string;
    correctAnswer: number;
  }> {
    return new Promise((resolve) => {
      // Find the card that was answered
      const cardToAnswer = game?.table.playerSide.find(
        (card) => card.id === cardId
      );

      if (!cardToAnswer) {
        resolve({
          isCorrect: false,
          explanation: "Card not found",
          correctAnswer: 0,
        });
        return;
      }

      // Use the card's actual correct answer if available, or calculate from ID
      const correctAnswer =
        cardToAnswer.correctAnswer !== undefined
          ? cardToAnswer.correctAnswer
          : generateConsistentAnswer(cardId);

      const isCorrect = answerIndex === correctAnswer;

      // Helper function to generate a consistent answer from a card ID string
      function generateConsistentAnswer(id: string): number {
        try {
          // Extract only numeric characters and use the first digit
          const numericPart = id.replace(/\D/g, "");
          if (numericPart.length > 0) {
            return parseInt(numericPart[0]) % 4;
          }
          // If no numeric parts, hash the string and get a value 0-3
          return id.split("").reduce((a, b) => a + b.charCodeAt(0), 0) % 4;
        } catch (e) {
          console.error("Error parsing card ID for answer:", e);
          return 0; // Default fallback
        }
      }

      const explanation = isCorrect
        ? `That's correct! The answer is ${cardToAnswer.answers[correctAnswer]}.`
        : `Sorry, that's wrong. The correct answer is ${cardToAnswer.answers[correctAnswer]}.`;

      // First resolve the promise so the UI can show the result
      resolve({ isCorrect, explanation, correctAnswer });

      // Then delay removing the card from the table to give time to see explanation
      setTimeout(() => {
        // Find the card that was answered
        setGame((prev) => {
          if (!prev) return prev;

          // Check if this is a card on player's side of the table
          const playerCard = prev.table.playerSide.find(
            (card) => card.id === cardId
          );

          if (playerCard) {
            // If the player answered incorrectly, they take damage based on card level
            const damage = !isCorrect
              ? calculateWrongAnswerDamage(playerCard.level)
              : 0;

            return {
              ...prev,
              table: {
                ...prev.table,
                playerSide: prev.table.playerSide.filter(
                  (card) => card.id !== cardId
                ),
              },
              player: {
                ...prev.player,
                // Add to player's stash if correct, otherwise take damage
                stash: isCorrect
                  ? [...prev.player.stash, playerCard]
                  : prev.player.stash,
                // Apply damage for incorrect answers
                health: isCorrect
                  ? prev.player.health
                  : Math.max(0, prev.player.health - damage),
              },
            };
          }

          return prev;
        });
      }, 3000); // 3 second delay to give enough time to read explanation
    });
  }

  return (
    <div className="h-full w-full">
      {/* Overlay logic */}
      {(isLoading || results) && (
        <div className="absolute z-10 top-0 left-0 flex items-center justify-center bg-black bg-opacity-50 h-screen w-screen">
          <div className="p-4 text-white">
            {isLoading ? (
              <h2 className="text-xl font-bold">
                Matchmaking... finding opponent
              </h2>
            ) : (
              <>
                <h2 className="text-xl font-bold">
                  {results === "won"
                    ? "You Won!"
                    : results === "lost"
                    ? "You Lost!"
                    : "Error connecting to server"}
                </h2>
                <p>
                  {results !== "draw"
                    ? `Thanks for playing! ${
                        results === "won"
                          ? `You won ${game?.enemy.stash.length || 0} cards`
                          : `You lost ${game?.player.stash.length || 0} cards`
                      }`
                    : "Please try again later."}
                </p>
                {submitStatus.error && (
                  <p className="text-red-400 mt-2">{submitStatus.error}</p>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Content underneath */}
      <div
        className={`flex flex-col items-center justify-center h-full w-full transition-opacity duration-500 ${
          isLoading || results ? "opacity-50" : "opacity-100"
        }`}
      >
        <h1 className="text-4xl font-bold text-primary">Battle Page</h1>

        <div className="wrapper w-full max-w-[800px] mx-auto bg-black/5 rounded-xl">
          {game && (
            <CardGame
              game={game}
              setGame={setGame}
              onAnswer={onAnswer}
              playerName={playerName}
              opponentName={opponentName}
            />
          )}
        </div>
      </div>
    </div>
  );
}
