import { useState, useEffect } from 'react';
import useScrollToTop from '../hooks/useScrollToTop';
import usePageMeta from '../hooks/usePageMeta';
import { supabase } from '../lib/supabase';

const GOOGLE_REVIEW_URL = 'https://g.page/r/CWiM9mqvEGVkEBM/review';

function Reviews() {
  useScrollToTop();
  usePageMeta(
    'Client Reviews | Rome GA Property Maintenance | Nailed It',
    'Read what Rome homeowners and landlords have to say about our reliable property maintenance, unit turnovers, and repair services at Nailed It Property Solutions.'
  );

  const [reviews, setReviews] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    rating: '',
    review: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    supabase
      .from('reviews')
      .select('*')
      .eq('published', true)
      .order('created_at', { ascending: false })
      .then(({ data }) => setReviews(data || []));
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const form = e.target;

    // Save to Supabase for admin dashboard (unpublished until approved)
    supabase.from('reviews').insert({
      name: formData.name,
      stars: parseInt(formData.rating),
      text: formData.review,
      date: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      published: false,
    }).then();

    // Also send via Formspree for email notification
    fetch('https://formspree.io/f/mwvjjrqp', {
      method: 'POST',
      body: new FormData(form),
      headers: { Accept: 'application/json' },
    })
      .then((res) => {
        if (res.ok) {
          alert('Thank you for your review! It will be posted after approval.');
          setFormData({ name: '', rating: '', review: '' });
        } else {
          alert('Something went wrong. Please try again.');
        }
      })
      .catch(() => alert('Something went wrong. Please try again.'))
      .finally(() => setIsSubmitting(false));
  };

  const renderStars = (count) => '★'.repeat(count) + '☆'.repeat(5 - count);

  return (
    <div className="w-full bg-wood-900 min-h-screen pb-24">
      {/* Hero Section */}
      <section className="max-w-4xl mx-auto px-4 py-24 text-center">
        <h1 className="text-4xl md:text-5xl lg:text-6xl text-text-main font-heading font-bold uppercase tracking-wider mb-6">
          What Our Clients Say
        </h1>
        <div className="h-1 w-24 bg-brand-orange mx-auto mb-10"></div>
        <p className="text-xl text-text-sub leading-relaxed max-w-2xl mx-auto mb-12">
          Real feedback from real property owners in the Rome, GA community. We earn our reputation one job at a time.
        </p>
        
        <div className="bg-wood-card border-2 border-brand-orange p-8 rounded-xl shadow-[0_0_30px_rgba(255,95,31,0.15)] max-w-2xl mx-auto">
          <p className="text-lg text-text-main font-bold mb-6">Had a great experience? Leave us a review on Google — it helps your neighbors find honest property care.</p>
          <a
            href={GOOGLE_REVIEW_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-brand-orange hover:bg-brand-hover text-wood-900 font-heading font-bold uppercase tracking-wider px-8 py-4 rounded-md transition-all inline-block shadow-[0_0_15px_rgba(255,95,31,0.3)] hover:shadow-[0_0_20px_rgba(255,95,31,0.5)]"
          >
            Leave a Google Review
          </a>
        </div>
      </section>

      {/* Reviews Grid */}
      <section className="max-w-6xl mx-auto px-4 mb-24">
        <h2 className="text-3xl text-text-main font-heading font-bold uppercase tracking-wider mb-6 text-center">Recent Reviews</h2>
        <div className="h-1 w-16 bg-brand-orange mx-auto mb-12"></div>
        
        {reviews.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {reviews.map((review, index) => (
              <div key={index} className="bg-wood-800 border border-border-subtle p-8 rounded-xl shadow-lg flex flex-col h-full hover:border-brand-orange/50 transition-colors">
                <div className="text-brand-orange text-2xl mb-4 tracking-widest">{renderStars(review.stars)}</div>
                <p className="text-text-sub leading-relaxed mb-6 flex-grow italic">&ldquo;{review.text}&rdquo;</p>
                <div className="border-t border-border-subtle pt-4 mt-auto">
                  <p className="text-text-main font-heading font-bold uppercase tracking-wider">{review.name}</p>
                  <p className="text-sm text-text-sub">{review.date}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-text-sub">Loading reviews...</p>
        )}
      </section>

      {/* Review Form */}
      <section className="max-w-2xl mx-auto px-4">
        <div className="bg-wood-card border border-border-subtle p-8 md:p-12 rounded-xl shadow-2xl">
          <h2 className="text-2xl text-text-main font-heading font-bold uppercase tracking-wider mb-8 text-center">Share Your Experience</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="review-name" className="block text-sm font-bold text-text-sub uppercase tracking-wider mb-2">Your Name</label>
              <input
                type="text"
                id="review-name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full bg-wood-900 border border-border-subtle rounded-md px-4 py-3 text-text-main focus:outline-none focus:border-brand-orange transition-colors"
              />
            </div>

            <div>
              <label htmlFor="review-rating" className="block text-sm font-bold text-text-sub uppercase tracking-wider mb-2">Rating</label>
              <select
                id="review-rating"
                name="rating"
                value={formData.rating}
                onChange={handleChange}
                required
                className="w-full bg-wood-900 border border-border-subtle rounded-md px-4 py-3 text-text-main focus:outline-none focus:border-brand-orange transition-colors appearance-none"
              >
                <option value="">Select a rating</option>
                <option value="5">★★★★★ — Excellent</option>
                <option value="4">★★★★☆ — Great</option>
                <option value="3">★★★☆☆ — Good</option>
                <option value="2">★★☆☆☆ — Fair</option>
                <option value="1">★☆☆☆☆ — Poor</option>
              </select>
            </div>

            <div>
              <label htmlFor="review-text" className="block text-sm font-bold text-text-sub uppercase tracking-wider mb-2">Your Review</label>
              <textarea
                id="review-text"
                name="review"
                rows="4"
                value={formData.review}
                onChange={handleChange}
                required
                className="w-full bg-wood-900 border border-border-subtle rounded-md px-4 py-3 text-text-main focus:outline-none focus:border-brand-orange transition-colors"
              ></textarea>
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full bg-brand-orange hover:bg-brand-hover text-wood-900 font-heading font-bold uppercase tracking-wider px-8 py-4 rounded-md transition-all text-lg shadow-[0_0_15px_rgba(255,95,31,0.3)] hover:shadow-[0_0_20px_rgba(255,95,31,0.5)] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}

export default Reviews;
