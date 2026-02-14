import HeroSection from "@/components/home/HeroSection";
import CollectionsSection from "@/components/home/CollectionsSection";
import BestSellers from "@/components/home/BestSellers";
import TestimonialsSection from "@/components/home/TestimonialsSection";
import TrustBadges from "@/components/home/TrustBadges";
import MetaTags from "@/components/seo/MetaTags";

const Index = () => {
  return (
    <main>
      <MetaTags
        title="KVP JEWELLERY — Luxury Gold Jewellery Store"
        description="Shop the finest handcrafted gold jewellery at KVP JEWELLERY. Discover our exclusive collections of earrings, rings, necklaces, and more."
      />
      <HeroSection />
      <CollectionsSection />
      <BestSellers />
      <TestimonialsSection />
      <TrustBadges />
    </main>
  );
};

export default Index;
