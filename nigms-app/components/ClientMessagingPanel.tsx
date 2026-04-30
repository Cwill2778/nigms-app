'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createBrowserClient } from '@/lib/supabase-browser';
import type { Message } from '@/lib/types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

// ─── Photo Upload Button ──────────────────────────────────────────────────────

interface PhotoUploadButtonProps {
  onUploaded: (url: string) => void;
  disabled?: boolean;
}

function PhotoUploadButton({ onUploaded, disabled }: PhotoUploadButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const supabase = createBrowserClient();
      const ext = file.name.split('.').pop() ?? 'jpg';
      const path = `messages/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('message-attachments')
        .upload(path, file, { upsert: false });

      if (uploadError) throw new Error(uploadError.message);

      const { data: urlData } = supabase.storage
        .from('message-attachments')
        .getPublicUrl(path);

      onUploaded(urlData.publicUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      // Reset input so the same file can be re-selected
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div style={{ position: 'relative', display: 'inline-flex', flexDirection: 'column', alignItems: 'center' }}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        disabled={disabled || uploading}
        aria-label="Upload photo"
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0,
          cursor: disabled || uploading ? 'not-allowed' : 'pointer',
          width: '100%',
          height: '100%',
        }}
      />
      <button
        type="button"
        disabled={disabled || uploading}
        aria-label="Upload photo"
        title="Upload photo"
        style={{
          padding: '0.45rem 0.6rem',
          borderRadius: 'var(--radius-sm, 6px)',
          background: 'transparent',
          color: uploading ? 'var(--color-text-muted, #778DA9)' : 'var(--color-coral, #FF7F7F)',
          border: '1px solid var(--color-steel-dim, #2a3a52)',
          cursor: disabled || uploading ? 'not-allowed' : 'pointer',
          fontSize: '1rem',
          lineHeight: 1,
          pointerEvents: 'none', // let the input handle clicks
        }}
      >
        {uploading ? '⏳' : '📎'}
      </button>
      {error && (
        <span
          style={{
            position: 'absolute',
            bottom: 'calc(100% + 4px)',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--color-error, #EF4444)',
            color: '#fff',
            fontSize: '0.7rem',
            padding: '0.2rem 0.4rem',
            borderRadius: '4px',
            whiteSpace: 'nowrap',
            zIndex: 10,
          }}
        >
          {error}
        </span>
      )}
    </div>
  );
}

// ─── Message Bubble ───────────────────────────────────────────────────────────

interface MessageBubbleProps {
  message: Message;
  currentUserId: string;
}

function MessageBubble({ message, currentUserId }: MessageBubbleProps) {
  const isClient = message.sender_id === currentUserId;

  // Detect if body is an image URL
  const isImage =
    message.body.startsWith('http') &&
    /\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i.test(message.body);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        maxWidth: '75%',
        alignSelf: isClient ? 'flex-end' : 'flex-start',
        alignItems: isClient ? 'flex-end' : 'flex-start',
      }}
    >
      <div
        style={{
          padding: isImage ? '0.25rem' : '0.6rem 0.85rem',
          borderRadius: isClient
            ? '12px 12px 2px 12px'
            : '12px 12px 12px 2px',
          background: isClient
            ? 'var(--color-coral, #FF7F7F)'
            : 'var(--color-navy, #1B263B)',
          color: '#fff',
          fontSize: '0.875rem',
          lineHeight: 1.5,
          wordBreak: 'break-word',
          border: isClient
            ? 'none'
            : '1px solid var(--color-steel-dim, #2a3a52)',
          overflow: 'hidden',
        }}
      >
        {isImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={message.body}
            alt="Attached photo"
            style={{
              maxWidth: '200px',
              maxHeight: '200px',
              borderRadius: '8px',
              display: 'block',
            }}
          />
        ) : (
          message.body
        )}
      </div>
      <span
        style={{
          fontSize: '0.68rem',
          color: 'var(--color-text-muted, #778DA9)',
          marginTop: '0.2rem',
        }}
      >
        {isClient ? 'You' : 'Nailed It'} · {formatTimestamp(message.created_at)}
      </span>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface ClientMessagingPanelProps {
  /** Scope messages to a specific work order */
  workOrderId?: string;
  /** Scope messages to a specific property */
  propertyId?: string;
}

/**
 * ClientMessagingPanel — real-time messaging interface for clients.
 *
 * - Fetches messages from GET /api/client/messages
 * - Subscribes to Supabase Realtime on `messages` table for new messages
 * - Supports photo upload via Supabase Storage
 * - Scoped to a specific work order or property (optional)
 * - Client messages: right-aligned, precision-coral background
 * - Admin messages: left-aligned, trust-navy background
 *
 * Requirements: 7.7
 */
export default function ClientMessagingPanel({ workOrderId, propertyId }: ClientMessagingPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reconnecting, setReconnecting] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fetch current user and messages
  const fetchMessages = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (workOrderId) params.set('work_order_id', workOrderId);
      if (propertyId) params.set('property_id', propertyId);

      const res = await fetch(`/api/client/messages?${params.toString()}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error ?? 'Failed to load messages');
      }
      const data = await res.json() as { messages: Message[] };
      setMessages(data.messages ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, [workOrderId, propertyId]);

  // Get current user ID
  useEffect(() => {
    const supabase = createBrowserClient();
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUserId(data.user?.id ?? null);
    });
  }, []);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Supabase Realtime subscription
  useEffect(() => {
    if (!currentUserId) return;

    const supabase = createBrowserClient();

    const channel = supabase
      .channel('client-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          // Listen for messages where the current user is sender or recipient
          filter: `recipient_id=eq.${currentUserId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => {
            // Avoid duplicates (optimistic messages have temp IDs)
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .subscribe((status) => {
        setReconnecting(status === 'CHANNEL_ERROR');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId]);

  async function handleSend() {
    const body = newMessage.trim();
    if (!body || sending) return;

    // Optimistic update
    const optimistic: Message = {
      id: `optimistic-${Date.now()}`,
      sender_id: currentUserId ?? '',
      recipient_id: '',
      sender_role: 'client',
      body,
      read_at: null,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setNewMessage('');
    setSending(true);

    try {
      const res = await fetch('/api/client/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          body,
          work_order_id: workOrderId,
          property_id: propertyId,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error ?? 'Failed to send message');
      }

      const data = await res.json() as { message: Message };
      // Replace optimistic message with real one
      setMessages((prev) =>
        prev.map((m) => (m.id === optimistic.id ? data.message : m))
      );
    } catch (err) {
      // Remove optimistic message on failure
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setSending(false);
    }
  }

  function handlePhotoUploaded(url: string) {
    // Send the image URL as a message body
    setNewMessage(url);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: '400px',
        position: 'relative',
      }}
    >
      {/* Reconnecting banner */}
      {reconnecting && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            background: 'var(--color-accent-yellow, #F59E0B)',
            color: '#fff',
            fontSize: '0.75rem',
            textAlign: 'center',
            padding: '0.25rem',
            zIndex: 10,
          }}
        >
          Reconnecting…
        </div>
      )}

      {/* Messages area */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
        }}
      >
        {loading ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: 'var(--color-text-muted, #778DA9)',
              fontSize: '0.875rem',
            }}
          >
            <span
              style={{
                display: 'inline-block',
                width: '0.75rem',
                height: '0.75rem',
                borderRadius: '50%',
                background: 'var(--color-coral, #FF7F7F)',
                animation: 'pulse 1.5s ease-in-out infinite',
              }}
            />
            Loading messages…
          </div>
        ) : error ? (
          <p style={{ color: 'var(--color-error, #EF4444)', fontSize: '0.875rem' }}>
            {error}
          </p>
        ) : messages.length === 0 ? (
          <p
            style={{
              color: 'var(--color-text-muted, #778DA9)',
              fontSize: '0.875rem',
              textAlign: 'center',
              marginTop: '2rem',
            }}
          >
            No messages yet. Start a conversation.
          </p>
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              currentUserId={currentUserId ?? ''}
            />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div
        style={{
          flexShrink: 0,
          padding: '0.75rem',
          borderTop: '1px solid var(--color-steel-dim, #2a3a52)',
          display: 'flex',
          gap: '0.5rem',
          alignItems: 'flex-end',
          background: 'var(--color-bg-surface, #0f1e30)',
        }}
      >
        <PhotoUploadButton onUploaded={handlePhotoUploaded} disabled={sending} />

        <textarea
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message… (Enter to send, Shift+Enter for new line)"
          rows={1}
          aria-label="Message input"
          style={{
            flex: 1,
            padding: '0.5rem 0.75rem',
            borderRadius: 'var(--radius-sm, 6px)',
            border: '1px solid var(--color-navy, #1B263B)',
            background: 'var(--color-bg-elevated, #1e2d42)',
            color: 'var(--color-text-primary, #f0f4f8)',
            fontSize: '0.875rem',
            resize: 'none',
            lineHeight: 1.5,
            fontFamily: 'var(--font-body, Inter, sans-serif)',
            outline: 'none',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-coral, #FF7F7F)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-navy, #1B263B)';
          }}
        />

        <button
          type="button"
          onClick={handleSend}
          disabled={!newMessage.trim() || sending}
          aria-label="Send message"
          style={{
            padding: '0.5rem 1rem',
            borderRadius: 'var(--radius-sm, 6px)',
            background: 'var(--color-coral, #FF7F7F)',
            color: '#fff',
            fontWeight: 700,
            fontSize: '0.8rem',
            border: 'none',
            cursor: !newMessage.trim() || sending ? 'not-allowed' : 'pointer',
            opacity: !newMessage.trim() || sending ? 0.6 : 1,
            fontFamily: 'var(--font-heading)',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          {sending ? 'Sending…' : 'Send'}
        </button>
      </div>
    </div>
  );
}
