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
          className="absolute inset-0 max-w-none max-h-none w-full h-full object-cover -z-10 opacity-7 origin-center translate-x-8 -translate-y-24"
          style={{
            transform:
              "perspective(1000px) rotateX(17deg) rotateY(6deg) scale(1.2)",
            transformStyle: "preserve-3d",
          }}
        />
      </div>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-5xl font-bold mb-6">Welcome to Minduel</h1>
        <p className="text-xl text-muted-foreground mb-8">
          The Competitive study duels for excelling students.
        </p>
        <Link href="/app">
          <Button size="xl">Go to App</Button>
        </Link>
      </div>
    </main>
  );
}
