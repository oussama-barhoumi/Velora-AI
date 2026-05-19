import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/* ── Feature data ── */
const STEPS = [
  {
    title: 'AI CV Analyzer',
    sub: 'Upload CV, AI extracts skills, experience, suggests improvements.',
    image: 'https://images.unsplash.com/photo-1633356122102-3fe601e05bd2?q=80&w=900&auto=format&fit=crop',
  },
  {
    title: 'Smart Job Matching',
    sub: 'Matches user profile to relevant job listings.',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=900&auto=format&fit=crop',
  },
  {
    title: 'Salary Prediction',
    sub: 'Estimates salary range based on skills, location, experience.',
    image: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?q=80&w=900&auto=format&fit=crop',
  },
  {
    title: 'Interview Prep',
    sub: 'AI-generated mock interviews, common questions, feedback.',
    image: 'https://images.unsplash.com/photo-1573164713988-8665fc963095?q=80&w=900&auto=format&fit=crop',
  },
  {
    title: 'Career Roadmap',
    sub: 'Visual timeline showing career progression paths.',
    image: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=900&auto=format&fit=crop',
  },
  {
    title: 'Auto Apply System',
    sub: 'One-click apply to matched jobs with tailored cover letters.',
    image: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=900&auto=format&fit=crop',
  },
];

/* Progress breakpoints at which each step text reveals */
const STEP_PROGRESS = [0.05, 0.22, 0.39, 0.56, 0.73, 0.90];

export default function FeatureScrollSection() {
  const sectionRef  = useRef(null);
  const stepsRef    = useRef([]);
  const imagesRef   = useRef([]);
  const overlayRef  = useRef(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      /* ── Set initial state of all step texts ── */
      stepsRef.current.forEach((el) => {
        if (!el) return;
        gsap.set(el, { opacity: 0, y: 50 });
      });

      /* ── Set initial state of images — first visible ── */
      imagesRef.current.forEach((el, i) => {
        if (!el) return;
        gsap.set(el, { opacity: i === 0 ? 1 : 0 });
      });

      /* ── Master timeline bound to scroll ── */
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          pin: true,
          scrub: 1,
          start: 'top top',
          end: '+=300%',
        },
      });

      /* ── Overlay progress bar (purely visual) ── */
      if (overlayRef.current) {
        tl.to(overlayRef.current, { scaleX: 1, ease: 'none' }, 0);
      }

      /* ── For each step: reveal text + swap image ── */
      STEP_PROGRESS.forEach((progress, i) => {
        /* Text reveal */
        tl.to(
          stepsRef.current[i],
          { opacity: 1, y: 0, duration: 0.08, ease: 'power2.out' },
          progress          // position on timeline (0–1 maps to full scroll)
        );

        /* Fade out previous image, fade in this one */
        if (i > 0) {
          tl.to(
            imagesRef.current[i - 1],
            { opacity: 0, duration: 0.1, ease: 'none' },
            progress - 0.04
          );
          tl.to(
            imagesRef.current[i],
            { opacity: 1, duration: 0.12, ease: 'power2.out' },
            progress
          );
        }

        /* Dim previous step texts */
        if (i > 0) {
          tl.to(
            stepsRef.current[i - 1],
            { opacity: 0.25, duration: 0.06, ease: 'none' },
            progress
          );
        }
      });

    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} style={css.section} id="features" aria-label="Platform features">

      {/* ── Left: text steps ── */}
      <div style={css.left}>
        <p style={css.eyebrow}>WHAT WE OFFER</p>
        <h2 style={css.heading}>Your AI career OS</h2>

        <div style={css.steps}>
          {STEPS.map((step, i) => (
            <div
              key={step.title}
              ref={el => (stepsRef.current[i] = el)}
              style={css.step}
              className={`fss-step fss-step-${i}`}
            >
              <span style={css.stepNum}>0{i + 1}</span>
              <div>
                <h3 style={css.stepTitle}>{step.title}</h3>
                <p style={css.stepSub}>{step.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right: sticky image panel ── */}
      <div style={css.right} aria-hidden="true">
        <div style={css.imgFrame}>
          {STEPS.map((step, i) => (
            <img
              key={step.title}
              ref={el => (imagesRef.current[i] = el)}
              src={step.image}
              alt={step.title}
              style={{ ...css.img, zIndex: STEPS.length - i }}
            />
          ))}

          {/* Corner label */}
          <div style={css.frameLabel}>
            <span style={css.frameDot} />
            Velora AI Engine
          </div>
        </div>

        {/* Progress bar */}
        <div style={css.progressTrack}>
          <div ref={overlayRef} style={css.progressBar} />
        </div>
      </div>

    </section>
  );
}

/* ── Inline styles ── matching your cream/brown palette */
const css = {
  section: {
    position: 'relative',
    width: '100%',
    minHeight: '100vh',
    background: '#fefee3',
    display: 'grid',
    gridTemplateColumns: '45% 55%',
    alignItems: 'center',
    overflow: 'hidden',
    boxSizing: 'border-box',
  },

  /* Left column */
  left: {
    padding: '80px 5% 80px 6%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    gap: '32px',
  },
  eyebrow: {
    fontFamily: "'Satoshi', sans-serif",
    fontSize: '0.78rem',
    letterSpacing: '0.2em',
    color: '#888',
    textTransform: 'uppercase',
    margin: 0,
  },
  heading: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 'clamp(2.4rem, 4vw, 4rem)',
    fontWeight: 600,
    lineHeight: 1.05,
    color: '#3a332d',
    margin: 0,
  },
  steps: {
    display: 'flex',
    flexDirection: 'column',
    gap: '36px',
    marginTop: '8px',
  },
  step: {
    display: 'flex',
    gap: '20px',
    alignItems: 'flex-start',
    willChange: 'transform, opacity',
  },
  stepNum: {
    fontFamily: "'Satoshi', sans-serif",
    fontSize: '0.82rem',
    fontWeight: 700,
    color: '#aaa',
    letterSpacing: '0.06em',
    paddingTop: '4px',
    minWidth: '24px',
  },
  stepTitle: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 'clamp(1.5rem, 2.5vw, 2.1rem)',
    fontWeight: 600,
    color: '#3a332d',
    margin: '0 0 6px',
    lineHeight: 1.1,
  },
  stepSub: {
    fontFamily: "'Satoshi', sans-serif",
    fontSize: '1rem',
    color: '#6b5f55',
    lineHeight: 1.55,
    margin: 0,
  },

  /* Right column */
  right: {
    position: 'relative',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 6% 40px 2%',
    gap: '16px',
    boxSizing: 'border-box',
  },
  imgFrame: {
    position: 'relative',
    width: '100%',
    height: '72vh',
    borderRadius: '14px',
    overflow: 'hidden',
    background: '#d0cfc9',
    boxShadow: '0 24px 80px rgba(0,0,0,0.18)',
    border: '1px solid rgba(0,0,0,0.06)',
  },
  img: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    willChange: 'opacity',
  },
  frameLabel: {
    position: 'absolute',
    bottom: '16px',
    left: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontFamily: "'Satoshi', sans-serif",
    fontSize: '0.75rem',
    color: 'rgba(255,255,255,0.9)',
    background: 'rgba(0,0,0,0.3)',
    backdropFilter: 'blur(8px)',
    borderRadius: '999px',
    padding: '5px 14px 5px 10px',
    letterSpacing: '0.06em',
    zIndex: 20,
  },
  frameDot: {
    width: '7px',
    height: '7px',
    borderRadius: '50%',
    background: '#4fcd70',
    boxShadow: '0 0 6px #4fcd70',
    display: 'inline-block',
  },

  /* Progress bar */
  progressTrack: {
    width: '100%',
    height: '3px',
    background: 'rgba(0,0,0,0.08)',
    borderRadius: '999px',
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    width: '100%',
    background: 'linear-gradient(90deg, #3a332d, #6b5f55)',
    borderRadius: '999px',
    transformOrigin: 'left center',
    transform: 'scaleX(0)',
    willChange: 'transform',
  },
};
