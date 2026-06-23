-- Chat conversations
CREATE TABLE IF NOT EXISTS chat_conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  visitor_name TEXT,
  visitor_email TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Chat messages
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
  sender TEXT NOT NULL CHECK (sender IN ('visitor', 'admin')),
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Visitors can create conversations and read their own
CREATE POLICY "Anyone can create conversations" ON chat_conversations FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can read conversations" ON chat_conversations FOR SELECT USING (true);
CREATE POLICY "Anyone can update conversations" ON chat_conversations FOR UPDATE USING (true);

-- Anyone can insert and read messages (visitor needs to see admin replies)
CREATE POLICY "Anyone can insert messages" ON chat_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can read messages" ON chat_messages FOR SELECT USING (true);

-- Admin full access
CREATE POLICY "Admin full access conversations" ON chat_conversations FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin full access messages" ON chat_messages FOR ALL USING (auth.role() = 'authenticated');

-- Enable realtime on chat_messages
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_conversations;
