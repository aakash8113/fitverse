import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import {
  Heart,
  Star,
  ChevronRight,
  Minus,
  Plus,
  ThumbsUp,
  ChevronLeft,
  Loader2,
  ShoppingCart,
  AlertCircle,
  Pencil,
  Trash2,
  ImagePlus,
  X,
  Truck,
  RotateCcw,
  Check,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ProductCard } from "@/components/shop/ProductCard";
import { cn } from "@/lib/utils";
import { productsApi, cartApi, addressesApi, Product as ApiProduct, getTotalStock, getSizeStock, reviewsApi, Review } from "@/services/api";
import { getPincodeArea, isServiceable } from "@/lib/pincodes";
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
  category: (apiProduct.category || apiProduct.gender || "").toLowerCase(),
  isNew: false,
  description: apiProduct.description,
  stock: getTotalStock(apiProduct.sizeStock),
});

// Sizes come from product.availableSizes
const ALL_SIZES: Record<string, string[]> = {
  TOPWEAR: ["XS", "S", "M", "L", "XL", "XXL", "3XL"],
  BOTTOMWEAR: ["26", "28", "30", "32", "34", "36", "38", "40", "42"],
};

const CONDITION_LABELS: Record<string, string> = {
  LIKE_NEW: 'Like New',
  VERY_GOOD: 'Very Good',
  GOOD: 'Good',
  FAIR: 'Fair',
  POOR: 'Poor',
};

const colors = [
  { name: "Midnight Black", value: "#1a1a1a", available: true },
  { name: "Slate Gray", value: "#708090", available: true },
  { name: "Pure White", value: "#f5f5f5", available: true },
];

export default function ProductDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAuthenticated, user: authUser } = useAuth();
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

  // Pincode checker state
  const [pincodeInput, setPincodeInput] = useState('');
  const [pincodeResult, setPincodeResult] = useState<'valid' | 'invalid' | null>(null);
  const [pincodeAreaName, setPincodeAreaName] = useState('');

  // Review state
  const [reviewPage, setReviewPage] = useState(1);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewHoverRating, setReviewHoverRating] = useState(0);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewComment, setReviewComment] = useState("");
  const [reviewImages, setReviewImages] = useState<File[]>([]);
  const [reviewImagePreviews, setReviewImagePreviews] = useState<string[]>([]);
  const [submittingReview, setSubmittingReview] = useState(false);

  // Fetch the specific product by ID from backend
  const { data: productData, isLoading, isError } = useQuery({
    queryKey: ["product", id],
    queryFn: () => productsApi.getProduct(id!),
    enabled: !!id,
  });

  // Fetch addresses to pre-fill the pincode checker with user's default address
  const { data: addressesData } = useQuery({
    queryKey: ['addresses'],
    queryFn: addressesApi.getAddresses,
    enabled: isAuthenticated,
  });

  // Initialize pincode from localStorage (guest) or default address (logged-in)
  useEffect(() => {
    const saved = localStorage.getItem('fitverse_checked_pincode');
    if (saved) setPincodeInput(saved);
  }, []);

  useEffect(() => {
    const addresses = addressesData?.data || [];
    const defaultAddr = addresses.find((a: any) => a.isDefault) ?? addresses[0];
    if (defaultAddr?.zipCode) setPincodeInput(defaultAddr.zipCode);
  }, [addressesData]);

  const handlePincodeCheck = () => {
    const pin = pincodeInput.trim();
    if (pin.length !== 6) return;
    localStorage.setItem('fitverse_checked_pincode', pin);
    const area = getPincodeArea(pin);
    if (area) {
      setPincodeResult('valid');
      setPincodeAreaName(area);
    } else {
      setPincodeResult('invalid');
      setPincodeAreaName('');
    }
  };

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

  // ── Reviews ────────────────────────────────────────────────────────────────
  const { data: reviewsData, isLoading: reviewsLoading, refetch: refetchReviews } = useQuery({
    queryKey: ['reviews', id, reviewPage],
    queryFn: () => reviewsApi.getProductReviews(id!, reviewPage, 10),
    enabled: !!id,
  });

  const { data: myReviewData, refetch: refetchMyReview } = useQuery({
    queryKey: ['myReview', id],
    queryFn: () => reviewsApi.getMyReview(id!),
    enabled: !!id && isAuthenticated,
  });

  const { data: canReviewData } = useQuery({
    queryKey: ['canReview', id],
    queryFn: () => reviewsApi.canReview(id!),
    enabled: !!id && isAuthenticated,
  });

  const helpfulMutation = useMutation({
    mutationFn: (reviewId: string) => reviewsApi.toggleHelpful(reviewId),
    onSuccess: () => { refetchReviews(); },
  });

  const deleteReviewMutation = useMutation({
    mutationFn: (reviewId: string) => reviewsApi.deleteReview(reviewId),
    onSuccess: () => {
      refetchReviews();
      refetchMyReview();
      toast({ title: 'Review deleted' });
    },
  });

  const stats = reviewsData?.data?.stats;
  const reviews = reviewsData?.data?.reviews || [];
  const reviewPagination = reviewsData?.data?.pagination;
  const myReview = myReviewData?.data;
  const canWriteReview = canReviewData?.data?.canReview ?? false;
  const averageRating = stats?.averageRating ?? 0;
  const totalReviews = stats?.totalReviews ?? 0;

  const openReviewDialog = () => {
    if (myReview) {
      setReviewRating(myReview.rating);
      setReviewTitle(myReview.title || '');
      setReviewComment(myReview.comment);
    } else {
      setReviewRating(5);
      setReviewTitle('');
      setReviewComment('');
    }
    setReviewImages([]);
    setReviewImagePreviews([]);
    setShowReviewDialog(true);
  };

  const handleReviewImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const combined = [...reviewImages, ...files].slice(0, 5);
    setReviewImages(combined);
    setReviewImagePreviews(combined.map((f) => URL.createObjectURL(f)));
  };

  const removeReviewImage = (idx: number) => {
    const imgs = reviewImages.filter((_, i) => i !== idx);
    setReviewImages(imgs);
    setReviewImagePreviews(imgs.map((f) => URL.createObjectURL(f)));
  };

  const handleSubmitReview = async () => {
    if (!reviewComment.trim()) {
      toast({ title: 'Please write a comment', variant: 'destructive' });
      return;
    }
    setSubmittingReview(true);
    try {
      await reviewsApi.createOrUpdateReview(id!, {
        rating: reviewRating,
        title: reviewTitle.trim() || undefined,
        comment: reviewComment.trim(),
        images: reviewImages,
      });
      toast({ title: myReview ? 'Review updated!' : 'Review submitted! Thank you.' });
      setShowReviewDialog(false);
      refetchReviews();
      refetchMyReview();
    } catch (err: any) {
      toast({ title: 'Failed to submit review', description: err.response?.data?.message, variant: 'destructive' });
    } finally {
      setSubmittingReview(false);
    }
  };
  // ───────────────────────────────────────────────────────────────────────────

  // Stock for the currently selected size (or total if no size selected)
  const selectedSizeStock = product
    ? selectedSize
      ? getSizeStock(product.sizeStock as Record<string, number>, selectedSize)
      : getTotalStock(product.sizeStock as Record<string, number>)
    : 0;

  // Auto-select first in-stock size when product loads
  useEffect(() => {
    if (availableSizes.length > 0 && !selectedSize && product) {
      const sizeStockMap = product.sizeStock as Record<string, number> | undefined;
      const firstInStock = availableSizes.find(
        (s) => !sizeStockMap || (sizeStockMap[s] ?? 0) > 0
      );
      setSelectedSize(firstInStock ?? availableSizes[0]);
    }
  }, [availableSizes, selectedSize, product]);

  const relatedProducts = (relatedData?.data || [])
    .filter((p) => p.id !== id)
    .slice(0, 5)
    .map(convertToCardProduct);

  const productImages = product?.images?.map(getImageUrl) || [];

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
        description: `${product?.name} has been added to your cart.`,
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
                      stock: getTotalStock(product.sizeStock as Record<string, number>),
                    });
                    toast({
                      title: isWishlisted(product.id) ? "Removed from wishlist" : "Added to wishlist",
                      description: isWishlisted(product.id)
                        ? `${product.name} removed.`
                        : `${product.name} saved to wishlist.`,
                    });
                  }}
                  className={cn(
                    "h-10 w-10 rounded-full bg-white shadow-sm flex items-center justify-center transition-colors",
                    isWishlisted(product.id) ? "text-red-500" : "text-muted-foreground hover:text-red-500"
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
                  {totalReviews > 0 ? (
                    <>
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={cn("w-4 h-4", i < Math.round(averageRating) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30")} />
                        ))}
                      </div>
                      <span className="text-sm font-medium">{averageRating.toFixed(1)}</span>
                      <span className="text-xs text-muted-foreground">({totalReviews})</span>
                    </>
                  ) : (
                    <span className="text-xs text-muted-foreground">No reviews yet</span>
                  )}
                  <Badge
                    variant="secondary"
                    className={cn("text-xs", selectedSizeStock > 10 ? "bg-green-50 text-green-700 border-green-200" : selectedSizeStock > 0 ? "bg-yellow-50 text-yellow-700 border-yellow-200" : "bg-red-50 text-red-700 border-red-200")}
                  >
                    {selectedSizeStock > 10 ? "In Stock" : selectedSizeStock > 0 ? `Only ${selectedSizeStock} left in ${selectedSize || 'stock'}` : "Out of Stock"}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Condition (for thrift items) */}
            {product.isThrift && product.thriftCondition && (
              <div>
                <p className="text-sm text-muted-foreground uppercase tracking-wider mb-2">Condition</p>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {CONDITION_LABELS[product.thriftCondition] || product.thriftCondition}
                  </span>
                </div>
              </div>
            )}
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
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <RotateCcw className="h-4 w-4 shrink-0 text-foreground" />
              <span>
                <span className="font-medium text-foreground">7-days returnable</span> &mdash;{" "}
                <Link to="/return-policy" className="underline underline-offset-2 hover:text-foreground transition-colors">
                  Read policy
                </Link>
              </span>
            </div>

            <Separator />

            {/* Color Selection */}
            {/* <div>
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
            </div> */}

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
                    const sizeStockMap = (product.sizeStock as Record<string, number>) || {};
                    const isListed = availableSizes.includes(size);
                    const stockQty = sizeStockMap[size] ?? 0;
                    const isSoldOut = isListed && stockQty === 0;
                    const isDisabled = !isListed || isSoldOut;
                    return (
                      <button
                        key={size}
                        onClick={() => !isDisabled && setSelectedSize(size)}
                        disabled={isDisabled}
                        title={isSoldOut ? "Sold out" : !isListed ? "Not available" : undefined}
                        className={cn(
                          "w-12 h-12 rounded-lg border-2 transition-all font-medium relative",
                          !isDisabled
                            ? selectedSize === size
                              ? "border-foreground bg-foreground text-background"
                              : "border-border hover:border-muted-foreground"
                            : "border-border text-muted-foreground/40 cursor-not-allowed"
                        )}
                      >
                        {size}
                        {isDisabled && (
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
                    onClick={() => setQuantity(Math.min(selectedSizeStock, quantity + 1))}
                    className="h-12 w-12 rounded-none"
                    disabled={quantity >= selectedSizeStock}
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
                  disabled={addingToCart || selectedSizeStock === 0}
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
                  disabled={buyingNow || addingToCart || selectedSizeStock === 0}
                >
                  {buyingNow ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
                  ) : (
                    "Buy Now"
                  )}
                </Button>
              </div>

              {/* Delivery & Returns */}
              <div className="space-y-2 pt-1">

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Truck className="h-4 w-4 shrink-0 text-foreground" />
                  <span>
                    <span className="font-medium text-foreground">Estimated delivery:</span>{" "}
                    {(() => {
                      const d = new Date();
                      d.setDate(d.getDate() + 3);
                      return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "long", year: "numeric" });
                    })()}
                  </span>
                </div>

                {/* Pincode checker */}
                <div className="pt-0.5">
                  <p className="text-xs text-muted-foreground mb-1.5">Check delivery availability</p>
                  <div className="flex gap-2">
                    <Input
                      value={pincodeInput}
                      onChange={(e) => {
                        setPincodeInput(e.target.value.replace(/\D/g, '').slice(0, 6));
                        setPincodeResult(null);
                      }}
                      placeholder="Enter 6-digit pincode"
                      className="h-9 text-sm max-w-[180px]"
                      maxLength={6}
                      onKeyDown={(e) => e.key === 'Enter' && handlePincodeCheck()}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 text-xs"
                      onClick={handlePincodeCheck}
                      disabled={pincodeInput.length !== 6}
                    >
                      Check
                    </Button>
                  </div>
                  {pincodeResult === 'valid' && (
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1.5 flex items-center gap-1">
                      <Check className="h-3.5 w-3.5 shrink-0" />
                      <span>Delivery available &mdash; <span className="font-semibold">{pincodeAreaName}</span></span>
                    </p>
                  )}
                  {pincodeResult === 'invalid' && (
                    <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                      <X className="h-3.5 w-3.5 shrink-0" />
                      Sorry, we don&apos;t deliver to this location yet.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Related Products */}
      <div className="section-container py-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold">Related Products</h2>
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
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold">Product Reviews</h2>
          {isAuthenticated && canWriteReview && (
            <Button onClick={openReviewDialog} variant="outline" className="gap-2">
              <Pencil className="w-4 h-4" />
              {myReview ? 'Edit your review' : 'Write a review'}
            </Button>
          )}
        </div>

        {/* Rating summary */}
        {totalReviews > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            <div className="lg:col-span-1">
              <div className="flex flex-col items-center justify-center p-8 border-2 border-border rounded-2xl">
                <div className="text-6xl font-bold mb-2">{averageRating.toFixed(1)}</div>
                <div className="flex mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={cn("w-5 h-5", i < Math.round(averageRating) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30")} />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">{totalReviews.toLocaleString()} review{totalReviews !== 1 ? 's' : ''}</p>
              </div>
            </div>
            <div className="lg:col-span-2">
              <div className="space-y-3">
                {(stats?.distribution || []).map((item) => (
                  <div key={item.stars} className="flex items-center gap-4">
                    <span className="text-sm font-medium w-8">{item.stars}.0</span>
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-foreground" style={{ width: totalReviews > 0 ? `${(item.count / totalReviews) * 100}%` : '0%' }} />
                    </div>
                    <span className="text-sm text-muted-foreground w-8 text-right">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <Star className="w-12 h-12 mx-auto mb-3 text-muted-foreground/20" />
            <p className="font-medium">No reviews yet</p>
            {isAuthenticated && canWriteReview && (
              <p className="text-sm mt-1">Be the first to review this product!</p>
            )}
          </div>
        )}

        {/* Reviews list */}
        {reviewsLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
        ) : reviews.length > 0 ? (
          <div className="space-y-6">
            {reviews.map((review: Review) => (
              <div key={review.id} className="border-b border-border pb-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                      <span className="text-sm font-semibold text-blue-600">
                        {review.author.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{review.author}</p>
                        <Badge variant="secondary" className="text-xs">Verified Purchase</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(review.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                        {review.updatedAt !== review.createdAt && ' (edited)'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost" size="sm"
                      className={cn("gap-1.5", review.markedHelpful && "text-blue-600")}
                      onClick={() => isAuthenticated && helpfulMutation.mutate(review.id)}
                      disabled={!isAuthenticated || review.userId === authUser?.id}
                    >
                      <ThumbsUp className="w-4 h-4" />
                      <span className="text-sm">{review.helpfulCount}</span>
                    </Button>
                    {review.userId === authUser?.id && (
                      <>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={openReviewDialog}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600" onClick={() => deleteReviewMutation.mutate(review.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={cn("w-4 h-4", i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30")} />
                  ))}
                </div>
                {review.title && <p className="font-medium text-sm mb-1">{review.title}</p>}
                <p className="text-sm text-muted-foreground">{review.comment}</p>
                {review.images.length > 0 && (
                  <div className="flex gap-2 mt-3">
                    {review.images.map((img, idx) => (
                      <img key={idx} src={img.startsWith('http') ? img : `http://localhost:5000${img}`} alt="review" className="h-16 w-16 object-cover rounded-lg border" />
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Pagination */}
            {reviewPagination && reviewPagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-6">
                <Button variant="outline" size="icon" disabled={reviewPage <= 1} onClick={() => setReviewPage((p) => p - 1)}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                {[...Array(reviewPagination.totalPages)].map((_, i) => (
                  <Button key={i} variant={reviewPage === i + 1 ? 'default' : 'outline'} size="sm" onClick={() => setReviewPage(i + 1)}>
                    {i + 1}
                  </Button>
                ))}
                <Button variant="outline" size="icon" disabled={reviewPage >= reviewPagination.totalPages} onClick={() => setReviewPage((p) => p + 1)}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        ) : null}
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

      {/* Write / Edit Review Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{myReview ? 'Edit your review' : 'Write a review'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            {/* Star picker */}
            <div>
              <p className="text-sm font-medium mb-2">Your rating</p>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onMouseEnter={() => setReviewHoverRating(star)}
                    onMouseLeave={() => setReviewHoverRating(0)}
                    onClick={() => setReviewRating(star)}
                  >
                    <Star className={cn("w-7 h-7 transition-colors", (reviewHoverRating || reviewRating) >= star ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30")} />
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <p className="text-sm font-medium mb-1">Title <span className="text-muted-foreground">(optional)</span></p>
              <Input
                placeholder="Summarise your experience"
                value={reviewTitle}
                onChange={(e) => setReviewTitle(e.target.value)}
                maxLength={100}
              />
            </div>

            {/* Comment */}
            <div>
              <p className="text-sm font-medium mb-1">Review</p>
              <Textarea
                placeholder="Tell others about your experience with this product..."
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                rows={4}
                maxLength={1000}
              />
              <p className="text-xs text-muted-foreground text-right mt-1">{reviewComment.length}/1000</p>
            </div>

            {/* Image upload */}
            <div>
              <p className="text-sm font-medium mb-2">Photos <span className="text-muted-foreground">(optional, up to 5)</span></p>
              <div className="flex flex-wrap gap-2">
                {reviewImagePreviews.map((src, idx) => (
                  <div key={idx} className="relative">
                    <img src={src} alt="" className="h-16 w-16 object-cover rounded-lg border" />
                    <button type="button" onClick={() => removeReviewImage(idx)} className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center">
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </div>
                ))}
                {reviewImages.length < 5 && (
                  <label className="h-16 w-16 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors">
                    <ImagePlus className="w-5 h-5 text-muted-foreground" />
                    <input type="file" accept="image/*" multiple className="hidden" onChange={handleReviewImageChange} />
                  </label>
                )}
              </div>
            </div>

            <Button className="w-full" onClick={handleSubmitReview} disabled={submittingReview}>
              {submittingReview ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Submitting...</> : myReview ? 'Update review' : 'Submit review'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
                  { size: "XS", chest: "32–34", waist: "24–26", hips: "34–36" },
                  { size: "S", chest: "34–36", waist: "26–28", hips: "36–38" },
                  { size: "M", chest: "36–38", waist: "28–30", hips: "38–40" },
                  { size: "L", chest: "38–40", waist: "30–32", hips: "40–42" },
                  { size: "XL", chest: "40–42", waist: "32–34", hips: "42–44" },
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
