import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

interface Testimonial {
  id: string;
  name: string;
  role: string;
  content: string;
  rating: number;
}

const TestimonialsSection = () => {
  const [reviews, setReviews] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    const checkSettingsAndFetch = async () => {
      try {
        // 1. Check Global Settings first
        const { data: settings } = await supabase
          .from('app_settings')
          .select('*')
          .eq('key', 'testimonials_enabled')
          .single();

        // If explicitly disabled, stop. Default to true if setting missing.
        if (settings && settings.value === false) {
          setEnabled(false);
          setLoading(false);
          return;
        }

        // 2. Fetch Reviews if enabled
        const { data, error } = await supabase
          .from('testimonials')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(3);

        if (error) throw error;
        if (data) setReviews(data);
      } catch (error) {
        console.error("Error loading testimonials data:", error);
      } finally {
        setLoading(false);
      }
    };

    checkSettingsAndFetch();
  }, []);

  if (loading) return null;
  if (!enabled) return null;
  if (reviews.length === 0) return null;

  return (
    <section className="py-16 lg:py-24 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <p className="text-primary text-xs tracking-[0.3em] uppercase mb-2 font-body">Trusted By Many</p>
          <h2 className="font-heading text-3xl lg:text-4xl font-bold text-foreground">What Our Customers Say</h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {reviews.map((review, i) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="bg-card rounded-2xl p-8 shadow-soft border border-border flex flex-col h-full relative"
            >
              <Quote className="absolute top-6 right-6 w-8 h-8 text-primary/10" />

              <div className="flex gap-1 mb-6">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Star
                    key={j}
                    className={`w-4 h-4 ${j < review.rating ? "fill-amber-400 text-amber-400" : "text-gray-200"}`}
                  />
                ))}
              </div>

              <p className="text-muted-foreground leading-relaxed mb-6 flex-grow italic">
                "{review.content}"
              </p>

              <div className="mt-auto flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                  {review.name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-heading text-sm font-semibold text-foreground">{review.name}</h4>
                  {review.role && <p className="text-xs text-muted-foreground">{review.role}</p>}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
