import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const items = [
  'Upload CV',
  'AI analyzes skills',
  'Get matched jobs instantly',
];

export default function ScrollStorySection() {
  const sectionRef = useRef(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return undefined;

    const ctx = gsap.context(() => {
      const rows = gsap.utils.toArray('.velora-scroll-story__item');
      const paths = gsap.utils.toArray('.velora-scroll-story__signal-path');

      paths.forEach((path) => {
        const length = path.getTotalLength();
        gsap.set(path, {
          strokeDasharray: length,
          strokeDashoffset: length,
        });

        gsap.to(path, {
          strokeDashoffset: 0,
          ease: 'none',
          scrollTrigger: {
            trigger: section,
            start: 'top 82%',
            end: 'bottom 72%',
            scrub: 1.2,
          },
        });
      });

      gsap.fromTo(
        '.velora-scroll-story__signal',
        { opacity: 0 },
        {
          opacity: 1,
          ease: 'none',
          scrollTrigger: {
            trigger: section,
            start: 'top bottom',
            end: 'top 58%',
            scrub: 1,
          },
        }
      );


      rows.forEach((row, index) => {
        gsap.fromTo(
          row,
          { y: 34, opacity: 0, filter: 'blur(10px)' },
          {
            y: 0,
            opacity: 1,
            filter: 'blur(0px)',
            ease: 'power3.out',
            scrollTrigger: {
              trigger: section,
              start: `${18 + index * 23}% center`,
              end: `${34 + index * 23}% center`,
              scrub: 1.1,
            },
          }
        );
      });
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="velora-scroll-story"
      aria-label="AI career workflow"
    >
      <svg
        className="velora-scroll-story__signal"
        viewBox="0 0 1000 1900"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          className="velora-scroll-story__signal-path velora-scroll-story__signal-glow"
          d="M500 0 C500 130 118 158 108 292 C94 492 906 492 892 292 C882 156 500 184 500 356 C500 560 124 584 110 725 C92 928 912 928 890 725 C876 584 500 614 500 786 C500 990 124 1016 110 1158 C92 1364 912 1364 890 1158 C876 1016 500 1050 500 1224 C500 1460 250 1650 40 1900"
        />
        <path
          className="velora-scroll-story__signal-path"
          d="M500 0 C500 130 118 158 108 292 C94 492 906 492 892 292 C882 156 500 184 500 356 C500 560 124 584 110 725 C92 928 912 928 890 725 C876 584 500 614 500 786 C500 990 124 1016 110 1158 C92 1364 912 1364 890 1158 C876 1016 500 1050 500 1224 C500 1460 250 1650 40 1900"
        />
      </svg>

      <div className="velora-scroll-story__inner">
        {items.map((item, index) => (
          <div className="velora-scroll-story__item" key={item}>
            <span>{String(index + 1).padStart(2, '0')}</span>
            <h2>{item}</h2>
          </div>
        ))}
      </div>
    </section>
  );
}
