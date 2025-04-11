"use client";

import { useState, useEffect } from "react";
import { getPackStatus, openPack } from "@/actions/packs";
import { Card as CardType } from "@/lib/types/card";
import { Card as CardComponent } from "@/components/game/Card";
import { Button } from "@/components/ui/button";
import {
  Package,
  Clock,
  Sparkles,
  PackageOpen,
  BarChart,
  BookOpen,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function PacksPage() {
  const [canOpenPack, setCanOpenPack] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [loading, setLoading] = useState(true);
  const [openingPack, setOpeningPack] = useState(false);
  const [packCards, setPackCards] = useState<CardType[]>([]);
  const [showingResult, setShowingResult] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextAvailableAt, setNextAvailableAt] = useState<Date | null>(null);

  // Format countdown time as mm:ss
  const formatCountdown = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  // Check if user can open a pack
  const checkPackStatus = async () => {
    try {
      const status = await getPackStatus();
      setCanOpenPack(status.canOpen);
      setCooldownRemaining(status.cooldownRemaining);

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
      setNextAvailableAt(result.nextPackAvailableAt);
      setShowingResult(true);
      setCanOpenPack(false);
      setCooldownRemaining(20 * 60); // 20 minutes
    } catch (error: any) {
      setError(error.message || "Failed to open pack");
    } finally {
      setOpeningPack(false);
    }
  };

  // After showing results, allow user to get another pack
  const handleDone = () => {
    setShowingResult(false);
    setPackCards([]);
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
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-yellow-500" />
              Pack Opened!
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
              {packCards.map((card) => (
                <div
                  key={card.id}
                  className="flex justify-center transform hover:scale-105 transition-transform"
                >
                  <CardComponent card={card} />
                </div>
              ))}
            </div>

            <div className="flex justify-center">
              <Button onClick={handleDone} size="lg">
                Done
              </Button>
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
                  Next pack available in
                </h2>

                <div className="flex flex-col items-center py-8">
                  <div className="text-4xl font-bold mb-2">
                    {formatCountdown(cooldownRemaining)}
                  </div>
                  <p className="text-muted-foreground">
                    {nextAvailableAt
                      ? `Next pack at ${nextAvailableAt.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}`
                      : "Cooldown in progress"}
                  </p>
                </div>
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
                <BarChart className="h-4 w-4 text-primary" />
              </div>
              <span>Cards vary in difficulty and subject</span>
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
