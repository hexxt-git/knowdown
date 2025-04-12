import { Card } from "./card";

interface User {
    id: number
    name: string;
    rank: number;
    image: string;

    friends: User[];
}

interface PlayerState {
    cards: {
        sent: Card[];
        received: Card[];
    };
    health: number;
    power: number;
}

interface Game {
    id: number;
    type: 'casual' | 'ranked';
    enemy: PlayerState,
    player: PlayerState,
}

export type { User, Card, PlayerState, Game };
