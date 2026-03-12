import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Recycle, Leaf, Heart, TrendingUp, Plus, Loader2, List, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ProductCard, Product } from "@/components/shop/ProductCard";
import { FilterSidebar, ShopFilters } from "@/components/shop/FilterSidebar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useInfiniteQuery } from "@tanstack/react-query";
import { productsApi } from "@/services/api";
import { useScrollAnimation } from "@/hooks/use-scroll-animation";

import thriftHero from "@/assets/thrift-hero.jpg";

const stats = [
  { value: "12.5k", label: "kg CO₂ Saved", icon: Leaf },
  { value: "8.2k", label: "Items Rehomed", icon: Heart },
  { value: "5.4k", label: "Happy Sellers", icon: TrendingUp },
];

export default function Thrift() {
  const navigate = useNavigate();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [sortBy, setSortBy] = useState("newest");
  const [filters, setFilters] = useState<ShopFilters>({});
  const [minPrice, setMinPrice] = useState<number | undefined>();
  const [maxPrice, setMaxPrice] = useState<number | undefined>();

  const CONDITION_LABELS: Record<string, string> = {
  LIKE_NEW: 'Like New',
  VERY_GOOD: 'Very Good',
  GOOD: 'Good',
  FAIR: 'Fair',
  POOR: 'Poor',
};

const THRIFT_LIMIT = 20; // 4 cols x 5 rows

  const handleFilterChange = (f: ShopFilters) => {
    setFilters(f);
    if (f.minPrice !== undefined) setMinPrice(f.minPrice);
    if (f.maxPrice !== undefined) setMaxPrice(f.maxPrice);
  };

  const { data: productsData, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ["products", "THRIFT", sortBy, filters, minPrice, maxPrice],
    queryFn: ({ pageParam }) =>
      productsApi.getProducts({ isThrift: true, limit: THRIFT_LIMIT, page: pageParam as number, sortBy, minPrice, maxPrice, gender: filters.gender, wearType: filters.wearType, category: filters.category, subCategory: filters.subCategory, size: filters.size }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.pagination?.hasNextPage ? lastPage.pagination.currentPage + 1 : undefined,
  });

  const thriftProducts: Product[] = (productsData?.pages.flatMap((p) => p.data || []) ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    brand: "THRIFT",
    price: Number(p.price),
    image: p.images?.[0]?.startsWith("http")
      ? p.images[0]
      : `http://localhost:5000/${p.images?.[0] || ""}`,
    sizes: p.availableSizes || ["XS", "S", "M", "L", "XL"],
    category: "thrift",
    isThrift: true,
    condition: p.thriftCondition ? (CONDITION_LABELS[p.thriftCondition] || p.thriftCondition) : undefined,
    seller: { name: "Fitverse", rating: 4.9 },
  }));

  // IntersectionObserver sentinel for infinite scroll
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Scroll animation for sustainability banner
  const { ref: bannerRef, isVisible: bannerVisible } = useScrollAnimation({ threshold: 0.15 });
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: '300px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative py-16 overflow-hidden bg-gradient-to-br from-thrift-green/5 to-thrift-green/10">
        <div className="section-container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="badge-thrift mb-6">
                <Recycle className="w-3.5 h-3.5" />
                Sustainable Fashion
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold mb-6">
                Pre-Loved Fashion,
                <br />
                <span className="text-thrift-green">Planet-Friendly</span>
              </h1>
              <p className="text-lg text-muted-foreground mb-8 max-w-lg">
                Discover unique pre-owned pieces at amazing prices. Every purchase helps reduce fashion waste and saves our planet.
              </p>

              {/* Impact Stats */}
              <div className="grid grid-cols-3 gap-6 mb-8">
                {stats.map((stat) => (
                  <div key={stat.label} className="text-center">
                    <stat.icon className="w-6 h-6 text-thrift-green mx-auto mb-2" />
                    <p className="text-2xl font-bold text-thrift-green">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button onClick={() => navigate('/thrift/sell')} className="bg-thrift-green hover:bg-thrift-green/90 text-white h-12 px-8 w-full sm:w-auto">
                  <Plus className="w-5 h-5 mr-2" />
                  Sell Your Items
                </Button>
                <Button onClick={() => navigate('/thrift/my-listings')} variant="outline" className="h-12 px-6 w-full sm:w-auto border-thrift-green text-thrift-green hover:bg-thrift-green/5 dark:hover:text-white">
                  <List className="w-4 h-4 mr-2" />
                  My Listings
                </Button>
              </div>
            </div>

            <div className="relative">
              <div className="aspect-[4/3] rounded-3xl overflow-hidden">
                <img
                  src={thriftHero}
                  alt="Sustainable Fashion"
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Impact Badge */}
              <div className="absolute -bottom-6 -left-6 bg-card rounded-2xl p-4 shadow-soft border border-border/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-thrift-green/10 flex items-center justify-center">
                    <Leaf className="w-5 h-5 text-thrift-green" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Your Impact</p>
                    <p className="text-xs text-muted-foreground">Avg. 2.5kg CO₂ saved per item</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Products */}
      <section id="thrift-products" className="py-12 bg-[hsl(var(--page-background))]">
        <div className="w-full px-6">
          <div className="flex gap-6">

            {/* Desktop Filters */}
            <aside className="hidden lg:block w-56 flex-shrink-0">
              <div className="sticky top-24">
                <FilterSidebar
                  onFilterChange={handleFilterChange}
                  onPriceRangeChange={(min, max) => {
                    setMinPrice(min > 0 ? min : undefined);
                    setMaxPrice(max < 999999 ? max : undefined);
                  }}
                />
              </div>
            </aside>

            {/* Products */}
            <main className="flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <div className="flex items-center gap-3">
                  <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                    <SheetTrigger asChild>
                      <Button variant="outline" className="lg:hidden">
                        <SlidersHorizontal className="w-4 h-4 mr-2" />
                        Filters
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-80 p-6">
                      <FilterSidebar
                        onClose={() => setIsFilterOpen(false)}
                        onFilterChange={handleFilterChange}
                        onPriceRangeChange={(min, max) => {
                          setMinPrice(min > 0 ? min : undefined);
                          setMaxPrice(max < 999999 ? max : undefined);
                        }}
                      />
                    </SheetContent>
                  </Sheet>
                  <h2 className="text-2xl font-bold">Pre-Loved Finds</h2>
                </div>
                <div className="flex items-center gap-3 ml-auto">
                  <span className="text-sm text-muted-foreground">
                    {thriftProducts.length} items
                  </span>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-36 sm:w-48 h-8">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Newest</SelectItem>
                      <SelectItem value="price-low">Price: Low to High</SelectItem>
                      <SelectItem value="price-high">Price: High to Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="h-8 w-8 animate-spin text-thrift-green" />
                </div>
              ) : thriftProducts.length === 0 ? (
                <div className="text-center py-20">
                  <p className="text-muted-foreground">No thrift products available right now.</p>
                </div>
              ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {thriftProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
              )}
              {/* Infinite scroll sentinel + spinner */}
              <div ref={sentinelRef} className="h-4 mt-8" />
              {isFetchingNextPage && (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-thrift-green" />
                </div>
              )}
            </main>
          </div>
        </div>
      </section>

      {/* Sustainability Banner */}
      <section className="py-16 bg-thrift-green/5 dark:bg-[#1A1A1A]">
        <div className="section-container">
          <div
            ref={bannerRef}
            className={`bg-thrift-green dark:bg-[#467A4B] rounded-3xl p-8 lg:p-12 text-white text-center transition-all duration-1000 ease-out ${
              bannerVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12 "
            }`}
          >
            <Recycle className="w-12 h-12 mx-auto mb-6 animate-float" />
            <h2 className="text-3xl font-bold mb-4">Join the Circular Fashion Movement</h2>
            <p className="text-white/80 max-w-2xl mx-auto mb-6">
              Every pre-loved item you buy or sell contributes to a more sustainable fashion industry.
              Together, we've prevented thousands of clothing items from ending up in landfills.
            </p>
            <div className="flex justify-center gap-4">
              <Button className="bg-white text-thrift-green hover:bg-white/90" onClick={() => document.querySelector('#thrift-products')?.scrollIntoView({ behavior: 'smooth' })}>
                Start Shopping
              </Button>
              <Button className="bg-white text-thrift-green hover:bg-white/90" onClick={() => navigate('/thrift/sell')}>
                Sell Your Items
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
