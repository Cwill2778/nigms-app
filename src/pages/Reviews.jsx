import { useState } from 'react';
import useScrollReveal from '../hooks/useScrollReveal';
import './Reviews.css';

// TODO: Replace with your actual Google Business review link
const GOOGLE_REVIEW_URL = 'https://g.page/r/CWiM9mqvEGVkEBM/review';

function Reviews() {
  useScrollReveal();

  const [formData, setFormData] = useState({
    name: '',
    rating: '',
    review: '',
  });

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

  // Placeholder reviews — replace with real ones as they come in
  const reviews = [
    {
      name: 'Marcus T.',
      stars: 5,
      text: 'Charles replaced our water heater the same day we called. Fair price for such a rapid response. Will be signing up for the subscription plan.',
      date: 'June 2026',
    },
    {
      name: 'Sandra & Bill H.',
      stars: 5,
      text: 'We had three different contractors ghost us before finding Nailed It. Charles showed up, gave us an honest quote, and did the work right. No surprises on the bill, no headaches, and nothing left unfinished. Great work!',
      date: 'May 2026',
    },
    {
      name: 'David R.',
      stars: 5,
      text: 'The drywall finish in our kitchen looks really great. You can\'t even tell where the old damage was. Great attention to detail and the built-in shelf was a nice bonus.',
      date: 'April 2026',
    },
  ];

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
