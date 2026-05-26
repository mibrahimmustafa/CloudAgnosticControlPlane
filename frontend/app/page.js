"use client";
import React, { useState } from 'react';
import { Search, LayoutDashboard, Settings, Database, ExternalLink, CheckCircle2, AlertCircle } from 'lucide-react';

export default function Dashboard() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, user_id: 1 }), // Static user_id for MVP
      });
      const data = await response.json();
      setResults(data.results || []);
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white p-6 flex flex-col gap-8">
        <div className="text-xl font-bold flex items-center gap-2">
          <LayoutDashboard className="text-blue-400" />
          <span>CAC Plane</span>
        </div>
        <nav className="flex flex-col gap-2">
          <a href="#" className="flex items-center gap-3 p-3 rounded-lg bg-blue-600 text-white transition">
            <Search size={20} /> Search
          </a>
          <a href="#" className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800 text-slate-300 transition">
            <Database size={20} /> Connectors
          </a>
          <a href="#" className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800 text-slate-300 transition">
            <Settings size={20} /> Settings
          </a>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="mb-12">
          <h1 className="text-3xl font-bold text-slate-800">Unified Search Intelligence</h1>
          <p className="text-slate-500">Query all your business data across platforms from one place.</p>
        </header>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="max-w-3xl mx-auto mb-12 relative">
          <input 
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for a customer, a problem, or a keyword..."
            className="w-full p-4 pl-12 rounded-2xl border-none shadow-lg text-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <Search className="absolute left-4 top-4.5 text-slate-400" size={24} />
          <button 
            type="submit"
            disabled={isLoading}
            className="absolute right-3 top-3 bg-blue-600 text-white px-6 py-2 rounded-xl hover:bg-blue-700 transition disabled:opacity-50"
          >
            {isLoading ? 'Searching...' : 'Search'}
          </button>
        </form>

        {/* Results Area */}
        <div className="max-w-5xl mx-auto grid grid-cols-1 gap-4">
          {results.length > 0 ? (
            results.map((res, idx) => (
              <div key={idx} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex justify-between items-center hover:border-blue-300 transition">
                <div className="flex gap-4 items-start">
                  <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                    <Database size={20} />
                  </div>
                  <div>
                    <span className="text-xs font-semibold uppercase text-slate-400 tracking-wider">Source: {res.source}</span>
                    <p className="text-slate-700 text-lg mt-1">{res.content}</p>
                    <span className="text-xs text-slate-400 italic">{res.timestamp}</span>
                  </div>
                </div>
                <a href="#" className="p-2 text-slate-400 hover:text-blue-600 transition">
                  <ExternalLink size={20} />
                </a>
              </div>
            ))
          ) : (
            <div className="text-center py-20">
              <div className="inline-block p-4 bg-slate-100 rounded-full text-slate-400 mb-4">
                <AlertCircle size={48} />
              </div>
              <p className="text-slate-500 text-xl">No results found yet. Try searching for something!</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
