"use client";

import {
  getLeaderboard,
  type LeaderboardItem,
  type SortField,
} from "@/actions/users";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Medal,
  TrendingUp,
  UserSquare,
  BookOpen,
  Trophy,
  Users,
  Filter,
  CircleUser,
  Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortField>("wins");
  const [friendsOnly, setFriendsOnly] = useState(false);
  const [currentUserId, setCurrentUserId] = useState("");

  useEffect(() => {
    fetchLeaderboard();
  }, [sortBy, friendsOnly]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const data = await getLeaderboard(sortBy, friendsOnly);
      setLeaderboard(data.items);
      setCurrentUserId(data.currentUserId);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch leaderboard:", error);
      setLoading(false);
    }
  };

  const getMedalIcon = (position: number) => {
    switch (position) {
      case 0:
        return <Medal className="h-5 w-5 text-yellow-500" />;
      case 1:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 2:
        return <Medal className="h-5 w-5 text-amber-700" />;
      default:
        return <UserSquare className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getRankLabel = (position: number) => {
    switch (position) {
      case 0:
        return "1st";
      case 1:
        return "2nd";
      case 2:
        return "3rd";
      default:
        return `${position + 1}${
          position % 10 === 1
            ? "st"
            : position % 10 === 2
            ? "nd"
            : position % 10 === 3
            ? "rd"
            : "th"
        }`;
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-8 text-primary">Leaderboard</h1>
        <div className="flex items-center justify-center h-[50vh]">
          <div className="animate-pulse text-xl">
            Loading leaderboard data...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-2 text-primary">Leaderboard</h1>

      <div className="mb-8 flex flex-wrap gap-4 items-center">
        {/* Filters */}
        <div className="flex gap-2 items-center">
          <div className="bg-black/5 p-1 rounded-lg flex">
            <Button
              variant={sortBy === "wins" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setSortBy("wins")}
              className="gap-1"
            >
              <Trophy className="h-4 w-4" />
              Wins
            </Button>
            <Button
              variant={sortBy === "cards" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setSortBy("cards")}
              className="gap-1"
            >
              <BookOpen className="h-4 w-4" />
              Cards
            </Button>
          </div>

          <div className="bg-black/5 p-1 rounded-lg flex">
            <Button
              variant={!friendsOnly ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setFriendsOnly(false)}
              className="gap-1"
            >
              <Globe className="h-4 w-4" />
              Global
            </Button>
            <Button
              variant={friendsOnly ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setFriendsOnly(true)}
              className="gap-1"
            >
              <Users className="h-4 w-4" />
              Friends
            </Button>
          </div>
        </div>
      </div>

      {/* Leaderboard table */}
      <div className="bg-black/5 rounded-lg overflow-hidden">
        <div className="grid grid-cols-[auto_1fr_repeat(3,auto)] bg-black/10 p-3 gap-4 font-medium text-sm">
          <div>Rank</div>
          <div>Player</div>
          <div className="text-right">
            {sortBy === "wins" ? "Wins" : "Cards"}
          </div>
          <div className="text-right">
            {sortBy === "wins" ? "Win Rate" : "Games"}
          </div>
          <div className="text-right">
            {sortBy === "wins" ? "Games" : "Win Rate"}
          </div>
        </div>

        {leaderboard.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            {friendsOnly ? "No friends data available" : "No players found"}
          </div>
        ) : (
          <div className="divide-y divide-black/5">
            {leaderboard.map((player, index) => (
              <div
                key={player.id}
                className={cn(
                  "grid grid-cols-[auto_1fr_repeat(3,auto)] p-3 gap-4 items-center hover:bg-black/5 transition-colors",
                  player.id === currentUserId && "bg-primary/5"
                )}
              >
                <div className="flex items-center justify-center w-8">
                  {getMedalIcon(index)}
                </div>
                <div className="flex items-center gap-2 font-medium">
                  {player.id === currentUserId && (
                    <CircleUser className="h-4 w-4 text-primary" />
                  )}
                  <span>
                    {player.id === currentUserId
                      ? "You: " + player.username
                      : player.username}
                  </span>
                </div>
                <div className="text-right font-semibold px-4">
                  {sortBy === "wins" ? player.gamesWon : player.cardCount}
                </div>
                <div className="text-right px-4">
                  {sortBy === "wins" ? (
                    <span className="flex items-center justify-end gap-1">
                      {player.winRate}%
                      {player.winRate > 50 && (
                        <TrendingUp className="h-3 w-3 text-green-500" />
                      )}
                    </span>
                  ) : (
                    player.gamesPlayed
                  )}
                </div>
                <div className="text-right px-4">
                  {sortBy === "wins" ? (
                    player.gamesPlayed
                  ) : (
                    <span className="flex items-center justify-end gap-1">
                      {player.winRate}%
                      {player.winRate > 50 && (
                        <TrendingUp className="h-3 w-3 text-green-500" />
                      )}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
