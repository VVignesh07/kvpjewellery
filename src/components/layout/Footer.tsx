import { Link } from "react-router-dom";
import { Facebook, Instagram, Twitter, Mail, MapPin, Phone, ArrowUp } from "lucide-react";

const Footer = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="relative bg-[#1a0f05] text-white pt-20 pb-10 overflow-hidden font-sans border-t border-amber-900/20">
      {/* Background Decor */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-600/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 pb-16 border-b border-white/5">

          {/* Brand Info */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-6">
            <Link to="/" className="inline-block group">
              <h3 className="text-3xl font-black tracking-tighter">
                <span className="text-amber-500 group-hover:text-amber-400 transition-colors">KVP</span>
                <span className="ml-1 text-white">JEWELLERY</span>
              </h3>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed max-w-xs md:max-w-none italic">
              "Crafting timeless elegance since generations. Every piece tells a story of heritage, artistry, and love."
            </p>
            <div className="flex items-center gap-4 pt-2">
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-amber-600 hover:text-white transition-all duration-300 border border-white/10">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-amber-600 hover:text-white transition-all duration-300 border border-white/10">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="https://wa.me/918825564893" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-amber-600 hover:text-white transition-all duration-300 border border-white/10">
                <Phone className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <h4 className="text-sm font-black uppercase tracking-[0.2em] text-amber-500 mb-8 mt-2">Quick Links</h4>
            <ul className="flex flex-col gap-y-4 w-full">
              {[
                { to: "/shop", label: "Collections" },
                { to: "/about", label: "Our Story" },
                { to: "/contact", label: "Contact Us" }
              ].map((link) => (
                <li key={link.label}>
                  <Link to={link.to} className="text-gray-400 hover:text-white text-sm transition-colors flex items-center gap-2 group justify-center md:justify-start">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500/0 group-hover:bg-amber-500 transition-all duration-300 transform scale-0 group-hover:scale-100" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Details */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <h4 className="text-sm font-black uppercase tracking-[0.2em] text-amber-500 mb-8 mt-2">Find Us</h4>
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row items-center gap-3 text-gray-400 group">
                <MapPin className="w-5 h-5 text-amber-500 shrink-0" />
                <span className="text-sm leading-relaxed max-w-[200px]">Kovilpatti, Tamil Nadu, India</span>
              </div>
              <div className="flex flex-col md:flex-row items-center gap-3 text-gray-400 group">
                <Mail className="w-5 h-5 text-amber-500 shrink-0" />
                <span className="text-sm">thekvpstore@gmail.com</span>
              </div>
              <div className="flex flex-col md:flex-row items-center gap-3 text-gray-400 group">
                <Phone className="w-5 h-5 text-amber-500 shrink-0" />
                <span className="text-sm">+91 88255 64893</span>
              </div>
            </div>
          </div>

          {/* Newsletter */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <h4 className="text-sm font-black uppercase tracking-[0.2em] text-amber-500 mb-8 mt-2">Newsletter</h4>
            <p className="text-gray-400 text-sm mb-6 max-w-xs md:max-w-none italic">
              Subscribe to get exclusive offers and new collection updates.
            </p>
            <div className="relative w-full max-w-[280px] group">
              <input
                type="email"
                placeholder="Your email address"
                className="w-full bg-transparent border-b border-white/20 py-3 focus:outline-none focus:border-amber-500 transition-colors text-sm placeholder:text-gray-600"
              />
              <button className="absolute right-0 top-1/2 -translate-y-1/2 text-amber-500 hover:text-amber-400 transition-colors">
                <Mail className="w-5 h-5" />
              </button>
            </div>
          </div>

        </div>

        {/* Bottom Area */}
        <div className="pt-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <p className="text-[10px] uppercase font-bold tracking-[0.3em] text-gray-600">
            © {new Date().getFullYear()} KVP JEWELLERY. All Rights Reserved.
          </p>

          <button
            onClick={scrollToTop}
            className="flex items-center gap-2 group text-amber-500/50 hover:text-amber-500 transition-all duration-300"
          >
            <span className="text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Back to top</span>
            <div className="w-10 h-10 rounded-full border border-white/5 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-white transition-all cursor-pointer">
              <ArrowUp className="w-4 h-4" />
            </div>
          </button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
