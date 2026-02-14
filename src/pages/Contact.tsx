import { motion } from "framer-motion";
import { Mail, Phone, MapPin, Clock, MessageSquare, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const Contact = () => {
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        toast.success("Message sent! We will get back to you soon.");
    };

    return (
        <div className="pt-20 pb-16 min-h-screen bg-background">
            {/* Hero Section */}
            <section className="relative h-[45vh] flex items-center justify-center overflow-hidden bg-[#2D1B10]">
                <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>

                {/* Decorative Accents */}
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="relative text-center text-white px-4"
                >
                    <motion.div
                        initial={{ scale: 0.9 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 1.2, ease: "easeOut" }}
                        className="inline-block mb-4 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/5 backdrop-blur-sm"
                    >
                        <span className="text-[10px] sm:text-xs font-bold tracking-[0.3em] uppercase text-primary">Get in touch</span>
                    </motion.div>
                    <h1 className="font-heading text-4xl md:text-7xl font-bold mb-6 tracking-tight">
                        Contact Us
                    </h1>
                    <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto font-light leading-relaxed">
                        Exquisite craftsmanship meets personalized service. Reach out to KVP JEWELLERY for all your bespoke needs.
                    </p>
                </motion.div>
            </section>

            <section className="py-24 relative overflow-hidden">
                {/* Abstract subtle background decorations */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/2"></div>

                <div className="container mx-auto px-4 relative z-10">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-start">
                        {/* Contact Information */}
                        <div className="space-y-12">
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.8 }}
                                className="space-y-6"
                            >
                                <h2 className="text-4xl font-heading font-bold text-foreground tracking-tight">Speak with Our Experts</h2>
                                <p className="text-muted-foreground text-lg leading-relaxed max-w-lg">
                                    Our dedicated concierge team is available to assist you with inquiries regarding our collections, orders, or private consultations.
                                </p>
                            </motion.div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {[
                                    { icon: <Phone className="w-5 h-5" />, title: "Phone & WhatsApp", detail: "+91 88255 64893", desc: "Available 10AM - 8PM" },
                                    { icon: <Mail className="w-5 h-5" />, title: "Email Inquiry", detail: "thekvpstore@gmail.com", desc: "Official store support" },
                                    { icon: <MapPin className="w-5 h-5" />, title: "Boutique Location", detail: "Kovilpatti, Tamil Nadu", desc: "Our flagship destination" },
                                    { icon: <Clock className="w-5 h-5" />, title: "Business Hours", detail: "Mon - Sat: 10AM - 8PM", desc: "Closed on Sundays" }
                                ].map((item, idx) => (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 0.5, delay: idx * 0.1 }}
                                        className="group p-8 bg-card/40 backdrop-blur-md rounded-[2rem] border border-border/50 hover:border-primary/40 hover:shadow-elevated transition-all duration-500"
                                    >
                                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-500">
                                            {item.icon}
                                        </div>
                                        <h4 className="font-bold text-lg mb-2 text-foreground">{item.title}</h4>
                                        <p className="text-foreground font-medium mb-1">{item.detail}</p>
                                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                                    </motion.div>
                                ))}
                            </div>
                        </div>

                        {/* Contact Form */}
                        <motion.div
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8 }}
                            className="relative group lg:mt-0"
                        >
                            {/* Decorative shadow glow */}
                            <div className="absolute inset-0 bg-primary/5 rounded-[3rem] blur-3xl group-hover:bg-primary/10 transition-colors duration-700"></div>

                            <div className="relative bg-background/80 backdrop-blur-xl p-8 md:p-14 rounded-[3rem] shadow-2xl border border-border/50">
                                <div className="text-center mb-12">
                                    <h3 className="text-3xl font-heading font-bold mb-3">Send a Message</h3>
                                    <p className="text-muted-foreground font-light">Allow us to assist you with your specific requirements.</p>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-2.5">
                                            <Label htmlFor="name" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Full Name</Label>
                                            <Input id="name" placeholder="John Doe" required className="h-14 rounded-2xl bg-muted/30 border-none focus:ring-2 focus:ring-primary/20 transition-all px-6" />
                                        </div>
                                        <div className="space-y-2.5">
                                            <Label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Email Address</Label>
                                            <Input id="email" type="email" placeholder="john@example.com" required className="h-14 rounded-2xl bg-muted/30 border-none focus:ring-2 focus:ring-primary/20 transition-all px-6" />
                                        </div>
                                    </div>
                                    <div className="space-y-2.5">
                                        <Label htmlFor="subject" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Subject</Label>
                                        <Input id="subject" placeholder="Private Consultation" required className="h-14 rounded-2xl bg-muted/30 border-none focus:ring-2 focus:ring-primary/20 transition-all px-6" />
                                    </div>
                                    <div className="space-y-2.5">
                                        <Label htmlFor="message" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Message</Label>
                                        <Textarea id="message" placeholder="How can our artisans assist you?" className="min-h-[160px] rounded-2xl bg-muted/30 border-none focus:ring-2 focus:ring-primary/20 transition-all px-6 py-4 resize-none" required />
                                    </div>
                                    <Button type="submit" className="w-full h-16 text-sm font-bold tracking-[0.2em] rounded-2xl gradient-gold text-primary-foreground shadow-gold hover:shadow-elevated group transition-all duration-500">
                                        <span>ESTABLISH CONTACT</span>
                                        <Send className="w-4 h-4 ml-3 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                    </Button>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Contact;
