import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import './ChatBubble.css';

function ChatBubble() {
  const [open, setOpen] = useState(false);
  const [conversationId, setConversationId] = useState(() => localStorage.getItem('nips_chat_id'));
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [name, setName] = useState('');
  const [started, setStarted] = useState(!!localStorage.getItem('nips_chat_id'));
  const [unread, setUnread] = useState(false);
  const messagesEndRef = useRef(null);

  // Load existing messages
  useEffect(() => {
    if (!conversationId) return;

    supabase
      .from('chat_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at')
      .then(({ data }) => setMessages(data || []));
  }, [conversationId]);

  // Realtime subscription
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`chat-${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `conversation_id=eq.${conversationId}`,
      }, (payload) => {
        setMessages((prev) => [...prev, payload.new]);
        if (payload.new.sender === 'admin' && !open) {
          setUnread(true);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [conversationId, open]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function startChat(e) {
    e.preventDefault();
    const { data } = await supabase
      .from('chat_conversations')
      .insert({ visitor_name: name || 'Visitor' })
      .select()
      .single();

    if (data) {
      setConversationId(data.id);
      localStorage.setItem('nips_chat_id', data.id);
      setStarted(true);

      // Send auto greeting
      await supabase.from('chat_messages').insert({
        conversation_id: data.id,
        sender: 'admin',
        message: "Hey! Thanks for reaching out. How can we help you today?",
      });
    }
  }

  async function sendMessage(e) {
    e.preventDefault();
    if (!input.trim()) return;

    await supabase.from('chat_messages').insert({
      conversation_id: conversationId,
      sender: 'visitor',
      message: input.trim(),
    });

    setInput('');
  }

  return (
    <>
      {open && (
        <div className="chat-window">
          <div className="chat-header">
            <div>
              <p className="chat-header-title">Nailed It Support</p>
              <p className="chat-header-status">● Online</p>
            </div>
            <button className="chat-close" onClick={() => setOpen(false)}>&times;</button>
          </div>

          {!started ? (
            <form className="chat-prechat" onSubmit={startChat}>
              <p>Have a question? Chat with us live.</p>
              <input
                placeholder="Your name (optional)"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <button type="submit">Start Chat</button>
            </form>
          ) : (
            <>
              <div className="chat-messages">
                {messages.map((msg) => (
                  <div key={msg.id} className={`chat-msg chat-msg--${msg.sender}`}>
                    {msg.message}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              <form className="chat-input-area" onSubmit={sendMessage}>
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type a message..."
                  autoFocus
                />
                <button type="submit" className="chat-send">Send</button>
              </form>
            </>
          )}
        </div>
      )}

      <button
        className={`chat-toggle${unread ? ' chat-toggle--unread' : ''}`}
        onClick={() => { setOpen(!open); setUnread(false); }}
        aria-label="Open live chat"
      >
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4V4c0-1.1-.9-2-2-2zm0 15.17L18.83 16H4V4h16v13.17zM7 9h2v2H7V9zm4 0h2v2h-2V9zm4 0h2v2h-2V9z"/>
        </svg>
      </button>
    </>
  );
}

export default ChatBubble;
