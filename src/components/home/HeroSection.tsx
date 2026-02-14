import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import heroImage from "@/assets/hero-jewellery.jpg";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface HeroSlide {
  id: string;
  image_url: string;
  title: string | null;
  subtitle: string | null;
  button_text: string | null;
  button_link: string | null;
}

const HeroSection = () => {
  const DEFAULT_SLIDES: HeroSlide[] = [
    {
      id: "default-1",
      image_url: "https://images.unsplash.com/photo-1596450514735-3004bbbb5512?q=80&w=1920&auto=format&fit=crop",
      title: "The Bridal Edit",
      subtitle: "Experience the grandeur of 22k gold bridal sets designed for your special day.",
      button_text: "EXPLORE BRIDAL",
      button_link: "/shop?category=Necklace"
    },
    {
      id: "default-2",
      image_url: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?q=80&w=1920&auto=format&fit=crop",
      title: "Diamond Elegance",
      subtitle: "Modern solitaires and diamond necklaces that define sophistication.",
      button_text: "SHOP DIAMONDS",
      button_link: "/shop?category=Ring"
    },
    {
      id: "default-3",
      image_url: heroImage,
      title: "Elegance That Shines",
      subtitle: "Discover handcrafted gold jewellery that celebrates tradition and artistry.",
      button_text: "SHOP NOW",
      button_link: "/shop"
    }
  ];

  const [slides, setSlides] = useState<HeroSlide[]>(DEFAULT_SLIDES);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [direction, setDirection] = useState(0);

  useEffect(() => {
    fetchSlides();
  }, []);

  const fetchSlides = async () => {
    try {
      const { data, error } = await supabase
        .from("hero_slides")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        setSlides(data);
      }
    } catch (error: any) {
      if (error?.code === 'PGRST205') {
        console.warn('Hero slides table not found. Using premium fallbacks.');
      } else {
        console.error("Error fetching hero slides:", error);
      }
      // Keep using DEFAULT_SLIDES (already set in state)
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (slides.length <= 1) return;

    const interval = setInterval(() => {
      paginate(1);
    }, 5000);

    return () => clearInterval(interval);
  }, [slides, currentIndex]);

  const paginate = (newDirection: number) => {
    setDirection(newDirection);
    setCurrentIndex((prevIndex) => (prevIndex + newDirection + slides.length) % slides.length);
  };

  if (loading) {
    return <section className="min-h-[80dvh] lg:min-h-[85vh] bg-foreground/5 animate-pulse" />;
  }

  const currentSlide = slides[currentIndex];

  if (!currentSlide) {
    return <section className="min-h-[80dvh] lg:min-h-[85vh] bg-foreground" />;
  }

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0
    })
  };

  return (
    <section className="relative min-h-[80dvh] lg:min-h-[85vh] flex items-center overflow-hidden bg-foreground">
      <AnimatePresence initial={false} custom={direction}>
        <motion.div
          key={currentIndex}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: "spring", stiffness: 300, damping: 30 },
            opacity: { duration: 0.6 }
          }}
          className="absolute inset-0 w-full h-full"
        >
          {/* Background image */}
          <div className="absolute inset-0 bg-neutral-900">
            <img
              src={currentSlide.image_url}
              alt={currentSlide.title || "Luxury gold jewellery"}
              className="w-full h-full object-cover object-[center_20%] lg:object-center transition-opacity duration-500"
              loading="eager"
              // @ts-ignore
              fetchpriority={currentIndex === 0 ? "high" : "auto"}
              decoding="async"
            />
            <div className="absolute inset-0 bg-gradient-to-b lg:bg-gradient-to-r from-foreground/90 via-foreground/60 to-foreground/20 lg:to-transparent" />
          </div>

          <div className="relative h-full container mx-auto px-4 flex items-center">
            <div className="max-w-xl text-center lg:text-left mx-auto lg:mx-0 py-12 lg:py-32">
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-primary font-body text-xs sm:text-sm tracking-[0.3em] uppercase mb-4"
              >
                KVP JEWELLERY
              </motion.p>
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="font-heading text-4xl sm:text-5xl lg:text-7xl font-bold text-primary-foreground leading-[1.2] lg:leading-[1.1] mb-6"
              >
                {currentSlide.title}
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="text-primary-foreground/90 text-sm sm:text-base lg:text-lg mb-8 leading-relaxed max-w-md mx-auto lg:mx-0"
              >
                {currentSlide.subtitle}
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.8 }}
                className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4"
              >
                <Link
                  to={currentSlide.button_link || "/shop"}
                  className="w-full sm:w-auto inline-flex items-center justify-center px-10 py-4 rounded-full gradient-gold text-primary-foreground font-bold text-sm tracking-widest shadow-gold hover:shadow-elevated transition-all duration-300 hover:scale-105"
                >
                  {currentSlide.button_text || "SHOP NOW"}
                </Link>
                <a
                  href="https://wa.me/918825564893?text=Hi%20KVP%20Fancy%20Jewellery%2C%20I'd%20like%20to%20explore%20your%20collection."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center px-10 py-4 rounded-full border border-primary-foreground/30 text-primary-foreground font-semibold text-sm tracking-widest hover:bg-primary-foreground/10 transition-all duration-300"
                >
                  WHATSAPP
                </a>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Controls */}
      {slides.length > 1 && (
        <>
          <button
            onClick={() => paginate(-1)}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-black/20 text-white/50 hover:bg-primary hover:text-white transition-all backdrop-blur-sm group hidden md:block"
          >
            <ChevronLeft className="w-6 h-6 group-hover:scale-110 transition-transform" />
          </button>
          <button
            onClick={() => paginate(1)}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-black/20 text-white/50 hover:bg-primary hover:text-white transition-all backdrop-blur-sm group hidden md:block"
          >
            <ChevronRight className="w-6 h-6 group-hover:scale-110 transition-transform" />
          </button>

          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex gap-3">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setDirection(idx > currentIndex ? 1 : -1);
                  setCurrentIndex(idx);
                }}
                className={`h-1.5 rounded-full transition-all duration-300 ${currentIndex === idx ? "bg-primary w-10" : "bg-white/30 w-4 hover:bg-white/50"}`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
};

export default HeroSection;
