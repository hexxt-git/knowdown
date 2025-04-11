import { type Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Bungee } from "next/font/google";
import "./globals.css";

const bungee = Bungee({
  variable: "--font-bungee",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "Knowdown | A showdown of smarts",
  description: "compete in 1v1 battles and cleam your opponents cards",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${bungee.variable} antialiased`}>
          <div className="absolute inset-4 border-4 border-dashed border-black/15 rounded-xl pointer-events-none m-0!"></div>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
