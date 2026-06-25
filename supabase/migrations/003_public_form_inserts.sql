-- Allow public (unauthenticated) users to submit contact forms, reviews, and career applications.
-- These show up in the admin dashboard for Charles to review/approve.

-- Contact form submissions
CREATE POLICY "Public can submit contact forms" ON contact_submissions
  FOR INSERT WITH CHECK (true);

-- Reviews (submitted as unpublished, admin approves)
CREATE POLICY "Public can submit reviews" ON reviews
  FOR INSERT WITH CHECK (published = false);

-- Career applications
CREATE POLICY "Public can submit applications" ON career_applications
  FOR INSERT WITH CHECK (true);
