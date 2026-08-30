import { useState, useEffect } from 'react';
import useScrollReveal from '../hooks/useScrollReveal';
import usePageMeta from '../hooks/usePageMeta';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';

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
    <div className="max-w-4xl mx-auto px-4 py-16 page-fade-in min-h-[70vh]">
      <section className="text-center mb-12 reveal">
        <h1 className="text-4xl md:text-6xl text-text-main font-heading font-bold uppercase tracking-wider mb-6">Frequently Asked Questions</h1>
        <p className="text-lg text-text-sub max-w-2xl mx-auto">
          Got a question? We've got answers. Search below or browse our
          most common questions.
        </p>
      </section>

      <div className="mb-12 max-w-2xl mx-auto">
        <input
          type="text"
          placeholder="Search questions..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setOpenIndex(null); }}
          aria-label="Search frequently asked questions"
          className="w-full bg-wood-800 border-none rounded-md p-4 text-text-main text-lg shadow-[inset_4px_4px_8px_rgba(0,0,0,0.6),inset_-2px_-2px_6px_rgba(255,255,255,0.03)] focus:outline-none focus:ring-2 focus:ring-brand-orange transition-shadow"
        />
      </div>

      <div className="space-y-4">
        {filteredFaqs.length > 0 ? (
          filteredFaqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                className={`bg-wood-800 rounded-lg overflow-hidden border border-wood-700/50 shadow-[8px_8px_16px_rgba(0,0,0,0.6),-4px_-4px_12px_rgba(255,255,255,0.02)] transition-colors ${isOpen ? 'border-brand-orange/50' : ''}`}
                key={index}
              >
                <button
                  className="w-full text-left px-6 py-5 flex justify-between items-center focus:outline-none"
                  onClick={() => toggleItem(index)}
                  aria-expanded={isOpen}
                >
                  <span className="text-xl font-heading font-bold text-text-main uppercase tracking-wide pr-4">{faq.question}</span>
                  <span className={`text-2xl text-brand-orange transition-transform duration-300 ${isOpen ? 'rotate-45' : ''}`}>+</span>
                </button>
                
                <div className={`px-6 overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96 pb-6 opacity-100' : 'max-h-0 opacity-0'}`}>
                  <p className="text-text-sub leading-relaxed">{faq.answer}</p>
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-center text-text-sub italic py-8">
            No questions found matching "{search}". Try a different search or <Link to="/contact" className="text-brand-orange hover:underline">contact us</Link> directly.
          </p>
        )}
      </div>
    </div>
  );
}

export default FAQ;
