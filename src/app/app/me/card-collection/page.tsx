"use client";

import { getCardCollection } from "@/actions/cards";
import { Card as CardType } from "@/lib/types/card";
import { Card as CardComponent } from "@/components/game/Card";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Search,
  SortDesc,
  SortAsc,
  Filter,
  Grid3x3,
  Menu,
  BarChart,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function CardCollection() {
  const [cards, setCards] = useState<CardType[]>([]);
  const [filteredCards, setFilteredCards] = useState<CardType[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState<{
    field: "difficulty" | "alphabetical";
    order: "asc" | "desc";
  }>({ field: "difficulty", order: "asc" });
  const [filterLevel, setFilterLevel] = useState<number | null>(null);
  const [filterSubject, setFilterSubject] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState<string[]>([]);

  useEffect(() => {
    const fetchCards = async () => {
      try {
        const cardCollection = await getCardCollection();
        setCards(cardCollection);
        setFilteredCards(cardCollection);

        // Extract unique subjects
        const uniqueSubjects = Array.from(
          new Set(cardCollection.map((card) => card.subject))
        );
        setSubjects(uniqueSubjects);

        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch cards:", error);
        setLoading(false);
      }
    };

    fetchCards();
  }, []);

  useEffect(() => {
    let result = [...cards];

    // Apply search
    if (searchTerm) {
      result = result.filter(
        (card) =>
          card.thumbnail.toLowerCase().includes(searchTerm.toLowerCase()) ||
          card.question.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply level filter
    if (filterLevel !== null) {
      result = result.filter((card) => card.level === filterLevel);
    }

    // Apply subject filter
    if (filterSubject) {
      result = result.filter((card) => card.subject === filterSubject);
    }

    // Apply sorting
    result.sort((a, b) => {
      if (sortOrder.field === "difficulty") {
        return sortOrder.order === "asc"
          ? a.level - b.level
          : b.level - a.level;
      } else {
        // Alphabetical sorting
        return sortOrder.order === "asc"
          ? a.thumbnail.localeCompare(b.thumbnail)
          : b.thumbnail.localeCompare(a.thumbnail);
      }
    });

    setFilteredCards(result);
  }, [cards, searchTerm, filterLevel, filterSubject, sortOrder]);

  // Calculate stats
  const cardStats = {
    total: cards.length,
    byLevel: {
      1: cards.filter((card) => card.level === 1).length,
      2: cards.filter((card) => card.level === 2).length,
      3: cards.filter((card) => card.level === 3).length,
    },
  };

  // Function to cycle through sort options
  const cycleSortOrder = () => {
    if (sortOrder.field === "difficulty" && sortOrder.order === "asc") {
      setSortOrder({ field: "difficulty", order: "desc" });
    } else if (sortOrder.field === "difficulty" && sortOrder.order === "desc") {
      setSortOrder({ field: "alphabetical", order: "asc" });
    } else if (
      sortOrder.field === "alphabetical" &&
      sortOrder.order === "asc"
    ) {
      setSortOrder({ field: "alphabetical", order: "desc" });
    } else {
      setSortOrder({ field: "difficulty", order: "asc" });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="animate-pulse text-xl">
          Loading your card collection...
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-primary">
          My Card Collection
        </h1>
        <div className="flex flex-wrap gap-4 mb-4 items-center">
          <div className="bg-black/10 p-4 rounded-lg flex items-center gap-3">
            <BarChart className="h-5 w-5" />
            <div>
              <span className="text-sm opacity-70">Total Cards:</span>
              <span className="ml-2 font-bold">{cardStats.total}</span>
            </div>
          </div>
          <div className="bg-black/5 p-3 rounded-lg flex items-center gap-2">
            <span className="text-xs opacity-70">Easy:</span>
            <span className="font-medium">{cardStats.byLevel[1]}</span>
          </div>
          <div className="bg-black/5 p-3 rounded-lg flex items-center gap-2">
            <span className="text-xs opacity-70">Medium:</span>
            <span className="font-medium">{cardStats.byLevel[2]}</span>
          </div>
          <div className="bg-black/5 p-3 rounded-lg flex items-center gap-2">
            <span className="text-xs opacity-70">Hard:</span>
            <span className="font-medium">{cardStats.byLevel[3]}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-grow max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search cards..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={cycleSortOrder}
            className="flex items-center gap-1"
          >
            {sortOrder.field === "difficulty" ? (
              sortOrder.order === "asc" ? (
                <SortAsc className="h-4 w-4" />
              ) : (
                <SortDesc className="h-4 w-4" />
              )
            ) : sortOrder.order === "asc" ? (
              <SortAsc className="h-4 w-4" />
            ) : (
              <SortDesc className="h-4 w-4" />
            )}
            <span>
              {sortOrder.field === "difficulty" ? "Difficulty" : "A-Z"}{" "}
              {sortOrder.order === "asc" ? "↑" : "↓"}
            </span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
            className="flex items-center gap-1"
          >
            {viewMode === "grid" ? (
              <Grid3x3 className="h-4 w-4" />
            ) : (
              <Menu className="h-4 w-4" />
            )}
            <span>View</span>
          </Button>

          <div className="flex gap-1">
            <Button
              variant={filterLevel === null ? "secondary" : "outline"}
              size="sm"
              onClick={() => setFilterLevel(null)}
            >
              All
            </Button>
            <Button
              variant={filterLevel === 1 ? "secondary" : "outline"}
              size="sm"
              onClick={() => setFilterLevel(1)}
            >
              Easy
            </Button>
            <Button
              variant={filterLevel === 2 ? "secondary" : "outline"}
              size="sm"
              onClick={() => setFilterLevel(2)}
            >
              Medium
            </Button>
            <Button
              variant={filterLevel === 3 ? "secondary" : "outline"}
              size="sm"
              onClick={() => setFilterLevel(3)}
            >
              Hard
            </Button>
          </div>
        </div>
      </div>

      {subjects.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2 items-center">
          <Filter className="h-4 w-4 mr-1" />
          <span className="text-sm mr-2">Subject:</span>
          <Button
            variant={filterSubject === null ? "secondary" : "outline"}
            size="sm"
            onClick={() => setFilterSubject(null)}
          >
            All
          </Button>
          {subjects.map((subject) => (
            <Button
              key={subject}
              variant={filterSubject === subject ? "secondary" : "outline"}
              size="sm"
              onClick={() => setFilterSubject(subject)}
            >
              {subject}
            </Button>
          ))}
        </div>
      )}

      {filteredCards.length === 0 ? (
        <div className="text-center py-12 bg-black/5 rounded-xl">
          <p className="text-lg mb-2">No cards match your filters</p>
          <Button
            variant="secondary"
            onClick={() => {
              setSearchTerm("");
              setFilterLevel(null);
              setFilterSubject(null);
            }}
          >
            Clear Filters
          </Button>
        </div>
      ) : (
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-2 sm:flex flex-wrap gap-4"
              : "flex flex-col gap-3"
          }
        >
          {filteredCards.map((card: CardType) => (
            <div key={card.id}>
              {viewMode === "list" ? (
                <Dialog>
                  <DialogTrigger asChild>
                    <div className="flex bg-black/5 rounded-lg p-4 hover:bg-black/10 transition-colors cursor-pointer">
                      <div className="flex-grow">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium">{card.thumbnail}</h3>
                          <span
                            className={`text-xs px-2 py-0.5 rounded ${
                              card.level === 1
                                ? "bg-green-500"
                                : card.level === 2
                                ? "bg-yellow-500"
                                : "bg-red-500"
                            }`}
                          >
                            {card.level === 1
                              ? "Easy"
                              : card.level === 2
                              ? "Medium"
                              : "Hard"}
                          </span>
                          <span className="text-xs bg-black/20 px-2 py-0.5 rounded ml-auto">
                            {card.subject}
                          </span>
                        </div>
                        <p className="text-sm opacity-70 line-clamp-2">
                          {card.question}
                        </p>
                      </div>
                    </div>
                  </DialogTrigger>
                  <DialogContent
                    noClose
                    className="border-none bg-transparent shadow-none w-fit h-fit max-w-none! max-h-none! p-0"
                  >
                    <DialogTitle className="sr-only">
                      {card.thumbnail}
                    </DialogTitle>
                    <CardComponent card={card} />
                  </DialogContent>
                </Dialog>
              ) : (
                <div className="w-fit">
                  <CardComponent card={card} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
