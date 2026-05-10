export interface Deck {
  id: string;
  title: string;
  description: string;
  created_at: string;
  cardCount: number;
  dueCount: number;
}

export interface Card {
  id: string;
  deck_id: string;
  front: string;
  back: string;
  next_review: string;
  interval: number;
  repetition: number;
  efactor: number;
  created_at: string;
}

export interface Stats {
  totalDecks: number;
  totalCards: number;
  cardsDue: number;
  reviewsToday: number;
}
