"use client";

import { useState, useEffect } from "react";
import {
  getPackStatus,
  openPack,
  answerPackCard,
  dismissPackSession,
  getSessionCards,
} from "@/actions/packs";
import { CardClosed } from "@/lib/types/card";
import { PlayableCard } from "@/components/game/Card";
import { Button } from "@/components/ui/button";
import {
  Package,
  Clock,
  Sparkles,
  PackageOpen,
  BookOpen,
  Check,
  X,
  HelpCircle,
  AlertTriangle,
} from "lucide-react";
import { format } from "date-fns";

export default function PacksPage() {
  const [canOpenPack, setCanOpenPack] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [loading, setLoading] = useState(true);
  const [openingPack, setOpeningPack] = useState(false);
  const [packCards, setPackCards] = useState<CardClosed[]>([]);
  const [packId, setPackId] = useState<string | null>(null);
  const [showingResult, setShowingResult] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextAvailableAt, setNextAvailableAt] = useState<Date | null>(null);
  const [activeSession, setActiveSession] = useState<{
    id: string;
    cardsTotal: number;
    cardsAnswered: number;
    cardsClaimed: number;
    expiresAt: Date;
  } | null>(null);
  const [cardResults, setCardResults] = useState<
    Record<string, boolean | null>
  >({});
  const [dismissingSession, setDismissingSession] = useState(false);

  // Format countdown time as mm:ss
  const formatCountdown = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const formatExpiryTime = (date: Date) => {
    return format(new Date(date), "MMM d, h:mm a");
  };

  // Check if user can open a pack
  const checkPackStatus = async () => {
    try {
      const status = await getPackStatus();
      setCanOpenPack(status.canOpen);
      setCooldownRemaining(status.cooldownRemaining);
      setActiveSession(status.activeSession);

      // If there's an active session, we need to fetch the cards
      if (status.activeSession && !showingResult) {
        await handleResumeSession(status.activeSession.id);
      }

      if (status.lastOpenedAt) {
        const nextAt = new Date(status.lastOpenedAt);
        nextAt.setMinutes(nextAt.getMinutes() + 20);
        setNextAvailableAt(nextAt);
      }

      setLoading(false);
    } catch (error: any) {
      setError(error.message || "Failed to check pack status");
      setLoading(false);
    }
  };

  // Resume an active session
  const handleResumeSession = async (sessionId: string) => {
    try {
      const result = await getSessionCards(sessionId);
      setPackCards(result.cards);
      setPackId(result.packId);
      setShowingResult(true);

      // Initialize card results based on the status from the server
      const initialResults: Record<string, boolean | null> = {};

      // If a card has been answered, set its result based on claimed status
      result.cardStatus.forEach((status) => {
        if (status.answered) {
          initialResults[status.cardId] = status.claimed;
        } else {
          initialResults[status.cardId] = null;
        }
      });

      setCardResults(initialResults);
    } catch (error: any) {
      setError(error.message || "Failed to resume session");
    }
  };

  // Countdown timer
  useEffect(() => {
    if (loading) {
      checkPackStatus();
    }

    if (cooldownRemaining > 0) {
      const timer = setInterval(() => {
        setCooldownRemaining((prev) => {
          const newValue = prev - 1;
          if (newValue <= 0) {
            setCanOpenPack(true);
            clearInterval(timer);
            return 0;
          }
          return newValue;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [loading, cooldownRemaining]);

  // Handle opening a pack
  const handleOpenPack = async () => {
    setError(null);
    setOpeningPack(true);

    try {
      const result = await openPack();
      setPackCards(result.cards);
      setPackId(result.packId);
      setShowingResult(true);
      setCanOpenPack(false);
      setCooldownRemaining(20 * 60); // 20 minutes

      // Initialize card results
      const initialResults: Record<string, boolean | null> = {};
      result.cards.forEach((card) => {
        initialResults[card.id] = null;
      });
      setCardResults(initialResults);
    } catch (error: any) {
      setError(error.message || "Failed to open pack");
    } finally {
      setOpeningPack(false);
    }
  };

  // Handle card answer
  const handleCardAnswer = async (cardId: string, answerIndex: number) => {
    if (!packId) return false;

    try {
      const isCorrect = await answerPackCard(packId, cardId, answerIndex);

      // Update the result for this card
      setCardResults((prev) => ({
        ...prev,
        [cardId]: isCorrect,
      }));

      // Update active session data
      if (activeSession) {
        setActiveSession({
          ...activeSession,
          cardsAnswered: activeSession.cardsAnswered + 1,
          cardsClaimed: activeSession.cardsClaimed + (isCorrect ? 1 : 0),
        });
      }

      return isCorrect;
    } catch (error: any) {
      console.error("Error answering card:", error);
      return false;
    }
  };

  // Handle dismissing a session
  const handleDismissSession = async () => {
    if (!packId) return;

    setDismissingSession(true);
    try {
      await dismissPackSession(packId);
      setActiveSession(null);
      setShowingResult(false);
      setPackCards([]);
      setPackId(null);
      setCardResults({});
      await checkPackStatus(); // Refresh status
    } catch (error: any) {
      setError(error.message || "Failed to dismiss session");
    } finally {
      setDismissingSession(false);
    }
  };

  // After showing results, allow user to get another pack regardless of whether all cards are answered
  const handleDone = () => {
    if (!activeSession) return;
    // Simply dismiss the session - no need to check if all cards are answered
    handleDismissSession();
  };

  // Calculate stats for the current pack
  const getPackStats = () => {
    if (activeSession) {
      return {
        total: activeSession.cardsTotal,
        answered: activeSession.cardsAnswered,
        correct: activeSession.cardsClaimed,
      };
    }

    // Fallback to client-side calculation
    const total = packCards.length;
    const answered = Object.values(cardResults).filter(
      (result) => result !== null
    ).length;
    const correct = Object.values(cardResults).filter(
      (result) => result === true
    ).length;

    return { total, answered, correct };
  };

  // Loading state
  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-8 text-primary">Card Packs</h1>
        <div className="flex items-center justify-center h-[50vh]">
          <div className="animate-pulse text-xl">Loading pack info...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-2 text-primary">Card Packs</h1>

      <div className="flex flex-wrap gap-4 mb-8 items-center">
        <div className="bg-black/10 p-4 rounded-lg flex items-center gap-3">
          <Package className="h-5 w-5" />
          <div>
            <span className="text-sm opacity-70">
              Open packs to expand your collection
            </span>
          </div>
        </div>
        <div className="bg-black/5 p-3 rounded-lg flex items-center gap-2">
          <BookOpen className="h-4 w-4" />
          <span className="text-xs opacity-70">5 cards per pack</span>
        </div>
        <div className="bg-black/5 p-3 rounded-lg flex items-center gap-2">
          <Clock className="h-4 w-4" />
          <span className="text-xs opacity-70">New pack every 20 minutes</span>
        </div>
      </div>

      {/* Card pack animation/results */}
      {showingResult ? (
        <div className="mb-8">
          <div className="bg-black/5 p-6 rounded-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-yellow-500" />
                Pack Opened - Answer to Claim Cards!
              </h2>

              {activeSession && (
                <div className="text-sm text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Session expires {formatExpiryTime(activeSession.expiresAt)}
                </div>
              )}
            </div>

            {/* Pack stats */}
            <div className="mb-6 flex gap-4 flex-wrap">
              <div className="bg-black/10 p-3 rounded-lg flex items-center gap-2">
                <HelpCircle className="h-4 w-4" />
                <span className="text-sm">
                  {getPackStats().answered} / {getPackStats().total} Answered
                </span>
              </div>
              <div className="bg-green-100 p-3 rounded-lg flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-800">
                  {getPackStats().correct} Cards Claimed
                </span>
              </div>
              {getPackStats().answered > 0 &&
                getPackStats().answered - getPackStats().correct > 0 && (
                  <div className="bg-red-100 p-3 rounded-lg flex items-center gap-2">
                    <X className="h-4 w-4 text-red-600" />
                    <span className="text-sm text-red-800">
                      {getPackStats().answered - getPackStats().correct} Cards
                      Lost
                    </span>
                  </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
              {packCards.map((card) => (
                <div key={card.id} className="flex justify-center">
                  <div className="relative">
                    <PlayableCard
                      card={card}
                      onAnswer={handleCardAnswer}
                      disabled={cardResults[card.id] !== null}
                    />
                    {cardResults[card.id] !== null && (
                      <div className="absolute top-2 right-2 z-10">
                        <div
                          className={`h-8 w-8 rounded-full flex items-center justify-center ${
                            cardResults[card.id] ? "bg-green-500" : "bg-red-500"
                          }`}
                        >
                          {cardResults[card.id] ? (
                            <Check className="h-5 w-5 text-white" />
                          ) : (
                            <X className="h-5 w-5 text-white" />
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex justify-center gap-4">
                <Button onClick={handleDone} size="lg">
                  Complete Session
                </Button>
              </div>

              <div className="flex justify-center">
                <p className="text-sm text-muted-foreground">
                  Any unanswered cards will be lost
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-8">
          <div className="bg-black/5 p-6 rounded-lg">
            {canOpenPack ? (
              <>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <PackageOpen className="h-5 w-5" />A pack is available!
                </h2>

                <div className="flex flex-col items-center py-8">
                  <Button
                    onClick={handleOpenPack}
                    size="xl"
                    className="w-64 h-64 rounded-xl flex flex-col gap-4 shadow-lg"
                    disabled={openingPack}
                  >
                    <Package className="size-24" />
                    {openingPack ? "Opening..." : "Open Pack"}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  {activeSession
                    ? "You have an active pack session"
                    : "Next pack available in"}
                </h2>

                {activeSession ? (
                  <div className="flex flex-col items-center py-8">
                    <div className="mb-4 text-center">
                      <p className="text-lg mb-1">
                        You have{" "}
                        <span className="font-bold">
                          {activeSession.cardsTotal -
                            activeSession.cardsAnswered}
                        </span>{" "}
                        unanswered cards
                      </p>
                      <p className="text-muted-foreground">
                        Session expires on{" "}
                        {formatExpiryTime(activeSession.expiresAt)}
                      </p>
                    </div>
                    <Button
                      onClick={() => handleResumeSession(activeSession.id)}
                      size="lg"
                      className="mb-2"
                    >
                      Resume Session
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center py-8">
                    <div className="text-4xl font-bold mb-2">
                      {formatCountdown(cooldownRemaining)}
                    </div>
                    <p className="text-muted-foreground">
                      {nextAvailableAt
                        ? `Next pack at ${nextAvailableAt.toLocaleTimeString(
                            [],
                            { hour: "2-digit", minute: "2-digit" }
                          )}`
                        : "Cooldown in progress"}
                    </p>
                  </div>
                )}
              </>
            )}

            {error && (
              <div className="bg-red-100 text-red-800 p-3 rounded-md mt-4">
                {error}
              </div>
            )}
          </div>
        </div>
      )}

      {/* How it works */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-black/5 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">How It Works</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 items-start">
              <div className="bg-primary/10 p-1 rounded">
                <PackageOpen className="h-4 w-4 text-primary" />
              </div>
              <span>Open one pack every 20 minutes</span>
            </li>
            <li className="flex gap-2 items-start">
              <div className="bg-primary/10 p-1 rounded">
                <BookOpen className="h-4 w-4 text-primary" />
              </div>
              <span>Each pack contains 5 random cards</span>
            </li>
            <li className="flex gap-2 items-start">
              <div className="bg-primary/10 p-1 rounded">
                <Check className="h-4 w-4 text-primary" />
              </div>
              <span>Answer correctly to claim the card</span>
            </li>
            <li className="flex gap-2 items-start">
              <div className="bg-primary/10 p-1 rounded">
                <X className="h-4 w-4 text-primary" />
              </div>
              <span>Wrong answers mean you lose the card</span>
            </li>
            <li className="flex gap-2 items-start">
              <div className="bg-primary/10 p-1 rounded">
                <AlertTriangle className="h-4 w-4 text-primary" />
              </div>
              <span>Sessions expire after 24 hours</span>
            </li>
          </ul>
        </div>

        <div className="bg-black/5 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Card Rarities</h2>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                Easy
              </span>
              <span className="font-bold">Common</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                Medium
              </span>
              <span className="font-bold">Uncommon</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                Hard
              </span>
              <span className="font-bold">Rare</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
