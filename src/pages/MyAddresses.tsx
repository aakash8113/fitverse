import { useState } from "react";
import { Plus, MapPin, Edit, Trash2 } from "lucide-react";
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

interface Address {
  id: string;
  label: string;
  name: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  isDefault: boolean;
}

export default function MyAddresses() {
  const [addresses, setAddresses] = useState<Address[]>([
    {
      id: "1",
      label: "Home",
      name: "John Doe",
      street: "123 Fashion Street",
      city: "New York",
      state: "NY",
      zip: "10001",
      phone: "(555) 123-4567",
      isDefault: true,
    },
    {
      id: "2",
      label: "Work",
      name: "John Doe",
      street: "456 Business Ave",
      city: "Brooklyn",
      state: "NY",
      zip: "11201",
      phone: "(555) 987-6543",
      isDefault: false,
    },
  ]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);

  const handleDelete = (id: string) => {
    setAddresses(addresses.filter((addr) => addr.id !== id));
  };

  const handleSetDefault = (id: string) => {
    setAddresses(
      addresses.map((addr) => ({
        ...addr,
        isDefault: addr.id === id,
      }))
    );
  };

  const handleEdit = (address: Address) => {
    setEditingAddress(address);
    setIsDialogOpen(true);
  };

  const handleAddNew = () => {
    setEditingAddress(null);
    setIsDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="section-container py-8 lg:py-12">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold mb-2">My Addresses</h1>
              <p className="text-muted-foreground">
                Manage your shipping and billing addresses
              </p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={handleAddNew} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Address
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>
                    {editingAddress ? "Edit Address" : "Add New Address"}
                  </DialogTitle>
                  <DialogDescription>
                    Fill in the details for your {editingAddress ? "address" : "new address"}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="label">Address Label</Label>
                    <Input
                      id="label"
                      placeholder="e.g., Home, Work, Office"
                      defaultValue={editingAddress?.label}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      placeholder="John Doe"
                      defaultValue={editingAddress?.name}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="(555) 123-4567"
                      defaultValue={editingAddress?.phone}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="street">Street Address</Label>
                    <Input
                      id="street"
                      placeholder="123 Fashion Street"
                      defaultValue={editingAddress?.street}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        placeholder="New York"
                        defaultValue={editingAddress?.city}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">State</Label>
                      <Select defaultValue={editingAddress?.state}>
                        <SelectTrigger id="state">
                          <SelectValue placeholder="Select state" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="NY">New York</SelectItem>
                          <SelectItem value="CA">California</SelectItem>
                          <SelectItem value="TX">Texas</SelectItem>
                          <SelectItem value="FL">Florida</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zip">ZIP Code</Label>
                    <Input
                      id="zip"
                      placeholder="10001"
                      defaultValue={editingAddress?.zip}
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <Button onClick={() => setIsDialogOpen(false)} className="flex-1">
                      {editingAddress ? "Save Changes" : "Add Address"}
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {addresses.map((address) => (
              <div
                key={address.id}
                className="glass rounded-2xl border border-border/50 p-6 relative group"
              >
                {address.isDefault && (
                  <Badge className="absolute top-4 right-4 bg-accent/10 text-accent border-accent/20">
                    Default
                  </Badge>
                )}
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapPin className="h-5 w-5 text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg mb-1">{address.label}</h3>
                    <div className="text-sm text-muted-foreground space-y-0.5">
                      <p className="font-medium text-foreground">{address.name}</p>
                      <p>{address.street}</p>
                      <p>
                        {address.city}, {address.state} {address.zip}
                      </p>
                      <p>{address.phone}</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  {!address.isDefault && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSetDefault(address.id)}
                      className="flex-1"
                    >
                      Set as Default
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(address)}
                    className="gap-2"
                  >
                    <Edit className="h-3.5 w-3.5" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(address.id)}
                    className="gap-2 text-red-600 hover:text-red-700 hover:border-red-300"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {addresses.length === 0 && (
            <div className="text-center py-16 glass rounded-2xl border border-border/50">
              <MapPin className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">No Addresses Saved</h3>
              <p className="text-muted-foreground mb-6">
                Add your first address to make checkout faster
              </p>
              <Button onClick={handleAddNew} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Address
              </Button>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
