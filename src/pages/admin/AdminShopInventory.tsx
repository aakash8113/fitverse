import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { productsApi, Product, getTotalStock } from '@/services/api';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/components/ui/use-toast';
import {
  Plus, Search, Edit2, Trash2, Loader2, ImagePlus, ChevronLeft, ChevronRight, X,
} from 'lucide-react';

// â”€â”€â”€ Category Constants â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const GENDERS = [{ value: 'MENS', label: "Men's" }, { value: 'WOMENS', label: "Women's" }];
const WEAR_TYPES = [{ value: 'TOPWEAR', label: 'Topwear' }, { value: 'BOTTOMWEAR', label: 'Bottomwear' }];
const TOPWEAR_CATS = [
  { value: 'TSHIRT', label: 'T-Shirt' }, { value: 'SHIRT', label: 'Shirt' },
  { value: 'HOODIE', label: 'Hoodie' }, { value: 'JACKET', label: 'Jacket' },
];
const BOTTOMWEAR_CATS = [
  { value: 'JEANS', label: 'Jeans' }, { value: 'TROUSER', label: 'Trouser' },
  { value: 'TRACKPANT', label: 'Trackpant' }, { value: 'CARGO', label: 'Cargo' },
];
const SUB_CATS: Record<string, { value: string; label: string }[]> = {
  TSHIRT: [
    { value: 'OVERSIZED', label: 'Oversized' }, { value: 'POLO', label: 'Polo' },
    { value: 'DROP_SHOULDER', label: 'Drop Shoulder' }, { value: 'V_NECK', label: 'V-Neck' },
    { value: 'SHORT_SLEEVED', label: 'Short Sleeved' }, { value: 'LONG_SLEEVED', label: 'Long Sleeved' },
  ],
  SHIRT: [
    { value: 'PRINTED', label: 'Printed' }, { value: 'PLAIN', label: 'Plain' }, { value: 'TEXTURED', label: 'Textured' },
  ],
  JEANS: [
    { value: 'DENIM', label: 'Denim' }, { value: 'SKINNY', label: 'Skinny' },
    { value: 'BAGGY', label: 'Baggy' }, { value: 'BOOT_CUT', label: 'Boot Cut' },
  ],
};
const TOPWEAR_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'];
const BOTTOMWEAR_SIZES = ['26', '28', '30', '32', '34', '36', '38', '40', '42'];

const PAGE_SIZE = 12;

interface ProductFormData {
  name: string;
  description: string;
  price: string;
  sizeStock: Record<string, number>;
  brand: string;
  gender: string;
  wearType: string;
  category: string;
  subCategory: string;
  availableSizes: string[];
}

const emptyForm: ProductFormData = {
  name: '', description: '', price: '', sizeStock: {}, brand: '',
  gender: '', wearType: '', category: '', subCategory: '', availableSizes: [],
};

const AdminShopInventory: React.FC = () => {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [genderFilter, setGenderFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductFormData>(emptyForm);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);
  const [removingImage, setRemovingImage] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'products', search, genderFilter, page],
    queryFn: () =>
      productsApi.getProducts({
        search: search || undefined,
        gender: genderFilter !== 'all' ? genderFilter : undefined,
        page,
        limit: PAGE_SIZE,
      }),
    placeholderData: (previousData) => previousData,
  });

  const rawData = data?.data as any;
  const products: Product[] = rawData?.products || rawData || [];
  const totalPages = rawData?.pagination?.totalPages || 1;

  const getErrorDescription = (e: any): string => {
    const data = e?.response?.data;
    if (data?.errors && Array.isArray(data.errors) && data.errors.length > 0) {
      return data.errors.map((err: { field: string; message: string }) => `${err.field}: ${err.message}`).join('\n');
    }
    return data?.message || 'Something went wrong';
  };

  const createMutation = useMutation({
    mutationFn: (fd: FormData) => productsApi.createProduct(fd),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'products'] });
      toast({ title: 'Product created' });
      setDialogOpen(false);
    },
    onError: (e: any) => toast({ title: 'Validation Error', description: getErrorDescription(e), variant: 'destructive' }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, fd }: { id: string; fd: FormData }) => productsApi.updateProduct(id, fd),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'products'] });
      toast({ title: 'Product updated' });
      setDialogOpen(false);
    },
    onError: (e: any) => toast({ title: 'Validation Error', description: getErrorDescription(e), variant: 'destructive' }),
  });

  const deleteImageMutation = useMutation({
    mutationFn: ({ productId, imagePath }: { productId: string; imagePath: string }) =>
      productsApi.deleteProductImage(productId, imagePath),
    onSuccess: (_data, { imagePath }) => {
      setExistingImages((prev) => prev.filter((img) => img !== imagePath));
      qc.invalidateQueries({ queryKey: ['admin', 'products'] });
    },
    onError: (e: any) => toast({ title: 'Error', description: e?.response?.data?.message || 'Failed to remove image', variant: 'destructive' }),
    onSettled: () => setRemovingImage(null),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => productsApi.deleteProduct(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'products'] });
      toast({ title: 'Product deleted' });
      setDeleteDialogOpen(false);
    },
    onError: (e: any) => toast({ title: 'Error', description: e?.response?.data?.message || 'Failed to delete', variant: 'destructive' }),
  });

  const openCreate = () => {
    setEditingProduct(null);
    setForm(emptyForm);
    setExistingImages([]);
    setNewImageFiles([]);
    setNewImagePreviews([]);
    setDialogOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditingProduct(p);
    setForm({
      name: p.name,
      description: p.description || '',
      price: String(p.price),
      sizeStock: (p.sizeStock as Record<string, number>) || {},
      brand: p.brand || '',
      gender: p.gender || '',
      wearType: p.wearType || '',
      category: p.category || '',
      subCategory: p.subCategory || '',
      availableSizes: p.availableSizes || [],
    });
    setExistingImages(p.images || []);
    setNewImageFiles([]);
    setNewImagePreviews([]);
    setDialogOpen(true);
  };

  const openDelete = (id: string) => {
    setDeletingId(id);
    setDeleteDialogOpen(true);
  };

  const handleImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setNewImageFiles((prev) => [...prev, ...files]);
    setNewImagePreviews((prev) => [...prev, ...files.map((f) => URL.createObjectURL(f))]);
    e.target.value = '';
  };

  const removeNewImage = (index: number) => {
    setNewImageFiles((prev) => prev.filter((_, i) => i !== index));
    setNewImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (imagePath: string) => {
    if (!editingProduct) return;
    setRemovingImage(imagePath);
    deleteImageMutation.mutate({ productId: editingProduct.id, imagePath });
  };

  const setFormField = (field: keyof ProductFormData, value: any) => {
    if (field === 'gender') {
      setForm((f) => ({ ...f, gender: value, wearType: '', category: '', subCategory: '', availableSizes: [] }));
      return;
    }
    if (field === 'wearType') {
      setForm((f) => ({ ...f, wearType: value, category: '', subCategory: '', availableSizes: [], sizeStock: {} }));
      return;
    }
    if (field === 'category') {
      setForm((f) => ({ ...f, category: value, subCategory: '' }));
      return;
    }
    setForm((f) => ({ ...f, [field]: value }));
  };

  const toggleSize = (size: string) => {
    setForm((f) => {
      const removing = f.availableSizes.includes(size);
      const newSizeStock = { ...f.sizeStock };
      if (removing) {
        delete newSizeStock[size];
      } else {
        newSizeStock[size] = 0;
      }
      return {
        ...f,
        availableSizes: removing
          ? f.availableSizes.filter((s) => s !== size)
          : [...f.availableSizes, size],
        sizeStock: newSizeStock,
      };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append('name', form.name);
    fd.append('description', form.description);
    fd.append('price', form.price);
    fd.append('sizeStock', JSON.stringify(form.sizeStock));
    fd.append('brand', form.brand);
    fd.append('gender', form.gender);
    fd.append('wearType', form.wearType);
    fd.append('category', form.category);
    if (form.subCategory) fd.append('subCategory', form.subCategory);
    fd.append('availableSizes', JSON.stringify(form.availableSizes));
    fd.append('isThrift', 'false');
    newImageFiles.forEach((file) => fd.append('images', file));

    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id, fd });
    } else {
      createMutation.mutate(fd);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const categoriesForWearType = form.wearType === 'TOPWEAR' ? TOPWEAR_CATS : form.wearType === 'BOTTOMWEAR' ? BOTTOMWEAR_CATS : [];
  const sizesForWearType = form.wearType === 'TOPWEAR' ? TOPWEAR_SIZES : form.wearType === 'BOTTOMWEAR' ? BOTTOMWEAR_SIZES : [];
  const subCatsForCategory = SUB_CATS[form.category] || [];

  return (
    <AdminLayout>
      <div className="p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Shop Inventory</h1>
            <p className="text-sm text-gray-500 mt-0.5">Manage products, stock, and pricing</p>
          </div>
          <Button size="sm" className="gap-1.5" onClick={openCreate}>
            <Plus className="h-4 w-4" /> Add Product
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search products..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-9 h-9 text-sm"
            />
          </div>
          <Select value={genderFilter} onValueChange={(v) => { setGenderFilter(v); setPage(1); }}>
            <SelectTrigger className="h-9 text-sm w-44">
              <SelectValue placeholder="All genders" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All genders</SelectItem>
              {GENDERS.map((g) => <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-16 text-gray-400">
              <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading products...
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-16 text-gray-400 text-sm">No products found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-500 bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-4 py-3 font-medium">Product</th>
                    <th className="text-left px-4 py-3 font-medium">Gender / Type</th>
                    <th className="text-left px-4 py-3 font-medium">Category</th>
                    <th className="text-left px-4 py-3 font-medium">Price</th>
                    <th className="text-left px-4 py-3 font-medium">Stock</th>
                    <th className="text-left px-4 py-3 font-medium">Status</th>
                    <th className="text-right px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p: Product, idx: number) => (
                    <tr key={p.id} className={`border-b border-gray-100 last:border-0 ${idx % 2 === 0 ? '' : 'bg-gray-50/40'}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded border border-gray-200 bg-gray-100 overflow-hidden shrink-0">
                            {p.images?.[0] ? (
                              <img src={p.images[0]} alt={p.name} className="h-full w-full object-cover" />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-gray-300">
                                <ImagePlus className="h-4 w-4" />
                              </div>
                            )}
                          </div>
                          <span className="font-medium text-gray-800 line-clamp-1">{p.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-xs">
                        {p.gender ? `${p.gender} / ${p.wearType || '—'}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{p.category || '—'}</td>
                      <td className="px-4 py-3 text-gray-900 font-medium">₹{parseFloat(String(p.price)).toFixed(2)}</td>
                      <td className="px-4 py-3 text-gray-700">{getTotalStock(p.sizeStock as Record<string, number>)}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={getTotalStock(p.sizeStock as Record<string, number>) > 0 ? 'active' : 'inactive'} customLabel={getTotalStock(p.sizeStock as Record<string, number>) > 0 ? 'In Stock' : 'Out of Stock'} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEdit(p)}
                            className="text-gray-400 hover:text-gray-700 transition-colors p-1 rounded hover:bg-gray-100"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => openDelete(p.id)}
                            className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded hover:bg-red-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Edit Product' : 'Add Product'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Multi-image upload */}
            <div className="space-y-2">
              <Label className="text-xs">Images {editingProduct ? '(click × to remove existing)' : ''}</Label>
              <div className="flex flex-wrap gap-2">
                {/* Existing images (edit mode) */}
                {existingImages.map((src, i) => (
                  <div key={`ex-${i}`} className="relative h-20 w-20 rounded-lg overflow-hidden border border-gray-200 shrink-0">
                    <img
                      src={src.startsWith('http') ? src : `http://localhost:5000/${src}`}
                      alt={`img ${i + 1}`}
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeExistingImage(src)}
                      disabled={removingImage === src}
                      className="absolute top-0.5 right-0.5 bg-black/60 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center transition-colors"
                    >
                      {removingImage === src
                        ? <Loader2 className="h-3 w-3 animate-spin" />
                        : <X className="h-3 w-3" />}
                    </button>
                  </div>
                ))}
                {/* New staged images */}
                {newImagePreviews.map((src, i) => (
                  <div key={`new-${i}`} className="relative h-20 w-20 rounded-lg overflow-hidden border-2 border-blue-300 shrink-0">
                    <img src={src} alt={`new ${i + 1}`} className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeNewImage(i)}
                      className="absolute top-0.5 right-0.5 bg-black/60 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                    <span className="absolute bottom-0 left-0 right-0 bg-blue-600/70 text-white text-[9px] text-center py-0.5">new</span>
                  </div>
                ))}
                {/* Add more button */}
                {(existingImages.length + newImagePreviews.length) < 8 && (
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="h-20 w-20 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center hover:border-gray-500 transition-colors shrink-0"
                  >
                    <ImagePlus className="h-5 w-5 text-gray-400 mb-0.5" />
                    <span className="text-[10px] text-gray-400">Add</span>
                  </button>
                )}
                <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImagesChange} />
              </div>
              {newImagePreviews.length > 0 && (
                <p className="text-[10px] text-blue-600">{newImagePreviews.length} new image{newImagePreviews.length !== 1 ? 's' : ''} ready to upload</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Name */}
              <div className="col-span-2 space-y-1">
                <Label className="text-xs">Product Name * <span className="text-gray-400">(min 3 chars)</span></Label>
                <Input
                  value={form.name}
                  onChange={(e) => setFormField('name', e.target.value)}
                  required minLength={3}
                  placeholder="e.g. Classic Oversized Tee"
                  className="h-9 text-sm"
                />
              </div>

              {/* Price */}
              <div className="space-y-1">
                <Label className="text-xs">Price (₹) *</Label>
                <Input type="number" min="0" step="0.01" value={form.price}
                  onChange={(e) => setFormField('price', e.target.value)} required className="h-9 text-sm" />
              </div>

              {/* Brand (full width) */}
              <div className="col-span-2 space-y-1">
                <Label className="text-xs">Brand</Label>
                <Input value={form.brand} onChange={(e) => setFormField('brand', e.target.value)}
                  placeholder="e.g. Nike, Zara" className="h-9 text-sm" />
              </div>

              {/* Gender */}
              <div className="space-y-1">
                <Label className="text-xs">Gender *</Label>
                <Select value={form.gender} onValueChange={(v) => setFormField('gender', v)}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {GENDERS.map((g) => <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* WearType */}
              <div className="space-y-1">
                <Label className="text-xs">Type *</Label>
                <Select value={form.wearType} onValueChange={(v) => setFormField('wearType', v)} disabled={!form.gender}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue placeholder={form.gender ? "Select" : "Pick gender first"} /></SelectTrigger>
                  <SelectContent>
                    {WEAR_TYPES.map((w) => <SelectItem key={w.value} value={w.value}>{w.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* Category */}
              <div className="space-y-1">
                <Label className="text-xs">Category *</Label>
                <Select value={form.category} onValueChange={(v) => setFormField('category', v)} disabled={!form.wearType}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue placeholder={form.wearType ? "Select" : "Pick type first"} /></SelectTrigger>
                  <SelectContent>
                    {categoriesForWearType.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* SubCategory */}
              <div className="space-y-1">
                <Label className="text-xs">Style</Label>
                <Select value={form.subCategory} onValueChange={(v) => setFormField('subCategory', v)} disabled={subCatsForCategory.length === 0}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue placeholder={subCatsForCategory.length ? "Select style" : "N/A"} /></SelectTrigger>
                  <SelectContent>
                    {subCatsForCategory.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* Available Sizes + per-size stock */}
              {sizesForWearType.length > 0 && (
                <div className="col-span-2 space-y-2">
                  <Label className="text-xs">Sizes & Stock *</Label>
                  <div className="space-y-2">
                    {sizesForWearType.map((size) => {
                      const checked = form.availableSizes.includes(size);
                      return (
                        <div key={size} className="flex items-center gap-3">
                          <label className="flex items-center gap-1.5 cursor-pointer w-14 shrink-0">
                            <Checkbox
                              checked={checked}
                              onCheckedChange={() => toggleSize(size)}
                              className="h-3.5 w-3.5"
                            />
                            <span className="text-xs font-medium text-gray-700">{size}</span>
                          </label>
                          {checked && (
                            <div className="flex items-center gap-1.5">
                              <Input
                                type="number"
                                min="0"
                                value={form.sizeStock[size] ?? 0}
                                onChange={(e) =>
                                  setForm((f) => ({
                                    ...f,
                                    sizeStock: { ...f.sizeStock, [size]: parseInt(e.target.value) || 0 },
                                  }))
                                }
                                className="h-7 w-20 text-sm text-center"
                              />
                              <span className="text-xs text-gray-400">units</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {form.availableSizes.length > 0 && (
                    <p className="text-[10px] text-gray-500">
                      Total: {Object.values(form.sizeStock).reduce((s, v) => s + v, 0)} units across {form.availableSizes.length} size{form.availableSizes.length !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              )}

              {/* Description */}
              <div className="col-span-2 space-y-1">
                <Label className="text-xs">Description <span className="text-gray-400">(min 10 chars)</span></Label>
                <Textarea
                  value={form.description}
                  onChange={(e) => setFormField('description', e.target.value)}
                  rows={3} minLength={10} required
                  placeholder="Describe the product..."
                  className="text-sm resize-none"
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" size="sm" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isSaving}>
                {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
                {editingProduct ? 'Save Changes' : 'Create Product'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Product?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-500">This action cannot be undone. The product will be permanently removed.</p>
          <DialogFooter className="mt-2">
            <Button variant="outline" size="sm" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive" size="sm"
              disabled={deleteMutation.isPending}
              onClick={() => deletingId && deleteMutation.mutate(deletingId)}
            >
              {deleteMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminShopInventory;
