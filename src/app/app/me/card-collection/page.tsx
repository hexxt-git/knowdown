import { getCardCollection } from "@/actions/card-collection";
import { Card } from "@/lib/types/card";
export default async function CardCollection() {
  const cardCollection = await getCardCollection();

  return (
    <div>
      {cardCollection.map((card: Card) => (
        <div key={card.id}>{JSON.stringify(card)}</div>
      ))}
    </div>
  );
}
