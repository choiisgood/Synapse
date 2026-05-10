import React, { useState, useEffect } from "react";
import { Card } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { Check, X, RotateCcw, Volume2, Plus, ArrowRight, Eye, ChevronRight, Target, BookOpen, PlusCircle } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface StudyProps {
  deckId: string;
  onFinish: () => void;
  initialIsAddingCard?: boolean;
}

export default function Study({ deckId, onFinish, initialIsAddingCard = false }: StudyProps) {
  const [cards, setCards] = useState<Card[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sessionStats, setSessionStats] = useState({ correct: 0, wrong: 0 });
  const [isAddingCard, setIsAddingCard] = useState(initialIsAddingCard);
  const [newCards, setNewCards] = useState([{ front: "", back: "" }]);
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkText, setBulkText] = useState("");

  const handleCreateBulkCards = async (e: React.FormEvent) => {
    e.preventDefault();
    const lines = bulkText.split("\n").filter(l => l.trim().includes("|"));
    const parsedCards = lines.map(line => {
      const [front, ...backParts] = line.split("|");
      return { front: front.trim(), back: backParts.join("|").trim() };
    }).filter(c => c.front && c.back);

    if (parsedCards.length === 0) return;

    try {
      const res = await fetch(`/api/decks/${deckId}/cards/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cards: parsedCards.map(c => ({
            id: Math.random().toString(36).substring(2, 11),
            ...c
          }))
        })
      });
      if (res.ok) {
        setBulkText("");
        setBulkMode(false);
        setIsAddingCard(false);
        // Refresh cards
        const upRes = await fetch(`/api/decks/${deckId}/cards`);
        const upData = await upRes.json();
        const now = new Date();
        now.setSeconds(now.getSeconds() + 10);
        const dueCards = upData.filter((c: Card) => new Date(c.next_review) <= now);
        setCards(dueCards);
        setCurrentIndex(0);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const fetchCards = async () => {
      try {
        const res = await fetch(`/api/decks/${deckId}/cards`);
        const data = await res.json();
        // The user wants to study even if already studied, 
        // so we'll show all cards but prioritize due ones in a real app.
        // For now, let's just show all cards as requested.
        setCards(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchCards();
  }, [deckId]);

  const handleReview = async (quality: number) => {
    const card = cards[currentIndex];
    try {
      await fetch(`/api/cards/${card.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quality })
      });
      
      if (quality >= 3) {
        setSessionStats(s => ({ ...s, correct: s.correct + 1 }));
      } else {
        setSessionStats(s => ({ ...s, wrong: s.wrong + 1 }));
      }

      nextCard();
    } catch (err) {
      console.error(err);
    }
  };

  const nextCard = () => {
    setIsFlipped(false);
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setCurrentIndex(cards.length); // Marks finish
    }
  };

  const addAnotherCardRow = () => {
    setNewCards([...newCards, { front: "", back: "" }]);
  };

  const removeCardRow = (index: number) => {
    if (newCards.length > 1) {
      setNewCards(newCards.filter((_, i) => i !== index));
    }
  };

  const updateCardRow = (index: number, field: "front" | "back", value: string) => {
    const updated = [...newCards];
    updated[index][field] = value;
    setNewCards(updated);
  };

  const handleCreateCards = async (e: React.FormEvent) => {
    e.preventDefault();
    const validCards = newCards.filter(c => c.front && c.back);
    if (validCards.length === 0) return;
    
    try {
      const res = await fetch(`/api/decks/${deckId}/cards/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cards: validCards.map(c => ({
            id: Math.random().toString(36).substring(2, 11),
            ...c
          }))
        })
      });
      if (res.ok) {
        setNewCards([{ front: "", back: "" }]);
        setBulkText("");
        
        // Refresh cards
        const upRes = await fetch(`/api/decks/${deckId}/cards`);
        const upData = await upRes.json();
        setCards(upData);
        
        // Always return to study mode after a batch add if cards are available
        setIsAddingCard(false);
        setCurrentIndex(0);
        setBulkMode(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-24 text-slate-400">
      <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4" />
      <p>Preparing your study session...</p>
    </div>
  );

  const handleShowAddForm = () => setIsAddingCard(true);
  const handleHideAddForm = () => setIsAddingCard(false);

  if (isAddingCard) {
    return (
      <div className="max-w-3xl mx-auto space-y-12 pb-24">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl p-8 shadow-xl border border-indigo-100"
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-indigo-900">Add New Cards</h2>
              <p className="text-slate-500 text-sm mt-1">Create multiple cards for your library at once.</p>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setBulkMode(!bulkMode)}
                className="text-xs font-bold uppercase tracking-widest text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-3 py-2 rounded-xl transition-colors"
              >
                {bulkMode ? "Switch to Individual" : "Switch to Bulk Paste"}
              </button>
              <button onClick={handleHideAddForm} className="text-slate-400 hover:text-slate-600 transition-colors bg-slate-50 p-2 rounded-xl border border-slate-100">
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {bulkMode ? (
            <form onSubmit={handleCreateBulkCards} className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 px-1">Bulk Paste (One per line: Question | Answer)</label>
                <textarea 
                  autoFocus
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-3xl py-6 px-8 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-lg min-h-[300px] resize-none font-mono"
                  placeholder="What is the capital of France? | Paris&#10;Who wrote Hamlet? | William Shakespeare&#10;H2O | Water"
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                />
              </div>
              <button 
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-5 rounded-2xl transition-all shadow-lg flex items-center justify-center gap-3 text-lg active:scale-95"
              >
                <Plus className="w-6 h-6" />
                <span>Import All Cards</span>
              </button>
            </form>
          ) : (
            <form onSubmit={handleCreateCards} className="space-y-8">
              <div className="space-y-6">
                {newCards.map((card, index) => (
                  <div key={index} className="p-6 bg-slate-50 rounded-2xl border border-slate-100 relative group animate-in fade-in slide-in-from-top-2">
                    {newCards.length > 1 && (
                      <button 
                        type="button" 
                        onClick={() => removeCardRow(index)}
                        className="absolute -top-2 -right-2 bg-white text-slate-400 hover:text-red-500 rounded-full p-1.5 shadow-sm border border-slate-200 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 px-1">Front (Question)</label>
                        <textarea 
                          required
                          className="w-full bg-white border border-slate-200 rounded-xl py-4 px-5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-lg min-h-[100px] resize-none"
                          placeholder="e.g. What is Photosynthesis?"
                          value={card.front}
                          onChange={(e) => updateCardRow(index, "front", e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 px-1">Back (Answer)</label>
                        <textarea 
                          required
                          className="w-full bg-white border border-slate-200 rounded-xl py-4 px-5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-lg min-h-[100px] resize-none"
                          placeholder="The chemical process by which plants..."
                          value={card.back}
                          onChange={(e) => updateCardRow(index, "back", e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col md:flex-row gap-4">
                <button 
                  type="button"
                  onClick={addAnotherCardRow}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-5 rounded-2xl transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  <span>Add Another Row</span>
                </button>
                <button 
                  type="submit"
                  className="flex-[2] bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-5 rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2 text-lg active:scale-95"
                >
                  <Check className="w-6 h-6" />
                  <span>Saves All Cards ({newCards.filter(c => c.front && c.back).length})</span>
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    );
  }

  if (cards.length === 0) return (
    <div className="max-w-md mx-auto text-center py-12 px-6 bg-white rounded-3xl shadow-xl border border-slate-100">
      <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
        <Check className="w-8 h-8" />
      </div>
      <h2 className="text-2xl font-bold text-slate-900 mb-2">Deck is empty or all caught up!</h2>
      <p className="text-slate-500 mb-8">You've mastered all the cards currently due in this deck. Add more cards to continue learning.</p>
      <div className="flex flex-col gap-3">
        <button 
          onClick={handleShowAddForm}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          <span>Add New Cards</span>
        </button>
        <button 
          onClick={onFinish}
          className="text-slate-500 font-bold py-4 hover:text-slate-800 transition-colors"
        >
          Return to Dashboard
        </button>
      </div>
    </div>
  );

  if (currentIndex >= cards.length) return (
    <div className="max-w-md mx-auto bg-slate-900 rounded-[40px] p-10 shadow-2xl text-white text-center relative overflow-hidden">
      <div className="relative z-10">
        <div className="w-20 h-20 bg-white/10 rounded-[32px] flex items-center justify-center mx-auto mb-8">
          <Target className="w-10 h-10 text-indigo-400" />
        </div>
        <h2 className="text-4xl font-black mb-2 tracking-tight">Session Complete</h2>
        <p className="text-slate-400 font-medium mb-10">You've reached your daily goal for this deck.</p>
        
        <div className="grid grid-cols-2 gap-4 mb-10">
          <div className="bg-white/5 border border-white/10 rounded-[24px] p-6">
            <span className="block text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Mastered</span>
            <span className="text-3xl font-black text-indigo-400 tracking-tight">{sessionStats.correct}</span>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-[24px] p-6">
            <span className="block text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Re-review</span>
            <span className="text-3xl font-black text-orange-400 tracking-tight">{sessionStats.wrong}</span>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <button 
            onClick={onFinish}
            className="w-full bg-white text-slate-900 font-bold py-5 rounded-[24px] hover:bg-slate-50 transition-all shadow-xl active:scale-95"
          >
            Finish Session
          </button>
          <button 
            onClick={handleShowAddForm}
            className="w-full bg-white/10 text-white font-bold py-4 rounded-[24px] hover:bg-white/20 transition-all border border-white/10"
          >
            Add More Cards
          </button>
        </div>
      </div>
      
      <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-indigo-600/20 rounded-full blur-[100px]" />
    </div>
  );

  const currentCard = cards[currentIndex];

  return (
    <div className="max-w-2xl mx-auto space-y-12 pb-24">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-2 w-48 bg-slate-200 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${((currentIndex) / cards.length) * 100}%` }}
              className="h-full bg-indigo-600 rounded-full"
            />
          </div>
          <span className="text-sm font-bold text-slate-500">{currentIndex + 1} / {cards.length}</span>
        </div>
        <button onClick={handleShowAddForm} className="flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-700 transition-colors">
          <PlusCircle className="w-5 h-5" />
          <span>Quick Add</span>
        </button>
      </div>

      <div className="relative perspective-2000 h-[480px] w-full">
        <motion.div 
          onClick={() => setIsFlipped(!isFlipped)}
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 25 }}
          className="w-full h-full relative cursor-pointer preserve-3d"
        >
          {/* Front Side */}
          <div className="absolute inset-0 backface-hidden bg-white border border-slate-200 rounded-[48px] shadow-2xl p-12 flex flex-col items-center justify-center text-center overflow-hidden group">
            <div className="absolute top-10 left-10 text-slate-100 group-hover:text-indigo-50 transition-colors">
              <BookOpen className="w-16 h-16" />
            </div>
            <h3 className="text-4xl font-black text-slate-900 leading-tight tracking-tight relative z-10 px-4">
              {currentCard.front}
            </h3>
            <div className="mt-16 flex items-center gap-3 text-slate-400 group-hover:text-indigo-500 transition-colors font-bold uppercase tracking-[0.2em] text-[10px]">
              <RotateCcw className="w-4 h-4" />
              <span>Tap to reveal</span>
            </div>
          </div>

          {/* Back Side */}
          <div 
            className="absolute inset-0 backface-hidden bg-slate-900 border border-slate-800 rounded-[48px] shadow-2xl p-12 flex flex-col items-center justify-center text-center rotate-y-180 overflow-hidden"
          >
            <div className="absolute top-10 right-10 flex gap-2">
              <button className="p-4 bg-white/5 text-indigo-400 rounded-2xl hover:bg-white/10 transition-colors">
                <Volume2 className="w-6 h-6" />
              </button>
            </div>
            <div className="max-h-full overflow-auto py-8">
              <p className="text-3xl font-bold text-white leading-relaxed tracking-tight">
                {currentCard.back}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="h-32">
        <AnimatePresence mode="wait">
          {isFlipped ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-3 gap-4 h-full"
            >
              <QualityButton 
                quality={1} 
                label="Hard" 
                desc="1d" 
                icon={<X className="w-5 h-5" />} 
                color="red"
                onClick={() => handleReview(1)} 
              />
              <QualityButton 
                quality={3} 
                label="Good" 
                desc="4d" 
                icon={<RotateCcw className="w-5 h-5" />} 
                color="indigo"
                onClick={() => handleReview(3)} 
              />
              <QualityButton 
                quality={5} 
                label="Easy" 
                desc="7d" 
                icon={<Check className="w-5 h-5" />} 
                color="emerald"
                onClick={() => handleReview(5)} 
              />
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center h-full text-slate-400 font-bold uppercase tracking-widest text-sm"
            >
              <span>Use space or click card to flip</span>
              <div className="mt-4 animate-bounce">
                <ArrowRight className="w-6 h-6 rotate-90" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function QualityButton({ quality, label, desc, icon, color, onClick }: any) {
  const colors: any = {
    red: "bg-red-50 text-red-600 hover:bg-red-600 hover:text-white border-red-200 shadow-xl shadow-red-100",
    indigo: "bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white border-indigo-200 shadow-xl shadow-indigo-100",
    emerald: "bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white border-emerald-200 shadow-xl shadow-emerald-100"
  };

  return (
    <button 
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className={cn(
        "flex flex-col items-center justify-center gap-1 rounded-[32px] border transition-all duration-300 active:scale-95",
        colors[color]
      )}
    >
      <div className="p-3 rounded-2xl bg-white shadow-sm mb-1 group-hover:scale-110 transition-transform">
        {React.cloneElement(icon as React.ReactElement, { className: "w-6 h-6" })}
      </div>
      <span className="font-black uppercase tracking-[0.2em] text-xs">{label}</span>
      <span className="text-[10px] font-bold opacity-60 uppercase tracking-widest">{desc}</span>
    </button>
  );
}
