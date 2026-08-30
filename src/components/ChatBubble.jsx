import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

function ChatBubble() {
  const [open, setOpen] = useState(false);
  const [conversationId, setConversationId] = useState(() => localStorage.getItem('nips_chat_id'));
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [name, setName] = useState('');
  const [started, setStarted] = useState(!!localStorage.getItem('nips_chat_id'));
  const [unread, setUnread] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!conversationId) return;

    supabase
      .from('chat_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at')
      .then(({ data }) => setMessages(data || []));
  }, [conversationId]);

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
    <div className="fixed z-50 bottom-6 right-6 md:bottom-8 md:right-8 font-body flex flex-col items-end">
      {open && (
        <div className="mb-6 w-[340px] max-w-[calc(100vw-32px)] bg-wood-800 border border-border-subtle rounded-xl shadow-[0_12px_40px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col animate-[pageFadeIn_0.2s_ease-out]">
          
          <div className="bg-wood-card border-b border-border-subtle px-5 py-4 flex justify-between items-center">
            <div>
              <p className="font-heading font-bold uppercase tracking-wider text-sm text-text-main">Nailed It Support</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                <span className="text-xs text-text-sub">Online</span>
              </div>
            </div>
            <button 
              className="text-text-sub hover:text-brand-orange text-2xl leading-none transition-colors" 
              onClick={() => setOpen(false)}
            >
              &times;
            </button>
          </div>

          {!started ? (
            <form className="p-6 flex flex-col gap-4 bg-wood-800" onSubmit={startChat}>
              <p className="text-sm text-center text-text-main mb-2">Have a question? Chat with us live.</p>
              <input
                className="w-full bg-wood-900 border border-border-subtle text-text-main px-4 py-3 rounded focus:outline-none focus:border-brand-orange text-sm"
                placeholder="Your name (optional)"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <button type="submit" className="w-full bg-brand-orange hover:bg-brand-hover text-wood-900 font-heading font-bold uppercase tracking-wider py-3 rounded transition-colors mt-2">
                Start Chat
              </button>
            </form>
          ) : (
            <>
              <div className="p-5 overflow-y-auto flex flex-col gap-4 bg-wood-800 min-h-[250px] max-h-[350px]">
                {messages.map((msg) => {
                  let displayMsg = msg.message;
                  let agentName = null;
                  if (msg.sender === 'admin') {
                    const match = displayMsg.match(/^\[Agent (.*?)\]:\s*(.*)$/);
                    if (match) {
                      agentName = match[1];
                      displayMsg = match[2];
                    }
                  }
                  const isVisitor = msg.sender === 'visitor';
                  
                  return (
                    <div key={msg.id} className={`max-w-[85%] p-3 rounded-lg text-sm leading-relaxed ${isVisitor ? 'self-end bg-brand-orange text-wood-900 rounded-br-sm' : 'self-start bg-wood-900 border border-border-subtle text-text-main rounded-bl-sm'}`}>
                      {agentName && <span className="block text-xs font-bold text-brand-orange mb-1 uppercase tracking-wide">{agentName}</span>}
                      {displayMsg}
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
              <form className="p-4 border-t border-border-subtle bg-wood-card flex gap-2" onSubmit={sendMessage}>
                <input
                  className="flex-1 bg-wood-900 border border-border-subtle text-text-main px-3 py-2 rounded focus:outline-none focus:border-brand-orange text-sm"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type a message..."
                  autoFocus
                />
                <button type="submit" className="bg-brand-orange hover:bg-brand-hover text-wood-900 font-bold px-4 py-2 rounded transition-colors text-sm">
                  Send
                </button>
              </form>
            </>
          )}
        </div>
      )}

      <button
        className="relative w-16 h-16 rounded-full bg-brand-orange hover:bg-brand-hover flex items-center justify-center text-wood-900 border-4 border-wood-900 shadow-[0_0_0_2px_rgba(255,95,31,0.3),_0_8px_24px_rgba(0,0,0,0.6)] hover:shadow-[0_0_0_4px_rgba(255,95,31,0.4),_0_12px_28px_rgba(0,0,0,0.8)] transition-all hover:scale-105"
        onClick={() => { setOpen(!open); setUnread(false); }}
        aria-label="Open live chat"
      >
        {unread && (
          <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 border-2 border-wood-900 rounded-full animate-pulse"></span>
        )}
        <svg viewBox="0 0 24 24" className="w-8 h-8 fill-current" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4V4c0-1.1-.9-2-2-2zm0 15.17L18.83 16H4V4h16v13.17zM7 9h2v2H7V9zm4 0h2v2h-2V9zm4 0h2v2h-2V9z"/>
        </svg>
      </button>
    </div>
  );
}

export default ChatBubble;
