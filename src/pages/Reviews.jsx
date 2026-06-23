import { useState, useEffect } from 'react';
import useScrollReveal from '../hooks/useScrollReveal';
import usePageMeta from '../hooks/usePageMeta';
import { supabase } from '../lib/supabase';
import './Reviews.css';

const GOOGLE_REVIEW_URL = 'https://g.page/r/CWiM9mqvEGVkEBM/review';

function Reviews() {
  useScrollReveal();
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
    const form = e.target;
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
      .catch(() => alert('Something went wrong. Please try again.'));
  };

  const renderStars = (count) => '★'.repeat(count) + '☆'.repeat(5 - count);

  return (
    <div className="reviews">
      <section className="reviews-intro reveal">
        <h1>What Our Clients Say</h1>
        <p>
          Real feedback from real property owners in the Rome, GA community. We
          earn our reputation one job at a time.
        </p>
      </section>

      <section className="reviews-google reveal">
        <p>Had a great experience? Leave us a review on Google — it helps your neighbors find honest property care.</p>
        <a
          href={GOOGLE_REVIEW_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="cta-button"
        >
          Leave a Google Review
        </a>
      </section>

      <section className="reviews-list reveal">
        <h2>Recent Reviews</h2>
        <div className="accent-bar" aria-hidden="true"></div>
        <div className="reviews-grid">
          {reviews.map((review, index) => (
            <div className="review-card" key={index}>
              <div className="review-stars">{renderStars(review.stars)}</div>
              <p className="review-text">&ldquo;{review.text}&rdquo;</p>
              <p className="review-author">{review.name}</p>
              <p className="review-date">{review.date}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="reviews-form-section reveal">
        <h2>Share Your Experience</h2>
        <div className="accent-bar" aria-hidden="true"></div>
        <form className="review-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="review-name">Your Name</label>
            <input
              type="text"
              id="review-name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="review-rating">Rating</label>
            <select
              id="review-rating"
              name="rating"
              value={formData.rating}
              onChange={handleChange}
              required
            >
              <option value="">Select a rating</option>
              <option value="5">★★★★★ — Excellent</option>
              <option value="4">★★★★☆ — Great</option>
              <option value="3">★★★☆☆ — Good</option>
              <option value="2">★★☆☆☆ — Fair</option>
              <option value="1">★☆☆☆☆ — Poor</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="review-text">Your Review</label>
            <textarea
              id="review-text"
              name="review"
              rows="4"
              value={formData.review}
              onChange={handleChange}
              required
            ></textarea>
          </div>

          <button type="submit" className="cta-button">
            Submit Review
          </button>
        </form>
      </section>
    </div>
  );
}

export default Reviews;
