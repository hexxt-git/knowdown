"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { SignInButton, SignOutButton } from "@clerk/nextjs";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import {
  Trophy,
  Users,
  BookOpen,
  Sword,
  Settings,
  LogOut,
  Package,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { UserProfile } from "@/components/layout/UserProfile";
import { getPackStatus } from "@/actions/packs";
import { cn } from "@/lib/utils";

export default function Home() {
  const [packAvailable, setPackAvailable] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [loading, setLoading] = useState(true);

  // Format countdown time as mm:ss
  const formatCountdown = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  // Check pack status on load
  useEffect(() => {
    const checkPack = async () => {
      try {
        const status = await getPackStatus();
        setPackAvailable(status.canOpen);
        setCooldownRemaining(status.cooldownRemaining);
        setLoading(false);
      } catch (error) {
        console.error("Failed to check pack status:", error);
        setLoading(false);
      }
    };

    checkPack();
  }, []);

  // Countdown timer
  useEffect(() => {
    if (cooldownRemaining > 0) {
      const timer = setInterval(() => {
        setCooldownRemaining((prev) => {
          const newValue = prev - 1;
          if (newValue <= 0) {
            setPackAvailable(true);
            clearInterval(timer);
            return 0;
          }
          return newValue;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [cooldownRemaining]);

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center space-y-8">
      <SignedIn>
        <UserProfile />

        {/* Floating Pack Button - Desktop only */}
        <div className="fixed top-8 right-8 hidden md:block z-10">
          <Link href="/app/packs">
            <Button
              size="lg"
              variant="secondary"
              className={cn(
                "flex flex-col items-center p-3 px-4 gap-1 relative h-fit",
                packAvailable &&
                  "animate-pulse shadow-lg shadow-primary/20 ring-2 ring-primary"
              )}
            >
              <Package strokeWidth={2} className="size-6" />
              <span className="text-xs font-medium">Packs</span>
              {!packAvailable && !loading && (
                <div className="absolute -bottom-2 -right-2 bg-black/80 text-white text-[10px] px-1.5 py-0.5 rounded-full flex items-center gap-1">
                  <Clock className="h-2.5 w-2.5" />
                  {formatCountdown(cooldownRemaining)}
                </div>
              )}
              {packAvailable && (
                <span className="absolute -top-1 -right-1 bg-primary text-white text-xs w-4 h-4 flex items-center justify-center rounded-full">
                  !
                </span>
              )}
            </Button>
          </Link>
        </div>
      </SignedIn>
      <div className="absolute bottom-8 right-8 m-0!">
        <SignOutButton>
          <button className="text-destructive hover:underline me-2 cursor-pointer">
            Sign Out
          </button>
        </SignOutButton>
      </div>
      <h1 className="text-4xl font-bold text-center text-primary">Knowdown</h1>
      <div className="flex flex-col gap-4 md:w-auto w-full md:min-w-82 md:p-8">
        <SignedIn>
          <Link href="/game" className="contents">
            <Button size="xl">
              Start Battle &nbsp; <Sword strokeWidth={2} className="size-6" />
            </Button>
          </Link>
          <Link href="/app/me/card-collection" className="contents">
            <Button size="xl" variant="secondary">
              Card Collection <BookOpen strokeWidth={2} className="size-6" />
            </Button>
          </Link>

          {/* Mobile-only Pack Button */}
          <div className="md:hidden">
            <Link href="/app/packs" className="contents">
              <Button
                size="xl"
                variant="secondary"
                className={cn(
                  "w-full relative",
                  packAvailable &&
                    "animate-pulse shadow-lg shadow-primary/20 ring-2 ring-primary"
                )}
              >
                Card Packs <Package strokeWidth={2} className="size-6" />
                {!packAvailable && !loading && (
                  <div className="absolute right-3 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded-full flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatCountdown(cooldownRemaining)}
                  </div>
                )}
                {packAvailable && (
                  <span className="absolute right-3 bg-primary text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                    !
                  </span>
                )}
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[5fr_5fr_1fr] gap-4 md:gap-2">
            <Link href="/app/leaderboard" className="contents">
              <Button size="xl" variant="secondary">
                Leaderboard <Trophy strokeWidth={2} className="size-6" />
              </Button>
            </Link>
            <Link href="/app/me" className="contents">
              <Button size="xl" variant="secondary">
                Friends <Users strokeWidth={2} className="size-6" />
              </Button>
            </Link>

            <Button size="xl" variant="secondary">
              <Settings strokeWidth={2} className="size-6" />
            </Button>
          </div>
        </SignedIn>
        <SignedOut>
          <SignInButton>
            <Button>Sign In</Button>
          </SignInButton>
        </SignedOut>
      </div>
    </div>
  );
}
