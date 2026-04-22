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
  const date = new Date(iso);
  return date.toLocaleString("en-US", {
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

  // Fetch conversations on mount
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

  // Fetch messages when a client is selected
  useEffect(() => {
    if (!selectedClientId) return;

    async function loadMessages() {
      try {
        const res = await fetch(`/api/admin/messages?clientId=${selectedClientId}`);
        if (!res.ok) throw new Error("Failed to load messages");
        const json = await res.json();
        setMessages(json.messages ?? []);
      } catch {
        // Non-fatal — keep existing messages
      }
    }

    async function markRead() {
      try {
        await fetch("/api/admin/messages/read", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clientId: selectedClientId }),
        });
        // Update local unread count to 0
        setConversations((prev) =>
          prev.map((c) =>
            c.clientId === selectedClientId ? { ...c, unreadCount: 0 } : c
          )
        );
      } catch {
        // Non-fatal
      }
    }

    loadMessages();
    markRead();
  }, [selectedClientId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Supabase Realtime subscription
  useEffect(() => {
    const supabase = createBrowserClient();
    const channel = supabase
      .channel("admin-messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `recipient_id=eq.${adminUserId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;

          // If this message is from the currently selected client, append it
          setSelectedClientId((currentClientId) => {
            if (newMsg.sender_id === currentClientId) {
              setMessages((prev) => [...prev, newMsg]);
            }
            return currentClientId;
          });

          // Update conversation list: bump unread count or add new conversation
          setConversations((prev) => {
            const existing = prev.find((c) => c.clientId === newMsg.sender_id);
            if (existing) {
              return prev.map((c) =>
                c.clientId === newMsg.sender_id
                  ? {
                      ...c,
                      lastMessage: newMsg.body,
                      unreadCount:
                        newMsg.sender_id !== adminUserId
                          ? c.unreadCount + 1
                          : c.unreadCount,
                    }
                  : c
              );
            }
            // New conversation
            return [
              {
                clientId: newMsg.sender_id,
                clientName: newMsg.sender_id,
                unreadCount: 1,
                lastMessage: newMsg.body,
              },
              ...prev,
            ];
          });
        }
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR") {
          setReconnecting(true);
        } else if (status === "SUBSCRIBED") {
          setReconnecting(false);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
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
      // Non-fatal — optimistic message stays visible
    }
  }

  const selectedConversation = conversations.find((c) => c.clientId === selectedClientId);

  if (error) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Reconnecting banner */}
      {reconnecting && (
        <div className="absolute top-0 left-0 right-0 bg-yellow-500 text-black text-sm text-center py-1 z-10">
          Reconnecting...
        </div>
      )}

      {/* Left column — client list */}
      <div className="w-1/3 border-r border-[#4A4A4A] overflow-y-auto flex-shrink-0">
        {loading ? (
          <p className="p-4 text-gray-400 text-sm">Loading...</p>
        ) : conversations.length === 0 ? (
          <p className="p-4 text-gray-400 text-sm">No conversations yet.</p>
        ) : (
          conversations.map((conv) => (
            <button
              key={conv.clientId}
              onClick={() => setSelectedClientId(conv.clientId)}
              className={`w-full text-left px-4 py-3 border-b border-[#4A4A4A] transition-colors
                ${selectedClientId === conv.clientId
                  ? "bg-[#162d5e]"
                  : "hover:bg-[#162d5e]/50"
                }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-white text-sm font-medium truncate">
                  {conv.clientName}
                </span>
                {conv.unreadCount > 0 && (
                  <span className="ml-2 flex-shrink-0 bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {conv.unreadCount}
                  </span>
                )}
              </div>
              <p className="text-gray-400 text-xs mt-1 truncate">{conv.lastMessage}</p>
            </button>
          ))
        )}
      </div>

      {/* Right column — conversation */}
      <div className="flex-1 flex flex-col min-w-0">
        {!selectedClientId ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-400">Select a conversation</p>
          </div>
        ) : (
          <>
            {/* Conversation header */}
            <div className="px-4 py-3 border-b border-[#4A4A4A] bg-[#162d5e] flex-shrink-0">
              <p className="text-white font-medium text-sm">
                {selectedConversation?.clientName ?? selectedClientId}
              </p>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg) => {
                const isAdmin = msg.sender_id === adminUserId;
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col max-w-[75%] ${isAdmin ? "ml-auto items-end" : "items-start"}`}
                  >
                    <div
                      className={`px-3 py-2 rounded-lg text-sm text-white
                        ${isAdmin ? "bg-orange-600" : "bg-[#162d5e]"}`}
                    >
                      {msg.body}
                    </div>
                    <span className="text-xs text-gray-500 mt-1">
                      {isAdmin ? "You" : selectedConversation?.clientName ?? "Client"} ·{" "}
                      {formatTimestamp(msg.created_at)}
                    </span>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            {/* Compose */}
            <div className="flex-shrink-0 border-t border-[#4A4A4A] p-3 flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Type a message..."
                className="flex-1 bg-[#0a1f44] border border-[#4A4A4A] rounded px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
              />
              <button
                onClick={handleSend}
                disabled={!newMessage.trim()}
                className="bg-orange-600 hover:bg-orange-500 disabled:opacity-40 text-white text-sm px-4 py-2 rounded transition-colors"
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
