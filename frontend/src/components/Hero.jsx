import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Model from './Model';

gsap.registerPlugin(ScrollTrigger);

const Hero = () => {
  const containerRef = useRef(null);
  const modelWrapperRef = useRef(null);

  useEffect(() => {
    // GSAP ScrollTrigger: 3D model gentle rotation on scroll
    if (modelWrapperRef.current) {
      gsap.to(modelWrapperRef.current, {
        rotationY: 30,
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: "bottom top",
          scrub: 1,
        }
      });
    }
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.4,
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -30 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: { duration: 0.8, ease: "easeOut" }
    }
  };

  return (
    <section 
      ref={containerRef}
      className="relative min-h-screen flex items-center justify-center pt-24 px-6 md:px-12 overflow-hidden"
    >
      <div className="container mx-auto grid grid-cols-1 lg:grid-cols-2 items-center gap-12">
        
        {/* Left Text Block */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-col items-center text-center lg:items-start lg:text-left z-10 order-2 lg:order-1"
        >
          <motion.h1 
            variants={itemVariants}
            className="serif text-5xl md:text-7xl font-bold leading-tight mb-6"
          >
            Your AI Career Agent
          </motion.h1>
          
          <motion.p 
            variants={itemVariants}
            className="text-lg md:text-xl text-muted max-w-lg mb-10 leading-relaxed"
          >
            Smart job matching, automatic applications, and personalized opportunities — all in one place.
          </motion.p>
          
          <motion.div 
            variants={itemVariants}
            className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
          >
            <motion.a 
              href="#"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              className="pill-button pill-button-primary w-full sm:w-auto"
            >
              Get Started
            </motion.a>
            <motion.a 
              href="#"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              className="pill-button pill-button-secondary w-full sm:w-auto"
            >
              Find Jobs
            </motion.a>
          </motion.div>
        </motion.div>

        {/* 3D Model Section */}
        <div 
          ref={modelWrapperRef}
          className="relative flex justify-center items-center order-1 lg:order-2 h-[400px] md:h-[600px] w-full"
        >
          <Model />
        </div>
      </div>
    </section>
  );
};

export default Hero;
