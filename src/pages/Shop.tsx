// Shop Page - Fetches products from backend API with filtering and pagination

import { useState, useEffect, useRef } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
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
import { productsApi, Product as ApiProduct } from "@/services/api";

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
    isNew: false,
    description: apiProduct.description,
    stock: apiProduct.stock,
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

  useEffect(() => {
    const g = searchParams.get("gender")?.toUpperCase() || undefined;
    setFilters((prev) => ({ ...prev, gender: g }));
  }, [searchParams]);

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
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Banner */}
      <section className="bg-secondary/50 py-16">
        <div className="section-container text-center">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">Shop Collection</h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Discover the latest fashion from our Men's and Women's collections
          </p>
        </div>
      </section>

      <div className="w-full py-8 px-6">
        <div className="flex gap-6">
          {/* Desktop Filters */}
          <aside className="hidden lg:block w-56 flex-shrink-0">
            <div className="sticky top-24">
              <FilterSidebar
                onFilterChange={handleFilterChange}
                onPriceRangeChange={handlePriceChange}
              />
            </div>
          </aside>

          {/* Products */}
          <main className="flex-1">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-border/50">
              <div className="flex items-center gap-4">
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
                      onPriceRangeChange={handlePriceChange}
                    />
                  </SheetContent>
                </Sheet>

                <span className="text-sm text-muted-foreground">
                  {isLoading ? 'Loading...' : `${totalItems} products`}
                </span>
              </div>

              <div className="flex items-center gap-4">
                <Select value={sortBy} onValueChange={setSortBy}>
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
