-- Create storage bucket for Name Your Price attachments
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'nyp-attachments',
  'nyp-attachments',
  true,
  26214400, -- 25MB in bytes
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'video/mp4', 'video/quicktime', 'video/webm']
)
ON CONFLICT (id) DO NOTHING;

-- Anyone can upload to the bucket
CREATE POLICY "Public can upload nyp attachments"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'nyp-attachments');

-- Anyone can read (view) attachments
CREATE POLICY "Public can read nyp attachments"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'nyp-attachments');

-- Admin can delete attachments
CREATE POLICY "Admin can delete nyp attachments"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'nyp-attachments' AND auth.role() = 'authenticated');
