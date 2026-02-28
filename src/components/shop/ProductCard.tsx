import { Link } from "react-router-dom";
import { Heart, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useWishlistContext } from "@/contexts/WishlistContext";
import { useToast } from "@/hooks/use-toast";

export interface Product {
  id: string;
  name: string;
  brand: string;
  price: number;
  originalPrice?: number;
  image: string;
  sizes: string[];
  category: string;
  stock?: number;
  isNew?: boolean;
  isThrift?: boolean;
  condition?: string;
  seller?: {
    name: string;
    rating: number;
  };
}

interface ProductCardProps {
  product: Product;
  className?: string;
}

export function ProductCard({ product, className }: ProductCardProps) {
  const { toggleWishlist, isWishlisted } = useWishlistContext();
  const { toast } = useToast();
  const wishlisted = isWishlisted(product.id);

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    toggleWishlist({
      id: product.id,
      name: product.name,
      image: product.image,
      price: product.price,
      originalPrice: product.originalPrice,
      category: product.category,
      stock: product.stock ?? 0,
    });
    toast({
      title: wishlisted ? "Removed from wishlist" : "Added to wishlist",
      description: wishlisted ? `${product.name} removed.` : `${product.name} saved to wishlist.`,
    });
  };

  const discount = product.originalPrice 
    ? Math.round((1 - Number(product.price) / Number(product.originalPrice)) * 100) 
    : 0;

  return (
    <Link to={`/product/${product.id}`} className={cn("card-product group block", className)}>
      {/* Image Container */}
      <div className="relative aspect-[3/4] overflow-hidden bg-secondary">
        <img
          src={product.image}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        
        {/* Overlay Actions */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="absolute bottom-4 left-4 right-4 flex gap-2">
            <Button 
              size="sm" 
              className="flex-1 bg-[#d1ebdb] text-black h-9 hover:bg-[#c7e4d3] transition-colors duration-200"
              onClick={(e) => e.preventDefault()}
            >
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
              Try On
            </Button>
          </div>
        </div>

        {/* Wishlist */}
        <button
          onClick={handleWishlist}
          className={cn(
            "absolute top-3 right-3 h-9 w-9 rounded-full bg-white shadow-soft flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200",
            wishlisted ? "text-red-500" : "text-gray-400 hover:text-red-500"
          )}
        >
          <Heart className={cn("h-4 w-4", wishlisted && "fill-red-500")} />
        </button>

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {product.isNew && (
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-primary text-primary-foreground">
              New
            </span>
          )}
          {/* {discount > 0 && (
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-destructive text-destructive-foreground">
              -{discount}%
            </span>
          )} */}
          {product.isThrift && (
            <span className="badge-thrift">
              Pre-Owned
            </span>
          )}
          {product.condition && (
            <span className="badge-condition">
              {product.condition}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-2">
        <div className="flex justify-between items-start">
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">
              {product.brand}
            </p>
            <h3 className="font-medium text-sm mt-1 truncate hover:text-accent transition-colors">
              {product.name}
            </h3>
          </div>
        </div>

        {/* Price */}
        <div className="flex items-center gap-2">
          <span className="font-semibold text-base">
            ${Number(product.price).toFixed(2)}
          </span>
          {product.originalPrice && (
            <span className="text-sm text-muted-foreground line-through">
              ${Number(product.originalPrice).toFixed(2)}
            </span>
          )}
        </div>

        {/* Sizes */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {product.sizes.slice(0, 5).map((size) => (
            <span 
              key={size} 
              className="px-2 py-0.5 text-xs border border-border rounded-md text-muted-foreground hover:border-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              {size}
            </span>
          ))}
          {product.sizes.length > 5 && (
            <span className="px-2 py-0.5 text-xs text-muted-foreground">
              +{product.sizes.length - 5}
            </span>
          )}
        </div>

        {/* Thrift Seller Info
        {product.seller && (
          <div className="pt-2 flex items-center gap-2 text-xs text-muted-foreground border-t border-border/50 mt-2">
            <span>Sold by {product.seller.name}</span>
            <span className="flex items-center">
              ⭐ {product.seller.rating}
            </span>
          </div>
        )} */}
      </div>
    </Link>
  );
}
