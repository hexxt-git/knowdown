import { Button } from "@/components/ui/button";
import { SignInButton, SignOutButton } from "@clerk/nextjs";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import { Trophy, Users, BookOpen, Sword, Settings, LogOut } from "lucide-react";
import Link from "next/link";
import { UserProfile } from "@/components/layout/UserProfile";

export default async function Home() {
  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center space-y-8">
      <SignedIn>
        <UserProfile />
      </SignedIn>
      <div className="absolute bottom-8 right-8 m-0!">
        <SignOutButton>
          <button className="text-destructive hover:underline me-2 cursor-pointer">
            Sign Out
          </button>
        </SignOutButton>
      </div>
      <h1 className="text-4xl font-bold text-center text-primary">Knowdown</h1>
      <div className="flex flex-col gap-4 md:w-auto w-full md:min-w-82 p-8">
        <SignedIn>
          <Button size="xl">
            Start Battle &nbsp; <Sword strokeWidth={2} className="size-6" />
          </Button>
          <Link href="/app/me/card-collection" className="contents">
            <Button size="xl" variant="secondary">
              Card Collection <BookOpen strokeWidth={2} className="size-6" />
            </Button>
          </Link>
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
