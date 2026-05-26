import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/* ── SVG Illustrations ── one per feature, themed to cream/brown/green palette */

function SvgCvAnalyzer() {
  return (
    <svg viewBox="0 0 480 360" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>

      {/* Document */}
      <rect x="120" y="40" width="200" height="260" rx="10" fill="#fff" stroke="#e2ddd6" strokeWidth="1.5" />
      <rect x="140" y="72" width="120" height="8" rx="4" fill="#3a332d" />
      <rect x="140" y="92" width="90" height="6" rx="3" fill="#c9c3bb" />
      <rect x="140" y="112" width="160" height="4" rx="2" fill="#e2ddd6" />
      <rect x="140" y="124" width="140" height="4" rx="2" fill="#e2ddd6" />
      <rect x="140" y="136" width="155" height="4" rx="2" fill="#e2ddd6" />
      <rect x="140" y="156" width="100" height="6" rx="3" fill="#3a332d" opacity="0.6" />
      <rect x="140" y="170" width="160" height="4" rx="2" fill="#e2ddd6" />
      <rect x="140" y="182" width="130" height="4" rx="2" fill="#e2ddd6" />
      <rect x="140" y="194" width="150" height="4" rx="2" fill="#e2ddd6" />
      <rect x="140" y="214" width="100" height="6" rx="3" fill="#3a332d" opacity="0.6" />
      <rect x="140" y="228" width="160" height="4" rx="2" fill="#e2ddd6" />
      <rect x="140" y="240" width="110" height="4" rx="2" fill="#e2ddd6" />
      {/* AI scan line */}
      <rect x="120" y="148" width="200" height="2" fill="#4fcd70" opacity="0.8">
        <animate attributeName="y" values="40;280;40" dur="3s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.8;0.4;0.8" dur="3s" repeatCount="indefinite" />
      </rect>
      {/* Glow */}
      <rect x="120" y="144" width="200" height="10" fill="url(#glowGrad)" opacity="0.35">
        <animate attributeName="y" values="36;276;36" dur="3s" repeatCount="indefinite" />
      </rect>
      <defs>
        <linearGradient id="glowGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4fcd70" stopOpacity="0" />
          <stop offset="0.5" stopColor="#4fcd70" stopOpacity="1" />
          <stop offset="1" stopColor="#4fcd70" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Skill chips */}

      <text x="375" y="108" textAnchor="middle" fontSize="11" fill="#3a8f55" fontFamily="sans-serif"></text>

      <text x="375" y="144" textAnchor="middle" fontSize="11" fill="#3a332d" fontFamily="sans-serif"></text>

      <text x="375" y="180" textAnchor="middle" fontSize="11" fill="#3a8f55" fontFamily="sans-serif"></text>
    </svg>
  );
}

function SvgJobMatching() {
  return (
    <svg viewBox="0 0 480 360" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>

      {/* Center node */}
      <circle cx="240" cy="180" r="36" fill="#4fcd70" opacity="0.2" stroke="#4fcd70" strokeWidth="2" />
      <circle cx="240" cy="180" r="22" fill="#4fcd70" opacity="0.35" />
      <circle cx="240" cy="180" r="12" fill="#4fcd70" />
      {/* Company nodes */}
      {[
        [100, 90], [380, 90], [60, 200], [420, 200], [110, 290], [370, 290],
      ].map(([cx, cy], i) => (
        <g key={i}>
          <line x1="240" y1="180" x2={cx} y2={cy} stroke="#4fcd70" strokeWidth="1.2" opacity="0.4" strokeDasharray="6 4">
            <animate attributeName="stroke-dashoffset" values="0;-20" dur={`${1.4 + i * 0.3}s`} repeatCount="indefinite" />
          </line>
          <circle cx={cx} cy={cy} r="22" fill="#fff" stroke="#e2ddd6" strokeWidth="1.5" />
          <circle cx={cx} cy={cy} r="10" fill="#3a332d" opacity="0.12" />
          <circle cx={cx} cy={cy} r="6" fill="#3a332d" opacity="0.5">
            <animate attributeName="r" values="6;8;6" dur={`${2 + i * 0.4}s`} repeatCount="indefinite" />
          </circle>
        </g>
      ))}
      <text x="240" y="260" textAnchor="middle" fontSize="13" fill="#6b5f55" fontFamily="sans-serif" opacity="0.7"></text>
    </svg>
  );
}

function SvgSalaryPrediction() {
  return (
    <svg viewBox="0 0 480 360" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>

      {/* Grid lines */}
      {[80, 130, 180, 230, 280].map((y, i) => (
        <line key={i} x1="60" y1={y} x2="420" y2={y} stroke="#e2ddd6" strokeWidth="1" />
      ))}
      {/* Y axis labels */}
      {['$180k', '$140k', '$100k', '$60k', '$20k'].map((label, i) => (
        <text key={i} x="52" y={83 + i * 50} textAnchor="end" fontSize="10" fill="#aaa" fontFamily="sans-serif">{label}</text>
      ))}
      {/* Area fill */}
      <path d="M80 260 C140 220 180 200 220 170 C260 140 300 120 360 90 L360 280 L80 280Z"
        fill="#4fcd70" opacity="0.08" />
      {/* Chart line */}
      <path d="M80 260 C140 220 180 200 220 170 C260 140 300 120 360 90"
        fill="none" stroke="#4fcd70" strokeWidth="2.5" strokeLinecap="round" />
      {/* Prediction dashed */}
      <path d="M360 90 C390 78 410 72 420 68"
        fill="none" stroke="#4fcd70" strokeWidth="2" strokeDasharray="6 4" strokeLinecap="round">
        <animate attributeName="stroke-dashoffset" values="0;-20" dur="1.5s" repeatCount="indefinite" />
      </path>
      {/* Data point */}
      <circle cx="360" cy="90" r="6" fill="#4fcd70" />
      <circle cx="360" cy="90" r="12" fill="#4fcd70" opacity="0.2">
        <animate attributeName="r" values="10;16;10" dur="2s" repeatCount="indefinite" />
      </circle>
      {/* Tooltip */}
      <rect x="300" y="56" width="100" height="28" rx="6" fill="#3a332d" />
      <text x="350" y="75" textAnchor="middle" fontSize="12" fill="#fff" fontFamily="sans-serif" fontWeight="bold">+67% · $164k</text>
      {/* X axis */}
      <line x1="60" y1="280" x2="430" y2="280" stroke="#c9c3bb" strokeWidth="1.5" />
      {['Now', '2y', '5y', '10y'].map((label, i) => (
        <text key={i} x={80 + i * 94} y="296" textAnchor="middle" fontSize="10" fill="#aaa" fontFamily="sans-serif">{label}</text>
      ))}
    </svg>
  );
}

function SvgInterviewPrep() {
  return (
    <svg viewBox="0 0 480 360" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>

      {/* Screen frame */}
      <rect x="80" y="50" width="320" height="200" rx="12" fill="#fff" stroke="#e2ddd6" strokeWidth="1.5" />
      {/* AI avatar circle */}
      <circle cx="240" cy="150" r="60" fill="#3a332d" opacity="0.06" />
      <circle cx="240" cy="150" r="42" fill="#3a332d" opacity="0.09" />
      <circle cx="240" cy="130" r="26" fill="#3a332d" opacity="0.14" />
      <ellipse cx="240" cy="175" rx="36" ry="20" fill="#3a332d" opacity="0.08" />
      {/* Face features */}
      <circle cx="228" cy="126" r="4" fill="#4fcd70" opacity="0.8" />
      <circle cx="252" cy="126" r="4" fill="#4fcd70" opacity="0.8" />
      <path d="M230 138 Q240 145 250 138" fill="none" stroke="#4fcd70" strokeWidth="2" strokeLinecap="round" />
      {/* Scanline overlay */}
      <rect x="80" y="50" width="320" height="200" rx="12" fill="none" stroke="#4fcd70" strokeWidth="1.5" opacity="0.4" />
      {/* Waveform */}
      <rect x="80" y="262" width="320" height="50" rx="8" fill="#fff" stroke="#e2ddd6" strokeWidth="1" />
      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map((x) => {
        const h = [8, 18, 12, 24, 10, 20, 16, 28, 14, 22, 10, 18, 8, 20, 12][x];
        return (
          <rect key={x} x={100 + x * 20} y={287 - h / 2} width="8" height={h} rx="4" fill="#4fcd70" opacity="0.6">
            <animate attributeName="height" values={`${h};${h * 1.5};${h}`} dur={`${0.6 + x * 0.07}s`} repeatCount="indefinite" />
          </rect>
        );
      })}
    </svg>
  );
}

function SvgCareerRoadmap() {
  const milestones = [
    { x: 80, y: 270, label: 'Junior' },
    { x: 180, y: 210, label: 'Mid-level' },
    { x: 280, y: 150, label: 'Senior' },
    { x: 380, y: 90, label: 'Lead' },
  ];
  return (
    <svg viewBox="0 0 480 360" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>

      {/* Path */}
      <path d="M80 270 C120 260 140 230 180 210 C220 190 240 170 280 150 C320 130 340 110 380 90"
        fill="none" stroke="#e2ddd6" strokeWidth="4" strokeLinecap="round" />
      <path d="M80 270 C120 260 140 230 180 210 C220 190 240 170 280 150 C320 130 340 110 380 90"
        fill="none" stroke="#4fcd70" strokeWidth="3" strokeLinecap="round" strokeDasharray="600" strokeDashoffset="0">
        <animate attributeName="stroke-dashoffset" values="600;0" dur="2.5s" repeatCount="indefinite" />
      </path>
      {milestones.map(({ x, y, label }, i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="16" fill="#fff" stroke="#4fcd70" strokeWidth="2" />
          <circle cx={x} cy={y} r="8" fill="#4fcd70" opacity="0.5">
            <animate attributeName="r" values="8;11;8" dur={`${1.6 + i * 0.4}s`} repeatCount="indefinite" />
          </circle>
          <rect x={x - 36} y={y - 38} width="72" height="22" rx="6" fill="#3a332d" opacity="0.85" />
          <text x={x} y={y - 22} textAnchor="middle" fontSize="11" fill="#fff" fontFamily="sans-serif">{label}</text>
        </g>
      ))}
    </svg>
  );
}

function SvgAutoApply() {
  const companies = ['G', 'A', 'M', 'A', 'N', 'B'];
  return (
    <svg viewBox="0 0 480 360" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>

      {/* Central dispatch hub */}
      <circle cx="200" cy="180" r="50" fill="#3a332d" opacity="0.07" stroke="#3a332d" strokeWidth="1" strokeDasharray="6 4" />
      <circle cx="200" cy="180" r="32" fill="#fff" stroke="#e2ddd6" strokeWidth="1.5" />
      <circle cx="200" cy="180" r="18" fill="#4fcd70" opacity="0.3" />
      <circle cx="200" cy="180" r="10" fill="#4fcd70">
        <animate attributeName="r" values="10;13;10" dur="2s" repeatCount="indefinite" />
      </circle>
      <text x="200" y="185" textAnchor="middle" fontSize="11" fill="#fff" fontFamily="sans-serif" fontWeight="bold">AI</text>
      {/* Company targets */}
      {companies.map((c, i) => {
        const angle = (i / companies.length) * Math.PI * 2 - Math.PI / 2;
        const cx = 200 + Math.cos(angle) * 130;
        const cy = 180 + Math.sin(angle) * 110;
        return (
          <g key={i}>
            <line x1="200" y1="180" x2={cx} y2={cy} stroke="#4fcd70" strokeWidth="1.5" opacity="0.5" strokeDasharray="8 5">
              <animate attributeName="stroke-dashoffset" values="0;-26" dur={`${1.2 + i * 0.2}s`} repeatCount="indefinite" />
            </line>
            <circle cx={cx} cy={cy} r="22" fill="#fff" stroke="#e2ddd6" strokeWidth="1.5" />
            <text x={cx} y={cy + 5} textAnchor="middle" fontSize="13" fontFamily="sans-serif" fill="#3a332d">{c}</text>
            {/* Confirm badge */}
            <circle cx={cx + 14} cy={cy - 14} r="8" fill="#4fcd70">
              <animate attributeName="opacity" values="0;1;0" dur={`${2.5 + i * 0.4}s`} repeatCount="indefinite" />
            </circle>
            <text x={cx + 14} y={cy - 10} textAnchor="middle" fontSize="9" fill="#fff" fontFamily="sans-serif">✓</text>
          </g>
        );
      })}
      {/* Counter */}
      <rect x="310" y="280" width="120" height="40" rx="8" fill="#3a332d" />
      <text x="370" y="297" textAnchor="middle" fontSize="11" fill="#ccc" fontFamily="sans-serif">Applied</text>
      <text x="370" y="313" textAnchor="middle" fontSize="14" fill="#4fcd70" fontFamily="sans-serif" fontWeight="bold">12,480 jobs</text>
    </svg>
  );
}

/* SVG component map */
const SVG_MAP = [SvgCvAnalyzer, SvgJobMatching, SvgSalaryPrediction, SvgInterviewPrep, SvgCareerRoadmap, SvgAutoApply];

/* ── Feature data ── */
const STEPS = [
  {
    title: 'AI CV Analyzer',
    sub: 'Upload CV, AI extracts skills, experience, suggests improvements.',
  },
  {
    title: 'Smart Job Matching',
    sub: 'Matches user profile to relevant job listings.',
  },
  {
    title: 'Salary Prediction',
    sub: 'Estimates salary range based on skills, location, experience.',
  },
  {
    title: 'Interview Prep',
    sub: 'AI-generated mock interviews, common questions, feedback.',
  },
  {
    title: 'Career Roadmap',
    sub: 'Visual timeline showing career progression paths.',
  },
  {
    title: 'Auto Apply System',
    sub: 'One-click apply to matched jobs with tailored cover letters.',
  },
];

/* Progress breakpoints at which each step text reveals */
const STEP_PROGRESS = [0.05, 0.22, 0.39, 0.56, 0.73, 0.90];

export default function FeatureScrollSection() {
  const sectionRef = useRef(null);
  const stepsRef = useRef([]);
  const imagesRef = useRef([]);
  const overlayRef = useRef(null);


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
          {STEPS.map((step, i) => {
            const SvgComponent = SVG_MAP[i];
            return (
              <div
                key={step.title}
                ref={el => (imagesRef.current[i] = el)}
                style={{ ...css.img, zIndex: STEPS.length - i }}
              >
                <SvgComponent />
              </div>
            );
          })}
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
    overflow: 'clip',
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
    fontFamily: "'Satoshi', sans-serif",
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
    fontFamily: "'Satoshi', sans-serif",
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
    background: 'transparent',
  },
  img: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    willChange: 'opacity',
    background: 'transparent',
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
