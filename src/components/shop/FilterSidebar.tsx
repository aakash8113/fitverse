import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Category data ──────────────────────────────────────────────────────────

const TOPWEAR_CATEGORIES = [
  { value: 'TSHIRT',    label: 'T-Shirt' },
  { value: 'SHIRT',     label: 'Shirt' },
  { value: 'HOODIE',    label: 'Hoodie' },
  { value: 'JACKET',    label: 'Jacket' },
];

const BOTTOMWEAR_CATEGORIES = [
  { value: 'JEANS',     label: 'Jeans' },
  { value: 'TROUSER',   label: 'Trouser' },
  { value: 'TRACKPANT', label: 'Trackpant' },
  { value: 'CARGO',     label: 'Cargo' },
];

const SUBCATEGORIES: Record<string, { value: string; label: string }[]> = {
  TSHIRT: [
    { value: 'OVERSIZED',    label: 'Oversized' },
    { value: 'POLO',         label: 'Polo' },
    { value: 'DROP_SHOULDER',label: 'Drop Shoulder' },
    { value: 'V_NECK',       label: 'V-Neck' },
    { value: 'SHORT_SLEEVED',label: 'Short Sleeved' },
    { value: 'LONG_SLEEVED', label: 'Long Sleeved' },
  ],
  SHIRT: [
    { value: 'PRINTED',  label: 'Printed' },
    { value: 'PLAIN',    label: 'Plain' },
    { value: 'TEXTURED', label: 'Textured' },
  ],
  JEANS: [
    { value: 'DENIM',    label: 'Denim' },
    { value: 'SKINNY',   label: 'Skinny' },
    { value: 'BAGGY',    label: 'Baggy' },
    { value: 'BOOT_CUT', label: 'Boot Cut' },
  ],
};

const TOPWEAR_SIZES  = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'];
const BOTTOMWEAR_SIZES = ['28', '30', '32', '34', '36', '38', '40', '42'];

// ── FilterSection ──────────────────────────────────────────────────────────

interface FilterSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function FilterSection({ title, children, defaultOpen = true }: FilterSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-border/50 py-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between text-sm font-medium"
      >
        {title}
        <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
      </button>
      {isOpen && <div className="mt-4 space-y-2">{children}</div>}
    </div>
  );
}

// ── Props ──────────────────────────────────────────────────────────────────

export interface ShopFilters {
  gender?: string;
  wearType?: string;
  category?: string;
  subCategory?: string;
  size?: string;
  minPrice?: number;
  maxPrice?: number;
}

interface FilterSidebarProps {
  className?: string;
  onClose?: () => void;
  onFilterChange?: (filters: ShopFilters) => void;
  onPriceRangeChange?: (min: number, max: number) => void;
  currentFilters?: ShopFilters;
  /** @deprecated use onFilterChange */
  onCategoryChange?: (category: string | undefined) => void;
  /** @deprecated use onFilterChange */
  onSizeChange?: (sizes: string[]) => void;
  defaultCategory?: string;
}

// ── Pill button ────────────────────────────────────────────────────────────

function Pill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-3 py-1.5 text-sm border rounded-lg transition-colors w-full text-left",
        active
          ? "bg-primary text-primary-foreground border-primary"
          : "border-border hover:border-foreground"
      )}
    >
      {label}
    </button>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

export function FilterSidebar({
  className,
  onClose,
  onFilterChange,
  onPriceRangeChange,
  currentFilters,
  defaultCategory,
}: FilterSidebarProps) {
  const [minInput, setMinInput] = useState("");
  const [maxInput, setMaxInput] = useState("");
  const [priceApplied, setPriceApplied] = useState(false);

  const [gender,      setGender]      = useState<string | undefined>();
  const [wearType,    setWearType]    = useState<string | undefined>();
  const [category,    setCategory]    = useState<string | undefined>();
  const [subCategory, setSubCategory] = useState<string | undefined>();
  const [size,        setSize]        = useState<string | undefined>();

  useEffect(() => {
    setGender(currentFilters?.gender);
    setWearType(currentFilters?.wearType);
    setCategory(currentFilters?.category);
    setSubCategory(currentFilters?.subCategory);
    setSize(currentFilters?.size);
  }, [
    currentFilters?.gender,
    currentFilters?.wearType,
    currentFilters?.category,
    currentFilters?.subCategory,
    currentFilters?.size,
  ]);

  const emit = (patch: Partial<ShopFilters>) => {
    const next: ShopFilters = {
      gender, wearType, category, subCategory, size, ...patch,
    };
    onFilterChange?.(next);
  };

  const toggleGender = (g: string) => {
    const next = gender === g ? undefined : g;
    setGender(next);
    // Reset everything below
    setWearType(undefined); setCategory(undefined); setSubCategory(undefined); setSize(undefined);
    emit({ gender: next, wearType: undefined, category: undefined, subCategory: undefined, size: undefined });
  };

  const toggleWearType = (wt: string) => {
    const next = wearType === wt ? undefined : wt;
    setWearType(next);
    setCategory(undefined); setSubCategory(undefined); setSize(undefined);
    emit({ wearType: next, category: undefined, subCategory: undefined, size: undefined });
  };

  const toggleCategory = (cat: string) => {
    const next = category === cat ? undefined : cat;
    setCategory(next);
    setSubCategory(undefined);
    emit({ category: next, subCategory: undefined });
  };

  const toggleSubCategory = (sc: string) => {
    const next = subCategory === sc ? undefined : sc;
    setSubCategory(next);
    emit({ subCategory: next });
  };

  const toggleSize = (s: string) => {
    const next = size === s ? undefined : s;
    setSize(next);
    emit({ size: next });
  };

  const handleApplyPrice = () => {
    const min = minInput === "" ? 0 : Math.max(0, Number(minInput));
    const max = maxInput === "" ? 999999 : Math.max(min, Number(maxInput));
    onPriceRangeChange?.(min, max);
    emit({ minPrice: min > 0 ? min : undefined, maxPrice: max < 999999 ? max : undefined });
    setPriceApplied(minInput !== "" || maxInput !== "");
  };

  const handleClearPrice = () => {
    setMinInput(""); setMaxInput(""); setPriceApplied(false);
    onPriceRangeChange?.(0, 999999);
    emit({ minPrice: undefined, maxPrice: undefined });
  };

  const clearAll = () => {
    setGender(undefined); setWearType(undefined); setCategory(undefined);
    setSubCategory(undefined); setSize(undefined);
    setMinInput(""); setMaxInput(""); setPriceApplied(false);
    onPriceRangeChange?.(0, 999999);
    onFilterChange?.({});
  };

  const hasFilters = !!gender || !!wearType || !!category || !!subCategory || !!size || priceApplied;

  const sizeList = wearType === 'TOPWEAR' ? TOPWEAR_SIZES : wearType === 'BOTTOMWEAR' ? BOTTOMWEAR_SIZES : [];
  const categoryList = wearType === 'TOPWEAR' ? TOPWEAR_CATEGORIES : wearType === 'BOTTOMWEAR' ? BOTTOMWEAR_CATEGORIES : [];
  const subCategoryList = category ? (SUBCATEGORIES[category] || []) : [];

  return (
    <div className={cn("dark:bg-[#121212]", className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-lg">Filters</h3>
        <div className="flex items-center gap-2">
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearAll} className="text-xs">
              Clear all
            </Button>
          )}
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose} className="lg:hidden">
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>

      {/* ── Gender ── */}
      <FilterSection title="Gender">
        <div className="grid grid-cols-2 gap-2">
          {[{ value: 'MENS', label: 'Men' }, { value: 'WOMENS', label: 'Women' }].map((g) => (
            <Pill key={g.value} label={g.label} active={gender === g.value} onClick={() => toggleGender(g.value)} />
          ))}
        </div>
      </FilterSection>

      {/* ── Wear Type ── (always visible) */}
      <FilterSection title="Wear Type">
          <div className="grid grid-cols-2 gap-2">
            {[{ value: 'TOPWEAR', label: 'Topwear' }, { value: 'BOTTOMWEAR', label: 'Bottomwear' }].map((wt) => (
              <Pill key={wt.value} label={wt.label} active={wearType === wt.value} onClick={() => toggleWearType(wt.value)} />
            ))}
          </div>
        </FilterSection>

      {/* ── Category ── (only after wearType selected) */}
      {wearType && categoryList.length > 0 && (
        <FilterSection title="Category">
          <div className="space-y-1.5">
            {categoryList.map((cat) => (
              <Pill key={cat.value} label={cat.label} active={category === cat.value} onClick={() => toggleCategory(cat.value)} />
            ))}
          </div>
        </FilterSection>
      )}

      {/* ── Sub-Category ── (only if selected category has subs) */}
      {subCategoryList.length > 0 && (
        <FilterSection title="Style">
          <div className="flex flex-wrap gap-2">
            {subCategoryList.map((sc) => (
              <button
                key={sc.value}
                onClick={() => toggleSubCategory(sc.value)}
                className={cn(
                  "px-2.5 py-1 text-xs border rounded-full transition-colors",
                  subCategory === sc.value
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border hover:border-foreground"
                )}
              >
                {sc.label}
              </button>
            ))}
          </div>
        </FilterSection>
      )}

      {/* ── Size ── (only after wearType chosen — sizes depend on it) */}
      {sizeList.length > 0 && (
        <FilterSection title="Size">
          <div className="flex flex-wrap gap-2">
            {sizeList.map((s) => (
              <button
                key={s}
                onClick={() => toggleSize(s)}
                className={cn(
                  "min-w-[2.5rem] px-2.5 py-1.5 text-sm border rounded-lg transition-colors",
                  size === s
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border hover:border-foreground"
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </FilterSection>
      )}

      {/* ── Price Range ── */}
      <FilterSection title="Price Range (₹)">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
              <Input
                type="number"
                min={0}
                placeholder="Min"
                value={minInput}
                onChange={(e) => setMinInput(e.target.value)}
                className="pl-6 h-8 text-sm"
              />
            </div>
            <span className="text-muted-foreground text-sm flex-shrink-0">–</span>
            <div className="relative flex-1">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
              <Input
                type="number"
                min={0}
                placeholder="Max"
                value={maxInput}
                onChange={(e) => setMaxInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleApplyPrice()}
                className="pl-6 h-8 text-sm"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" className="flex-1 h-8 text-xs" onClick={handleApplyPrice}>
              Apply
            </Button>
            {priceApplied && (
              <Button size="sm" variant="outline" className="h-8 text-xs px-3" onClick={handleClearPrice}>
                Clear
              </Button>
            )}
          </div>
        </div>
      </FilterSection>
    </div>
  );
}