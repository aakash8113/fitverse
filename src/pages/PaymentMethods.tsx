import { useState } from "react";
import { Plus, CreditCard, Trash2, Edit, Check } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface PaymentMethod {
  id: string;
  type: "visa" | "mastercard" | "amex" | "discover";
  lastFour: string;
  expiryMonth: string;
  expiryYear: string;
  holderName: string;
  isDefault: boolean;
}

const cardTypeImages = {
  visa: "🟦",
  mastercard: "🟧",
  amex: "🟦",
  discover: "🟧",
};

export default function PaymentMethods() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
    {
      id: "1",
      type: "visa",
      lastFour: "4242",
      expiryMonth: "12",
      expiryYear: "2027",
      holderName: "John Doe",
      isDefault: true,
    },
    {
      id: "2",
      type: "mastercard",
      lastFour: "5555",
      expiryMonth: "08",
      expiryYear: "2026",
      holderName: "John Doe",
      isDefault: false,
    },
  ]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<PaymentMethod | null>(null);

  const handleDelete = (id: string) => {
    setPaymentMethods(paymentMethods.filter((pm) => pm.id !== id));
  };

  const handleSetDefault = (id: string) => {
    setPaymentMethods(
      paymentMethods.map((pm) => ({
        ...pm,
        isDefault: pm.id === id,
      }))
    );
  };

  const handleEdit = (card: PaymentMethod) => {
    setEditingCard(card);
    setIsDialogOpen(true);
  };

  const handleAddNew = () => {
    setEditingCard(null);
    setIsDialogOpen(true);
  };

  const getCardTypeName = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="section-container py-8 lg:py-12">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold mb-2">Payment Methods</h1>
              <p className="text-muted-foreground">
                Manage your saved payment methods for faster checkout
              </p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={handleAddNew} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Card
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>
                    {editingCard ? "Edit Payment Method" : "Add New Card"}
                  </DialogTitle>
                  <DialogDescription>
                    Enter your card details securely. We use industry-standard encryption.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="cardNumber">Card Number</Label>
                    <Input
                      id="cardNumber"
                      placeholder="1234 5678 9012 3456"
                      maxLength={19}
                      defaultValue={editingCard ? `•••• •••• •••• ${editingCard.lastFour}` : ""}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="holderName">Cardholder Name</Label>
                    <Input
                      id="holderName"
                      placeholder="John Doe"
                      defaultValue={editingCard?.holderName}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2 col-span-1">
                      <Label htmlFor="expiryMonth">Exp. Month</Label>
                      <Select defaultValue={editingCard?.expiryMonth || "01"}>
                        <SelectTrigger id="expiryMonth">
                          <SelectValue placeholder="MM" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 12 }, (_, i) => {
                            const month = (i + 1).toString().padStart(2, "0");
                            return (
                              <SelectItem key={month} value={month}>
                                {month}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2 col-span-1">
                      <Label htmlFor="expiryYear">Exp. Year</Label>
                      <Select defaultValue={editingCard?.expiryYear || "2026"}>
                        <SelectTrigger id="expiryYear">
                          <SelectValue placeholder="YYYY" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 10 }, (_, i) => {
                            const year = (2026 + i).toString();
                            return (
                              <SelectItem key={year} value={year}>
                                {year}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2 col-span-1">
                      <Label htmlFor="cvv">CVV</Label>
                      <Input id="cvv" placeholder="123" maxLength={4} type="password" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cardType">Card Type</Label>
                    <Select defaultValue={editingCard?.type || "visa"}>
                      <SelectTrigger id="cardType">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="visa">Visa</SelectItem>
                        <SelectItem value="mastercard">Mastercard</SelectItem>
                        <SelectItem value="amex">American Express</SelectItem>
                        <SelectItem value="discover">Discover</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button onClick={() => setIsDialogOpen(false)} className="flex-1">
                      {editingCard ? "Save Changes" : "Add Card"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Security Notice */}
          <div className="glass rounded-2xl border border-border/50 p-4 mb-6 bg-accent/5">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <CreditCard className="h-4 w-4 text-accent" />
              </div>
              <div className="text-sm">
                <p className="font-semibold mb-1">Your payment information is secure</p>
                <p className="text-muted-foreground">
                  We use industry-standard encryption to protect your payment data. Card
                  numbers are tokenized and never stored in plain text.
                </p>
              </div>
            </div>
          </div>

          {/* Payment Methods List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {paymentMethods.map((card) => (
              <div
                key={card.id}
                className="glass rounded-2xl border border-border/50 p-6 relative group"
              >
                {card.isDefault && (
                  <Badge className="absolute top-4 right-4 bg-accent/10 text-accent border-accent/20 gap-1">
                    <Check className="h-3 w-3" />
                    Default
                  </Badge>
                )}

                <div className="mb-6">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center flex-shrink-0 text-2xl">
                      {cardTypeImages[card.type]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg mb-1">
                        {getCardTypeName(card.type)}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        •••• •••• •••• {card.lastFour}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Cardholder</span>
                      <span className="font-medium">{card.holderName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Expires</span>
                      <span className="font-medium">
                        {card.expiryMonth}/{card.expiryYear}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  {!card.isDefault && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSetDefault(card.id)}
                      className="flex-1"
                    >
                      Set as Default
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(card)}
                    className="gap-2"
                  >
                    <Edit className="h-3.5 w-3.5" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(card.id)}
                    className="gap-2 text-red-600 hover:text-red-700 hover:border-red-300"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {paymentMethods.length === 0 && (
            <div className="text-center py-16 glass rounded-2xl border border-border/50">
              <CreditCard className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">No Payment Methods Saved</h3>
              <p className="text-muted-foreground mb-6">
                Add a payment method to make checkout faster and easier
              </p>
              <Button onClick={handleAddNew} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Your First Card
              </Button>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
