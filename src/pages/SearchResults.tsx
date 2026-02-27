import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ProductCard, Product } from "@/components/shop/ProductCard";
import { FilterSidebar } from "@/components/shop/FilterSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

// Import product images
import product1 from "@/assets/products/product-1.jpg";
import product2 from "@/assets/products/product-2.jpg";
import product3 from "@/assets/products/product-3.jpg";
import product4 from "@/assets/products/product-4.jpg";
import product5 from "@/assets/products/product-5.jpg";
import product6 from "@/assets/products/product-6.jpg";

const allProducts: Product[] = [
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
    isNew: false,
  },
  {
    id: "3",
    name: "Cashmere Turtleneck Sweater",
    brand: "MINIMAL",
    price: 149.00,
    image: product3,
    sizes: ["XS", "S", "M", "L"],
    category: "women",
    isNew: true,
  },
  {
    id: "4",
    name: "Slim Fit Chinos",
    brand: "STUDIO",
    price: 89.00,
    originalPrice: 120.00,
    image: product4,
    sizes: ["28", "30", "32", "34", "36"],
    category: "men",
    isNew: false,
  },
  {
    id: "5",
    name: "Silk Blend Blouse",
    brand: "ESSENCE",
    price: 119.00,
    image: product5,
    sizes: ["XS", "S", "M", "L", "XL"],
    category: "women",
    isNew: true,
  },
  {
    id: "6",
    name: "Technical Running Jacket",
    brand: "URBAN",
    price: 159.00,
    image: product6,
    sizes: ["S", "M", "L", "XL", "XXL"],
    category: "men",
    isNew: false,
  },
];

export default function SearchResults() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const [searchInput, setSearchInput] = useState(query);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);

  useEffect(() => {
    setSearchInput(query);
    
    // Filter products based on search query
    if (query) {
      const results = allProducts.filter((product) =>
        product.name.toLowerCase().includes(query.toLowerCase()) ||
        product.brand.toLowerCase().includes(query.toLowerCase()) ||
        product.category.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredProducts(results);
    } else {
      setFilteredProducts(allProducts);
    }
  }, [query]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setSearchParams({ q: searchInput.trim() });
    }
  };

  const clearSearch = () => {
    setSearchInput("");
    setSearchParams({});
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="section-container py-8">
        {/* Search Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <form onSubmit={handleSearch} className="flex-1 max-w-2xl">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search for products, brands, categories..."
                  className="pl-12 pr-12 h-12 text-base"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />
                {searchInput && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>
            </form>
          </div>

          {query && (
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold mb-2">
                Search Results for "{query}"
              </h1>
              <p className="text-muted-foreground">
                {filteredProducts.length} {filteredProducts.length === 1 ? "item" : "items"} found
              </p>
            </div>
          )}

          {!query && (
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold mb-2">
                All Products
              </h1>
              <p className="text-muted-foreground">
                Browse our complete collection
              </p>
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
                <SheetContent side="left" className="w-80 p-0">
                  <div className="p-6">
                    <FilterSidebar />
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                  <Search className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-2xl font-bold mb-2">No Results Found</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  We couldn't find any products matching "{query}". Try adjusting your 
                  search or browse our collections.
                </p>
                <div className="flex gap-4 justify-center flex-wrap">
                  <Button onClick={clearSearch} variant="outline">
                    Clear Search
                  </Button>
                  <Link to="/shop">
                    <Button>Browse All Products</Button>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Popular Searches */}
        {!query && (
          <div className="mt-16">
            <h3 className="text-xl font-semibold mb-4">Popular Searches</h3>
            <div className="flex flex-wrap gap-3">
              {[
                "Jackets",
                "Dresses",
                "Jeans",
                "Sneakers",
                "Sweaters",
                "Blazers",
                "Accessories",
                "Sale Items",
              ].map((term) => (
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
