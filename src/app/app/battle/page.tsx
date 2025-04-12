'use client';

import { useEffect, useState } from "react";
import type * as Types from "@/lib/types/game";
import CardGame from "@/components/game/main/Game";

import { randomCards } from "@/lib/generator";

export default function BattlePage() {
  const [game, setGame] = useState<Types.Game | null>(null);
  const [results, setResults] = useState<'won' | 'lost' | 'draw' | ''>('');

  // importing the game from server
  useEffect(() => {
    const gameData: Types.Game = {
      id: 1,
      type: "casual",
      player: {
        health: Math.floor(Math.random() * 100) + 1,
        power: Math.floor(Math.random() * 20) + 1,
        cards: randomCards(),
      },
      enemy: {
        health: Math.floor(Math.random() * 100) + 1,
        power: Math.floor(Math.random() * 20) + 1,
        cards: randomCards(true),
      },
    };

    // Simulate a delay for loading
    const timer = setTimeout(() => {
      setGame(gameData);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Game logic here...
  useEffect(() => {
    if (!game) return;

    if (game.player.health <= 0) {
      setResults('lost');
    } else if (game.enemy.health <= 0) {
      setResults('won');
    }
  }, [game]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!game || results) return;

      game.enemy.health--;
      game.player.health--;


      if (game.enemy.health <= 0 || game.player.health <= 0) {
        clearInterval(interval);
      }

      // add 1 enemy card
      const newEnemyCard = randomCards(true);

      setGame({ ...game });
    }, 1000);
    return () => clearInterval(interval);
  }, [game, results]);

  function onAnswer(
    cardId: string,
    answerIndex: number
  ): Promise<{ isCorrect: boolean; explanation: string; correctAnswer: number }> {
    return new Promise((resolve) => {
      alert(`Card ID: ${cardId}, Answer Index: ${answerIndex}`);
    });
  }

  return (
    <div className="h-full w-full">
      {/* Overlay logic */}
      {(!game || results) && (
        <div className="absolute z-10 top-0 left-0 flex items-center justify-center bg-black bg-opacity-50 h-screen w-screen">
          <div className="p-4 text-white">
            {!game ? (
              <h2 className="text-xl font-bold">Matchmaking...</h2>
            ) : (
              <>
                <h2 className="text-xl font-bold">
                  {results === 'won' ? 'You Won!' : results === 'lost' ? 'You Lost!' : 'It\'s a Draw!'}
                </h2>
                <p>Thanks for playing!</p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Content underneath */}
      <div
        className={`flex flex-col items-center justify-center h-full w-full transition-opacity duration-500 ${(!game || results) ? 'opacity-50' : 'opacity-100'}`}

      >
        <h1 className="text-4xl font-bold">Battle Page</h1>

        <div className="wrapper w-full max-w-[800px] mx-auto">
          {game && (
            <CardGame
              game={game}
              setGame={setGame}
              onAnswer={onAnswer}
            />
          )}
        </div>
      </div>
    </div>
  );
}
