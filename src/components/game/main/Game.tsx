"use client"

import React, { useState, useEffect, useRef } from "react"
import { AnimatePresence, motion } from "framer-motion"

// Types
import type * as Types from "@/lib/types/game"

import Avatar from "@/components/ui/avatar"
import Zone from "@/components/zone"
import Blink from "@/components/blink"
import { CardThumbnail as Card, Card as PlayCard, PlayableCard as AnswerCard } from "../Card"

import "./Game.css"

const CARD_TIME = 50000
const MAX_HEALTH = 100
const MAX_POWER = 100

interface CardWithUIState extends Types.Card {
    inPlay?: boolean
    playedAt?: number
}

// Component props
interface CardGameProps {
    game: Types.Game
    setGame: React.Dispatch<React.SetStateAction<Types.Game | null>>
    onAnswer: (
        cardId: string,
        answerIndex: number
    ) => Promise<{
        isCorrect: boolean;
        explanation: string;
        correctAnswer: number;
    }>;
}


export default function CardGame({ game, setGame, onAnswer }: CardGameProps) {
    const playerHandRef = useRef<HTMLDivElement>(null)
    const playerCardsAreaRef = useRef<HTMLDivElement>(null)

    const [playerCardsInPlay, setPlayerCardsInPlay] = useState<CardWithUIState[]>([])

    // References for card positions

    // Play a card
    const playCard = (cardIndex: number) => {

        // Find the card in the player's hand
        const cardToPlay = game.player.cards.received.find((card) => +card.id === cardIndex)
        if (!cardToPlay) return

        // Remove the played card from the player"s hand
        setGame((prev) => {
            if (!prev) return prev;
            return {
                ...prev,
                player: {
                    ...prev.player,
                    cards: {
                        ...prev.player.cards,
                        received: prev.player.cards.received.filter((card) => +card.id !== cardIndex),
                    },
                },
            };
        });

        // and then add it to the player's play area
        setPlayerCardsInPlay((prev) => [
            ...prev,
            {
                ...cardToPlay,
                inPlay: true,
                playedAt: Date.now(),
            },
        ])
    }

    useEffect(() => {
        const interval = setInterval(() => {
            const now = Date.now()

            setPlayerCardsInPlay((prev) => {
                return prev.filter((card) => card.playedAt && now - card.playedAt < CARD_TIME)
            })
        }, 1000)

        return () => clearInterval(interval)
    }, [])

    return (
        <div className="game-board">
            <div className="opponent-side">
                <div className="player-info right">
                    <div className="status-bars enemy">

                        <p>
                            Opponent
                        </p>

                        <div className="health-bar-container enemy">
                            <motion.div
                                className="health-bar"
                                initial={{ width: 0 }}
                                animate={{ width: `${(game.enemy.health / MAX_HEALTH) * 100}%` }}
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
                            <Avatar flipped mood={game.enemy.health > 60 ? "happy" : game.enemy.health > 30 ? "neutral" : "sad"} />
                        </span>
                    </div>
                </div>
            </div>

            {/* Opponent Cards */}
            <div className="opponent-cards-area">
                <div className="cards-container opponent">
                    {game.enemy.cards.received.length === 0 ? (
                        // make a fake card with width 0
                        <motion.div
                            key="empty"
                            className="card player-card"
                            initial={{ width: 0, opacity: 0 }}
                            animate={{ width: 0, opacity: 0 }}
                            exit={{ width: 0, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        >
                            <Card card={{
                                thumbnail: "",
                                level: 0,
                                subject: "",
                            }} fontSize="16px" />
                        </motion.div>
                    ) : (
                        game.enemy.cards.received.map((card) => (
                            <div className="card-wrapper opponent">
                                <motion.div
                                    key={card.id}
                                    className="card opponent-card"
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    whileHover={{ y: -5 }}
                                >
                                    <Card card={card} />
                                </motion.div>
                            </div>
                        )))}
                </div>
            </div>

            {/* Opponent Play Area */}
            <Blink delay={300}>
                <div className="opponent-play-area">
                    <div className="cards-container">
                        {game.enemy.cards.sent.map((card) => (
                            <div className="card-wrapper">
                                <AnswerCard card={card} fontSize="10px" onAnswer={onAnswer} />
                            </div>
                        ))}
                    </div>
                </div>
            </Blink>

            {/* horbar */}
            <div style={{
                height: '2px',
                backgroundColor: 'white',
                opacity: 0.5,
                margin: '20px 0',
                borderRadius: '4px',
            }} />

            {/* Player Play Area */}

            <div ref={playerCardsAreaRef} className="player-play-area">
                <div className="cards-container player">
                    <AnimatePresence>
                        {playerCardsInPlay.length === 0 ? (
                            // make a fake card with width 0
                            <motion.div
                                key="empty"
                                className="card player-card"
                                initial={{ width: 0, opacity: 0 }}
                                animate={{ width: 0, opacity: 0 }}
                                exit={{ width: 0, opacity: 0 }}
                                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                            >
                                <Card card={{
                                    thumbnail: "",
                                    level: 0,
                                    subject: "",
                                }} />
                            </motion.div>
                        ) : (
                            playerCardsInPlay.map((card: CardWithUIState) => (
                                <motion.div
                                    key={card.id}
                                    className={`card player-card card-level-${card.level}`}
                                    initial={{ y: 100, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    exit={{ y: -100, opacity: 0 }}
                                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                >
                                    <Card card={card} fontSize="10px" />
                                    {/* Timer for card duration */}
                                    <div className="card-timer-container">
                                        <div className="card-timer-background" />
                                        <div className="card-timer-text">
                                            {Math.ceil((CARD_TIME - (Date.now() - (card.playedAt || 0))) / 1000)} sec
                                        </div>
                                    </div>
                                    {/* Animate the timer */}
                                    {card.playedAt && (
                                        <motion.div
                                            className="card-timer"
                                            initial={{ width: "100%" }}
                                            animate={{ width: "0%" }}
                                            transition={{ duration: CARD_TIME / 1000, ease: "linear" }}
                                        />
                                    )}
                                </motion.div>
                            ))
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Player Hand */}
            <div ref={playerHandRef} className="player-hand">
                {game.player.cards.received.length === 0 ? (
                    <Zone title="No cards left">
                        <small>No cards left in hand</small>
                    </Zone>
                ) : (game.player.cards.received.map((card) => (
                    <motion.div
                        key={card.id}
                        className={`hand-card card-level-${card.level}`}
                        whileHover={{ y: -10, scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => playCard(+card.id)}
                        transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    >
                        <Card card={card} fontSize="11px" />
                    </motion.div>
                )))}
            </div>

            {/* Player Info - Now below cards */}
            <div className="player-info">
                <div className="avatar">
                    <span className="avatar-emoji">
                        <Avatar mood={game.player.health > 60 ? "happy" : game.player.health > 30 ? "neutral" : "sad"} />
                    </span>
                </div>
                <div className="status-bars">

                    <p>
                        Me
                    </p>

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

        </div>
    )
}
