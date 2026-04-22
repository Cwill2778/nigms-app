"use client";

import { useState, useEffect, useRef } from 'react';

export interface ClientSearchResult {
  id: string;
  first_name: string | null;
  last_name: string | null;
  username: string;
  phone: string | null;
  email: string | null;
}

interface ClientSearchInputProps {
  onSelect: (client: ClientSearchResult) => void;
  placeholder?: string;
}

export default function ClientSearchInput({ onSelect, placeholder = 'Search clients…' }: ClientSearchInputProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ClientSearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/clients/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data: ClientSearchResult[] = await res.json();
          setResults(data);
          setOpen(data.length > 0);
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  // Close on Escape or click outside
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  function handleSelect(client: ClientSearchResult) {
    onSelect(client);
    setQuery('');
    setResults([]);
    setOpen(false);
  }

  function getDisplayName(client: ClientSearchResult) {
    const full = [client.first_name, client.last_name].filter(Boolean).join(' ');
    return full || client.username;
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-md border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      {loading && (
        <div className="absolute right-3 top-2.5 text-gray-400 text-xs">Searching…</div>
      )}
      {open && results.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full rounded-md border border-gray-600 bg-gray-800 shadow-lg max-h-60 overflow-auto">
          {results.map((client) => (
            <li key={client.id}>
              <button
                type="button"
                onClick={() => handleSelect(client)}
                className="w-full text-left px-3 py-2 hover:bg-gray-700 transition-colors"
              >
                <div className="text-sm font-medium text-white">{getDisplayName(client)}</div>
                <div className="text-xs text-gray-400 flex gap-3">
                  {client.phone && <span>{client.phone}</span>}
                  {client.email && <span>{client.email}</span>}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
