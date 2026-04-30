"use client";

import { useState, useEffect, useRef } from "react";

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

export default function ClientSearchInput({
  onSelect,
  placeholder = "Search clients…",
}: ClientSearchInputProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ClientSearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.length < 2) { setResults([]); setOpen(false); return; }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/clients/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data: ClientSearchResult[] = await res.json();
          setResults(data);
          setOpen(data.length > 0);
        }
      } catch { /* silent */ } finally { setLoading(false); }
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") setOpen(false); }
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClickOutside);
    return () => { document.removeEventListener("keydown", onKey); document.removeEventListener("mousedown", onClickOutside); };
  }, []);

  function handleSelect(client: ClientSearchResult) {
    onSelect(client); setQuery(""); setResults([]); setOpen(false);
  }

  function getDisplayName(c: ClientSearchResult) {
    return [c.first_name, c.last_name].filter(Boolean).join(" ") || c.username;
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="input w-full"
      />
      {loading && (
        <div
          className="absolute right-3 top-2.5 text-xs"
          style={{ color: "var(--color-text-muted)" }}
        >
          Searching…
        </div>
      )}
      {open && results.length > 0 && (
        <ul
          className="absolute z-50 mt-1 w-full max-h-60 overflow-auto shadow-lg"
          style={{
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--color-steel-mid)",
            background: "var(--color-bg-elevated)",
          }}
        >
          {results.map((client) => (
            <li key={client.id}>
              <button
                type="button"
                onClick={() => handleSelect(client)}
                className="w-full text-left px-3 py-2 transition-colors"
                style={{ borderBottom: "1px solid var(--color-steel-dim)" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-bg-overlay)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <div className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
                  {getDisplayName(client)}
                </div>
                <div className="text-xs flex gap-3" style={{ color: "var(--color-text-muted)" }}>
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
