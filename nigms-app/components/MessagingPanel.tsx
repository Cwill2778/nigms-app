"use client";

import { useEffect, useRef, useState } from "react";
import { createBrowserClient } from "@/lib/supabase-browser";
import type { Message } from "@/lib/types";

interface Conversation {
  clientId: string;
  clientName: string;
  unreadCount: number;
  lastMessage: string;
}

interface MessagingPanelProps {
  adminUserId: string;
}

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function MessagingPanel({ adminUserId }: MessagingPanelProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reconnecting, setReconnecting] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadConversations() {
      try {
        const res = await fetch("/api/admin/messages");
        if (!res.ok) throw new Error("Failed to load conversations");
        const json = await res.json();
        setConversations(json.conversations ?? []);
      } catch {
        setError("Messaging unavailable");
      } finally {
        setLoading(false);
      }
    }
    loadConversations();
  }, []);

  useEffect(() => {
    if (!selectedClientId) return;

    async function loadMessages() {
      try {
        const res = await fetch(`/api/admin/messages?clientId=${selectedClientId}`);
        if (!res.ok) throw new Error();
        const json = await res.json();
        setMessages(json.messages ?? []);
      } catch {
        // non-fatal
      }
    }

    async function markRead() {
      try {
        await fetch("/api/admin/messages/read", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clientId: selectedClientId }),
        });
        setConversations((prev) =>
          prev.map((c) =>
            c.clientId === selectedClientId ? { ...c, unreadCount: 0 } : c
          )
        );
      } catch {
        // non-fatal
      }
    }

    loadMessages();
    markRead();
  }, [selectedClientId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const supabase = createBrowserClient();
    const channel = supabase
      .channel("admin-messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `recipient_id=eq.${adminUserId}` },
        (payload) => {
          const newMsg = payload.new as Message;
          setSelectedClientId((currentClientId) => {
            if (newMsg.sender_id === currentClientId) {
              setMessages((prev) => [...prev, newMsg]);
            }
            return currentClientId;
          });
          setConversations((prev) => {
            const existing = prev.find((c) => c.clientId === newMsg.sender_id);
            if (existing) {
              return prev.map((c) =>
                c.clientId === newMsg.sender_id
                  ? { ...c, lastMessage: newMsg.body, unreadCount: c.unreadCount + 1 }
                  : c
              );
            }
            return [{ clientId: newMsg.sender_id, clientName: newMsg.sender_id, unreadCount: 1, lastMessage: newMsg.body }, ...prev];
          });
        }
      )
      .subscribe((status) => {
        setReconnecting(status === "CHANNEL_ERROR");
      });

    return () => { supabase.removeChannel(channel); };
  }, [adminUserId]);

  async function handleSend() {
    if (!newMessage.trim() || !selectedClientId) return;
    const optimistic: Message = {
      id: `optimistic-${Date.now()}`,
      sender_id: adminUserId,
      recipient_id: selectedClientId,
      sender_role: "admin",
      body: newMessage.trim(),
      read_at: null,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setNewMessage("");
    try {
      await fetch("/api/admin/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientId: selectedClientId, body: optimistic.body }),
      });
    } catch {
      // non-fatal
    }
  }

  const selectedConversation = conversations.find((c) => c.clientId === selectedClientId);

  if (error) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <p className="alert alert-error">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex h-full" style={{ color: "var(--color-text-primary)" }}>
      {reconnecting && (
        <div
          className="absolute top-0 left-0 right-0 text-sm text-center py-1 z-10"
          style={{ background: "var(--color-accent-yellow)", color: "var(--color-text-inverse)" }}
        >
          Reconnecting…
        </div>
      )}

      {/* Client list */}
      <div
        className="w-1/3 overflow-y-auto flex-shrink-0"
        style={{ borderRight: "1px solid var(--color-steel-dim)" }}
      >
        {loading ? (
          <p className="p-4 text-sm" style={{ color: "var(--color-text-muted)" }}>Loading…</p>
        ) : conversations.length === 0 ? (
          <p className="p-4 text-sm" style={{ color: "var(--color-text-muted)" }}>No conversations yet.</p>
        ) : (
          conversations.map((conv) => (
            <button
              key={conv.clientId}
              onClick={() => setSelectedClientId(conv.clientId)}
              className="w-full text-left px-4 py-3 transition-colors"
              style={{
                borderBottom: "1px solid var(--color-steel-dim)",
                background: selectedClientId === conv.clientId
                  ? "var(--color-navy-mid)"
                  : "transparent",
              }}
              onMouseEnter={(e) => {
                if (selectedClientId !== conv.clientId)
                  e.currentTarget.style.background = "var(--color-navy)";
              }}
              onMouseLeave={(e) => {
                if (selectedClientId !== conv.clientId)
                  e.currentTarget.style.background = "transparent";
              }}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium truncate" style={{ color: "var(--color-text-primary)" }}>
                  {conv.clientName}
                </span>
                {conv.unreadCount > 0 && (
                  <span
                    className="ml-2 flex-shrink-0 text-xs rounded-full w-5 h-5 flex items-center justify-center"
                    style={{
                      background: "var(--color-accent-orange)",
                      color: "var(--color-text-inverse)",
                      fontFamily: "var(--font-heading)",
                      fontWeight: 700,
                    }}
                  >
                    {conv.unreadCount}
                  </span>
                )}
              </div>
              <p className="text-xs mt-1 truncate" style={{ color: "var(--color-text-muted)" }}>
                {conv.lastMessage}
              </p>
            </button>
          ))
        )}
      </div>

      {/* Conversation */}
      <div className="flex-1 flex flex-col min-w-0">
        {!selectedClientId ? (
          <div className="flex items-center justify-center h-full">
            <p style={{ color: "var(--color-text-muted)" }}>Select a conversation</p>
          </div>
        ) : (
          <>
            <div
              className="px-4 py-3 flex-shrink-0"
              style={{
                borderBottom: "1px solid var(--color-navy-bright)",
                background: "var(--color-navy)",
              }}
            >
              <p className="text-sm font-medium" style={{ color: "var(--color-text-on-navy)" }}>
                {selectedConversation?.clientName ?? selectedClientId}
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg) => {
                const isAdmin = msg.sender_id === adminUserId;
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col max-w-[75%] ${isAdmin ? "ml-auto items-end" : "items-start"}`}
                  >
                    <div
                      className="px-3 py-2 text-sm"
                      style={{
                        borderRadius: "var(--radius-md)",
                        background: isAdmin ? "var(--color-accent-orange)" : "var(--color-bg-elevated)",
                        color: isAdmin ? "var(--color-text-inverse)" : "var(--color-text-primary)",
                        border: isAdmin ? "none" : "1px solid var(--color-steel-dim)",
                      }}
                    >
                      {msg.body}
                    </div>
                    <span className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>
                      {isAdmin ? "You" : selectedConversation?.clientName ?? "Client"} ·{" "}
                      {formatTimestamp(msg.created_at)}
                    </span>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            <div
              className="flex-shrink-0 p-3 flex gap-2"
              style={{ borderTop: "1px solid var(--color-steel-dim)" }}
            >
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Type a message…"
                className="input flex-1 text-sm"
              />
              <button
                onClick={handleSend}
                disabled={!newMessage.trim()}
                className="btn-primary text-sm px-4 py-2"
              >
                Send
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
