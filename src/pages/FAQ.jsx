import { useState } from 'react';
import useScrollReveal from '../hooks/useScrollReveal';
import usePageMeta from '../hooks/usePageMeta';
import './FAQ.css';

const faqs = [
  {
    question: 'What services does Nailed It Property Solutions specialize in?',
    answer: 'We specialize in residential maintenance, reliable home repairs, and structured preventative care. From quick fixes and general installations to comprehensive upkeep, we ensure every patch, repair, and update stands the test of time. We also offer tiered preventative care plans designed to keep your home\'s vital systems running smoothly year-round.',
  },
  {
    question: 'What sets your business apart from other local home service providers?',
    answer: 'We don\'t believe in "dirt cheap and fast" band-aid fixes that just delay a bigger problem. To us, "nailed it" isn\'t a casual catchphrase — it is a rigid standard of quality. We build our reputation on absolute respect for your home, clear communication from the moment we arrive, and the endurance to do things the right way the first time. We treat every property exactly like it\'s our own.',
  },
  {
    question: 'What is your primary service area?',
    answer: 'We proudly serve homeowners and property managers right here across the Rome community and the surrounding local areas.',
  },
  {
    question: 'Why do you emphasize preventative care and maintenance subscriptions?',
    answer: 'A home is usually a person\'s most expensive asset, and neglecting it always costs more down the road. Our mission is to provide affordable, proactive care today so you never have to face a stressful, costly 2:00 AM emergency — like a hot water heater failing — tomorrow. Meticulous attention to small details yields long-term peace of mind.',
  },
  {
    question: 'How do you handle communication and customer service?',
    answer: 'Inviting someone into your personal space takes trust. We honor that by providing clear updates, showing up on time, and showing absolute respect for your property. You will always know what to expect regarding the scope of work, timeline, and pricing.',
  },
];

function FAQ() {
  useScrollReveal();
  usePageMeta(
    'FAQ | Nailed It Property Solutions | Rome, GA',
    'Find answers to common questions about our property maintenance services, subscription plans, and service area in Rome, GA.'
  );

  const [search, setSearch] = useState('');
  const [openIndex, setOpenIndex] = useState(null);

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
