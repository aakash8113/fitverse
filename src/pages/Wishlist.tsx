import { Link, useNavigate } from "react-router-dom";
import { Heart, ShoppingCart, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { useWishlistContext } from "@/contexts/WishlistContext";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { cartApi } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";

export default function Wishlist() {
  const { items, removeFromWishlist } = useWishlistContext();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const handleAddToCart = async (item: (typeof items)[0]) => {
    if (!isAuthenticated) {
      toast({ title: "Please log in", description: "You need to be logged in to add items to cart.", variant: "destructive" });
      navigate("/login");
      return;
    }
    try {
      await cartApi.addToCart({ productId: item.id, quantity: 1 });
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      toast({ title: "Added to cart", description: `${item.name} added to your cart.` });
    } catch {
      toast({ title: "Failed to add to cart", description: "Something went wrong.", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="section-container py-8 lg:py-12">
        <div className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold mb-2">My Wishlist</h1>
          <p className="text-muted-foreground">Save your favourite items for later</p>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-24 h-24 rounded-full bg-secondary flex items-center justify-center mb-6">
              <Heart className="w-12 h-12 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Your wishlist is empty</h2>
            <p className="text-muted-foreground mb-6">Tap the heart on any product to save it here</p>
            <Link to="/shop">
              <Button size="lg" className="gap-2">Explore Shop <ShoppingCart className="w-4 h-4" /></Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="hidden lg:grid lg:grid-cols-12 gap-6 px-6 py-3 bg-secondary/50 rounded-xl font-medium text-sm text-muted-foreground">
              <div className="col-span-5">Product</div>
              <div className="col-span-2">Price</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-3 text-center">Actions</div>
            </div>

            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="bg-card border border-border rounded-2xl p-4 lg:p-6 hover:shadow-md transition-shadow">
                  {/* Mobile */}
                  <div className="lg:hidden space-y-4">
                    <div className="flex gap-4">
                      <Link to={`/product/${item.id}`} className="flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden bg-secondary">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                      </Link>
                      <div className="flex-1 space-y-1">
                        <Link to={`/product/${item.id}`}><h3 className="font-semibold hover:text-primary transition-colors">{item.name}</h3></Link>
                        <p className="text-sm text-muted-foreground capitalize">{item.category}</p>
                        <div className="flex items-center gap-2">
                          {item.originalPrice && <span className="text-sm text-muted-foreground line-through">${Number(item.originalPrice).toFixed(2)}</span>}
                          <span className="text-lg font-bold">${Number(item.price).toFixed(2)}</span>
                        </div>
                        {item.stock !== undefined && (
                          <span className={cn("text-xs font-medium", item.stock > 0 ? "text-green-600" : "text-red-600")}>
                            {item.stock > 0 ? "In Stock" : "Out of Stock"}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={() => handleAddToCart(item)} className="flex-1 gap-2"><ShoppingCart className="w-4 h-4" /> Add to Cart</Button>
                      <Button variant="outline" size="icon" onClick={() => removeFromWishlist(item.id)} className="hover:bg-destructive hover:text-destructive-foreground hover:border-destructive"><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </div>

                  {/* Desktop */}
                  <div className="hidden lg:grid lg:grid-cols-12 gap-6 items-center">
                    <div className="col-span-5 flex items-center gap-4">
                      <button onClick={() => removeFromWishlist(item.id)} className="flex-shrink-0 text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="w-5 h-5" /></button>
                      <Link to={`/product/${item.id}`} className="flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden bg-secondary">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover hover:scale-105 transition-transform" />
                      </Link>
                      <div>
                        <Link to={`/product/${item.id}`}><h3 className="font-semibold hover:text-primary transition-colors">{item.name}</h3></Link>
                        <p className="text-sm text-muted-foreground mt-1 capitalize">{item.category}</p>
                      </div>
                    </div>
                    <div className="col-span-2">
                      {item.originalPrice && <span className="text-sm text-muted-foreground line-through block">${Number(item.originalPrice).toFixed(2)}</span>}
                      <span className="text-lg font-bold">${Number(item.price).toFixed(2)}</span>
                    </div>
                    <div className="col-span-2">
                      {item.stock !== undefined ? (
                        <span className={cn("text-sm font-medium", item.stock > 0 ? "text-green-600" : "text-red-600")}>
                          {item.stock > 0 ? "In Stock" : "Out of Stock"}
                        </span>
                      ) : (
                        <span className="text-sm text-green-600 font-medium">In Stock</span>
                      )}
                    </div>
                    <div className="col-span-3 flex justify-center">
                      <Button onClick={() => handleAddToCart(item)} className="gap-2"><ShoppingCart className="w-4 h-4" /> Add to Cart</Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4">
              <Link to="/shop">
                <Button variant="outline" className="gap-2 hover:bg-foreground hover:text-background transition-colors">Continue Shopping</Button>
              </Link>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
