import { useEffect } from 'react';

/**
 * Sets up an IntersectionObserver that adds a 'revealed' class
 * to elements with the 'reveal' class when they scroll into view.
 * Call once at app level or per page.
 */
function useScrollReveal() {
  useEffect(() => {
    const elements = document.querySelectorAll('.reveal');

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);
}

export default useScrollReveal;
