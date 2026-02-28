// Shop Page - Fetches products from backend API with filtering and pagination

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { SlidersHorizontal, Grid3X3, LayoutGrid, ChevronDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ProductCard } from "@/components/shop/ProductCard";
import { FilterSidebar } from "@/components/shop/FilterSidebar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { productsApi, Product as ApiProduct } from "@/services/api";

// Convert API product to frontend product format
const convertProduct = (apiProduct: ApiProduct) => {
  // Helper to convert image path to full URL
  const getImageUrl = (imagePath: string) => {
    // If image is already a full URL (starts with http), return as-is
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    // Otherwise, prepend backend URL for local uploads
    return `http://localhost:5000/${imagePath}`;
  };

  return {
    id: apiProduct.id,
    name: apiProduct.name,
    brand: "FITVERSE",
    price: apiProduct.price,
    image: getImageUrl(apiProduct.images[0]), // Convert to full URL
    images: apiProduct.images.map(getImageUrl),
    sizes: ["XS", "S", "M", "L", "XL"], // TODO: Add sizes to backend
    category: apiProduct.category.toLowerCase(),
    isNew: false,
    description: apiProduct.description,
    stock: apiProduct.stock,
  };
};

export default function Shop() {
  const [gridView, setGridView] = useState<"3" | "4">("4");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState<string | undefined>();
  const [minPrice, setMinPrice] = useState<number | undefined>();
  const [maxPrice, setMaxPrice] = useState<number | undefined>();
  const [search, setSearch] = useState<string | undefined>();
  const [sortBy, setSortBy] = useState<string>("newest");
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  
  const limit = 12;

  // Fetch products from API
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['products', page, limit, category, minPrice, maxPrice, search],
    queryFn: () => productsApi.getProducts({
      page,
      limit,
      category: category?.toUpperCase(),
      minPrice,
      maxPrice,
      search,
    }),
    keepPreviousData: true,
  });

  const products = data?.data?.map(convertProduct) || [];
  const filteredProducts = selectedSizes.length > 0
    ? products.filter((p) => p.sizes.some((s) => selectedSizes.includes(s.toLowerCase())))
    : products;
  const totalPages = data?.pagination?.totalPages || 1;
  const hasNextPage = data?.pagination?.hasNextPage || false;
  const totalItems = data?.pagination?.totalItems || 0;

  const handlePriceChange = (min: number, max: number) => {
    setMinPrice(min > 0 ? min : undefined);
    setMaxPrice(max < 999999 ? max : undefined);
    setPage(1);
  };

  const handleLoadMore = () => {
    if (hasNextPage) {
      setPage(page + 1);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Banner */}
      <section className="bg-secondary/50 py-16">
        <div className="section-container text-center">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">Shop Collection</h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Discover the latest fitness apparel from our collection
          </p>
        </div>
      </section>

      <div className="w-full py-8 px-6">
        <div className="flex gap-6">
          {/* Desktop Filters */}
          <aside className="hidden lg:block w-56 flex-shrink-0">
            <div className="sticky top-24">
              <FilterSidebar 
                onCategoryChange={setCategory}
                onPriceRangeChange={handlePriceChange}
                onSizeChange={setSelectedSizes}
              />
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
                    <FilterSidebar 
                      onClose={() => setIsFilterOpen(false)}
                      onCategoryChange={setCategory}
                      onPriceRangeChange={handlePriceChange}
                      onSizeChange={setSelectedSizes}
                    />
                  </SheetContent>
                </Sheet>

                <span className="text-sm text-muted-foreground">
                  {isLoading ? 'Loading...' : `${totalItems} products`}
                </span>
              </div>

              <div className="flex items-center gap-4">
                {/* Sort */}
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

            {/* Loading State */}
            {isLoading && (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-accent" />
              </div>
            )}

            {/* Error State */}
            {isError && (
              <div className="text-center py-12">
                <p className="text-destructive">Failed to load products</p>
                <p className="text-sm text-muted-foreground mt-2">
                  {error instanceof Error ? error.message : 'Please try again later'}
                </p>
              </div>
            )}

            {/* Product Grid */}
            {!isLoading && !isError && products.length > 0 && (
              <div className={cn(
                "grid gap-5",
                gridView === "4"
                  ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                  : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
              )}>
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}

            {/* No Products */}
            {!isLoading && !isError && filteredProducts.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No products found</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => {
                    setCategory(undefined);
                    setMinPrice(undefined);
                    setMaxPrice(undefined);
                    setSearch(undefined);
                    setPage(1);
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            )}

            {/* Load More */}
            {!isLoading && hasNextPage && (
              <div className="text-center mt-12">
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="min-w-48"
                  onClick={handleLoadMore}
                >
                  Load More
                  <ChevronDown className="w-4 h-4 ml-2" />
                </Button>
                <p className="text-sm text-muted-foreground mt-2">
                  Page {page} of {totalPages}
                </p>
              </div>
            )}
          </main>
        </div>
      </div>

      <Footer />
    </div>
  );
}
