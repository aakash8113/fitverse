// Shop Page - Fetches products from backend API with filtering and pagination

import { useState, useEffect, useRef } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { SlidersHorizontal, Grid3X3, LayoutGrid, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ProductCard } from "@/components/shop/ProductCard";
import { FilterSidebar, ShopFilters } from "@/components/shop/FilterSidebar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { productsApi, Product as ApiProduct, getTotalStock, carouselApi } from "@/services/api";
import heroStore from "@/assets/about/hero-store.jpg";
import carousel1 from "@/assets/about/carousel_1.png";
import carousel2 from "@/assets/about/carousel_2.jpeg";
import carousel3 from "@/assets/about/carousel_3.jpeg";

// Carousel configuration
const FALLBACK_SLIDES = [heroStore, carousel1, carousel2, carousel3];
const INTERVAL = 5000;
const TRANSITION_MS = 900;

const CONDITION_LABELS: Record<string, string> = {
  LIKE_NEW: 'Like New',
  VERY_GOOD: 'Very Good',
  GOOD: 'Good',
  FAIR: 'Fair',
  POOR: 'Poor',
};

// Convert API product to frontend product format
const convertProduct = (apiProduct: ApiProduct) => {
  const getImageUrl = (imagePath: string | undefined) => {
    if (!imagePath) return '/placeholder.svg';
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) return imagePath;
    return `http://localhost:5000/${imagePath}`;
  };

  return {
    id: apiProduct.id,
    name: apiProduct.name,
    brand: apiProduct.brand || "FITVERSE",
    price: apiProduct.price,
    image: getImageUrl(apiProduct.images?.[0]),
    images: (apiProduct.images || []).map(getImageUrl),
    sizes: apiProduct.availableSizes || [],
    category: apiProduct.gender?.toLowerCase() || '',
    clothingCategory: apiProduct.category,  // Actual clothing category (TSHIRT, KURTI, etc.)
    wearType: apiProduct.wearType,
    isNew: false,
    isThrift: apiProduct.isThrift,
    condition: apiProduct.thriftCondition ? (CONDITION_LABELS[apiProduct.thriftCondition] || apiProduct.thriftCondition) : undefined,
    description: apiProduct.description,
    stock: getTotalStock(apiProduct.sizeStock),
  };
};

export default function Shop() {
  const [searchParams] = useSearchParams();
  const urlGender = searchParams.get("gender")?.toUpperCase() || undefined;

  const [gridView, setGridView] = useState<"3" | "4">("4");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const [filters, setFilters] = useState<ShopFilters>({ gender: urlGender });
  const [sortBy, setSortBy] = useState<string>("newest");
  const [minPrice, setMinPrice] = useState<number | undefined>();
  const [maxPrice, setMaxPrice] = useState<number | undefined>();

  const { data: carouselResponse } = useQuery({
    queryKey: ["carousel", "SHOP"],
    queryFn: () => carouselApi.getSlides("SHOP"),
    staleTime: 300000,
  });

  const remoteSlides = (carouselResponse?.data || [])
    .map((slide) => slide.imageUrl)
    .filter(Boolean);
  const baseSlides = remoteSlides.length ? remoteSlides : FALLBACK_SLIDES;

  // Carousel state
  const slides = [...baseSlides, baseSlides[0]]; // Clone first slide for seamless loop
  const lastLoopIndex = slides.length - 1;
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [transitioning, setTransitioning] = useState(true);
  const carouselTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const g = searchParams.get("gender")?.toUpperCase() || undefined;
    setFilters((prev) => ({ ...prev, gender: g }));
  }, [searchParams]);

  // Carousel auto-play
  const startCarouselTimer = () => {
    if (carouselTimerRef.current) clearInterval(carouselTimerRef.current);
    carouselTimerRef.current = setInterval(() => {
      setTransitioning(true);
      setCarouselIndex((i) => (i >= lastLoopIndex ? i : i + 1));
    }, INTERVAL);
  };

  useEffect(() => {
    startCarouselTimer();
    return () => { 
      if (carouselTimerRef.current) clearInterval(carouselTimerRef.current); 
    };
  }, [lastLoopIndex]);

  const handleCarouselTransitionEnd = () => {
    if (carouselIndex !== lastLoopIndex) return;
    setTransitioning(false);
    setCarouselIndex(0);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setTransitioning(true));
    });
  };

  // ── Carousel touch swipe (mobile only) — smooth follow-finger ──
  const carouselSwipeRef = useRef({ startX: 0, offset: 0 });
  const [carouselSwipeOffset, setCarouselSwipeOffset] = useState(0);
  const [carouselSwiping, setCarouselSwiping] = useState(false);

  const carouselContainerRef = useRef<HTMLDivElement>(null);

  // All touch handlers in JSX (no split between JSX + useEffect)
  const handleTouchStart = (e: React.TouchEvent) => {
    carouselSwipeRef.current = { startX: e.touches[0].clientX, offset: 0 };
    setCarouselSwiping(true);
    if (carouselTimerRef.current) clearInterval(carouselTimerRef.current);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const deltaX = e.touches[0].clientX - carouselSwipeRef.current.startX;
    carouselSwipeRef.current.offset = deltaX;
    if (Math.abs(deltaX) > 10) e.preventDefault();
    setCarouselSwipeOffset(deltaX);
  };

  const handleTouchEnd = () => {
    const delta = carouselSwipeRef.current.offset;
    setCarouselSwiping(false);
    setCarouselSwipeOffset(0);
    const threshold = 80;
    if (delta < -threshold) {
      setTransitioning(true);
      setCarouselIndex((i) => (i >= lastLoopIndex ? i : i + 1));
    } else if (delta > threshold) {
      setTransitioning(true);
      setCarouselIndex((i) => (i <= 0 ? 0 : i - 1));
    }
    startCarouselTimer();
  };

  const limit = 16;

  const { data, isLoading, isError, error, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: ['products', limit, filters, minPrice, maxPrice, sortBy],
      queryFn: ({ pageParam }) =>
        productsApi.getProducts({
          page: pageParam as number,
          limit,
          isThrift: false,
          gender: filters.gender,
          wearType: filters.wearType,
          category: filters.category,
          subCategory: filters.subCategory,
          size: filters.size,
          minPrice,
          maxPrice,
          sortBy,
        }),
      initialPageParam: 1,
      getNextPageParam: (lastPage) =>
        lastPage.pagination?.hasNextPage ? lastPage.pagination.currentPage + 1 : undefined,
    });

  const allProducts = data?.pages.flatMap((p) => p.data?.map(convertProduct) || []) || [];
  const totalItems = data?.pages[0]?.pagination?.totalItems || 0;

  const handleFilterChange = (incoming: ShopFilters) => {
    setFilters(incoming);
    if (incoming.minPrice !== undefined) setMinPrice(incoming.minPrice);
    if (incoming.maxPrice !== undefined) setMaxPrice(incoming.maxPrice);
  };

  const handlePriceChange = (min: number, max: number) => {
    setMinPrice(min > 0 ? min : undefined);
    setMaxPrice(max < 999999 ? max : undefined);
  };

  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) fetchNextPage();
      },
      { rootMargin: '300px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero Carousel */}
      <section className="relative h-[500px] flex items-center justify-center overflow-hidden">
        {/* Sliding Background */}
        <div className="absolute inset-0 z-0">
          <div
            ref={carouselContainerRef}
            className="flex h-full"
            onTransitionEnd={handleCarouselTransitionEnd}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{
              width: `${slides.length * 100}%`,
              transform: `translateX(calc(-${(carouselIndex / slides.length) * 100}% + ${carouselSwiping ? carouselSwipeOffset : 0}px))`,
              transition: transitioning && !carouselSwiping ? `transform ${TRANSITION_MS}ms cubic-bezier(0.77,0,0.18,1)` : carouselSwiping ? 'none' : `transform ${TRANSITION_MS}ms cubic-bezier(0.77,0,0.18,1)`,
            }}
          >
            {slides.map((src, i) => (
              <div
                key={i}
                className="h-full flex-shrink-0"
                style={{ width: `${100 / slides.length}%` }}
              >
                <img src={src} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
          <div className="absolute inset-0 bg-black/20" />
        </div>

        {/* Slide dots */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex gap-2">
          {baseSlides.map((_, i) => (
            <button
              key={i}
              onClick={() => { 
                setTransitioning(true); 
                setCarouselIndex(i);
                // Restart timer on manual navigation
                if (carouselTimerRef.current) clearInterval(carouselTimerRef.current);
                startCarouselTimer();
              }}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                (carouselIndex % baseSlides.length) === i ? "w-6 bg-white" : "w-1.5 bg-white/40"
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      </section>

      <div className="w-full py-8 px-6 bg-[hsl(var(--page-background))]">
        <div className="flex gap-6">
          {/* Desktop Filters */}
          <aside className="hidden lg:block w-56 flex-shrink-0 border-r border-border">
            <div className="sticky top-24 pr-4">
              <FilterSidebar
                currentFilters={filters}
                onFilterChange={handleFilterChange}
                onPriceRangeChange={handlePriceChange}
              />
            </div>
          </aside>

          {/* Products */}
          <main className="flex-1">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-3 mb-6 pb-4 border-b border-border/50">
              <div className="flex items-center gap-3">
                <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" className="lg:hidden">
                      <SlidersHorizontal className="w-4 h-4 mr-2" />
                      Filters
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-80 p-6 overflow-y-auto">
                    <FilterSidebar
                      currentFilters={filters}
                      onClose={() => setIsFilterOpen(false)}
                      onFilterChange={handleFilterChange}
                      onPriceRangeChange={handlePriceChange}
                    />
                  </SheetContent>
                </Sheet>

                <span className="text-sm text-muted-foreground">
                  {isLoading ? 'Loading...' : `${totalItems} products`}
                </span>
              </div>

              <div className="flex items-center gap-3 ml-auto">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-36 sm:w-48 h-8">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest</SelectItem>
                    <SelectItem value="price-low">Price: Low to High</SelectItem>
                    <SelectItem value="price-high">Price: High to Low</SelectItem>
                    <SelectItem value="popular">Most Popular</SelectItem>
                  </SelectContent>
                </Select>

                <div className="hidden sm:flex items-center gap-1 border border-border rounded-lg p-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn("h-8 w-8 hover:bg-secondary hover:text-primary", gridView === "3" && "bg-secondary")}
                    onClick={() => setGridView("3")}
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn("h-8 w-8 hover:bg-secondary hover:text-primary", gridView === "4" && "bg-secondary")}
                    onClick={() => setGridView("4")}
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {isLoading && (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-accent" />
              </div>
            )}

            {isError && (
              <div className="text-center py-12">
                <p className="text-destructive">Failed to load products</p>
                <p className="text-sm text-muted-foreground mt-2">
                  {error instanceof Error ? error.message : 'Please try again later'}
                </p>
              </div>
            )}

            {!isLoading && !isError && allProducts.length > 0 && (
              <div
                className={cn(
                  "grid gap-5",
                  gridView === "4"
                    ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                    : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                )}
              >
                {allProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}

            {!isLoading && !isError && allProducts.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No products found</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => {
                    setFilters({});
                    setMinPrice(undefined);
                    setMaxPrice(undefined);
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            )}

            <div ref={sentinelRef} className="h-4 mt-8" />
            {isFetchingNextPage && (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-accent" />
              </div>
            )}
          </main>
        </div>
      </div>

      <Footer />
    </div>
  );
}