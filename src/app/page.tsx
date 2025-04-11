import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-5xl font-bold mb-6">Welcome to Knowdown</h1>
        <p className="text-xl text-muted-foreground mb-8">
          Your knowledge, organized and accessible. Start building your personal
          knowledge base today.
        </p>
        <Link href="/app">
          <Button size="xl">Go to App</Button>
        </Link>
      </div>
    </main>
  );
}
