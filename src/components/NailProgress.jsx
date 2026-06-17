import { useState, useEffect } from 'react';
import './NailProgress.css';

function NailProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrolled = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      setProgress(Math.min(scrolled, 100));
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="nail-progress" aria-hidden="true">
      <div className="nail-head"></div>
      <div className="nail-shaft">
        <div className="nail-fill" style={{ height: `${progress}%` }}></div>
      </div>
      <div className="nail-tip"></div>
      <span className="nail-label">{Math.round(progress)}%</span>
    </div>
  );
}

export default NailProgress;
