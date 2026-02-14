import { motion } from "framer-motion";
import { Shield, MessageCircle, Gem } from "lucide-react";

const badges = [
  { icon: Shield, title: "Secure Payments", desc: "100% safe UPI & COD options" },
  { icon: MessageCircle, title: "Easy WhatsApp Order", desc: "Order in minutes via chat" },
  { icon: Gem, title: "Premium Quality", desc: "Handcrafted with finest materials" },
];

const TrustBadges = () => {
  return (
    <section className="py-12 lg:py-16 bg-secondary">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {badges.map((badge, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="flex items-center gap-4 bg-card rounded-2xl p-5 shadow-soft"
            >
              <div className="w-12 h-12 rounded-full gradient-gold flex items-center justify-center flex-shrink-0">
                <badge.icon className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-heading text-sm font-semibold text-foreground">{badge.title}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{badge.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustBadges;
