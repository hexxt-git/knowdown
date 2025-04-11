"use client";

import { Button } from "@/components/ui/button";
import { useClerk } from "@clerk/nextjs";
import Image from "next/image";

export function UserProfile() {
  const { user, openUserProfile } = useClerk();

  return (
    <div className="absolute top-8 left-8 flex gap-2 items-center">
      <Button
        variant="ghost"
        className="p-0 size-fit border-6 border-black/15 rounded-md overflow-hidden"
        onClick={() => {
          openUserProfile();
        }}
      >
        {user?.imageUrl && (
          <Image
            src={user.imageUrl}
            alt="user"
            width={48}
            height={48}
            className="size-full"
          />
        )}
      </Button>
      <div className="flex flex-col">
        <p className="font-bold">{user?.fullName}</p>
        <p className="text-sm text-muted-foreground">{user?.id}</p>
      </div>
    </div>
  );
}
