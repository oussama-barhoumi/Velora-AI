import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Sparkles, ArrowUpRight, Shield, Compass } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const WORKFLOW_STEPS = [
  {
    num: '01',
    title: 'Analyze CV',
    desc: 'Our semantic AI engine parses your resume, identifying hidden strengths, core capabilities, and gaps matching market demand.',
    accent: '#26D862',
  },
  {
    num: '02',
    title: 'Match Jobs',
    desc: 'Instantly screen thousands of active job opportunities, filtering out mismatches and highlighting high-probability career fits.',
    accent: '#26D862',
  },
  {
    num: '03',
    title: 'Optimize ATS',
    desc: 'Adapt keywords, tone, and structure to bypass rigid Applicant Tracking Systems, securing maximum scores before submission.',
    accent: '#26D862',
  },
  {
    num: '04',
    title: 'Get Hired',
    desc: 'Deliver tailored applications, track recruitment stages in real-time, and stand out with AI-augmented portfolios.',
    accent: '#26D862',
  },
];

export default function Footer() {
  const footerWrapRef = useRef(null);
  const footerPinRef = useRef(null);
  const progressLineRef = useRef(null);
  const stepsContainerRef = useRef(null);
  const titleLettersRef = useRef([]);
  const ctaBtnRef = useRef(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const wrap = footerWrapRef.current;
    const pin = footerPinRef.current;
    if (!wrap || !pin) return undefined;

    // GSAP context to scoped selectors
    const ctx = gsap.context(() => {
      // 1. Initial State Setup
      const stepElements = gsap.utils.toArray('.vf-step');
      gsap.set(stepElements, { opacity: 0, y: 50, filter: 'blur(10px)' });
      gsap.set('.vf-footer-links-wrap', { opacity: 0, y: 30 });
      gsap.set('.vf-finale-cta', { opacity: 0, scale: 0.95 });

      // Split large logo letters if possible or animate directly
      const logoLetters = gsap.utils.toArray('.vf-logo-letter');
      gsap.set(logoLetters, { y: 120, opacity: 0, rotateX: -60 });

      // 2. Main Storytelling Scroll Timeline
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: wrap,
          pin: pin,
          pinSpacing: true,
          start: 'top top',
          end: '+=350%',
          scrub: 1,
          onUpdate: (self) => {
            setScrollProgress(self.progress);
            if (progressLineRef.current) {
              // Animate progress line scale
              gsap.set(progressLineRef.current, { scaleY: self.progress });
            }
          },
        },
      });

      // Step reveal timings:
      // We have 4 steps. They should reveal, shine, and then fade out, making room for the final CTA
      const stepDuration = 0.5;
      const stepGap = 0.45;

      WORKFLOW_STEPS.forEach((_, index) => {
        const startPos = index * stepGap;

        // Reveal active step
        tl.to(
          stepElements[index],
          {
            opacity: 1,
            y: 0,
            filter: 'blur(0px)',
            duration: stepDuration,
            ease: 'power3.out',
          },
          startPos
        );

        // Highlight step indicator
        tl.to(
          `.vf-indicator-dot-${index}`,
          {
            backgroundColor: WORKFLOW_STEPS[index].accent,
            scale: 1.4,
            boxShadow: `0 0 16px ${WORKFLOW_STEPS[index].accent}`,
            duration: 0.3,
          },
          startPos
        );

        // If not the last step, fade out as we scroll to the next one
        if (index < WORKFLOW_STEPS.length - 1) {
          tl.to(
            stepElements[index],
            {
              opacity: 0.15,
              y: -30,
              filter: 'blur(4px)',
              duration: stepDuration * 0.8,
              ease: 'power2.in',
            },
            startPos + stepDuration
          );
        } else {
          // Last step transitions out to reveal the grand finale
          tl.to(
            stepElements[index],
            {
              opacity: 0,
              y: -40,
              filter: 'blur(8px)',
              duration: stepDuration * 0.8,
              ease: 'power2.in',
            },
            startPos + stepDuration + 0.1
          );
        }
      });

      // 3. Finale Screen Transition (starts after steps are done, around progress 2.1)
      const finaleStart = WORKFLOW_STEPS.length * stepGap;

      // Animate steps container height collapsing or translating out of view
      tl.to(
        stepsContainerRef.current,
        {
          yPercent: -100,
          opacity: 0,
          pointerEvents: 'none',
          duration: 0.6,
          ease: 'power3.inOut',
        },
        finaleStart
      );

      // Fade in the grand finale CTA and logo
      tl.to(
        '.vf-finale-cta',
        {
          opacity: 1,
          scale: 1,
          duration: 0.6,
          ease: 'power4.out',
        },
        finaleStart + 0.2
      );

      // Roll up massive typographic letters "VELORA"
      tl.to(
        logoLetters,
        {
          y: 0,
          opacity: 1,
          rotateX: 0,
          stagger: 0.05,
          duration: 0.8,
          ease: 'power4.out',
        },
        finaleStart + 0.3
      );

      // Reveal bottom footer links
      tl.to(
        '.vf-footer-links-wrap',
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: 'power3.out',
        },
        finaleStart + 0.45
      );

    }, wrap);

    return () => ctx.revert();
  }, []);

  // Magnetic Button Effect for the main CTA button
  useEffect(() => {
    const btn = ctaBtnRef.current;
    if (!btn) return undefined;

    const handleMouseMove = (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      gsap.to(btn, {
        x: x * 0.3,
        y: y * 0.3,
        scale: 1.05,
        duration: 0.3,
        ease: 'power2.out',
      });
    };

    const handleMouseLeave = () => {
      gsap.to(btn, {
        x: 0,
        y: 0,
        scale: 1,
        duration: 0.6,
        ease: 'elastic.out(1, 0.5)',
      });
    };

    btn.addEventListener('mousemove', handleMouseMove);
    btn.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      btn.removeEventListener('mousemove', handleMouseMove);
      btn.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <div ref={footerWrapRef} className="vf-wrap" id="footer-section">
      <div ref={footerPinRef} className="vf-pin">
        {/* Luxury dark space background with neon overlay */}
        <div className="vf-grid-overlay" aria-hidden="true" />
        <div className="vf-glow-sphere-1" aria-hidden="true" />
        <div className="vf-glow-sphere-2" aria-hidden="true" />

        {/* Outer container */}
        <div className="vf-container">

          {/* ─── STAGE 1: Vertical Storytelling Workflow ─── */}
          <div ref={stepsContainerRef} className="vf-workflow-stage">
            <div className="vf-workflow-grid">

              {/* Left Column: Progress timeline indicators */}
              <div className="vf-timeline-col">
                <div className="vf-timeline-track">
                  <div ref={progressLineRef} className="vf-timeline-line" />
                </div>
                <div className="vf-dots-container">
                  {WORKFLOW_STEPS.map((step, idx) => (
                    <div key={idx} className="vf-dot-wrapper">
                      <span className={`vf-dot vf-indicator-dot-${idx}`} />
                      <span className="vf-dot-label">0{idx + 1}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Progressive Content Cards */}
              <div className="vf-content-col">
                <div className="vf-cards-wrap">
                  {WORKFLOW_STEPS.map((step, idx) => (
                    <div
                      key={step.title}
                      className={`vf-step vf-step-${idx}`}
                      style={{ '--accent-color': step.accent }}
                    >
                      <div className="vf-step-meta">
                        <span className="vf-step-num">{step.num}</span>
                        <div className="vf-step-pill" style={{ borderColor: `${step.accent}33` }}>
                          <span className="vf-pill-dot" style={{ backgroundColor: step.accent }} />
                          active match
                        </div>
                      </div>
                      <h3 className="vf-step-title">{step.title}</h3>
                      <p className="vf-step-desc">{step.desc}</p>

                      <div className="vf-step-footer">
                        <span className="vf-step-action">
                          Analyzing nodes <Sparkles size={14} className="vf-sparkle-icon" />
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>

          {/* ─── STAGE 2: Grand Finale Screen ─── */}
          <div className="vf-finale-stage">

            {/* CTA and editorial typography */}
            <div className="vf-finale-cta">
              <span className="vf-finale-tag">JOIN THE FUTURE OF RECRUITMENT</span>
              <h2 className="vf-finale-heading">
                Ready to elevate <br />
                your career trajectory?
              </h2>

              <button ref={ctaBtnRef} className="vf-magnetic-btn" id="footer-cta-btn">
                <span>Start Your Analysis</span>
                <ArrowUpRight size={20} />
              </button>
            </div>

            {/* Huge typographic brand background */}
            <div className="vf-massive-logo" aria-hidden="true">
              {['V', 'E', 'L', 'O', 'R', 'A'].map((letter, idx) => (
                <span key={idx} className="vf-logo-letter">
                  {letter}
                </span>
              ))}
            </div>

            {/* Bottom links grid */}
            <div className="vf-footer-links-wrap">
              <div className="vf-links-grid">
                <div className="vf-links-col">
                  <h4>Product</h4>
                  <a href="#analyzer">CV Analyzer</a>
                  <a href="#matching">Match Engine</a>
                  <a href="#ats">ATS Optimization</a>
                  <a href="#pricing">Premium Tiers</a>
                </div>
                <div className="vf-links-col">
                  <h4>Company</h4>
                  <a href="#about">About Velora</a>
                  <a href="#careers">Careers</a>
                  <a href="#contact">Contact</a>
                  <a href="#press">Press Kit</a>
                </div>
                <div className="vf-links-col">
                  <h4>Resources</h4>
                  <a href="#blog">AI Insights</a>
                  <a href="#security">Security Protocol</a>
                  <a href="#roadmap">Platform Roadmap</a>
                  <a href="#help">Operator Support</a>
                </div>
                <div className="vf-links-col vf-brand-col">
                  <h4>Network</h4>
                  <p>Next-gen agentic framework engineered for optimal matching density.</p>
                  <div className="vf-socials">
                    <a href="https://github.com" aria-label="Github Link" target="_blank" rel="noreferrer">
                      <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
                        <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                        <path d="M9 18c-4.51 2-5-2-7-2" />
                      </svg>
                    </a>
                    <a href="https://twitter.com" aria-label="Twitter Link" target="_blank" rel="noreferrer">
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" style={{ display: 'block' }}>
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                      </svg>
                    </a>
                    <a href="https://linkedin.com" aria-label="LinkedIn Link" target="_blank" rel="noreferrer">
                      <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
                        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                        <rect x="2" y="9" width="4" height="12" />
                        <circle cx="4" cy="4" r="2" />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>

              {/* Tiny copyright line */}
              <div className="vf-bottom-bar">
                <div className="vf-copyright">
                  © {new Date().getFullYear()} Velora AI Corporation. All protocols reserved.
                </div>
                <div className="vf-meta-protocols">
                  <span><Shield size={12} /> SECURE SHELL</span>
                  <span><Compass size={12} /> v1.0.4-PROD</span>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
