import { motion } from "framer-motion";
import { Users, Target, ShieldCheck, Gem, Sparkles, Heart, Zap } from "lucide-react";

const About = () => {
    return (
        <div className="pt-20 pb-16">
            {/* Hero Section */}
            <section className="relative h-[45vh] flex items-center justify-center overflow-hidden bg-[#2D1B10]">
                <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                {/* Decorative Accents */}
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="relative text-center text-white px-4"
                >
                    <h1 className="font-heading text-4xl md:text-6xl font-bold mb-6 tracking-tight">
                        About KVP JEWELLERY
                    </h1>
                    <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto font-light leading-relaxed">
                        Celebrating elegance, confidence, and individuality since March 2022.
                    </p>
                </motion.div>
            </section>

            {/* Vision & Origin */}
            <section className="py-20 bg-background">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                            className="text-center mb-16"
                        >
                            <h2 className="font-heading text-3xl md:text-4xl font-bold mb-6 text-foreground text-center">
                                Our Vision
                            </h2>
                            <p className="text-lg text-muted-foreground leading-relaxed">
                                Founded in March 2022, KVP JEWELLERY was born from a simple yet powerful vision — to create a brand that celebrates elegance, confidence, and individuality.
                            </p>
                        </motion.div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                            <motion.div
                                initial={{ opacity: 0, x: -50 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6 }}
                                className="space-y-6"
                            >
                                <div className="bg-primary/5 p-6 rounded-2xl border border-primary/10">
                                    <p className="text-muted-foreground italic">
                                        "What started as a deep love for jewellery slowly transformed into a meaningful entrepreneurial journey driven by passion, courage, and consistency."
                                    </p>
                                </div>
                                <p className="text-muted-foreground leading-relaxed">
                                    From a young age, jewellery was never just an accessory — it was a statement. Earrings, bracelets, chains, and hair accessories represented personality, grace, and self-expression. That belief became the foundation of KVP JEWELLERY.
                                </p>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, x: 50 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6 }}
                                className="relative aspect-square rounded-3xl overflow-hidden shadow-2xl bg-muted"
                            >
                                <img
                                    src="https://images.unsplash.com/photo-1573408301185-9146fe634ad0?auto=format&fit=crop&q=80&w=800"
                                    alt="Jewellery Craftmanship"
                                    className="w-full h-full object-cover transition-transform duration-700 hover:scale-110"
                                    loading="lazy"
                                />
                                <div className="absolute inset-0 bg-primary/5 mix-blend-multiply" />
                            </motion.div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Our Story */}
            <section className="py-20 bg-muted/30">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto bg-background p-8 md:p-16 rounded-[3rem] shadow-sm border border-border">
                        <h2 className="font-heading text-3xl md:text-4xl font-bold mb-8 text-center">Our Story</h2>
                        <div className="space-y-6 text-muted-foreground leading-relaxed">
                            <p className="font-semibold text-foreground italic text-center text-xl mb-10">
                                The beginning wasn’t easy.
                            </p>
                            <p>
                                There were no customers, no marketing knowledge, and limited business experience. But what existed was belief — belief in quality, belief in honesty, and belief that consistency would build trust over time.
                            </p>
                            <p>
                                With every small order fulfilled and every returning customer, KVP JEWELLERY began to grow — not just as a business, but as a brand built on dedication and learning.
                            </p>
                            <div className="pt-8">
                                <h3 className="text-foreground font-bold text-xl mb-6">Step by step, we understood:</h3>
                                <ul className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {[
                                        "What customers truly value",
                                        "What trends inspire confidence",
                                        "What everyday jewellery should feel like"
                                    ].map((item, idx) => (
                                        <li key={idx} className="bg-muted p-6 rounded-2xl flex flex-col items-center text-center gap-4 border border-border/50">
                                            <Sparkles className="w-6 h-6 text-primary" />
                                            <span className="text-sm font-medium">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <p className="text-center pt-8 text-lg font-medium text-foreground">
                                Every piece we curate reflects that journey.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Mission */}
            <section className="py-20 bg-background text-foreground">
                <div className="container mx-auto px-4 text-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="max-w-3xl mx-auto"
                    >
                        <h2 className="font-heading text-3xl md:text-4xl font-bold mb-8 uppercase tracking-widest">Our Mission</h2>
                        <p className="text-2xl md:text-3xl font-light mb-12 text-muted-foreground leading-snug">
                            To offer <span className="text-foreground font-semibold">trendy, elegant, and durable</span> jewellery at affordable prices — without ever compromising on quality.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 pt-8">
                            {[
                                { label: "Beauty", icon: <Sparkles className="w-5 h-5 mb-2" />, text: "Should be accessible" },
                                { label: "Style", icon: <Heart className="w-5 h-5 mb-2" />, text: "Should feel effortless" },
                                { label: "Quality", icon: <ShieldCheck className="w-5 h-5 mb-2" />, text: "Should last" }
                            ].map((m, i) => (
                                <div key={i} className="flex flex-col items-center group">
                                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4 transition-transform group-hover:scale-110">
                                        {m.icon}
                                    </div>
                                    <h4 className="font-bold text-lg">{m.label}</h4>
                                    <p className="text-muted-foreground">{m.text}</p>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Different */}
            <section className="py-20 bg-foreground text-primary-foreground">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                        <div>
                            <h2 className="font-heading text-3xl md:text-4xl font-bold mb-8">What Makes Us Different</h2>
                            <p className="opacity-80 mb-12 text-lg">
                                At KVP JEWELLERY, we don’t just sell accessories — we carefully select and curate each piece to ensure it delivers:
                            </p>
                            <div className="grid grid-cols-2 gap-6">
                                {[
                                    { title: "Timeless style", icon: <Gem className="w-5 h-5" /> },
                                    { title: "Comfortable wear", icon: <Heart className="w-5 h-5" /> },
                                    { title: "Long-lasting durability", icon: <ShieldCheck className="w-5 h-5" /> },
                                    { title: "Exceptional value", icon: <Zap className="w-5 h-5" /> }
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center gap-3 p-4 bg-primary-foreground/5 rounded-xl border border-primary-foreground/10">
                                        {item.icon}
                                        <span className="font-medium text-sm">{item.title}</span>
                                    </div>
                                ))}
                            </div>
                            <p className="mt-12 text-xl font-heading italic opacity-90">
                                Looking beautiful should never feel expensive.
                            </p>
                        </div>

                        <motion.div
                            initial={{ opacity: 0, x: 50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="text-center"
                        >
                            <div className="p-12 border-2 border-primary/30 rounded-[3rem] relative">
                                <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-foreground px-6 py-2 text-primary font-bold tracking-widest text-sm border-2 border-primary/30 rounded-full">
                                    VISION
                                </div>
                                <p className="text-2xl font-light italic leading-relaxed">
                                    "Today, KVP JEWELLERY is more than a small business — it’s a growing dream."
                                </p>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default About;
