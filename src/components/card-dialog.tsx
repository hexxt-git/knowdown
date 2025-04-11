"use client";

import { Card } from "@/lib/types/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

interface CardDialogProps {
  card: Card;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CardDialog({ card, open, onOpenChange }: CardDialogProps) {
  const [isExplanationOpen, setIsExplanationOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {card.question}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            {card.answers.map((answer, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border ${
                  index === card.correctAnswer
                    ? "border-green-500 bg-green-50"
                    : "border-gray-200"
                }`}
              >
                {answer}
              </div>
            ))}
          </div>
          <Collapsible
            open={isExplanationOpen}
            onOpenChange={setIsExplanationOpen}
          >
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between">
                <span>Explanation</span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${
                    isExplanationOpen ? "rotate-180" : ""
                  }`}
                />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-4">
              <div className="rounded-lg bg-gray-50 p-4 text-sm">
                {card.explanation}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </DialogContent>
    </Dialog>
  );
}
