import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import cors from "cors";
import Database from "better-sqlite3";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Database setup
  const db = new Database("synapse.db");
  db.pragma("foreign_keys = ON");

  // Initialize Tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS decks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS cards (
      id TEXT PRIMARY KEY,
      deck_id TEXT NOT NULL,
      front TEXT NOT NULL,
      back TEXT NOT NULL,
      next_review DATETIME DEFAULT CURRENT_TIMESTAMP,
      interval INTEGER DEFAULT 0,
      repetition INTEGER DEFAULT 0,
      efactor REAL DEFAULT 2.5,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (deck_id) REFERENCES decks(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS study_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      card_id TEXT NOT NULL,
      quality INTEGER NOT NULL,
      reviewed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE
    );
  `);

  app.use(cors());
  app.use(express.json());

  // API Routes
  app.get("/api/decks", (req, res) => {
    const decks = db.prepare("SELECT * FROM decks ORDER BY created_at DESC").all();
    const decksWithCounts = decks.map((deck: any) => {
      const counts = db.prepare("SELECT COUNT(*) as count FROM cards WHERE deck_id = ?").get(deck.id) as any;
      const dueCount = db.prepare("SELECT COUNT(*) as count FROM cards WHERE deck_id = ? AND next_review <= CURRENT_TIMESTAMP").get(deck.id) as any;
      return { ...deck, cardCount: counts.count, dueCount: dueCount.count };
    });
    res.json(decksWithCounts);
  });

  app.post("/api/decks", (req, res) => {
    const { id, title, description } = req.body;
    db.prepare("INSERT INTO decks (id, title, description) VALUES (?, ?, ?)").run(id, title, description);
    res.status(201).json({ id, title, description });
  });
  
  app.patch("/api/decks/:id", (req, res) => {
    const { title, description } = req.body;
    db.prepare("UPDATE decks SET title = ?, description = ? WHERE id = ?").run(title, description, req.params.id);
    res.json({ success: true });
  });

  app.delete("/api/decks/:id", (req, res) => {
    db.prepare("DELETE FROM decks WHERE id = ?").run(req.params.id);
    res.status(204).send();
  });

  app.get("/api/decks/:id/cards", (req, res) => {
    const cards = db.prepare("SELECT * FROM cards WHERE deck_id = ? ORDER BY created_at ASC").all(req.params.id);
    res.json(cards);
  });

  app.post("/api/decks/:id/cards", (req, res) => {
    const { id, front, back } = req.body;
    const deckId = req.params.id;
    db.prepare("INSERT INTO cards (id, deck_id, front, back) VALUES (?, ?, ?, ?)").run(id, deckId, front, back);
    res.status(201).json({ id, deck_id: deckId, front, back });
  });

  app.post("/api/decks/:id/cards/bulk", (req, res) => {
    const { cards } = req.body;
    const deckId = req.params.id;
    
    const insert = db.prepare("INSERT INTO cards (id, deck_id, front, back) VALUES (?, ?, ?, ?)");
    const insertBatch = db.transaction((cards) => {
      for (const card of cards) {
        insert.run(card.id, deckId, card.front, card.back);
      }
    });
    
    insertBatch(cards);
    res.status(201).json({ success: true, count: cards.length });
  });

  app.post("/api/cards/:id/review", (req, res) => {
    const { quality } = req.body; // 0-5
    const cardId = req.params.id;
    
    const card = db.prepare("SELECT * FROM cards WHERE id = ?").get(cardId) as any;
    if (!card) return res.status(404).json({ error: "Card not found" });

    // SM-2 Algorithm
    let { repetition, interval, efactor } = card;
    
    if (quality >= 3) {
      if (repetition === 0) {
        interval = 1;
      } else if (repetition === 1) {
        interval = 6;
      } else {
        interval = Math.round(interval * efactor);
      }
      repetition += 1;
    } else {
      repetition = 0;
      interval = 1;
    }

    efactor = efactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    if (efactor < 1.3) efactor = 1.3;

    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + interval);
    const nextReviewStr = nextReview.toISOString().replace('T', ' ').slice(0, 19);

    db.prepare(`
      UPDATE cards 
      SET repetition = ?, interval = ?, efactor = ?, next_review = ?
      WHERE id = ?
    `).run(repetition, interval, efactor, nextReviewStr, cardId);

    db.prepare("INSERT INTO study_logs (card_id, quality) VALUES (?, ?)").run(cardId, quality);

    res.json({ success: true, nextReview: nextReviewStr });
  });

  app.get("/api/stats", (req, res) => {
    const totalDecks = db.prepare("SELECT COUNT(*) as count FROM decks").get() as any;
    const totalCards = db.prepare("SELECT COUNT(*) as count FROM cards").get() as any;
    const cardsDue = db.prepare("SELECT COUNT(*) as count FROM cards WHERE next_review <= CURRENT_TIMESTAMP").get() as any;
    const reviewsToday = db.prepare("SELECT COUNT(*) as count FROM study_logs WHERE reviewed_at >= date('now')").get() as any;

    res.json({
      totalDecks: totalDecks.count,
      totalCards: totalCards.count,
      cardsDue: cardsDue.count,
      reviewsToday: reviewsToday.count
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Synapse Server running at http://localhost:${PORT}`);
  });
}

startServer();
