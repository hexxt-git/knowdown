"use client";

import {
  getUserStats,
  getFriends,
  getPendingInvites,
  sendFriendInvite,
  respondToFriendInvite,
} from "@/actions/users";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  Trophy,
  BookOpen,
  Users,
  Check,
  X,
  UserPlus,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

// Friend Invite Item Component
interface FriendInviteItemProps {
  invite: {
    id: string;
    senderId: string;
    senderName: string;
    receiverId: string;
    status: string;
  };
  onResponse: (
    inviteId: string,
    accept: boolean,
    senderId: string
  ) => Promise<void>;
}

function FriendInviteItem({ invite, onResponse }: FriendInviteItemProps) {
  const [isResponding, setIsResponding] = useState(false);
  const [responseStatus, setResponseStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });

  const handleResponse = async (accept: boolean) => {
    setIsResponding(true);

    try {
      await onResponse(invite.id, accept, invite.senderId);

      setResponseStatus({
        type: "success",
        message: accept ? "Friend request accepted" : "Friend request declined",
      });
    } catch (error: any) {
      setResponseStatus({
        type: "error",
        message: error.message || "Failed to respond to invite",
      });
      setIsResponding(false);
    }
  };

  return (
    <div className="flex flex-col p-2 bg-black/5 rounded">
      <div className="flex justify-between items-center">
        <span className="text-sm">
          {invite.senderName}{" "}
          <span className="text-xs text-muted-foreground">
            ({invite.senderId})
          </span>
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7 bg-green-500/10 hover:bg-green-500/20"
            onClick={() => handleResponse(true)}
            disabled={isResponding || responseStatus.type !== null}
          >
            <Check className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7 bg-red-500/10 hover:bg-red-500/20"
            onClick={() => handleResponse(false)}
            disabled={isResponding || responseStatus.type !== null}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {responseStatus.type && (
        <div
          className={`mt-2 text-xs flex items-center ${
            responseStatus.type === "success"
              ? "text-green-600"
              : "text-red-600"
          }`}
        >
          {responseStatus.type === "success" ? (
            <CheckCircle className="h-3 w-3 mr-1" />
          ) : (
            <AlertCircle className="h-3 w-3 mr-1" />
          )}
          {responseStatus.message}
        </div>
      )}
    </div>
  );
}

export default function MePage() {
  const [userStats, setUserStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [friends, setFriends] = useState<
    Array<{ id: string; username: string }>
  >([]);
  const [pendingInvites, setPendingInvites] = useState<any[]>([]);
  const [newFriendId, setNewFriendId] = useState("");
  const [isAddingFriend, setIsAddingFriend] = useState(false);
  const [inviteStatus, setInviteStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [stats, friendsData, invites] = await Promise.all([
          getUserStats(),
          getFriends(),
          getPendingInvites(),
        ]);

        setUserStats(stats);
        setFriends(friendsData.friends);
        setPendingInvites(invites);
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch user data:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="animate-pulse text-xl">Loading your stats...</div>
      </div>
    );
  }

  const winRate =
    userStats.gamesPlayed > 0
      ? Math.round((userStats.gamesWon / userStats.gamesPlayed) * 100)
      : 0;

  const handleSendInvite = async () => {
    if (!newFriendId.trim()) {
      setInviteStatus({
        type: "error",
        message: "Please enter a friend ID",
      });
      return;
    }

    setIsAddingFriend(true);
    setInviteStatus({ type: null, message: "" });

    try {
      await sendFriendInvite(newFriendId);
      setNewFriendId("");
      setInviteStatus({
        type: "success",
        message: "Friend invite sent successfully",
      });

      // Close dialog after 2 seconds on success
      setTimeout(() => {
        setDialogOpen(false);
        // Reset status after dialog closes
        setTimeout(() => {
          setInviteStatus({ type: null, message: "" });
        }, 300);
      }, 2000);
    } catch (error: any) {
      setInviteStatus({
        type: "error",
        message: error.message || "Failed to send friend invite",
      });
    } finally {
      setIsAddingFriend(false);
    }
  };

  const handleRespondToInvite = async (
    inviteId: string,
    accept: boolean,
    senderId: string
  ) => {
    try {
      await respondToFriendInvite(inviteId, accept);

      // Find the sender name from the pending invites
      const invite = pendingInvites.find((inv) => inv.id === inviteId);

      // Update local state
      if (accept && invite) {
        setFriends((prevFriends) => [
          ...prevFriends,
          {
            id: senderId,
            username: invite.senderName,
          },
        ]);
      }

      // Remove invite from list after 2 seconds
      setTimeout(() => {
        setPendingInvites((prevInvites) =>
          prevInvites.filter((inv) => inv.id !== inviteId)
        );
      }, 2000);

      return Promise.resolve();
    } catch (error: any) {
      return Promise.reject(error);
    }
  };

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-primary">My Profile</h1>

        <div className="flex flex-wrap gap-4 mb-4 items-center">
          <div className="bg-black/10 p-4 rounded-lg flex items-center gap-3">
            <BarChart className="h-5 w-5" />
            <div>
              <span className="text-sm opacity-70">Total Games:</span>
              <span className="ml-2 font-bold">{userStats.gamesPlayed}</span>
            </div>
          </div>
          <div className="bg-black/5 p-3 rounded-lg flex items-center gap-2">
            <span className="text-xs opacity-70">Wins:</span>
            <span className="font-medium">{userStats.gamesWon}</span>
          </div>
          <div className="bg-black/5 p-3 rounded-lg flex items-center gap-2">
            <span className="text-xs opacity-70">Losses:</span>
            <span className="font-medium">{userStats.gamesLost}</span>
          </div>
          <div className="bg-black/5 p-3 rounded-lg flex items-center gap-2">
            <span className="text-xs opacity-70">Win Rate:</span>
            <span className="font-medium">{winRate}%</span>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <div className="bg-black/5 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Card Collection
          </h2>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm opacity-70">Total Cards:</span>
              <span className="ml-2 font-bold">
                {userStats._count.cardCollection}
              </span>
            </div>
            <Link href="/app/me/card-collection">
              <Button variant="secondary" size="sm">
                View Collection
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-black/5 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Game Stats
          </h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="opacity-70">Games Played:</span>
              <span className="font-bold">{userStats.gamesPlayed}</span>
            </div>
            <div className="flex justify-between">
              <span className="opacity-70">Games Won:</span>
              <span className="font-bold">{userStats.gamesWon}</span>
            </div>
            <div className="flex justify-between">
              <span className="opacity-70">Games Lost:</span>
              <span className="font-bold">{userStats.gamesLost}</span>
            </div>
            <div className="flex justify-between">
              <span className="opacity-70">Win Rate:</span>
              <span className="font-bold">{winRate}%</span>
            </div>
          </div>
        </div>

        <div className="bg-black/5 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Users className="h-5 w-5" />
            Friends ({friends.length})
          </h2>

          {friends.length > 0 ? (
            <div className="space-y-2 mb-4">
              {friends.map((friend) => (
                <div
                  key={friend.id}
                  className="flex justify-between items-center p-2 bg-black/5 rounded"
                >
                  <span className="font-medium">{friend.username}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground mb-4">
              No friends yet
            </p>
          )}

          {pendingInvites.length > 0 && (
            <>
              <h3 className="font-medium text-sm mb-2 mt-4">
                Pending Invites ({pendingInvites.length})
              </h3>
              <div className="space-y-2 mb-4">
                {pendingInvites.map((invite) => (
                  <FriendInviteItem
                    key={invite.id}
                    invite={invite}
                    onResponse={handleRespondToInvite}
                  />
                ))}
              </div>
            </>
          )}

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full">
                <UserPlus className="h-4 w-4 mr-2" />
                Add Friend
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add a Friend</DialogTitle>
              </DialogHeader>
              <div className="py-4">
                <label className="text-sm font-medium mb-2 block">
                  Friend Username or ID
                </label>
                <Input
                  value={newFriendId}
                  onChange={(e) => setNewFriendId(e.target.value)}
                  placeholder="Enter friend's username or ID"
                  className={
                    inviteStatus.type === "error" ? "border-red-500" : ""
                  }
                />
                {inviteStatus.type && (
                  <div
                    className={`mt-2 text-sm flex items-center ${
                      inviteStatus.type === "success"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {inviteStatus.type === "success" ? (
                      <CheckCircle className="h-4 w-4 mr-1" />
                    ) : (
                      <AlertCircle className="h-4 w-4 mr-1" />
                    )}
                    {inviteStatus.message}
                  </div>
                )}
                <p className="text-xs text-muted-foreground/80 mt-2">
                  You can search by username or ID to add a friend.
                </p>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button
                  onClick={handleSendInvite}
                  disabled={isAddingFriend || !newFriendId.trim()}
                >
                  {isAddingFriend ? "Sending..." : "Send Invite"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </>
  );
}
