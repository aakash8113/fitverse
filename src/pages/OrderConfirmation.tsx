import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle, Package, MapPin, CreditCard, Calendar, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ordersApi } from "@/services/api";

const getImageUrl = (p: string) => { if (!p) return ""; if (p.startsWith("http")) return p; return "http://localhost:5000/" + p; };
const PAYMENT_LABELS: Record<string, string> = { COD: "Cash on Delivery", CARD: "Credit / Debit Card", WALLET: "Digital Wallet" };

export default function OrderConfirmation() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("orderId") || "";
  const { data: orderData, isLoading, isError } = useQuery({ queryKey: ["order", orderId], queryFn: () => ordersApi.getOrder(orderId), enabled: !!orderId, retry: 1 });
  const order = orderData?.data;
  const estimatedDelivery = new Date(Date.now() + 5*24*60*60*1000).toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"});
  const orderDate = order ? new Date(order.createdAt).toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"}) : "";

  if (isLoading) return (<div className="min-h-screen bg-background"><Navbar /><div className="section-container py-12 flex items-center justify-center min-h-[60vh]"><div className="text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" /><p className="text-muted-foreground">Loading your order...</p></div></div><Footer /></div>);
  if (isError || !order) return (<div className="min-h-screen bg-background"><Navbar /><div className="section-container py-12 flex items-center justify-center min-h-[60vh]"><div className="text-center"><AlertCircle className="h-8 w-8 mx-auto mb-4 text-destructive" /><p className="font-semibold mb-2">Could not load order details</p><Link to="/orders"><Button variant="outline">View My Orders</Button></Link></div></div><Footer /></div>);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="section-container py-12 md:py-16">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/10 mb-6"><CheckCircle className="w-12 h-12 text-green-600" /></div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Order Confirmed!</h1>
          <p className="text-lg text-muted-foreground mb-2">Thank you for your purchase. Your order has been successfully placed.</p>
          <p className="text-muted-foreground">A confirmation email has been sent to your registered email address.</p>
        </div>
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-card border border-border rounded-2xl p-6"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center"><Package className="w-5 h-5 text-blue-600" /></div><div><p className="text-sm text-muted-foreground">Order Number</p><p className="font-bold">#{order.orderNumber}</p></div></div></div>
              <div className="bg-card border border-border rounded-2xl p-6"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center"><Calendar className="w-5 h-5 text-green-600" /></div><div><p className="text-sm text-muted-foreground">Estimated Delivery</p><p className="font-bold">{estimatedDelivery}</p></div></div></div>
            </div>
            <div className="bg-card border border-border rounded-2xl p-6">
              <h2 className="text-xl font-bold mb-6">Order Items</h2>
              <div className="space-y-4">
                {(order.items ?? []).map((item) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="w-20 h-20 rounded-lg overflow-hidden bg-secondary flex-shrink-0"><img src={getImageUrl(item.productImage)} alt={item.productName} className="w-full h-full object-cover" /></div>
                    <div className="flex-1 min-w-0"><h3 className="font-semibold mb-1 truncate">{item.productName}</h3><p className="text-sm text-muted-foreground">Qty: {item.quantity}</p></div>
                    <div className="text-right"><p className="font-semibold">${(Number(item.price) * item.quantity).toFixed(2)}</p><p className="text-xs text-muted-foreground">${Number(item.price).toFixed(2)} each</p></div>
                  </div>
                ))}
              </div>
              <Separator className="my-6" />
              <div className="space-y-3">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Subtotal</span><span className="font-medium">${Number(order.subtotal).toFixed(2)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Shipping</span><span className="font-medium">${Number(order.shipping).toFixed(2)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Tax</span><span className="font-medium">${Number(order.tax).toFixed(2)}</span></div>
                <Separator />
                <div className="flex justify-between text-lg"><span className="font-bold">Total</span><span className="font-bold">${Number(order.total).toFixed(2)}</span></div>
              </div>
            </div>
            {order.address && (<div className="bg-card border border-border rounded-2xl p-6"><div className="flex items-center gap-2 mb-4"><MapPin className="w-5 h-5 text-muted-foreground" /><h3 className="text-lg font-semibold">Shipping Address</h3></div><div className="text-muted-foreground"><p className="font-semibold text-foreground mb-1">{order.address.name}</p><p>{order.address.addressLine1}</p>{order.address.addressLine2 && <p>{order.address.addressLine2}</p>}<p>{order.address.city}, {order.address.state} {order.address.zipCode}</p><p>{order.address.country}</p></div></div>)}
            <div className="bg-card border border-border rounded-2xl p-6"><div className="flex items-center gap-2 mb-4"><CreditCard className="w-5 h-5 text-muted-foreground" /><h3 className="text-lg font-semibold">Payment Method</h3></div><p className="font-semibold">{PAYMENT_LABELS[order.paymentMethod] ?? order.paymentMethod}</p><p className="text-sm text-muted-foreground mt-1">Status: {order.paymentStatus}</p></div>
          </div>
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
                <h3 className="font-semibold text-lg mb-4">What is Next?</h3>
                <Link to="/orders" className="block"><Button className="w-full gap-2 justify-between">View All Orders <ArrowRight className="w-4 h-4" /></Button></Link>
                <Link to="/shop" className="block"><Button variant="outline" className="w-full">Continue Shopping</Button></Link>
                <Separator className="my-4" />
                <div className="space-y-3 text-sm text-muted-foreground">
                  <p className="flex items-start gap-2"><span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 flex-shrink-0" /><span>You will receive shipping updates via email</span></p>
                  <p className="flex items-start gap-2"><span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 flex-shrink-0" /><span>Your order will be delivered by {estimatedDelivery}</span></p>
                  <p className="flex items-start gap-2"><span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 flex-shrink-0" /><span>Free returns within 30 days of delivery</span></p>
                </div>
              </div>
              <div className="bg-secondary/30 border border-border rounded-2xl p-6"><h4 className="font-semibold mb-2">Need Help?</h4><p className="text-sm text-muted-foreground mb-4">Our customer support team is here to assist you.</p><Link to="/contact"><Button variant="link" className="p-0 h-auto text-purple-600 hover:text-purple-700">Contact Support</Button></Link></div>
            </div>
          </div>
        </div>
        <div className="max-w-5xl mx-auto mt-8 text-center text-sm text-muted-foreground">Order placed on {orderDate}</div>
      </div>
      <Footer />
    </div>
  );
}