import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';

export default function Navbar() {
  const navRef = useRef(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    // Logo fade down from top
    gsap.fromTo(
      navRef.current,
      { opacity: 0, y: -30 },
      { opacity: 1, y: 0, duration: 1, ease: 'power3.out', delay: 0.1 }
    );

    const handleScroll = () => {
      setScrolled(window.scrollY > 30);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      ref={navRef}
      className={`velora-nav${scrolled ? ' scrolled' : ''}`}
      role="navigation"
      aria-label="Main navigation"
      style={{ opacity: 0 }}
    >
      <div className="velora-nav__inner">
        <div className="velora-nav__links">
          <a href="#hire" className="velora-nav__link">Hire</a>
          <a href="#move" className="velora-nav__link">Move</a>
        </div>
        <div className="velora-nav__logo">Velora</div>
        <div className="velora-nav__actions">
          <div className="velora-nav__hamburger">
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
    </nav>
  );
}
