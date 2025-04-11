"use client";

import { Card as CardType } from "@/lib/types/card";
import EasyCard from "@/assets/cards/easy.svg";
import MediumCard from "@/assets/cards/medium.svg";
import HardCard from "@/assets/cards/hard.svg";

import EasyModal from "@/assets/modals/easy.svg";
import MediumModal from "@/assets/modals/medium.svg";
import HardModal from "@/assets/modals/hard.svg";

import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { DialogTitle } from "@radix-ui/react-dialog";
import { motion } from "framer-motion";
import { useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";

export function CardThumbnail({
  card,
  hoverable = false,
}: {
  card: Pick<CardType, "thumbnail" | "level">;
  hoverable?: boolean;
}) {
  const BackgroundSvg =
    card.level === 1 ? EasyCard : card.level === 2 ? MediumCard : HardCard;

  const hoverRotation = Math.sqrt(Math.random()) * 10 - 5;

  return (
    <div className="cursor-pointer">
      <motion.div
        className="relative shrink-0 grow-0 my-0 -mx-4"
        whileHover={
          hoverable
            ? {
                scale: 1.05,
                rotate: hoverRotation,
                transition: { duration: 0.3 },
              }
            : {}
        }
      >
        <img
          src={BackgroundSvg.src}
          alt="card background"
          width={200}
          height={350}
        />
        <div
          className={cn(
            "absolute inset-0 p-8 text-center text-balance flex flex-col items-center justify-center",
            card.level === 3 && "text-danger"
          )}
        >
          {card.thumbnail}
        </div>
      </motion.div>
    </div>
  );
}

export function Card({ card }: { card: CardType }) {
  const BackgroundSvg =
    card.level === 1 ? EasyModal : card.level === 2 ? MediumModal : HardModal;
  const [isAnswerOpen, setIsAnswerOpen] = useState(false);
  const [isExplanationOpen, setIsExplanationOpen] = useState(false);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <div>
          <CardThumbnail hoverable card={card} />
        </div>
      </DialogTrigger>
      <DialogContent className="border-none bg-transparent shadow-none w-fit h-fit max-w-none! max-h-none! p-0">
        <img
          src={BackgroundSvg.src}
          alt="card background"
          className="w-200 max-w-[90vw]"
        />
        <DialogTitle className="sr-only">{card.question}</DialogTitle>
        <div className="absolute inset-8 flex flex-col gap-4 items-center justify-center">
          <h1 className="text-2xl font-bold text-black/70 text-center">
            {card.question}
          </h1>

          <Collapsible
            open={isAnswerOpen}
            onOpenChange={setIsAnswerOpen}
            className="w-full"
          >
            <CollapsibleTrigger asChild>
              <button className="bg-black/20 flex items-center gap-2 p-2 rounded-lg w-fit mb-4 border border-black/20">
                <span>Reveal Answer</span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${
                    isAnswerOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2">
              <div className="rounded-lg bg-black/15 p-4 text-base border border-black/15">
                <p className="text-center text-lg font-medium bg-black/15 p-2 rounded-lg w-fit mx-auto mb-4">
                  {card.answers[card.correctAnswer]}
                </p>
                <p>{card.explanation}</p>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </DialogContent>
    </Dialog>
  );
}
