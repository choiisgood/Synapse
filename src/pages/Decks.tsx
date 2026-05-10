import React, { useState, useEffect } from "react";
import { Plus, Search, BookOpen, Clock, Trash2, Edit2, Play } from "lucide-react";
import { Deck } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { generateId } from "../lib/utils";

interface DecksProps {
  onStudy: (deckId: string) => void;
  onAddCard: (deckId: string) => void;
}

export default function Decks({ onStudy, onAddCard }: DecksProps) {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingDeck, setEditingDeck] = useState<Deck | null>(null);
  const [newDeck, setNewDeck] = useState({ title: "", description: "" });
  const [initialCards, setInitialCards] = useState([{ front: "", back: "" }]);

  useEffect(() => {
    fetchDecks();
  }, []);

  const fetchDecks = async () => {
    try {
      const res = await fetch("/api/decks");
      const data = await res.json();
      setDecks(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const addInitialCardRow = () => {
    setInitialCards([...initialCards, { front: "", back: "" }]);
  };

  const handleAddDeck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeck.title) return;

    const deckId = generateId();
    try {
      // Create deck
      const res = await fetch("/api/decks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: deckId,
          ...newDeck
        })
      });

      if (res.ok) {
        // Create initial cards if any
        const validCards = initialCards.filter(c => c.front && c.back);
        if (validCards.length > 0) {
          await fetch(`/api/decks/${deckId}/cards/bulk`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              cards: validCards.map(c => ({
                id: generateId(),
                ...c
              }))
            })
          });
        }

        setNewDeck({ title: "", description: "" });
        setInitialCards([{ front: "", back: "" }]);
        setIsAdding(false);
        fetchDecks();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditDeck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDeck) return;

    try {
      const res = await fetch(`/api/decks/${editingDeck.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editingDeck.title,
          description: editingDeck.description
        })
      });
      if (res.ok) {
        setEditingDeck(null);
        setIsEditing(false);
        fetchDecks();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteDeck = async (id: string) => {
    if (!confirm("Are you sure? This will delete all cards in this deck.")) return;
    try {
      await fetch(`/api/decks/${id}`, { method: "DELETE" });
      fetchDecks();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredDecks = decks.filter(d => 
    d.title.toLowerCase().includes(search.toLowerCase()) || 
    d.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Your Library</h1>
          <p className="text-slate-500 mt-2 font-medium">Manage and organize your study materials.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3.5 rounded-2xl font-bold transition-all shadow-xl shadow-indigo-100 flex items-center gap-2 w-fit active:scale-95"
        >
          <Plus className="w-5 h-5" />
          <span>New Deck</span>
        </button>
      </div>

      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
        <input 
          type="text" 
          placeholder="Search your library..." 
          className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium text-slate-700"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredDecks.map((deck) => (
            <motion.div
              layout
              key={deck.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white border border-slate-200 rounded-[32px] p-8 shadow-sm hover:shadow-xl transition-all group flex flex-col min-h-[300px]"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="bg-slate-50 p-4 rounded-2xl group-hover:bg-indigo-50 transition-colors">
                  <BookOpen className="w-8 h-8 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={(e) => { e.stopPropagation(); onAddCard(deck.id); }}
                    className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-xl transition-all shadow-sm"
                    title="Add Card"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      setEditingDeck(deck);
                      setIsEditing(true);
                    }}
                    className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-xl transition-all shadow-sm"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDeleteDeck(deck.id); }}
                    className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-white rounded-xl transition-all shadow-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="flex-1">
                <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight group-hover:text-indigo-600 transition-colors">{deck.title}</h3>
                <p className="text-slate-500 text-sm font-medium leading-relaxed line-clamp-2">{deck.description || "No description provided."}</p>
              </div>
              
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-50">
                <div className="flex items-center gap-6">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Cards</span>
                    <span className="text-slate-900 font-black text-lg leading-none tracking-tight">{deck.cardCount}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Due</span>
                    <span className={deck.dueCount > 0 ? "text-indigo-600 font-black text-lg leading-none tracking-tight" : "text-slate-900 font-black text-lg leading-none tracking-tight"}>
                      {deck.dueCount}
                    </span>
                  </div>
                </div>
                
                <button 
                  onClick={() => onStudy(deck.id)}
                  className="bg-slate-900 hover:bg-indigo-600 text-white p-4 rounded-2xl transition-all shadow-lg active:scale-95"
                >
                  <Play className="w-6 h-6 fill-current" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {loading && decks.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-slate-400">
          <Clock className="w-12 h-12 mb-4 animate-pulse" />
          <p>Loading your decks...</p>
        </div>
      )}

      {!loading && decks.length === 0 && !isAdding && (
        <div className="bg-slate-100 rounded-3xl border-2 border-dashed border-slate-200 py-24 flex flex-col items-center justify-center text-center px-6">
          <BookOpen className="w-16 h-16 text-slate-300 mb-6" />
          <h2 className="text-2xl font-bold text-slate-800 mb-2">No decks found</h2>
          <p className="text-slate-500 max-w-sm mb-8">Ready to start mastering new subjects? Create your first deck and start adding flashcards.</p>
          <button 
            onClick={() => setIsAdding(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            <span>Create First Deck</span>
          </button>
        </div>
      )}

      {/* Modal for adding deck */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAdding(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl w-full max-w-2xl p-8 shadow-2xl relative z-10 max-h-[90vh] overflow-y-auto"
            >
              <h2 className="text-3xl font-black text-slate-900 mb-6 tracking-tight">Create New Deck</h2>
              <form onSubmit={handleAddDeck} className="space-y-8">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 px-1">Deck Title</label>
                      <input 
                        autoFocus
                        type="text" 
                        required
                        placeholder="e.g. Organic Chemistry" 
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 px-5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-bold text-lg"
                        value={newDeck.title}
                        onChange={(e) => setNewDeck({ ...newDeck, title: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 px-1">Description (Optional)</label>
                      <textarea 
                        placeholder="A collection of concepts about..." 
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 px-5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all min-h-[120px] resize-none font-medium"
                        value={newDeck.description}
                        onChange={(e) => setNewDeck({ ...newDeck, description: e.target.value })}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Initial Cards</label>
                      <button 
                        type="button" 
                        onClick={addInitialCardRow}
                        className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:text-indigo-700"
                      >
                        + Add Row
                      </button>
                    </div>
                    <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                      {initialCards.map((card, i) => (
                        <div key={i} className="flex gap-2">
                          <input 
                            placeholder="Front" 
                            className="w-1/2 bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-indigo-500"
                            value={card.front}
                            onChange={(e) => {
                              const updated = [...initialCards];
                              updated[i].front = e.target.value;
                              setInitialCards(updated);
                            }}
                          />
                          <input 
                            placeholder="Back" 
                            className="w-1/2 bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-indigo-500"
                            value={card.back}
                            onChange={(e) => {
                              const updated = [...initialCards];
                              updated[i].back = e.target.value;
                              setInitialCards(updated);
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    type="button"
                    onClick={() => setIsAdding(false)}
                    className="flex-1 px-6 py-4 rounded-2xl font-bold text-slate-500 hover:bg-slate-100 transition-all"
                  >
                    Discard
                  </button>
                  <button 
                    type="submit"
                    className="flex-[2] bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl font-black text-lg transition-all shadow-xl shadow-indigo-100"
                  >
                    Launch Deck
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal for editing deck */}
      <AnimatePresence>
        {isEditing && editingDeck && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditing(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[40px] w-full max-w-md p-10 shadow-2xl relative z-10"
            >
              <h2 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">Edit Deck</h2>
              <p className="text-slate-500 mb-8 font-medium">Update your deck information.</p>
              
              <form onSubmit={handleEditDeck} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 px-1">Deck Title</label>
                  <input 
                    autoFocus
                    type="text" 
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-bold text-lg"
                    value={editingDeck.title}
                    onChange={(e) => setEditingDeck({ ...editingDeck, title: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 px-1">Description</label>
                  <textarea 
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all min-h-[120px] resize-none font-medium text-slate-600"
                    value={editingDeck.description || ""}
                    onChange={(e) => setEditingDeck({ ...editingDeck, description: e.target.value })}
                  />
                </div>
                <div className="flex gap-4 pt-4">
                  <button 
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="flex-1 px-6 py-4 rounded-2xl font-bold text-slate-500 hover:bg-slate-100 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-[2] bg-slate-900 hover:bg-slate-800 text-white px-8 py-4 rounded-2xl font-black text-lg transition-all shadow-xl"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
