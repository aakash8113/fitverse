import { useState } from "react";
import { SlidersHorizontal, Grid3X3, LayoutGrid, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ProductCard, Product } from "@/components/shop/ProductCard";
import { FilterSidebar } from "@/components/shop/FilterSidebar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

import product1 from "@/assets/products/product-1.jpg";
import product2 from "@/assets/products/product-2.jpg";
import product3 from "@/assets/products/product-3.jpg";
import product4 from "@/assets/products/product-4.jpg";
import product5 from "@/assets/products/product-5.jpg";
import product6 from "@/assets/products/product-6.jpg";

const products: Product[] = [
  {
    id: "1",
    name: "Tailored White Blazer Set",
    brand: "LUXE",
    price: 189.00,
    originalPrice: 249.00,
    image: product1,
    sizes: ["XS", "S", "M", "L", "XL"],
    category: "women",
    isNew: true,
  },
  {
    id: "2",
    name: "Premium Leather Jacket",
    brand: "URBAN",
    price: 329.00,
    image: product2,
    sizes: ["S", "M", "L", "XL"],
    category: "men",
  },
  {
    id: "3",
    name: "Cashmere Turtleneck Sweater",
    brand: "COZY",
    price: 149.00,
    image: product3,
    sizes: ["XS", "S", "M", "L"],
    category: "women",
  },
  {
    id: "4",
    name: "Elegant Navy Midi Dress",
    brand: "CHIC",
    price: 199.00,
    originalPrice: 279.00,
    image: product4,
    sizes: ["XS", "S", "M", "L", "XL"],
    category: "women",
    isNew: true,
  },
  {
    id: "5",
    name: "Urban Cargo Joggers",
    brand: "STREET",
    price: 89.00,
    image: product5,
    sizes: ["S", "M", "L", "XL", "XXL"],
    category: "men",
  },
  {
    id: "6",
    name: "Vintage Denim Jacket Set",
    brand: "RETRO",
    price: 159.00,
    originalPrice: 199.00,
    image: product6,
    sizes: ["XS", "S", "M", "L"],
    category: "women",
  },
  {
    id: "7",
    name: "Silk Blend Evening Top",
    brand: "LUXE",
    price: 119.00,
    image: product1,
    sizes: ["XS", "S", "M", "L"],
    category: "women",
  },
  {
    id: "8",
    name: "Classic Wool Overcoat",
    brand: "HERITAGE",
    price: 399.00,
    image: product2,
    sizes: ["S", "M", "L", "XL"],
    category: "men",
    isNew: true,
  },
];

export default function Shop() {
  const [gridView, setGridView] = useState<"3" | "4">("4");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Banner */}
      <section className="bg-secondary/50 py-16">
        <div className="section-container text-center">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">Shop Collection</h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Discover the latest trends with AI-powered try-on for every item
          </p>
        </div>
      </section>

      <div className="w-full py-8 px-6">
        <div className="flex gap-6">
          {/* Desktop Filters */}
          <aside className="hidden lg:block w-56 flex-shrink-0">
            <div className="sticky top-24">
              <FilterSidebar />
            </div>
          </aside>

          {/* Products */}
          <main className="flex-1">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-border/50">
              <div className="flex items-center gap-4">
                {/* Mobile Filter Button */}
                <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" className="lg:hidden">
                      <SlidersHorizontal className="w-4 h-4 mr-2" />
                      Filters
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-80 p-6">
                    <FilterSidebar onClose={() => setIsFilterOpen(false)} />
                  </SheetContent>
                </Sheet>

                <span className="text-sm text-muted-foreground">
                  {products.length} products
                </span>
              </div>

              <div className="flex items-center gap-4">
                {/* Sort */}
                <Select defaultValue="newest">
                  <SelectTrigger className="w-40 h-8">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest</SelectItem>
                    <SelectItem value="price-low">Price: Low to High</SelectItem>
                    <SelectItem value="price-high">Price: High to Low</SelectItem>
                    <SelectItem value="popular">Most Popular</SelectItem>
                  </SelectContent>
                </Select>

                {/* Grid Toggle */}
                <div className="hidden sm:flex items-center gap-1 border border-border rounded-lg p-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn("h-8 w-8 hover:bg-gray-100 hover:text-primary", gridView === "3" && "bg-gray-200")}
                    onClick={() => setGridView("3")}
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn("h-8 w-8 hover:bg-gray-100 hover:text-primary", gridView === "4" && "bg-gray-200")}
                    onClick={() => setGridView("4")}
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Product Grid */}
            <div className={cn(
              "grid gap-5",
              gridView === "4"
                ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
            )}>
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {/* Load More */}
            <div className="text-center mt-12">
              <Button variant="outline" size="lg" className="min-w-48">
                Load More
                <ChevronDown className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </main>
        </div>
      </div>

      <Footer />
    </div>
  );
}
