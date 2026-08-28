import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const fallbackTestimonials = [
  { stars: 5, text: 'Charles replaced our water heater the same day we called. Fair price for such a rapid response.', name: 'Marcus Thompson' },
  { stars: 5, text: 'We had three different contractors ghost us before finding Nailed It. Charles showed up, gave us an honest quote, and did the work right.', name: 'Sandra & Bill Henderson' },
  { stars: 5, text: "The new subscription plan has made managing my rental properties totally stress-free. Best investment I've made all year.", name: 'David Reynolds' },
];

function TestimonialCarousel() {
  const [current, setCurrent] = useState(0);
  const [testimonials, setTestimonials] = useState(fallbackTestimonials);

  useEffect(() => {
    supabase.from('reviews').select('*').eq('published', true).order('created_at', { ascending: false })
      .then(({ data }) => { if (data && data.length > 0) setTestimonials(data); });
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setCurrent((prev) => (prev + 1) % testimonials.length), 10000);
    return () => clearInterval(interval);
  }, [testimonials]);

  return (
    <div className="relative w-full max-w-4xl mx-auto min-h-[250px] flex flex-col justify-center items-center">
      <div className="overflow-hidden w-full relative h-[200px]">
        {testimonials.map((t, i) => (
          <div 
            key={i} 
            className={`transition-opacity duration-1000 ease-in-out absolute inset-0 flex flex-col justify-center items-center w-full ${i === current ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none z-0'}`}
          >
            <p className="text-brand-orange text-2xl mb-4 tracking-widest">{'★'.repeat(t.stars)}</p>
            <p className="text-xl md:text-2xl text-text-main font-body italic leading-relaxed text-center mb-6 max-w-3xl px-4">&ldquo;{t.text}&rdquo;</p>
            <p className="text-text-sub font-heading font-bold uppercase tracking-wider">— {t.name}</p>
          </div>
        ))}
      </div>
      <div className="flex space-x-3 mt-4 z-20 relative">
        {testimonials.map((_, i) => (
          <button 
            key={i} 
            className={`w-3 h-3 rounded-full transition-colors duration-300 ${i === current ? 'bg-brand-orange' : 'bg-wood-800 border border-border-subtle hover:bg-wood-800/80'}`}
            onClick={() => setCurrent(i)} 
            aria-label={`View review ${i + 1}`} 
          />
        ))}
      </div>
    </div>
  );
}

export default TestimonialCarousel;
