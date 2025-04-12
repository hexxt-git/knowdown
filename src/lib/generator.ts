// generates random cards before implementing the actual game logic

import type * as Types from "@/lib/types/game";

const subjects = [
    "Math",
    "Science",
    "History",
    "Geography",
    "Literature",
    "Art",
]

export function randomCard(forEnemy?: boolean): Types.Card {
    let subject = subjects[Math.floor(Math.random() * subjects.length)];

    return {
        id: Math.floor(Math.random() * 1000).toString(),
        level: Math.floor(Math.random() * 5) + 1,
        subject: forEnemy ? "?" : subject,
        thumbnail: forEnemy ? "?" : subject + " question",
        question: "What is the element of this spell?",
        answers: ["Fire", "Water", "Earth", "Air"],
        correctAnswer: Math.floor(Math.random() * 4),
        explanation: "Fire is the element of this spell.",
    };
}

export function randomCards(forEnemy?: boolean): { sent: Types.Card[]; received: Types.Card[] } {
    let n = Math.floor(Math.random() * 5) + 1;

    const receivedCards = Array.from({ length: n }, () => randomCard(forEnemy));
    const sentCards = Array.from({ length: 5 - n }, () => randomCard());
    return { sent: sentCards, received: receivedCards };
}
