"use server";

import { protectAction } from "./protect-action";
import { prisma } from "@/lib/prisma";
import { FriendInviteStatus } from "@prisma/client";
import { clerkClient } from "@clerk/nextjs/server";

export async function getUserStats() {
  const user = await protectAction("getUserStats", true);

  const userStats = await prisma.user.findUnique({
    where: { id: user.userId },
    include: {
      _count: {
        select: {
          cardCollection: true,
        },
      },
    },
  });

  if (!userStats) {
    // Create user if not exists
    return await prisma.user.create({
      data: {
        id: user.userId,
      },
      include: {
        _count: {
          select: {
            cardCollection: true,
          },
        },
      },
    });
  }

  return userStats;
}

export async function getFriends() {
  const user = await protectAction("getFriends", true);

  const currentUser = await prisma.user.findUnique({
    where: { id: user.userId },
    select: { friends: true },
  });

  if (!currentUser) {
    return { friends: [] };
  }

  return { friends: currentUser.friends };
}

export async function getPendingInvites() {
  const user = await protectAction("getPendingInvites", true);

  const pendingInvites = await prisma.friendInvite.findMany({
    where: {
      receiverId: user.userId,
      status: FriendInviteStatus.PENDING,
    },
  });

  return pendingInvites;
}

export async function sendFriendInvite(receiverId: string) {
  const user = await protectAction("sendFriendInvite", true);

  if (user.userId === receiverId) {
    throw new Error("Cannot send friend invite to yourself");
  }

  const receiver = await prisma.user.findUnique({
    where: { id: receiverId },
  });

  if (!receiver) {
    throw new Error("User not found");
  }

  const sender = await prisma.user.findUnique({
    where: { id: user.userId },
    select: { friends: true },
  });

  if (sender?.friends.includes(receiverId)) {
    throw new Error("Already friends with this user");
  }

  const existingInvite = await prisma.friendInvite.findFirst({
    where: {
      OR: [
        { senderId: user.userId, receiverId },
        { senderId: receiverId, receiverId: user.userId },
      ],
    },
  });

  if (existingInvite) {
    throw new Error("Friend invite already exists");
  }

  return await prisma.friendInvite.create({
    data: {
      senderId: user.userId,
      receiverId,
      status: FriendInviteStatus.PENDING,
    },
  });
}

export async function respondToFriendInvite(inviteId: string, accept: boolean) {
  const user = await protectAction("respondToFriendInvite", true);

  const invite = await prisma.friendInvite.findUnique({
    where: { id: inviteId },
  });

  if (!invite) {
    throw new Error("Invite not found");
  }

  if (invite.receiverId !== user.userId) {
    throw new Error("Not authorized to respond to this invite");
  }

  if (invite.status !== FriendInviteStatus.PENDING) {
    throw new Error("Invite has already been processed");
  }

  if (accept) {
    await prisma.user.update({
      where: { id: user.userId },
      data: {
        friends: {
          push: invite.senderId,
        },
      },
    });

    await prisma.user.update({
      where: { id: invite.senderId },
      data: {
        friends: {
          push: user.userId,
        },
      },
    });

    return await prisma.friendInvite.update({
      where: { id: inviteId },
      data: {
        status: FriendInviteStatus.ACCEPTED,
      },
    });
  } else {
    // Reject invite
    return await prisma.friendInvite.update({
      where: { id: inviteId },
      data: {
        status: FriendInviteStatus.BLOCKED,
      },
    });
  }
}

export type LeaderboardItem = {
  id: string;
  username: string;
  gamesPlayed: number;
  gamesWon: number;
  gamesLost: number;
  winRate: number;
  cardCount: number;
};

export type SortField = "wins" | "cards";

export async function getLeaderboard(
  sortBy: SortField = "wins",
  friendsOnly: boolean = false
) {
  const user = await protectAction("getLeaderboard", true);

  let friendIds: string[] = [];
  if (friendsOnly) {
    const currentUser = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { friends: true },
    });

    if (currentUser) {
      friendIds = currentUser.friends;
    }
  }

  const whereClause = friendsOnly
    ? { id: { in: [...friendIds, user.userId] } }
    : {};

  const dbUsers = await prisma.user.findMany({
    where: whereClause,
    include: {
      _count: {
        select: {
          cardCollection: true,
        },
      },
    },
  });

  const userIds = dbUsers.map((user) => user.id);

  const clerk = await clerkClient();
  const clerkUsers = await clerk.users.getUserList({
    userId: userIds,
  });

  const userNameMap = new Map();
  clerkUsers.data.forEach((user: any) => {
    const displayName =
      user.firstName && user.lastName
        ? `${user.firstName} ${user.lastName}`
        : user.username ||
          user.emailAddresses[0]?.emailAddress ||
          "Unknown User";

    userNameMap.set(user.id, displayName);
  });

  // Transform into leaderboard items
  const leaderboardItems: LeaderboardItem[] = dbUsers.map((dbUser) => {
    const winRate =
      dbUser.gamesPlayed > 0
        ? Math.round((dbUser.gamesWon / dbUser.gamesPlayed) * 100)
        : 0;

    return {
      id: dbUser.id,
      username: userNameMap.get(dbUser.id) || "Unknown User",
      gamesPlayed: dbUser.gamesPlayed,
      gamesWon: dbUser.gamesWon,
      gamesLost: dbUser.gamesLost,
      winRate,
      cardCount: dbUser._count.cardCollection,
    };
  });

  if (sortBy === "wins") {
    leaderboardItems.sort((a, b) => {
      // First by wins
      if (b.gamesWon !== a.gamesWon) {
        return b.gamesWon - a.gamesWon;
      }
      // Then by win rate
      return b.winRate - a.winRate;
    });
  } else {
    leaderboardItems.sort((a, b) => b.cardCount - a.cardCount);
  }

  return {
    items: leaderboardItems,
    currentUserId: user.userId,
  };
}
