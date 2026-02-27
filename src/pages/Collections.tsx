import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";

// Import product images
import product1 from "@/assets/products/product-1.jpg";
import product2 from "@/assets/products/product-2.jpg";
import product3 from "@/assets/products/product-3.jpg";
import product4 from "@/assets/products/product-4.jpg";
import product5 from "@/assets/products/product-5.jpg";
import product6 from "@/assets/products/product-6.jpg";

interface Collection {
  id: string;
  name: string;
  description: string;
  image: string;
  itemCount: number;
  tag?: string;
}

const collections: Collection[] = [
  {
    id: "spring-essentials",
    name: "Spring Essentials",
    description: "Fresh styles for the new season",
    image: product1,
    itemCount: 48,
    tag: "New",
  },
  {
    id: "premium-basics",
    name: "Premium Basics",
    description: "Timeless pieces that never go out of style",
    image: product2,
    itemCount: 64,
  },
  {
    id: "athletic-wear",
    name: "Athletic Wear",
    description: "Performance meets style",
    image: product3,
    itemCount: 35,
  },
  {
    id: "winter-collection",
    name: "Winter Warmers",
    description: "Cozy & stylish cold-weather essentials",
    image: product4,
    itemCount: 52,
  },
  {
    id: "formal-wear",
    name: "Formal Collection",
    description: "Elegant pieces for special occasions",
    image: product5,
    itemCount: 41,
  },
  {
    id: "streetwear",
    name: "Urban Streetwear",
    description: "Contemporary street fashion",
    image: product6,
    itemCount: 56,
    tag: "Trending",
  },
];

export default function Collections() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="section-container py-8 lg:py-12">
        {/* Header */}
        <div className="text-center mb-12 max-w-3xl mx-auto">
          <h1 className="text-3xl lg:text-5xl font-bold mb-4">Our Collections</h1>
          <p className="text-lg text-muted-foreground">
            Curated collections designed to elevate your wardrobe. Each collection tells 
            a story of style, quality, and timeless fashion.
          </p>
        </div>

        {/* Collections Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {collections.map((collection) => (
            <Link
              key={collection.id}
              to={`/shop?collection=${collection.id}`}
              className="group"
            >
              <div className="glass rounded-2xl border border-border/50 overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                {/* Image */}
                <div className="relative aspect-[4/5] overflow-hidden bg-muted">
                  <img
                    src={collection.image}
                    alt={collection.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  {collection.tag && (
                    <div className="absolute top-4 right-4">
                      <span className="bg-accent text-accent-foreground text-xs font-semibold px-3 py-1.5 rounded-full">
                        {collection.tag}
                      </span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0" />
                  
                  {/* Overlay Button */}
                  <div className="absolute bottom-4 left-4 right-4 opacity-0 translate-y-4 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0">
                    <Button className="w-full" size="lg">
                      Explore Collection
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-2 group-hover:text-accent transition-colors">
                    {collection.name}
                  </h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    {collection.description}
                  </p>
                  <p className="text-sm font-medium">
                    {collection.itemCount} items
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Featured Brands */}
        <div className="mb-16">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4">Featured Brands</h2>
            <p className="text-muted-foreground">
              Premium brands we love and trust
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {["LUXE", "URBAN", "MINIMAL", "STUDIO", "ESSENCE", "VOGUE"].map((brand) => (
              <Link
                key={brand}
                to={`/shop?brand=${brand.toLowerCase()}`}
                className="glass rounded-xl border border-border/50 p-6 text-center hover:border-accent hover:shadow-lg transition-all duration-300"
              >
                <p className="font-bold text-lg tracking-wide">{brand}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* AI Try-On CTA */}
        <div className="glass rounded-3xl border border-border/50 p-8 lg:p-12 text-center relative overflow-hidden">
          <div className="absolute inset-0 gradient-ai opacity-5" />
          <div className="relative z-10 max-w-2xl mx-auto">
            <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="h-8 w-8 text-accent" />
            </div>
            <h2 className="text-3xl font-bold mb-4">
              Try Before You Buy with{" "}
              <span className="gradient-ai-text">Fitverse AI</span>
            </h2>
            <p className="text-lg text-muted-foreground mb-6">
              See how any piece looks on you with our revolutionary AI-powered 
              virtual try-on technology. No more guessing, just perfect fits.
            </p>
            <Link to="/fitverse-ai">
              <Button size="lg" className="gradient-ai">
                <Sparkles className="mr-2 h-5 w-5" />
                Try Fitverse AI
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
