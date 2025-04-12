import { Card } from "./card";

interface User {
  id: number;
  name: string;
  rank: number;
  image: string;

  friends: User[];
}

interface PlayerState {
  hand: Card[];
  health: number;
  power: number;
  stash: Card[];
  bag: Card[];
}

interface Game {
  id: number;
  type: "casual" | "ranked";
  enemy: PlayerState;
  player: PlayerState;
  table: {
    playerSide: Card[];
    enemySide: Card[];
  };
}

export type { User, Card, PlayerState, Game };
