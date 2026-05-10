import React, { useState, useEffect } from "react";
import { BookOpen, BarChart3, Plus, Brain, ChevronLeft, Zap } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import Dashboard from "./pages/Dashboard";
import Decks from "./pages/Decks";
import Study from "./pages/Study";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type Page = "dashboard" | "decks" | "study";

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>("dashboard");
  const [activeDeckId, setActiveDeckId] = useState<string | null>(null);
  const [isAddingCardMode, setIsAddingCardMode] = useState(false);

  const navigateToStudy = (deckId: string) => {
    setActiveDeckId(deckId);
    setIsAddingCardMode(false);
    setCurrentPage("study");
  };

  const navigateToAddCard = (deckId: string) => {
    setActiveDeckId(deckId);
    setIsAddingCardMode(true);
    setCurrentPage("study");
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      <nav className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 z-50 px-8 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2 cursor-pointer group" onClick={() => setCurrentPage("dashboard")}>
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center group-hover:rotate-6 transition-transform">
            <Zap className="w-5 h-5 text-white fill-current" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">Synapse</span>
        </div>

        <div className="flex items-center gap-8">
          <NavItem 
            active={currentPage === "dashboard" || currentPage === "study"} 
            onClick={() => {
              setCurrentPage("dashboard");
              setIsAddingCardMode(false);
            }}
            icon={<BarChart3 className="w-4 h-4" />}
            label="Dashboard"
          />
          <NavItem 
            active={currentPage === "decks"} 
            onClick={() => {
              setCurrentPage("decks");
              setIsAddingCardMode(false);
            }}
            icon={<BookOpen className="w-4 h-4" />}
            label="Library"
          />
        </div>

        <div className="hidden md:block">
          <div className="w-8 h-8 rounded-full bg-slate-200 border border-slate-300"></div>
        </div>
      </nav>

      <main className="pt-24 pb-12 px-6 max-w-7xl mx-auto">
        <AnimatePresence mode="wait">
          {currentPage === "dashboard" && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <Dashboard onStudyDeck={navigateToStudy} />
            </motion.div>
          )}

          {currentPage === "decks" && (
            <motion.div
              key="decks"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <Decks onStudy={navigateToStudy} onAddCard={navigateToAddCard} />
            </motion.div>
          )}

          {currentPage === "study" && activeDeckId && (
            <motion.div
              key={`study-${activeDeckId}-${isAddingCardMode}`}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2 }}
            >
              <div className="mb-6 flex items-center gap-2 text-slate-500 hover:text-slate-800 cursor-pointer transition-colors" onClick={() => setCurrentPage("decks")}>
                <ChevronLeft className="w-4 h-4" />
                <span>Back to Decks</span>
              </div>
              <Study 
                deckId={activeDeckId} 
                onFinish={() => setCurrentPage("dashboard")} 
                initialIsAddingCard={isAddingCardMode}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function NavItem({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 text-sm font-medium transition-colors py-2 px-1 relative",
        active ? "text-indigo-600" : "text-slate-500 hover:text-slate-800"
      )}
    >
      {icon}
      <span>{label}</span>
      {active && (
        <motion.div 
          layoutId="nav-underline" 
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" 
        />
      )}
    </button>
  );
}
