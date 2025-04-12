"use client";

import React, { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";

// Types
import type * as Types from "@/lib/types/game";

// Constants
import {
  CARD_TIME,
  MAX_HEALTH,
  MAX_POWER,
  POWER_GAIN_PER_TICK,
  POWER_TICK_INTERVAL,
  ENEMY_DECISION_INTERVAL,
  calculateCardCost,
  calculateWrongAnswerDamage,
  calculateExpiredCardDamage,
  calculateEnemyAnswerTime,
  ENEMY_CARD_ANSWER_TIMES,
} from "@/lib/constants";

import Avatar from "@/components/ui/avatar";
import Zone from "@/components/zone";
import Blink from "@/components/blink";
import {
  CardThumbnail as Card,
  Card as PlayCard,
  PlayableCard as AnswerCard,
  CardThumbnail,
} from "../Card";

import "./Game.css";

interface CardWithUIState extends Types.Card {
  playedAt?: number;
}

// Component props
interface CardGameProps {
  game: Types.Game;
  setGame: React.Dispatch<React.SetStateAction<Types.Game | null>>;
  onAnswer: (
    cardId: string,
    answerIndex: number
  ) => Promise<{
    isCorrect: boolean;
    explanation: string;
    correctAnswer: number;
  }>;
  playerName?: string;
  opponentName?: string;
}

// Create a new component for the circular timer
function CircularTimer({ playedAt }: { playedAt: number | undefined }) {
  if (!playedAt) return null;

  // Calculate remaining time
  const now = Date.now();
  const timeElapsed = now - playedAt;
  const timeRemaining = Math.max(0, CARD_TIME - timeElapsed);
  const secondsRemaining = Math.ceil(timeRemaining / 1000);

  // Calculate rotation for pie animation
  const rotationDegree = 360 * (timeElapsed / CARD_TIME);
  const isLessThanHalf = rotationDegree <= 180;
  const isAboutToExpire = secondsRemaining <= 10;

  return (
    <div
      className={`timer-container ${
        isAboutToExpire ? "card-about-to-expire" : ""
      }`}
    >
      {/* First half of the pie */}
      <div
        className="timer-pie"
        style={{
          transform: `rotate(${Math.min(180, rotationDegree)}deg)`,
          opacity: isLessThanHalf ? 1 : 0,
        }}
      />

      {/* Second half of the pie */}
      <div
        className="timer-pie"
        style={{
          transform: `rotate(${Math.max(180, rotationDegree)}deg)`,
          opacity: isLessThanHalf ? 0 : 1,
        }}
      />

      <div className="timer-mask">
        <div className="timer-text">{secondsRemaining}</div>
      </div>
    </div>
  );
}

export default function CardGame({
  game,
  setGame,
  onAnswer,
  playerName = "You",
  opponentName = "Opponent",
}: CardGameProps) {
  const playerHandRef = useRef<HTMLDivElement>(null);
  const playerCardsAreaRef = useRef<HTMLDivElement>(null);

  // Track when the AI should attempt to answer cards
  const [enemyAnswerTimes, setEnemyAnswerTimes] = useState<{
    [key: string]: number;
  }>({});

  // Play a card
  const playCard = (cardId: string) => {
    // Find the card in the player's hand
    const cardToPlay = game.player.hand.find((card) => card.id === cardId);
    if (!cardToPlay) {
      console.error(`Card with ID ${cardId} not found in player's hand`);
      return;
    }

    // Check if player has enough power to play the card
    const cardCost = calculateCardCost(cardToPlay.level);
    if (game.player.power < cardCost) {
      console.log("Not enough power to play this card");
      return; // Not enough power
    }

    // Remove the played card from the player's hand and reduce power
    setGame((prev) => {
      if (!prev) return prev;

      // Add playedAt timestamp to track when the card expires
      const cardWithTimestamp = {
        ...cardToPlay,
        playedAt: Date.now(),
      };

      // Draw a new card from the bag if available
      let newHand = prev.player.hand.filter((card) => card.id !== cardId);
      let newBag = [...prev.player.bag];

      // If the bag has cards, draw one
      if (newBag.length > 0) {
        const drawnCard = newBag.shift(); // Remove first card from bag
        if (drawnCard) {
          newHand.push(drawnCard); // Add to hand
        }
      }

      return {
        ...prev,
        player: {
          ...prev.player,
          hand: newHand,
          bag: newBag,
          power: prev.player.power - cardCost, // Deduct power based on card level
        },
        table: {
          ...prev.table,
          enemySide: [...prev.table.enemySide, cardWithTimestamp], // Place on enemy's side with timestamp
        },
      };
    });

    // Set enemy answer time based on card level
    const answerDelay = calculateEnemyAnswerTime(cardToPlay.level);

    console.log(`Enemy will answer card in ${answerDelay / 1000} seconds`);

    setEnemyAnswerTimes((prev) => ({
      ...prev,
      [cardToPlay.id]: Date.now() + answerDelay,
    }));
  };

  // Enemy AI - decide when to play cards
  useEffect(() => {
    if (!game) return;

    const interval = setInterval(() => {
      // Skip if game has ended
      if (game.enemy.health <= 0 || game.player.health <= 0) return;

      // Aggressive enemy AI - always try to play cards when possible
      if (game.enemy.hand.length > 0) {
        // Sort cards by level for better power usage
        const availableCards = [...game.enemy.hand].sort(
          (a, b) => a.level - b.level
        );

        // Find all cards the enemy can afford
        const playableCards = availableCards.filter(
          (card) => calculateCardCost(card.level) <= game.enemy.power
        );

        if (playableCards.length > 0) {
          // Always play a card if possible (no random chance anymore)

          // Strategy: Try to play the highest level card we can afford
          // (while keeping some lower level cards if we have them)
          let selectedCard;

          // If we have more than 3 playable cards, prefer high-level cards
          if (playableCards.length > 3) {
            // Use the highest level card we can afford
            selectedCard = playableCards[playableCards.length - 1];
          } else {
            // Otherwise, use the lowest level card to conserve power
            selectedCard = playableCards[0];
          }

          // Play the card
          setGame((prev) => {
            if (!prev) return prev;

            // Add playedAt timestamp to track when the card expires
            const cardWithTimestamp = {
              ...selectedCard,
              playedAt: Date.now(),
            };

            // Draw a new card from the enemy's bag if available
            let newEnemyHand = prev.enemy.hand.filter(
              (card) => card.id !== selectedCard.id
            );
            let newEnemyBag = [...prev.enemy.bag];

            // If the bag has cards, draw one
            if (newEnemyBag.length > 0) {
              const drawnCard = newEnemyBag.shift(); // Remove first card from bag
              if (drawnCard) {
                newEnemyHand.push(drawnCard); // Add to hand
              }
            }

            return {
              ...prev,
              enemy: {
                ...prev.enemy,
                power: prev.enemy.power - calculateCardCost(selectedCard.level),
                hand: newEnemyHand,
                bag: newEnemyBag,
              },
              table: {
                ...prev.table,
                playerSide: [...prev.table.playerSide, cardWithTimestamp],
              },
            };
          });
        }
      }
    }, ENEMY_DECISION_INTERVAL);

    return () => clearInterval(interval);
  }, [game]);

  // Enemy AI - answer cards at random times
  useEffect(() => {
    if (!game) return;

    const interval = setInterval(() => {
      const now = Date.now();

      // Check if there are any enemy cards that need to be answered
      Object.entries(enemyAnswerTimes).forEach(([cardId, answerTime]) => {
        if (now >= answerTime) {
          // Find the card in enemySide of table
          const cardToAnswer = game.table.enemySide.find(
            (card) => card.id === cardId
          );

          if (cardToAnswer) {
            console.log(`Enemy answering card ${cardId}`);

            // Determine correct answer based on card ID for consistency
            function generateConsistentAnswer(id: string): number {
              try {
                // Extract only numeric characters and use the first digit
                const numericPart = id.replace(/\D/g, "");
                if (numericPart.length > 0) {
                  return parseInt(numericPart[0]) % 4;
                }
                // If no numeric parts, hash the string and get a value 0-3
                return (
                  id.split("").reduce((a, b) => a + b.charCodeAt(0), 0) % 4
                );
              } catch (e) {
                console.error("Error parsing card ID for answer:", e);
                return 0; // Default fallback
              }
            }

            // Get a consistent answer for this card
            const correctAnswer =
              cardToAnswer.correctAnswer !== undefined
                ? cardToAnswer.correctAnswer
                : generateConsistentAnswer(cardId);

            // The enemy has a chance to select the correct answer based on card level
            // Higher level enemy cards have better chance of being answered correctly
            const enemySkillByLevel: Record<number, number> = {
              1: 60,
              2: 40,
              3: 30,
            };

            // Enemy selects the correct answer based on skill level
            const enemySkill =
              (enemySkillByLevel[cardToAnswer.level] || 50) / 100;
            const isEnemyCorrect = Math.random() < enemySkill;

            // The answer index the enemy selects
            let answerIndex;
            if (isEnemyCorrect) {
              // Enemy selects the correct answer
              answerIndex = correctAnswer;
            } else {
              // Enemy selects a wrong answer
              let wrongOptions = [0, 1, 2, 3].filter(
                (i) => i !== correctAnswer
              );
              answerIndex =
                wrongOptions[Math.floor(Math.random() * wrongOptions.length)];
            }

            // Determine if the enemy's answer is actually correct
            const isCorrect = answerIndex === correctAnswer;

            console.log(
              `Enemy answered ${isCorrect ? "correctly" : "incorrectly"}`
            );

            // If incorrect, enemy takes damage based on card level
            const damage = !isCorrect
              ? calculateWrongAnswerDamage(cardToAnswer.level)
              : 0;

            if (!isCorrect) {
              console.log(`Enemy takes ${damage} damage for incorrect answer!`);
            }

            // Remove card from answer times
            setEnemyAnswerTimes((prev) => {
              const newTimes = { ...prev };
              delete newTimes[cardId];
              return newTimes;
            });

            // Update game state based on answer
            setGame((prev) => {
              if (!prev) return prev;

              return {
                ...prev,
                table: {
                  ...prev.table,
                  enemySide: prev.table.enemySide.filter(
                    (card) => card.id !== cardId
                  ),
                },
                enemy: {
                  ...prev.enemy,
                  // Add to stash if answered correctly
                  stash: isCorrect
                    ? [...prev.enemy.stash, cardToAnswer]
                    : prev.enemy.stash,
                  // Apply damage for incorrect answers
                  health: isCorrect
                    ? prev.enemy.health
                    : Math.max(0, prev.enemy.health - damage),
                },
              };
            });
          }
        }
      });
    }, 100); // Check very frequently to ensure timely responses

    return () => clearInterval(interval);
  }, [game, enemyAnswerTimes]);

  // Handle card expiration and damage
  useEffect(() => {
    const interval = setInterval(() => {
      if (!game) return;

      const now = Date.now();

      // Check cards on player's side (cards placed by enemy) for expiration
      game.table.playerSide.forEach((card) => {
        if (
          (card as CardWithUIState).playedAt &&
          now - ((card as CardWithUIState).playedAt || 0) >= CARD_TIME
        ) {
          // Card expired - player takes damage based on card level
          setGame((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              player: {
                ...prev.player,
                health: Math.max(
                  0,
                  prev.player.health - calculateExpiredCardDamage(card.level)
                ),
              },
              table: {
                ...prev.table,
                playerSide: prev.table.playerSide.filter(
                  (c) => c.id !== card.id
                ),
              },
            };
          });
        }
      });

      // Check cards on enemy's side (cards placed by player) for expiration
      game.table.enemySide.forEach((card) => {
        if (
          (card as CardWithUIState).playedAt &&
          now - ((card as CardWithUIState).playedAt || 0) >= CARD_TIME
        ) {
          // Card expired - enemy takes damage based on card level
          setGame((prev) => {
            if (!prev) return prev;

            // Also remove from enemy answer times
            setEnemyAnswerTimes((prevTimes) => {
              const newTimes = { ...prevTimes };
              delete newTimes[card.id];
              return newTimes;
            });

            return {
              ...prev,
              enemy: {
                ...prev.enemy,
                health: Math.max(
                  0,
                  prev.enemy.health - calculateExpiredCardDamage(card.level)
                ),
              },
              table: {
                ...prev.table,
                enemySide: prev.table.enemySide.filter((c) => c.id !== card.id),
              },
            };
          });
        }
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [game]);

  return (
    <div className="game-board">
      {/* Enemy stash */}
      <div className="card-stash enemy-stash">
        {game.enemy.stash.length > 0 && (
          <div className="stash-count">{game.enemy.stash.length}</div>
        )}
        {game.enemy.stash.slice(-10).map((card, index) => (
          <div key={`enemy-stash-${card.id}-${index}`} className="stash-card">
            <CardThumbnail card={card} fontSize="8px" showPreview={true} />
          </div>
        ))}
      </div>

      <div className="opponent-side">
        <div className="player-info right">
          <div className="status-bars enemy">
            <p className="font-semibold">{opponentName}</p>

            <div className="health-bar-container enemy">
              <motion.div
                className="health-bar"
                initial={{ width: 0 }}
                animate={{
                  width: `${(game.enemy.health / MAX_HEALTH) * 100}%`,
                }}
                transition={{ duration: 0.5 }}
              >
                <span className="health-bar-text">{game.enemy.health}</span>
              </motion.div>
            </div>
            <div className="power-bar-container enemy">
              <motion.div
                className="power-bar"
                initial={{ width: 0 }}
                animate={{ width: `${(game.enemy.power / MAX_POWER) * 100}%` }}
                transition={{ duration: 0.5 }}
              >
                <span className="power-bar-text">{game.enemy.power}</span>
              </motion.div>
            </div>
          </div>

          <div className="avatar">
            <span className="avatar-emoji">
              <Avatar
                flipped
                mood={
                  game.enemy.health > 60
                    ? "happy"
                    : game.enemy.health > 30
                    ? "neutral"
                    : "sad"
                }
              />
            </span>
          </div>
        </div>
      </div>

      {/* Opponent Cards */}
      <div className="opponent-cards-area">
        <div className="cards-container opponent">
          {game.enemy.hand.map((card, index) => (
            <div
              key={`opponent-card-${card.id}-${index}`}
              className="card-wrapper opponent"
            >
              <motion.div
                key={`opponent-card-${card.id}-${index}-card`}
                className="card opponent-card relative"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ y: -5 }}
              >
                <CardThumbnail card={card} fontSize="12px" />
              </motion.div>
            </div>
          ))}
        </div>
      </div>

      {/* Opponent Play Area - cards placed by the player that the enemy needs to answer */}
      <div className="opponent-play-area">
        <div className="cards-container">
          {game.table.enemySide.map((card, index) => (
            <div
              key={`enemy-card-${card.id}-${index}`}
              className="card-wrapper"
            >
              <motion.div
                className={`card enemy-card relative card-level-${card.level}`}
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -100, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                whileHover={{ scale: 1.05, zIndex: 10 }}
              >
                <CardThumbnail card={card} fontSize="12px" showPreview={true} />
                <CircularTimer playedAt={(card as CardWithUIState).playedAt} />
              </motion.div>
            </div>
          ))}
        </div>
      </div>

      <hr className="w-full border-t-4 border-dashed border-black/20" />

      {/* Player Play Area - cards placed by the enemy that the player needs to answer */}
      <div ref={playerCardsAreaRef} className="player-play-area">
        <div className="cards-container player">
          <AnimatePresence>
            {game.table.playerSide.map((card, index) => (
              <div
                key={`player-card-${card.id}-${index}`}
                className="card-wrapper"
              >
                <Blink
                  delay={
                    (card as CardWithUIState).playedAt &&
                    Date.now() - ((card as CardWithUIState).playedAt || 0) <
                      5000
                      ? 300
                      : 1000
                  }
                >
                  <div className="relative">
                    <AnswerCard
                      card={card}
                      fontSize="18xpx"
                      onAnswer={onAnswer}
                    />
                    <CircularTimer
                      playedAt={(card as CardWithUIState).playedAt}
                    />
                  </div>
                </Blink>
              </div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Player Hand */}
      <div ref={playerHandRef} className="player-hand">
        {game.player.hand.length === 0 ? (
          <Zone title="No cards left">
            <small>No cards left in hand</small>
          </Zone>
        ) : (
          game.player.hand.map((card, index) => (
            <motion.div
              key={`player-card-${card.id}-${index}`}
              className={`hand-card relative card-level-${card.level} ${
                game.player.power < calculateCardCost(card.level)
                  ? "disabled-card"
                  : ""
              }`}
              whileHover={{
                y: game.player.power >= calculateCardCost(card.level) ? -10 : 0,
                scale:
                  game.player.power >= calculateCardCost(card.level) ? 1.05 : 1,
                zIndex: 10,
              }}
              whileTap={{
                scale:
                  game.player.power >= calculateCardCost(card.level) ? 0.95 : 1,
              }}
              onClick={() => playCard(card.id)}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <Card card={card} fontSize="10px" />
              <div className="card-cost">{calculateCardCost(card.level)}</div>
            </motion.div>
          ))
        )}
      </div>

      {/* Player Info - Now below cards */}
      <div className="player-info">
        <div className="avatar">
          <span className="avatar-emoji">
            <Avatar
              mood={
                game.player.health > 60
                  ? "happy"
                  : game.player.health > 30
                  ? "neutral"
                  : "sad"
              }
            />
          </span>
        </div>
        <div className="status-bars">
          <p className="font-semibold">{playerName}</p>

          <div className="health-bar-container">
            <motion.div
              className="health-bar"
              initial={{ width: 0 }}
              animate={{ width: `${(game.player.health / MAX_HEALTH) * 100}%` }}
              transition={{ duration: 0.5 }}
            >
              <span className="health-bar-text">{game.player.health}</span>
            </motion.div>
          </div>
          <div className="power-bar-container">
            <motion.div
              className="power-bar"
              initial={{ width: 0 }}
              animate={{ width: `${(game.player.power / MAX_POWER) * 100}%` }}
              transition={{ duration: 0.5 }}
            >
              <span className="power-bar-text">{game.player.power}</span>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Player stash */}
      <div className="card-stash player-stash">
        {game.player.stash.length > 0 && (
          <div className="stash-count">{game.player.stash.length}</div>
        )}
        {game.player.stash.slice(-10).map((card, index) => (
          <div key={`player-stash-${index}`} className="stash-card">
            <CardThumbnail card={card} fontSize="8px" showPreview={true} />
          </div>
        ))}
      </div>
    </div>
  );
}
