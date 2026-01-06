import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './ScrollCarousel.css';

interface ScrollCarouselProps {
  images: Array<{ id: string; url: string; caption?: string }>;
  onComplete?: () => void;
}

export const ScrollCarousel: React.FC<ScrollCarouselProps> = ({ images, onComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isTransitioning = useRef(false);
  const wheelTimeoutRef = useRef<number | null>(null);
  const autoRotateIntervalRef = useRef<number | null>(null);
  const lastUserInteractionRef = useRef<number>(Date.now());
  const userScrollingRef = useRef(false);

  useEffect(() => {
    if (images.length === 0) {
      if (onComplete) onComplete();
      return;
    }

    // Use Intersection Observer to detect when carousel is in view
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsActive(entry.isIntersecting && entry.intersectionRatio > 0.5);
        });
      },
      { threshold: 0.5 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    // Auto-rotate images every 1 second if user is not scrolling
    const startAutoRotate = () => {
      // Clear any existing interval
      if (autoRotateIntervalRef.current) {
        clearInterval(autoRotateIntervalRef.current);
        autoRotateIntervalRef.current = null;
      }

      // Only start if carousel is active and has images
      if (!isActive || images.length <= 1) {
        return;
      }

      autoRotateIntervalRef.current = window.setInterval(() => {
        // Only auto-rotate if:
        // 1. Carousel is active (in view)
        // 2. User hasn't scrolled recently (within last 2 seconds)
        // 3. Not currently transitioning
        const timeSinceLastInteraction = Date.now() - lastUserInteractionRef.current;
        const shouldAutoRotate = 
          isActive && 
          !userScrollingRef.current && 
          !isTransitioning.current &&
          timeSinceLastInteraction > 2000; // 2 seconds after last user interaction

        if (shouldAutoRotate && images.length > 1) {
          isTransitioning.current = true;
          setCurrentIndex((prev) => {
            // If on last image, loop back to first
            if (prev >= images.length - 1) {
              setTimeout(() => {
                isTransitioning.current = false;
              }, 600);
              return 0;
            }
            setTimeout(() => {
              isTransitioning.current = false;
            }, 600);
            return prev + 1;
          });
        }
      }, 1000); // Rotate every 1 second
    };

    // Start auto-rotation when active state changes
    if (isActive) {
      startAutoRotate();
    } else {
      // Stop auto-rotation when not active
      if (autoRotateIntervalRef.current) {
        clearInterval(autoRotateIntervalRef.current);
        autoRotateIntervalRef.current = null;
      }
    }

    // Handle wheel events for smooth image transitions
    const handleWheel = (e: WheelEvent) => {
      if (!isActive || isTransitioning.current) return;

      // Only handle if we're in the carousel section
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const isInView = rect.top < window.innerHeight && rect.bottom > 0;

      if (!isInView) return;

      // Prevent default scroll while transitioning
      if (isTransitioning.current) {
        e.preventDefault();
        return;
      }

      // Mark user interaction and pause auto-rotation
      lastUserInteractionRef.current = Date.now();
      userScrollingRef.current = true;

      // Resume auto-rotation after 2 seconds of no scrolling
      if (wheelTimeoutRef.current) {
        window.clearTimeout(wheelTimeoutRef.current);
      }
      
      wheelTimeoutRef.current = window.setTimeout(() => {
        userScrollingRef.current = false;
      }, 2000); // Resume auto-rotation 2 seconds after user stops scrolling

      // Handle scroll down - next image
      if (e.deltaY > 0) {
        // If not on last image, prevent scroll and advance carousel
        if (currentIndex < images.length - 1) {
          e.preventDefault();
          e.stopPropagation();
          isTransitioning.current = true;
          
          setCurrentIndex((prev) => {
            const next = prev + 1;
            // If we've reached the last image, allow normal scrolling after transition
            if (next >= images.length - 1) {
              setTimeout(() => {
                if (onComplete) onComplete();
                isTransitioning.current = false;
              }, 600);
            }
            return next;
          });

          // Reset transition lock after animation (only if not on last image)
          if (currentIndex < images.length - 2) {
            wheelTimeoutRef.current = window.setTimeout(() => {
              isTransitioning.current = false;
            }, 600);
          }
        }
        // If on last image, allow normal scrolling (don't prevent default)
      }
      // Handle scroll up - previous image
      else if (e.deltaY < 0 && currentIndex > 0) {
        e.preventDefault();
        isTransitioning.current = true;
        
        setCurrentIndex((prev) => prev - 1);

        // Reset transition lock after animation
        wheelTimeoutRef.current = window.setTimeout(() => {
          isTransitioning.current = false;
        }, 600);
      }
    };

    // Use passive: false to allow preventDefault
    window.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      observer.disconnect();
      window.removeEventListener('wheel', handleWheel);
      if (wheelTimeoutRef.current) {
        window.clearTimeout(wheelTimeoutRef.current);
      }
      if (autoRotateIntervalRef.current) {
        clearInterval(autoRotateIntervalRef.current);
      }
    };
  }, [currentIndex, images.length, isActive, onComplete]);

  if (images.length === 0) {
    return null;
  }

  const currentImage = images[currentIndex];

  return (
    <div 
      ref={containerRef} 
      className={`scroll-carousel-container ${currentIndex > 0 ? 'not-first' : ''}`}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
          className="scroll-carousel-image-wrapper"
        >
          <img
            src={currentImage.url}
            alt={currentImage.caption || `Gallery image ${currentIndex + 1}`}
            className="scroll-carousel-image"
          />
          {currentImage.caption && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="scroll-carousel-caption"
            >
              {currentImage.caption}
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
      
      {/* Progress indicator */}
      <div className="scroll-carousel-progress">
        {images.map((_, index) => (
          <div
            key={index}
            className={`progress-dot ${index === currentIndex ? 'active' : ''}`}
          />
        ))}
      </div>
    </div>
  );
};

