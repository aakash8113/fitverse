import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import {
  Plus, Trash2, Upload, X, ChevronLeft, CheckCircle, Loader2,
  Package, Tag, Ruler, Sparkles, FileText, DollarSign, AlertCircle,
} from 'lucide-react';
import { thriftApi, ThriftItemFormData } from '@/services/api';
import { cn } from '@/lib/utils';

// ─── Constants ──────────────────────────────────────────────────────────────

const CATEGORIES = [
  { value: 'TOPS', label: 'Tops / T-Shirts / Shirts' },
  { value: 'BOTTOMS', label: 'Bottoms / Pants / Jeans' },
  { value: 'DRESSES', label: 'Dresses / Skirts' },
  { value: 'OUTERWEAR', label: 'Jackets / Coats / Hoodies' },
  { value: 'FOOTWEAR', label: 'Shoes / Sneakers / Sandals' },
  { value: 'ACCESSORIES', label: 'Accessories / Belts / Scarves' },
  { value: 'SPORTSWEAR', label: 'Sportswear / Activewear' },
  { value: 'ETHNIC', label: 'Ethnic Wear / Kurtas / Sarees' },
  { value: 'BAGS', label: 'Bags / Backpacks / Purses' },
  { value: 'OTHER', label: 'Other' },
];

const CONDITIONS = [
  { value: 'LIKE_NEW', label: 'Like New', desc: 'Worn once or never. No visible signs of use.' },
  { value: 'VERY_GOOD', label: 'Very Good', desc: 'Minor signs of wear. Excellent condition overall.' },
  { value: 'GOOD', label: 'Good', desc: 'Some signs of use but well maintained.' },
  { value: 'FAIR', label: 'Fair', desc: 'Visible wear. Functional and wearable.' },
  { value: 'POOR', label: 'Poor', desc: 'Heavy wear, stains, or damage. Still sellable.' },
];

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', 'Free Size', 'UK6', 'UK7', 'UK8', 'UK9', 'UK10', 'UK11', 'UK12', 'Other'];

const emptyItem = (): ThriftItemFormData => ({
  name: '', brand: '', category: '', size: '', condition: '',
  description: '', originalPrice: '', images: [], previewUrls: [],
});

// ─── Condition Badge ─────────────────────────────────────────────────────────

const conditionColors: Record<string, string> = {
  LIKE_NEW: 'bg-green-100 text-green-700',
  VERY_GOOD: 'bg-teal-100 text-teal-700',
  GOOD: 'bg-blue-100 text-blue-700',
  FAIR: 'bg-yellow-100 text-yellow-700',
  POOR: 'bg-red-100 text-red-700',
};

// ─── Image Upload Zone ───────────────────────────────────────────────────────

interface ImageUploaderProps {
  previews: string[];
  onChange: (files: File[], previews: string[]) => void;
}

function ImageUploader({ previews, onChange }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (newFiles: FileList | null) => {
    if (!newFiles) return;
    const arr = Array.from(newFiles).slice(0, 5 - previews.length);
    const urls = arr.map((f) => URL.createObjectURL(f));
    // Pass complete list so parent can diff correctly
    onChange(arr, [...previews, ...urls]);
  };

  const removeImage = (idx: number) => {
    const updatedPreviews = previews.filter((_, i) => i !== idx);
    onChange([], updatedPreviews);
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {previews.map((url, i) => (
          <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200 group">
            <img src={url} alt="" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => removeImage(i)}
              className="absolute top-0.5 right-0.5 bg-black/60 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="h-3 w-3 text-white" />
            </button>
          </div>
        ))}
        {previews.length < 5 && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:border-green-500 transition-colors text-gray-400 hover:text-green-600"
          >
            <Upload className="h-5 w-5 mb-1" />
            <span className="text-[10px]">Add Photo</span>
          </button>
        )}
      </div>
      <p className="text-xs text-gray-400">Up to 5 photos per item. Clear, well-lit photos get better offers.</p>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}

// ─── Single Item Card ────────────────────────────────────────────────────────

interface ItemCardProps {
  item: ThriftItemFormData;
  index: number;
  total: number;
  onChange: (updated: ThriftItemFormData) => void;
  onRemove: () => void;
}

function ItemCard({ item, index, total, onChange, onRemove }: ItemCardProps) {
  const set = (field: keyof ThriftItemFormData, value: string) =>
    onChange({ ...item, [field]: value });

  // Single handler: allPreviews is always the COMPLETE desired list after the action.
  // newFiles contains only the newly added File objects (empty on remove).
  const handleImageChange = (newFiles: File[], allPreviews: string[]) => {
    const removed = item.previewUrls.filter((p) => !allPreviews.includes(p));
    const kept = item.images.filter((_, i) => !removed.includes(item.previewUrls[i]));
    onChange({ ...item, images: [...kept, ...newFiles], previewUrls: allPreviews });
  };

  const cond = CONDITIONS.find((c) => c.value === item.condition);

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
      {/* Card header */}
      <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-full bg-green-600 text-white flex items-center justify-center text-xs font-bold">
            {index + 1}
          </div>
          <span className="font-medium text-sm text-gray-700">
            {item.name ? item.name : `Item ${index + 1}`}
          </span>
          {item.condition && (
            <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', conditionColors[item.condition])}>
              {cond?.label}
            </span>
          )}
        </div>
        {total > 1 && (
          <button type="button" onClick={onRemove} className="text-gray-400 hover:text-red-500 transition-colors">
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Form fields */}
      <div className="p-5 space-y-4">
        {/* Row: Name + Brand */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium flex items-center gap-1">
              <Package className="h-3 w-3" /> Item Name *
            </Label>
            <Input
              value={item.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="e.g. Vintage Levi's Denim Jacket"
              required
              minLength={3}
              className="h-9 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium flex items-center gap-1">
              <Tag className="h-3 w-3" /> Brand
            </Label>
            <Input
              value={item.brand}
              onChange={(e) => set('brand', e.target.value)}
              placeholder="e.g. Nike, Zara, H&M"
              className="h-9 text-sm"
            />
          </div>
        </div>

        {/* Row: Category + Size */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Category *</Label>
            <Select value={item.category} onValueChange={(v) => set('category', v)}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium flex items-center gap-1">
              <Ruler className="h-3 w-3" /> Size
            </Label>
            <Select value={item.size} onValueChange={(v) => set('size', v)}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Select size" />
              </SelectTrigger>
              <SelectContent>
                {SIZES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Condition */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium flex items-center gap-1">
            <Sparkles className="h-3 w-3" /> Condition *
          </Label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {CONDITIONS.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => set('condition', c.value)}
                className={cn(
                  'border rounded-lg p-2 text-xs text-left transition-all',
                  item.condition === c.value
                    ? 'border-green-600 bg-green-50 text-green-700 ring-1 ring-green-400'
                    : 'border-gray-200 hover:border-gray-400 text-gray-600'
                )}
              >
                <div className="font-semibold mb-0.5">{c.label}</div>
                <div className="text-[10px] leading-tight opacity-80">{c.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium flex items-center gap-1">
            <FileText className="h-3 w-3" /> Description * <span className="text-gray-400">(min 20 chars)</span>
          </Label>
          <Textarea
            value={item.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="Describe the item in detail — any flaws, why you're selling, original purchase info, etc."
            rows={3}
            minLength={20}
            required
            className="text-sm resize-none"
          />
        </div>

        {/* Original Price */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium flex items-center gap-1">
            <DollarSign className="h-3 w-3" /> Original Purchase Price (₹) <span className="text-gray-400">optional</span>
          </Label>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={item.originalPrice}
            onChange={(e) => set('originalPrice', e.target.value)}
            placeholder="What did you originally pay?"
            className="h-9 text-sm max-w-xs"
          />
          <p className="text-xs text-gray-400">
            Helps our team determine your fair estimated value.
          </p>
        </div>

        {/* Photos */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium flex items-center gap-1">
            <Upload className="h-3 w-3" /> Photos
          </Label>
          <ImageUploader
            previews={item.previewUrls}
            onChange={handleImageChange}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Success Screen ──────────────────────────────────────────────────────────

function SuccessScreen({ listingId }: { listingId: string }) {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-md px-6 py-12">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Listing Submitted!</h1>
          <p className="text-gray-500 mb-2">
            Your items have been submitted for review. Our team will assess each item and get back to you within <strong>1–2 business days</strong>.
          </p>
          <p className="text-gray-500 mb-8 text-sm">
            Once approved, we'll schedule a pickup and set estimated values for your items. You'll be able to track everything in <strong>My Listings</strong>.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={() => navigate('/thrift/my-listings')}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Track My Listings
            </Button>
            <Button variant="outline" onClick={() => navigate('/thrift')}>
              Back to Thrift Store
            </Button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function ThriftSell() {
  const navigate = useNavigate();
  const [items, setItems] = useState<ThriftItemFormData[]>([emptyItem()]);
  const [submittedId, setSubmittedId] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async (itemsData: ThriftItemFormData[]) => {
      // Build FormData: JSON items array + individual image files
      const fd = new FormData();
      const payload = itemsData.map(({ images: _imgs, previewUrls: _prev, ...rest }) => rest);
      fd.append('items', JSON.stringify(payload));
      itemsData.forEach((item, idx) => {
        item.images.forEach((file) => {
          fd.append(`item_images_${idx}`, file);
        });
      });
      return thriftApi.createListing(fd);
    },
    onSuccess: (res) => {
      if (res.success && res.data) {
        setSubmittedId(res.data.id);
      }
    },
    onError: (e: any) => {
      const msg = e?.response?.data?.message || 'Failed to submit listing. Please try again.';
      toast({ title: 'Submission Failed', description: msg, variant: 'destructive' });
    },
  });

  const addItem = () => {
    if (items.length >= 10) {
      toast({ title: 'Maximum 10 items per submission', description: 'Submit this batch and create another listing for more.' });
      return;
    }
    setItems((prev) => [...prev, emptyItem()]);
  };

  const removeItem = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateItem = (idx: number, updated: ThriftItemFormData) => {
    setItems((prev) => prev.map((item, i) => (i === idx ? updated : item)));
  };

  const validate = (): string | null => {
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (!it.name || it.name.length < 3) return `Item ${i + 1}: name must be at least 3 characters`;
      if (!it.category) return `Item ${i + 1}: please select a category`;
      if (!it.condition) return `Item ${i + 1}: please select a condition`;
      if (!it.description || it.description.length < 20)
        return `Item ${i + 1}: description must be at least 20 characters`;
    }
    return null;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (err) {
      toast({ title: 'Please fix errors', description: err, variant: 'destructive' });
      return;
    }
    mutation.mutate(items);
  };

  if (submittedId) return <SuccessScreen listingId={submittedId} />;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-5">
          <button
            onClick={() => navigate('/thrift')}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-4 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" /> Back to Thrift Store
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Sell Your Pre-Loved Items</h1>
          <p className="text-gray-500 mt-1 text-sm">
            List up to 10 items in one submission. Add details and photos for a better offer from our team.
          </p>
        </div>
      </div>

      {/* How it works */}
      <div className="bg-green-50 border-b border-green-100">
        <div className="max-w-3xl mx-auto md:max-w-none px-4 sm:px-6 md:px-16 py-5 md:flex md:flex-col md:items-center">
          <p className="text-xs md:text-sm font-semibold text-green-800 uppercase tracking-widest mb-4 md:text-center">How it works</p>
          <div className="flex items-start md:w-full md:max-w-3xl">
            {[
              { step: '1', title: 'List Items', desc: 'Fill in details & photos' },
              { step: '2', title: 'Get Reviewed', desc: 'Admin reviews in 1–2 days' },
              { step: '3', title: 'We Pick Up', desc: 'Scheduled at your convenience' },
              { step: '4', title: 'Earn Cash', desc: 'Get paid for your items' },
            ].map((s, i, arr) => (
              <React.Fragment key={s.step}>
                {/* Step circle + label — fixed width, centered */}
                <div className="flex flex-col items-center shrink-0">
                  <div className="h-9 w-9 md:h-14 md:w-14 rounded-full bg-green-600 text-white flex items-center justify-center font-bold text-sm md:text-xl shadow-sm">
                    {s.step}
                  </div>
                  <p className="mt-2 text-xs md:text-sm font-semibold text-green-800 whitespace-nowrap">{s.title}</p>
                  <p className="text-[10px] md:text-xs text-green-600 text-center leading-tight max-w-[80px] md:max-w-[120px]">{s.desc}</p>
                </div>
                {/* Connector line — grows to fill equal space between circles */}
                {i < arr.length - 1 && (
                  <div className="flex-1 h-0.5 bg-green-300 mt-4 md:mt-7 mx-2 md:mx-3 shrink" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Notice */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 mt-5">
        <div className="flex gap-3 bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <p>
            Estimated values are set by our team during review. We aim to offer <strong>40–60% of resale value</strong> based on condition and demand.
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        {items.map((item, idx) => (
          <ItemCard
            key={idx}
            item={item}
            index={idx}
            total={items.length}
            onChange={(updated) => updateItem(idx, updated)}
            onRemove={() => removeItem(idx)}
          />
        ))}

        {/* Add item button */}
        {items.length < 10 && (
          <button
            type="button"
            onClick={addItem}
            className="w-full border-2 border-dashed border-gray-300 rounded-xl py-4 flex items-center justify-center gap-2 text-gray-500 hover:border-green-500 hover:text-green-600 hover:bg-green-50 transition-all"
          >
            <Plus className="h-5 w-5" />
            <span className="font-medium">Add Another Item</span>
            <span className="text-xs text-gray-400">({items.length}/10)</span>
          </button>
        )}

        {/* Submit */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 pb-8">
          <p className="text-sm text-gray-500">
            {items.length} item{items.length !== 1 ? 's' : ''} in this submission
          </p>
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={() => navigate('/thrift')}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending}
              className="bg-green-600 hover:bg-green-700 text-white min-w-[160px]"
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" /> Submitting…
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" /> Submit Listing
                </>
              )}
            </Button>
          </div>
        </div>
      </form>

      <Footer />
    </div>
  );
}
