import { getCardCollection } from "@/actions/cards";
import { Card } from "@/lib/types/card";
import { Card as CardComponent } from "@/components/game/Card";

export default async function CardCollection() {
  const cardCollection = await getCardCollection();

  return (
    <div className="flex p-8 flex-wrap items-start gap-4">
      {cardCollection.map((card: Card) => (
        <CardComponent key={card.id} card={card} />
      ))}
    </div>
  );
}
