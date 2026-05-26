import { useEffect, useRef, Suspense } from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import HeroModel from './HeroModel';

gsap.registerPlugin(ScrollTrigger);

/* Framer Motion variants */
const fadeInLeft = {
  hidden: { opacity: 0, x: -30 },
  visible: (i) => ({
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.8,
      ease: 'easeOut',
      delay: 0.4 + i * 0.2,
    },
  }),
};

const fadeInRight = {
  hidden: { opacity: 0, x: 30 },
  visible: (i) => ({
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.8,
      ease: 'easeOut',
      delay: 0.6 + i * 0.2,
    },
  }),
};


function ModelLoader() {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          border: '3px solid var(--border-light)',
          borderTopColor: 'var(--accent-sage)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }}
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function HeroSection() {
  const sectionRef = useRef(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return undefined;

    const ctx = gsap.context(() => {
      gsap.from('.velora-reveal', {
        y: 28,
        opacity: 0,
        filter: 'blur(10px)',
        duration: 1,
        ease: 'power3.out',
        stagger: 0.12,
        delay: 0.15,
      });

      gsap.from('.velora-premium-badge', {
        y: 18,
        opacity: 0,
        duration: 0.75,
        ease: 'power3.out',
        stagger: 0.08,
        delay: 0.55,
      });

      gsap.to('.velora-hero__model-glow', {
        scale: 1.12,
        opacity: 0.95,
        duration: 3.5,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
      });

      gsap.to('.velora-hero__visual', {
        yPercent: 7,
        filter: 'blur(2px)',
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: 'bottom top',
          scrub: 1.2,
        },
      });

      gsap.to('.velora-hero__content', {
        yPercent: -5,
        opacity: 0.82,
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: '35% top',
          end: 'bottom top',
          scrub: 1.2,
        },
      });
    }, section);

    const modelContainer = sectionRef.current?.querySelector(
      '.velora-hero__model-container'
    );
    if (modelContainer) {
      gsap.fromTo(
        modelContainer,
        { opacity: 0, scale: 0.92, y: 20 },
        {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 1.2,
          ease: 'power3.out',
          delay: 0.3,
        }
      );
    }

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    const buttons = sectionRef.current?.querySelectorAll('.velora-btn');
    if (!buttons?.length) return undefined;

    const cleanups = [];
    buttons.forEach((button) => {
      const handleMove = (event) => {
        const rect = button.getBoundingClientRect();
        const x = event.clientX - rect.left - rect.width / 2;
        const y = event.clientY - rect.top - rect.height / 2;
        gsap.to(button, {
          x: x * 0.18,
          y: y * 0.22,
          scale: 1.035,
          duration: 0.45,
          ease: 'power3.out',
        });
      };

      const handleLeave = () => {
        gsap.to(button, {
          x: 0,
          y: 0,
          scale: 1,
          duration: 0.65,
          ease: 'elastic.out(1, 0.45)',
        });
      };

      button.addEventListener('pointermove', handleMove);
      button.addEventListener('pointerleave', handleLeave);
      cleanups.push(() => {
        button.removeEventListener('pointermove', handleMove);
        button.removeEventListener('pointerleave', handleLeave);
      });
    });

    return () => cleanups.forEach((cleanup) => cleanup());
  }, []);

  return (
    <section
      ref={sectionRef}
      className="velora-hero"
      id="hero"
      aria-label="Hero section"
    >
      <div className="velora-hero__inner">
        <div className="velora-hero__content">
          <h1 className="velora-hero__headline velora-reveal">
            Your AI <em>Career</em> Agent
          </h1>

          <p className="velora-hero__subheadline velora-reveal">
            A refined career operating system that matches roles, prepares
            applications, and surfaces the opportunities worth your attention.
          </p>

          <div className="velora-hero__badges velora-reveal">
            <span className="velora-premium-badge">AI Powered</span>
            <span className="velora-premium-badge">10k+ users</span>
            <span className="velora-premium-badge">Trusted by startups</span>
          </div>
        </div>

        <div className="velora-hero__visual" aria-hidden="true">
          <div className="velora-hero__model-glow" />
          <div className="velora-hero__model-container" style={{ opacity: 0 }}>
            <Suspense fallback={<ModelLoader />}>
              <HeroModel />
            </Suspense>
            <div className="velora-hero__model-shadow" aria-hidden="true" />
          </div>
        </div>

        <motion.div
          className="velora-hero__buttons"
          custom={0}
          initial="hidden"
          animate="visible"
          variants={fadeInRight}
        >
          <motion.button
            className="velora-btn velora-btn--primary"
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            id="btn-get-started"
          >
            get started <span>→</span>
          </motion.button>

          <motion.button
            className="velora-btn1 "
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            id="btn-find-jobs"
          >
            find job
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
}
