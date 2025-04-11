import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";

export default function LandingPage() {
  return (
    <main className="min-h-dvh flex flex-col items-center justify-center overflow-hidden">
      <div className="absolute inset-0 -z-10 overflow-clip">
        <Image
          src="/background.png"
          width={1000}
          height={1000}
          alt="background"
          className="absolute inset-0 max-w-none max-h-none w-full h-full object-cover -z-10 opacity-7"
          style={{
            transform:
              "perspective(1000px) rotateX(12deg) rotateY(6deg) scale(1.15)",
            transformStyle: "preserve-3d",
          }}
        />
      </div>
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
