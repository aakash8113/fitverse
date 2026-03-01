import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  Heart, 
  Star, 
  ChevronRight, 
  Minus, 
  Plus, 
  ThumbsUp, 
  MessageCircle,
  ChevronLeft,
  Loader2,
  ShoppingCart,
  AlertCircle,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ProductCard } from "@/components/shop/ProductCard";
import { cn } from "@/lib/utils";
import { productsApi, cartApi, Product as ApiProduct } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useWishlistContext } from "@/contexts/WishlistContext";

const getImageUrl = (imagePath: string) => {
  if (!imagePath) return "";
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) return imagePath;
  return `http://localhost:5000/${imagePath}`;
};

const convertToCardProduct = (apiProduct: ApiProduct) => ({
  id: apiProduct.id,
  name: apiProduct.name,
  brand: "FITVERSE",
  price: apiProduct.price,
  image: getImageUrl(apiProduct.images?.[0]),
  sizes: ["XS", "S", "M", "L", "XL"],
  category: apiProduct.category.toLowerCase(),
  isNew: false,
  description: apiProduct.description,
  stock: apiProduct.stock,
});

// Sizes come from product.availableSizes
const ALL_SIZES: Record<string, string[]> = {
  TOPWEAR: ["XS", "S", "M", "L", "XL", "XXL", "3XL"],
  BOTTOMWEAR: ["26", "28", "30", "32", "34", "36", "38", "40", "42"],
};

// Mock reviews data
const reviews = [
  {
    id: 1,
    author: "Darrell Steward",
    rating: 5,
    date: "June 28, 2024 / 7:04 PM",
    title: "Great quality product, highly recommend for workouts!",
    helpful: 24,
    verified: true,
  },
  {
    id: 2,
    author: "Sarah Johnson",
    rating: 4,
    date: "May 15, 2024 / 3:22 PM",
    title: "Very comfortable and fits true to size.",
    helpful: 18,
    verified: true,
  },
];

const colors = [
  { name: "Midnight Black", value: "#1a1a1a", available: true },
  { name: "Slate Gray", value: "#708090", available: true },
  { name: "Pure White", value: "#f5f5f5", available: true },
];

const ratingDistribution = [
  { stars: 5, count: 20551 },
  { stars: 4, count: 30 },
  { stars: 3, count: 4 },
  { stars: 2, count: 0 },
  { stars: 1, count: 0 },
];

export default function ProductDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const { toggleWishlist, isWishlisted } = useWishlistContext();
  const [showSizeChart, setShowSizeChart] = useState(false);

  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedColor, setSelectedColor] = useState(0);
  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [buyingNow, setBuyingNow] = useState(false);

  // Fetch the specific product by ID from backend
  const { data: productData, isLoading, isError } = useQuery({
    queryKey: ["product", id],
    queryFn: () => productsApi.getProduct(id!),
    enabled: !!id,
  });

  // Fetch related products (same category)
  const { data: relatedData } = useQuery({
    queryKey: ["products", "related", productData?.data?.category],
    queryFn: () =>
      productsApi.getProducts({
        category: productData?.data?.category,
        limit: 6,
      }),
    enabled: !!productData?.data?.category,
  });

  const product = productData?.data;
  const availableSizes = product?.availableSizes || [];

  // Auto-select first size when product loads
  useEffect(() => {
    if (availableSizes.length > 0 && !selectedSize) {
      setSelectedSize(availableSizes[0]);
    }
  }, [availableSizes, selectedSize]);

  const relatedProducts = (relatedData?.data || [])
    .filter((p) => p.id !== id)
    .slice(0, 5)
    .map(convertToCardProduct);

  const productImages = product?.images?.map(getImageUrl) || [];

  const totalReviews = ratingDistribution.reduce((acc, curr) => acc + curr.count, 0);
  const averageRating = 4.5;

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      toast({
        title: "Please log in",
        description: "You need to be logged in to add items to cart.",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    if (availableSizes.length > 0 && !selectedSize) {
      toast({
        title: "Select a size",
        description: "Please select a size before adding to cart.",
        variant: "destructive",
      });
      return;
    }

    setAddingToCart(true);
    try {
      await cartApi.addToCart({ productId: id!, quantity, size: selectedSize });
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      toast({
        title: "Added to cart",
        description: `?${product?.name} has been added to your cart.`,
      });
    } catch (error: any) {
      toast({
        title: "Failed to add to cart",
        description: error.response?.data?.message || "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    if (!isAuthenticated) {
      toast({
        title: "Please log in",
        description: "You need to be logged in to purchase.",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    if (availableSizes.length > 0 && !selectedSize) {
      toast({
        title: "Select a size",
        description: "Please select a size before purchasing.",
        variant: "destructive",
      });
      return;
    }

    setBuyingNow(true);
    try {
      await cartApi.addToCart({ productId: id!, quantity, size: selectedSize });
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      navigate("/checkout", { state: { buyNowProductId: id } });
    } catch (error: any) {
      toast({
        title: "Couldn't proceed to checkout",
        description: error.response?.data?.message || "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setBuyingNow(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Loading product...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">Product not found</h2>
            <p className="text-muted-foreground mb-6">This product doesn't exist or has been removed.</p>
            <Button asChild>
              <Link to="/shop">Back to Shop</Link>
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Breadcrumb */}
      <div className="section-container py-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
          <ChevronRight className="w-4 h-4" />
          <Link to="/shop" className="hover:text-foreground transition-colors">Shop</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-foreground">{product.name}</span>
        </div>
      </div>

      {/* Main Product Section */}
      <div className="section-container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Left: Images */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="aspect-[3/4] bg-secondary rounded-lg overflow-hidden relative group">
              {productImages[selectedImage] ? (
                <img
                  src={productImages[selectedImage]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">No image</div>
              )}
              {/* Action buttons */}
              <div className="absolute top-4 right-4 flex flex-col gap-2">
                <button
                  onClick={() => {
                    if (!product) return;
                    toggleWishlist({
                      id: product.id,
                      name: product.name,
                      image: productImages[0] || "",
                      price: Number(product.price),
                      category: product.category,
                      stock: product.stock,
                    });
                    toast({
                      title: isWishlisted(product.id) ? "Removed from wishlist" : "Added to wishlist",
                      description: isWishlisted(product.id)
                        ? `?${product.name} removed.`
                        : `?${product.name} saved to wishlist.`,
                    });
                  }}
                  className={cn(
                    "h-10 w-10 rounded-full bg-white shadow-sm flex items-center justify-center transition-colors",
                    isWishlisted(product.id) ? "text-red-500" : "text-gray-400 hover:text-red-500"
                  )}
                >
                  <Heart className={cn("h-5 w-5", isWishlisted(product.id) && "fill-red-500")} />
                </button>
              </div>
            </div>

            {/* Thumbnail Images */}
            {productImages.length > 1 && (
              <div className="grid grid-cols-5 gap-3">
                {productImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={cn(
                      "aspect-[3/4] rounded-lg overflow-hidden border-2 transition-all",
                      selectedImage === idx ? "border-foreground" : "border-transparent hover:border-border"
                    )}
                  >
                    <img src={img} alt={`View ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Product Details */}
          <div className="space-y-6">
            {/* Brand and Name */}
            <div>
              <p className="text-sm text-muted-foreground uppercase tracking-wider mb-2">FITVERSE</p>
              <h1 className="text-3xl lg:text-4xl font-bold mb-3">{product.name}</h1>
              
              {/* Price and Rating */}
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-bold">₹{Number(product.price).toFixed(2)}</span>
                </div>
                <Separator orientation="vertical" className="h-6 hidden sm:block" />
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={cn("w-4 h-4", i < Math.floor(averageRating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300")} />
                    ))}
                  </div>
                  <span className="text-sm font-medium">{averageRating}</span>
                  <Badge
                    variant="secondary"
                    className={cn("text-xs", product.stock > 10 ? "bg-green-50 text-green-700 border-green-200" : product.stock > 0 ? "bg-yellow-50 text-yellow-700 border-yellow-200" : "bg-red-50 text-red-700 border-red-200")}
                  >
                    {product.stock > 10 ? "In Stock" : product.stock > 0 ? `Only ${product.stock} left` : "Out of Stock"}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <h3 className="font-semibold mb-2">Description:</h3>
              <p className="text-muted-foreground leading-relaxed">
                {showFullDescription
                  ? product.description
                  : product.description?.slice(0, 150) + (product.description?.length > 150 ? "..." : "")}
              </p>
              {product.description?.length > 150 && (
                <button onClick={() => setShowFullDescription(!showFullDescription)} className="text-sm text-primary hover:underline mt-1">
                  {showFullDescription ? "See Less..." : "See More..."}
                </button>
              )}
            </div>

            <Separator />

            {/* Color Selection */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">
                  Color: <span className="text-muted-foreground font-normal">{colors[selectedColor].name}</span>
                </h3>
              </div>
              <div className="flex gap-3">
                {colors.map((color, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedColor(idx)}
                    disabled={!color.available}
                    className={cn(
                      "w-12 h-12 rounded-lg border-2 transition-all",
                      selectedColor === idx ? "border-foreground scale-110" : "border-border hover:border-muted-foreground",
                      !color.available && "opacity-40 cursor-not-allowed"
                    )}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>

            {/* Size Selection */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">Size: <span className="text-muted-foreground font-normal">{selectedSize}</span></h3>
                <button onClick={() => setShowSizeChart(true)} className="text-sm text-primary hover:underline">View Size Chart</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {availableSizes.length === 0 ? (
                  <span className="text-sm text-muted-foreground">No sizes available</span>
                ) : (
                  (ALL_SIZES[product.wearType] || availableSizes).map((size) => {
                    const isAvailable = availableSizes.includes(size);
                    return (
                      <button
                        key={size}
                        onClick={() => isAvailable && setSelectedSize(size)}
                        disabled={!isAvailable}
                        title={!isAvailable ? "Not available" : undefined}
                        className={cn(
                          "w-12 h-12 rounded-lg border-2 transition-all font-medium relative",
                          isAvailable
                            ? selectedSize === size
                              ? "border-foreground bg-foreground text-background"
                              : "border-border hover:border-muted-foreground"
                            : "border-border text-muted-foreground/40 cursor-not-allowed"
                        )}
                      >
                        {size}
                        {!isAvailable && (
                          <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <span className="w-[120%] h-px bg-muted-foreground/40 rotate-45 absolute" />
                          </span>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            <Separator />

            {/* Quantity and Actions */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center border-2 border-border rounded-lg">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="h-12 w-12 rounded-none"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-12 text-center font-medium">{quantity}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    className="h-12 w-12 rounded-none"
                    disabled={quantity >= product.stock}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button
                  size="lg"
                  className="h-12 text-base font-semibold"
                  onClick={handleAddToCart}
                  disabled={addingToCart || product.stock === 0}
                >
                  {addingToCart ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adding...</>
                  ) : (
                    <><ShoppingCart className="mr-2 h-4 w-4" /> Add To Cart</>
                  )}
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="h-12 text-base font-semibold"
                  onClick={handleBuyNow}
                  disabled={buyingNow || addingToCart || product.stock === 0}
                >
                  {buyingNow ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
                  ) : (
                    "Buy Now"
                  )}
                </Button>
              </div>

              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Delivery:</span> TBC
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Related Products */}
      <div className="section-container py-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold">Related Product</h2>
          <Link to="/shop" className="text-sm font-medium hover:underline flex items-center gap-1">
            View All
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 lg:gap-6">
          {relatedProducts.map((prod) => (
            <ProductCard key={prod.id} product={prod} />
          ))}
        </div>
      </div>

      {/* Product Reviews */}
      <div className="section-container py-12">
        <h2 className="text-2xl font-bold mb-8">Product Reviews</h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Overall Rating */}
          <div className="lg:col-span-1">
            <div className="flex flex-col items-center justify-center p-8 border-2 border-border rounded-2xl">
              <div className="text-6xl font-bold mb-2">{averageRating}</div>
              <div className="flex mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      "w-5 h-5",
                      i < Math.floor(averageRating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                    )}
                  />
                ))}
              </div>
              <p className="text-sm text-muted-foreground">{totalReviews.toLocaleString()} User reviews</p>
            </div>
          </div>

          {/* Rating Distribution */}
          <div className="lg:col-span-2">
            <div className="space-y-3">
              {ratingDistribution.map((item) => (
                <div key={item.stars} className="flex items-center gap-4">
                  <span className="text-sm font-medium w-8">{item.stars}.0</span>
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-foreground"
                      style={{ width: `?${(item.count / totalReviews) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm text-muted-foreground w-12 text-right">
                    {item.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Reviews List */}
        <div className="space-y-6">
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm">All Reviews</Button>
            <Button variant="ghost" size="sm">With Photo & Video</Button>
            <Button variant="ghost" size="sm">With Description</Button>
          </div>

          <div className="space-y-6">
            {reviews.map((review) => (
              <div key={review.id} className="border-b border-border pb-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-sm font-semibold text-blue-600">
                        {review.author.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{review.author}</p>
                        {review.verified && (
                          <Badge variant="secondary" className="text-xs">Verified</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{review.date}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" className="gap-1.5">
                      <ThumbsUp className="w-4 h-4" />
                      <span className="text-sm">{review.helpful}</span>
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MessageCircle className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        "w-4 h-4",
                        i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                      )}
                    />
                  ))}
                </div>
                <p className="text-sm">{review.title}</p>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-center gap-2 pt-6">
            <Button variant="outline" size="icon" disabled>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="default" size="sm">1</Button>
            <Button variant="outline" size="sm">2</Button>
            <Button variant="outline" size="sm">...</Button>
            <Button variant="outline" size="sm">10</Button>
            <Button variant="outline" size="icon">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Popular this week */}
      <div className="section-container py-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold">Popular this week</h2>
          <Link to="/shop" className="text-sm font-medium hover:underline flex items-center gap-1">
            View All
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 lg:gap-6">
          {relatedProducts.map((prod) => (
            <ProductCard key={prod.id} product={prod} />
          ))}
        </div>
      </div>

      <Footer />

      {/* Size Chart Dialog */}
      <Dialog open={showSizeChart} onOpenChange={setShowSizeChart}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Size Chart</DialogTitle>
          </DialogHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-secondary/50">
                  <th className="px-4 py-2 text-left font-semibold border border-border">Size</th>
                  <th className="px-4 py-2 text-left font-semibold border border-border">Chest (in)</th>
                  <th className="px-4 py-2 text-left font-semibold border border-border">Waist (in)</th>
                  <th className="px-4 py-2 text-left font-semibold border border-border">Hips (in)</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { size: "XS",  chest: "32–34", waist: "24–26", hips: "34–36" },
                  { size: "S",   chest: "34–36", waist: "26–28", hips: "36–38" },
                  { size: "M",   chest: "36–38", waist: "28–30", hips: "38–40" },
                  { size: "L",   chest: "38–40", waist: "30–32", hips: "40–42" },
                  { size: "XL",  chest: "40–42", waist: "32–34", hips: "42–44" },
                  { size: "XXL", chest: "42–44", waist: "34–36", hips: "44–46" },
                ].map((row) => (
                  <tr key={row.size} className="odd:bg-background even:bg-secondary/20">
                    <td className="px-4 py-2 font-medium border border-border">{row.size}</td>
                    <td className="px-4 py-2 border border-border">{row.chest}</td>
                    <td className="px-4 py-2 border border-border">{row.waist}</td>
                    <td className="px-4 py-2 border border-border">{row.hips}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground mt-2">All measurements are in inches. For best results, measure yourself and compare.</p>
        </DialogContent>
      </Dialog>
    </div>
  );
}
