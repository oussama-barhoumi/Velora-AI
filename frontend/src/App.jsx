import { useEffect, useRef } from 'react';
import Lenis from 'lenis';
import './App.css';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import ScrollStorySection from './components/ScrollStorySection';

function App() {
  const cursorRef = useRef(null);

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - 2 ** (-10 * t)),
      smoothWheel: true,
    });

    let frameId;
    const raf = (time) => {
      lenis.raf(time);
      frameId = requestAnimationFrame(raf);
    };
    frameId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(frameId);
      lenis.destroy();
    };
  }, []);

  useEffect(() => {
    const cursor = cursorRef.current;
    if (!cursor) return undefined;

    const handleMove = (event) => {
      cursor.style.setProperty('--cursor-x', `${event.clientX}px`);
      cursor.style.setProperty('--cursor-y', `${event.clientY}px`);
    };

    window.addEventListener('pointermove', handleMove, { passive: true });
    return () => window.removeEventListener('pointermove', handleMove);
  }, []);

  return (
    <>
      <div ref={cursorRef} className="velora-cursor-glow" aria-hidden="true" />

      {/* Background gradient blobs */}
      <div className="velora-bg-blobs" aria-hidden="true">
        <div className="blob blob--blue" />
        <div className="blob blob--peach" />
        <div className="blob blob--lavender" />
      </div>

      <div className="velora-noise" aria-hidden="true" />

      <div className="velora-particles" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>

      {/* Navigation */}
      <Navbar />

      {/* Hero / Welcome Section */}
      <main>
        <HeroSection />
        <ScrollStorySection />
      </main>
    </>
  );
}

export default App;
