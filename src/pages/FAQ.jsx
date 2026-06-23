import { useState, useEffect } from 'react';
import useScrollReveal from '../hooks/useScrollReveal';
import usePageMeta from '../hooks/usePageMeta';
import { supabase } from '../lib/supabase';
import './FAQ.css';

function FAQ() {
  useScrollReveal();
  usePageMeta(
    'FAQ | Nailed It Property Solutions | Rome, GA',
    'Find answers to common questions about our property maintenance services, subscription plans, and service area in Rome, GA.'
  );

  const [faqs, setFaqs] = useState([]);
  const [search, setSearch] = useState('');
  const [openIndex, setOpenIndex] = useState(null);

  useEffect(() => {
    supabase
      .from('faqs')
      .select('*')
      .eq('published', true)
      .order('sort_order')
      .then(({ data }) => setFaqs(data || []));
  }, []);

  const filteredFaqs = faqs.filter(
    (faq) =>
      faq.question.toLowerCase().includes(search.toLowerCase()) ||
      faq.answer.toLowerCase().includes(search.toLowerCase())
  );

  const toggleItem = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="faq">
      <section className="faq-intro reveal">
        <h1>Frequently Asked Questions</h1>
        <p>
          Got a question? We&rsquo;ve got answers. Search below or browse our
          most common questions.
        </p>
      </section>

      <div className="faq-search">
        <input
          type="text"
          placeholder="Search questions..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setOpenIndex(null); }}
          aria-label="Search frequently asked questions"
        />
      </div>

      <div className="faq-list">
        {filteredFaqs.length > 0 ? (
          filteredFaqs.map((faq, index) => (
            <div
              className={`faq-item${openIndex === index ? ' faq-item--open' : ''}`}
              key={index}
            >
              <button
                className="faq-question"
                onClick={() => toggleItem(index)}
                aria-expanded={openIndex === index}
              >
                <span className="faq-question-text">{faq.question}</span>
                <span className="faq-toggle">+</span>
              </button>
              <div className="faq-answer">
                <p>{faq.answer}</p>
              </div>
            </div>
          ))
        ) : (
          <p className="faq-no-results">
            No questions found matching &ldquo;{search}&rdquo;. Try a different search or <a href="/contact">contact us</a> directly.
          </p>
        )}
      </div>
    </div>
  );
}

export default FAQ;
