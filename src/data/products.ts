import productEarrings from "@/assets/product-earrings.jpg";
import productRing from "@/assets/product-ring.jpg";
import productNecklace from "@/assets/product-necklace.jpg";
import productBangles from "@/assets/product-bangles.jpg";

export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  original_price?: number;
  description: string;
  category: string;
  image: string;
  images: string[];
  inStock: boolean;
  isNew?: boolean;
  isBestSeller?: boolean;
  stock_quantity?: number;
  image_url?: string;
  avg_rating?: number;
  review_count?: number;
}

export const products: Product[] = [
  {
    id: "1",
    name: "Royal Diamond Drop Earrings",
    price: 12999,
    originalPrice: 15999,
    description: "Handcrafted 22K gold earrings adorned with sparkling diamonds. A timeless piece that radiates elegance for every occasion.",
    category: "earrings",
    image: productEarrings,
    images: [productEarrings],
    inStock: true,
    isBestSeller: true,
  },
  {
    id: "2",
    name: "Celestial Solitaire Ring",
    price: 18999,
    originalPrice: 22999,
    description: "A stunning solitaire diamond set in pure 22K gold. The perfect symbol of everlasting love and commitment.",
    category: "rings",
    image: productRing,
    images: [productRing],
    inStock: true,
    isNew: true,
  },
  {
    id: "3",
    name: "Heritage Gold Pendant",
    price: 8999,
    description: "An exquisite gold pendant featuring intricate traditional craftsmanship. Lightweight and perfect for daily wear.",
    category: "necklaces",
    image: productNecklace,
    images: [productNecklace],
    inStock: true,
    isBestSeller: true,
  },
  {
    id: "4",
    name: "Empress Gold Bangles Set",
    price: 24999,
    originalPrice: 29999,
    description: "A luxurious set of diamond-studded gold bangles. Each piece is a masterwork of traditional Indian artistry.",
    category: "bangles",
    image: productBangles,
    images: [productBangles],
    inStock: true,
    isNew: true,
  },
  {
    id: "5",
    name: "Pearl Cascade Earrings",
    price: 7499,
    description: "Delicate gold earrings with cascading pearl accents. Perfect for weddings and festive occasions.",
    category: "earrings",
    image: productEarrings,
    images: [productEarrings],
    inStock: true,
  },
  {
    id: "6",
    name: "Eternal Band Ring",
    price: 9999,
    description: "A classic gold band adorned with a row of sparkling stones. Elegant simplicity at its finest.",
    category: "rings",
    image: productRing,
    images: [productRing],
    inStock: false,
  },
  {
    id: "7",
    name: "Golden Leaf Necklace",
    price: 15999,
    originalPrice: 18999,
    description: "A nature-inspired gold necklace with delicate leaf motifs. A statement piece for the modern woman.",
    category: "necklaces",
    image: productNecklace,
    images: [productNecklace],
    inStock: true,
    isBestSeller: true,
  },
  {
    id: "8",
    name: "Classic Gold Bangle",
    price: 11999,
    description: "A timeless single gold bangle with subtle diamond detailing. Perfect for stacking or wearing alone.",
    category: "bangles",
    image: productBangles,
    images: [productBangles],
    inStock: true,
  },
];

export const categories = [
  { id: "earrings", label: "Earrings" },
  { id: "rings", label: "Rings" },
  { id: "necklaces", label: "Necklaces" },
  { id: "bangles", label: "Bangles" },
] as const;
