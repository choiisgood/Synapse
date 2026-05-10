import React, { useState, useEffect } from "react";
import { Brain, Flame, Target, BookOpen, ChevronRight, PlusCircle, TrendingUp, Zap } from "lucide-react";
import { Stats, Deck } from "../types";
import { motion } from "motion/react";

interface DashboardProps {
  onStudyDeck: (deckId: string) => void;
}

export default function Dashboard({ onStudyDeck }: DashboardProps) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [activeDecks, setActiveDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const statsRes = await fetch("/api/stats");
        const statsData = await statsRes.json();
        setStats(statsData);

        const decksRes = await fetch("/api/decks");
        const decksData = await decksRes.json();
        setActiveDecks(decksData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const dueDecks = activeDecks.filter(d => d.dueCount > 0);
  const heroDeck = dueDecks.length > 0 ? dueDecks[0] : (activeDecks.length > 0 ? activeDecks[0] : null);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
          <p className="text-slate-500 mt-1">Strengthen your memory and accelerate learning.</p>
        </div>
        <div className="flex items-center gap-4 text-sm font-bold text-slate-400 uppercase tracking-widest">
          <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Hero Study Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="col-span-full bg-white rounded-3xl border border-slate-200 p-8 shadow-sm flex flex-col justify-between min-h-[300px]"
        >
          <div>
            <div className="flex justify-between items-start mb-6">
              <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-full uppercase tracking-wider">Active Session</span>
              <span className="text-slate-400 text-sm italic">
                {heroDeck ? `Last review: ${new Date(heroDeck.created_at).toLocaleDateString()}` : "No decks yet"}
              </span>
            </div>
            {heroDeck ? (
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div className="flex-1">
                  <h2 className="text-4xl font-black text-slate-900 mb-2 tracking-tight">{heroDeck.title}</h2>
                  <p className="text-slate-500 mb-6 text-lg max-w-2xl">{heroDeck.description || "Start mastering this deck today."}</p>
                  <div className="flex gap-3">
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex-1 md:flex-none md:min-w-[120px]">
                      <div className="text-2xl font-black text-indigo-600 tracking-tight">{heroDeck.dueCount}</div>
                      <div className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Due Now</div>
                    </div>
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex-1 md:flex-none md:min-w-[120px]">
                      <div className="text-2xl font-black text-slate-700 tracking-tight">{heroDeck.cardCount}</div>
                      <div className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Total Cards</div>
                    </div>
                  </div>
                </div>
                <div className="w-full md:w-64">
                  <button 
                    onClick={() => onStudyDeck(heroDeck.id)}
                    className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-xl shadow-indigo-100 flex items-center justify-center gap-2 transition-all transform active:scale-95 text-lg"
                  >
                    Study Now
                    <Zap className="w-5 h-5 fill-current" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center flex flex-col items-center">
                <PlusCircle className="w-12 h-12 text-slate-200 mb-4" />
                <p className="text-slate-400 font-medium">Create a deck to start studying</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Library Mini List */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="col-span-full bg-white rounded-3xl border border-slate-200 p-8 shadow-sm"
        >
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Your Decks</h3>
            <button className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] hover:text-indigo-700 transition-colors bg-indigo-50 px-4 py-2 rounded-full">View All</button>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {activeDecks.slice(0, 4).map((deck) => (
              <div 
                key={deck.id}
                onClick={() => onStudyDeck(deck.id)}
                className="flex items-center p-6 bg-slate-50 hover:bg-white rounded-[32px] transition-all border border-slate-100 hover:border-indigo-100 cursor-pointer group shadow-sm hover:shadow-md"
              >
                <div className="w-14 h-14 bg-white text-indigo-600 rounded-2xl flex items-center justify-center font-black text-xl group-hover:scale-110 transition-transform shadow-sm">
                  {deck.title.substring(0, 2).toUpperCase()}
                </div>
                <div className="ml-5 flex-1">
                  <div className="text-lg font-black text-slate-900 group-hover:text-indigo-600 transition-colors tracking-tight">{deck.title}</div>
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                    {deck.cardCount} cards • {deck.dueCount > 0 ? "Review Required" : "Up to Date"}
                  </div>
                </div>
                <ChevronRight className="w-6 h-6 text-slate-300 group-hover:text-indigo-600 transition-colors" />
              </div>
            ))}
            {activeDecks.length === 0 && (
              <div className="col-span-full py-12 text-center text-slate-400 font-medium">
                No decks in your library yet.
              </div>
            )}
          </div>
        </motion.div>
      </div>

      <footer className="pt-12 pb-4 flex items-center justify-between text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] opacity-60">
        <div>Algorithm: SM-2 Optimized</div>
        <div className="flex gap-4">
          <span>Active Session • Offline Mode</span>
          <span>v2.8.4 Build 2026</span>
        </div>
      </footer>
    </div>
  );
}
