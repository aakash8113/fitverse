// Search Results Page — fetches live products from backend API

import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { Search, Loader2, SlidersHorizontal, ArrowLeft } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ProductCard } from "@/components/shop/ProductCard";
import { FilterSidebar } from "@/components/shop/FilterSidebar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { productsApi, Product as ApiProduct, PaginatedResponse, getTotalStock } from "@/services/api";

// Condition labels for displaying thrift product conditions
const CONDITION_LABELS: Record<string, string> = {
  LIKE_NEW: 'Like New',
  VERY_GOOD: 'Very Good',
  GOOD: 'Good',
  FAIR: 'Fair',
  POOR: 'Poor',
};

// Same converter as Shop.tsx
const convertProduct = (apiProduct: ApiProduct) => {
  const getImageUrl = (imagePath: string | undefined) => {
    if (!imagePath) return '/placeholder.svg';
    if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
      return imagePath;
    }
    return `http://localhost:5000/${imagePath}`;
  };

  return {
    id: apiProduct.id,
    name: apiProduct.name,
    brand: "FITVERSE",
    price: apiProduct.price,
    image: getImageUrl(apiProduct.images?.[0]),
    images: (apiProduct.images || []).map(getImageUrl),
    sizes: ["XS", "S", "M", "L", "XL"],
    category: (apiProduct.category || apiProduct.gender || "").toLowerCase(),
    wearType: apiProduct.wearType,
    isNew: false,
    isThrift: apiProduct.isThrift,
    condition: apiProduct.thriftCondition ? (CONDITION_LABELS[apiProduct.thriftCondition] || apiProduct.thriftCondition) : undefined,
    description: apiProduct.description,
    stock: getTotalStock(apiProduct.sizeStock),
  };
};

const POPULAR_SEARCHES = [
  "Jackets",
  "Dresses",
  "Jeans",
  "Sneakers",
  "Sweaters",
  "Blazers",
  "Accessories",
  "Sale Items",
];

export default function SearchResults() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const navigate = useNavigate();

  const { data, isLoading, isError } = useQuery<PaginatedResponse<ApiProduct>>({
    queryKey: ["search", query],
    queryFn: () =>
      productsApi.getProducts({
        search: query || undefined,
        page: 1,
        limit: 40,
      }),
    placeholderData: keepPreviousData,
  });

  const products = data?.data?.map(convertProduct) || [];
  const totalItems = data?.pagination?.totalItems ?? products.length;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="section-container py-8">
        {/* Page header */}
        <div className="mb-8">
          {/* Navigation back buttons */}
          <div className="flex gap-3 mb-4">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </div>
          {query ? (
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold mb-1">
                Search Results for "{query}"
              </h1>
              {!isLoading && (
                <p className="text-muted-foreground">
                  {totalItems} {totalItems === 1 ? "item" : "items"} found
                </p>
              )}
            </div>
          ) : (
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold mb-1">All Products</h1>
              <p className="text-muted-foreground">Browse our complete collection</p>
            </div>
          )}
        </div>

        <div className="flex gap-8">
          {/* Desktop Filters */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-24">
              <FilterSidebar />
            </div>
          </aside>

          {/* Products Grid */}
          <div className="flex-1">
            {/* Mobile Filter Button */}
            <div className="lg:hidden mb-6">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" className="w-full">
                    <SlidersHorizontal className="mr-2 h-4 w-4" />
                    Filters
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80 p-0 overflow-y-auto">
                  <div className="p-6">
                    <FilterSidebar />
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            {/* Loading */}
            {isLoading && (
              <div className="flex items-center justify-center py-24">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            )}

            {/* Error */}
            {isError && !isLoading && (
              <div className="text-center py-16">
                <p className="text-muted-foreground mb-4">
                  Something went wrong while fetching results.
                </p>
                <Button variant="outline" onClick={() => window.location.reload()}>
                  Try Again
                </Button>
              </div>
            )}

            {/* Results */}
            {!isLoading && !isError && products.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}

            {/* Empty State */}
            {!isLoading && !isError && products.length === 0 && (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                  <Search className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-2xl font-bold mb-2">No Results Found</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  We couldn't find any products matching "{query}". Try a different
                  search term or browse our collections.
                </p>
                <Link to="/shop">
                  <Button>Browse All Products</Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Popular Searches (shown when no active query) */}
        {!query && !isLoading && (
          <div className="mt-16">
            <h3 className="text-xl font-semibold mb-4">Popular Searches</h3>
            <div className="flex flex-wrap gap-3">
              {POPULAR_SEARCHES.map((term) => (
                <Link
                  key={term}
                  to={`/search?q=${term.toLowerCase()}`}
                  className="px-4 py-2 rounded-full bg-muted hover:bg-accent hover:text-accent-foreground transition-colors text-sm font-medium"
                >
                  {term}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}

