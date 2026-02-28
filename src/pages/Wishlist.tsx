import { useState } from "react";
import { Link } from "react-router-dom";
import { Heart, ShoppingCart, Trash2, Edit2 } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Import product images
import product1 from "@/assets/products/product-1.jpg";
import product2 from "@/assets/products/product-2.jpg";
import product3 from "@/assets/products/product-3.jpg";
import product4 from "@/assets/products/product-4.jpg";

interface WishlistItem {
  id: string;
  name: string;
  image: string;
  price: number;
  originalPrice?: number;
  inStock: boolean;
  category: string;
}

export default function Wishlist() {
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([
    {
      id: "1",
      name: "Tailored White Blazer Set",
      image: product1,
      price: 189.00,
      originalPrice: 249.00,
      inStock: true,
      category: "Suits",
    },
    {
      id: "2",
      name: "Premium Leather Jacket",
      image: product2,
      price: 329.00,
      inStock: true,
      category: "Jackets",
    },
    {
      id: "3",
      name: "Cashmere Turtleneck Sweater",
      image: product3,
      price: 149.00,
      inStock: true,
      category: "Sweaters",
    },
    {
      id: "4",
      name: "Classic Denim Jacket",
      image: product4,
      price: 129.00,
      originalPrice: 179.00,
      inStock: false,
      category: "Jackets",
    },
  ]);

  const removeFromWishlist = (id: string) => {
    setWishlistItems(items => items.filter(item => item.id !== id));
  };

  const addToCart = (item: WishlistItem) => {
    // This would integrate with cart state management
    console.log("Adding to cart:", item);
    // Optionally remove from wishlist after adding to cart
    // removeFromWishlist(item.id);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="section-container py-8 lg:py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl lg:text-4xl font-bold">My Wishlist</h1>
            <Button variant="ghost" size="icon" className="hover:bg-secondary">
              <Edit2 className="w-5 h-5" />
            </Button>
          </div>
          <p className="text-muted-foreground">
            Save your favorite items for later
          </p>
        </div>

        {wishlistItems.length === 0 ? (
          // Empty Wishlist
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-24 h-24 rounded-full bg-secondary flex items-center justify-center mb-6">
              <Heart className="w-12 h-12 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Your wishlist is empty</h2>
            <p className="text-muted-foreground mb-6">
              Start adding items you love to your wishlist
            </p>
            <Link to="/shop">
              <Button size="lg" className="gap-2">
                Explore Shop
                <ShoppingCart className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Desktop Table Header */}
            <div className="hidden lg:grid lg:grid-cols-12 gap-6 px-6 py-3 bg-secondary/50 rounded-xl font-medium text-sm text-muted-foreground">
              <div className="col-span-5">Product</div>
              <div className="col-span-2">Unit Price</div>
              <div className="col-span-2">Stock Status</div>
              <div className="col-span-3 text-right">Actions</div>
            </div>

            {/* Wishlist Items */}
            <div className="space-y-4">
              {wishlistItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-card border border-border rounded-2xl p-4 lg:p-6 hover:shadow-md transition-shadow"
                >
                  {/* Mobile Layout */}
                  <div className="lg:hidden space-y-4">
                    <div className="flex gap-4">
                      <Link
                        to={`/product/${item.id}`}
                        className="flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden bg-secondary"
                      >
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        />
                      </Link>
                      <div className="flex-1 space-y-2">
                        <Link to={`/product/${item.id}`}>
                          <h3 className="font-semibold text-base hover:text-primary transition-colors">
                            {item.name}
                          </h3>
                        </Link>
                        <p className="text-sm text-muted-foreground">{item.category}</p>
                        <div className="flex items-center gap-2">
                          {item.originalPrice && (
                            <span className="text-sm text-muted-foreground line-through">
                              ${Number(item.originalPrice).toFixed(2)}
                            </span>
                          )}
                          <span className="text-lg font-bold">${Number(item.price).toFixed(2)}</span>
                        </div>
                        <span
                          className={cn(
                            "text-sm font-medium",
                            item.inStock ? "text-green-600" : "text-red-600"
                          )}
                        >
                          {item.inStock ? "In Stock" : "Out of Stock"}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => addToCart(item)}
                        disabled={!item.inStock}
                        className="flex-1 gap-2"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        Add to Cart
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => removeFromWishlist(item.id)}
                        className="hover:bg-destructive hover:text-destructive-foreground hover:border-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Desktop Layout */}
                  <div className="hidden lg:grid lg:grid-cols-12 gap-6 items-center">
                    {/* Product Info */}
                    <div className="col-span-5 flex items-center gap-4">
                      <button
                        onClick={() => removeFromWishlist(item.id)}
                        className="flex-shrink-0 text-muted-foreground hover:text-destructive transition-colors"
                        aria-label="Remove from wishlist"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                      <Link
                        to={`/product/${item.id}`}
                        className="flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden bg-secondary"
                      >
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        />
                      </Link>
                      <div>
                        <Link to={`/product/${item.id}`}>
                          <h3 className="font-semibold hover:text-primary transition-colors">
                            {item.name}
                          </h3>
                        </Link>
                        <p className="text-sm text-muted-foreground mt-1">{item.category}</p>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="col-span-2">
                      <div className="flex flex-col gap-1">
                        {item.originalPrice && (
                          <span className="text-sm text-muted-foreground line-through">
                            ${Number(item.originalPrice).toFixed(2)}
                          </span>
                        )}
                        <span className="text-lg font-bold">${Number(item.price).toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Stock Status */}
                    <div className="col-span-2">
                      <span
                        className={cn(
                          "text-sm font-medium",
                          item.inStock ? "text-green-600" : "text-red-600"
                        )}
                      >
                        {item.inStock ? "In Stock" : "Out of Stock"}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="col-span-3 flex justify-end">
                      <Button
                        onClick={() => addToCart(item)}
                        disabled={!item.inStock}
                        className="gap-2"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        Add to Cart
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Continue Shopping */}
            <div className="pt-4">
              <Link to="/shop">
                <Button variant="outline" className="gap-2">
                  Continue Shopping
                  <ShoppingCart className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
