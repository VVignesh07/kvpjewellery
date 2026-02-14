import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CloudinaryImage } from "@/components/ui/CloudinaryImage";
import { supabase } from "@/lib/supabaseClient";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
  image_url: string;
}

const CollectionsSection = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "center",
    containScroll: "trimSnaps",
    dragFree: true,
    loop: false
  });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi, setSelectedIndex]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    setScrollSnaps(emblaApi.scrollSnapList());
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
  }, [emblaApi, setScrollSnaps, onSelect]);

  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      if (data) setCategories(data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="py-16 lg:py-24 bg-background">
        <div className="container mx-auto px-4 text-center">
          <div className="flex justify-center gap-4 lg:gap-6 overflow-hidden">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="w-[120px] sm:w-[150px] lg:w-[180px] aspect-square rounded-full bg-gray-200 animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (categories.length === 0) return null;

  const showCarousel = categories.length > 3;

  return (
    <section className="py-16 lg:py-24 bg-background overflow-hidden">
      <div className="container mx-auto px-4 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10 lg:mb-16"
        >
          <p className="text-primary text-[10px] sm:text-xs tracking-[0.3em] uppercase mb-2 font-body font-semibold">Curated For You</p>
          <h2 className="font-heading text-3xl lg:text-5xl font-bold text-foreground">Our Collections</h2>
        </motion.div>

        {showCarousel ? (
          <div className="relative group/carousel">
            <div className="overflow-hidden cursor-grab active:cursor-grabbing" ref={emblaRef}>
              <div className="flex gap-4 xs:gap-6 sm:gap-8 lg:gap-12 py-4 px-2 sm:px-6">
                {categories.map((col, i) => (
                  <motion.div
                    key={col.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="flex-[0_0_auto] flex flex-col items-center group w-[90px] xs:w-[110px] sm:w-[150px] lg:w-[180px]"
                  >
                    <Link
                      to={`/shop?category=${col.name}`}
                      className="relative block w-full aspect-square rounded-full overflow-hidden shadow-soft hover:shadow-elevated transition-all duration-500 hover:-translate-y-2 ring-2 ring-transparent group-hover:ring-primary/30"
                    >
                      {col.image_url ? (
                        <CloudinaryImage
                          src={col.image_url}
                          alt={col.name}
                          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                          width={400}
                          height={400}
                        />
                      ) : (
                        <div className="h-full w-full bg-secondary flex items-center justify-center text-muted-foreground font-medium uppercase text-[10px]">
                          {col.name.substring(0, 2)}
                        </div>
                      )}
                      <div className="absolute inset-0 bg-primary/5 group-hover:bg-transparent transition-colors duration-500" />
                    </Link>
                    <div className="mt-3 sm:mt-4 text-center">
                      <h3 className="font-heading text-xs sm:text-base lg:text-lg font-bold text-foreground group-hover:text-primary transition-colors tracking-wide truncate w-full px-1">{col.name}</h3>
                      <p className="text-[8px] sm:text-[10px] text-muted-foreground uppercase tracking-[0.2em] mt-1 font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300">Explore</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Navigation Buttons */}
            <button
              className="absolute left-0 top-1/2 -translate-y-1/2 -left-2 lg:-left-6 p-2 rounded-full bg-background/80 backdrop-blur shadow-md hover:bg-primary hover:text-white transition-all opacity-0 group-hover/carousel:opacity-100 hidden sm:flex z-10"
              onClick={scrollPrev}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              className="absolute right-0 top-1/2 -translate-y-1/2 -right-2 lg:-right-6 p-2 rounded-full bg-background/80 backdrop-blur shadow-md hover:bg-primary hover:text-white transition-all opacity-0 group-hover/carousel:opacity-100 hidden sm:flex z-10"
              onClick={scrollNext}
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {/* Pagination Dots */}
            <div className="flex justify-center gap-2 mt-6">
              {scrollSnaps.map((_, index) => (
                <button
                  key={index}
                  className={`h-1.5 transition-all duration-300 rounded-full ${index === selectedIndex ? "w-6 bg-primary" : "w-1.5 bg-primary/20"
                    }`}
                  onClick={() => emblaApi && emblaApi.scrollTo(index)}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap justify-center gap-6 sm:gap-8 lg:gap-12">
            {categories.map((col, i) => (
              <motion.div
                key={col.id}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex flex-col items-center group w-[100px] xs:w-[120px] sm:w-[150px] lg:w-[180px]"
              >
                <Link
                  to={`/shop?category=${col.name}`}
                  className="relative block w-full aspect-square rounded-full overflow-hidden shadow-soft hover:shadow-elevated transition-all duration-500 hover:-translate-y-2 ring-2 ring-transparent group-hover:ring-primary/30"
                >
                  {col.image_url ? (
                    <CloudinaryImage
                      src={col.image_url}
                      alt={col.name}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                      width={400}
                      height={400}
                    />
                  ) : (
                    <div className="h-full w-full bg-secondary flex items-center justify-center text-muted-foreground font-medium uppercase text-[10px]">
                      {col.name.substring(0, 2)}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-primary/5 group-hover:bg-transparent transition-colors duration-500" />
                </Link>
                <div className="mt-4 text-center">
                  <h3 className="font-heading text-sm sm:text-base lg:text-lg font-bold text-foreground group-hover:text-primary transition-colors tracking-wide">{col.name}</h3>
                  <p className="text-[9px] sm:text-[10px] text-muted-foreground uppercase tracking-[0.2em] mt-1 font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300">Explore</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default CollectionsSection;
