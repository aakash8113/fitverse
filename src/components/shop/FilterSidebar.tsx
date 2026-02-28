import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";

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
      {isOpen && <div className="mt-4 space-y-3">{children}</div>}
    </div>
  );
}

interface FilterOption {
  id: string;
  label: string;
  count?: number;
}

interface FilterSidebarProps {
  className?: string;
  onClose?: () => void;
  onCategoryChange?: (category: string | undefined) => void;
  onPriceRangeChange?: (min: number, max: number) => void;
  onSizeChange?: (sizes: string[]) => void;
  defaultCategory?: string;
}

// Only 3 gender categories; IDs match backend enum values exactly
const categories: FilterOption[] = [
  { id: "MEN",    label: "Men" },
  { id: "WOMEN",  label: "Women" },
  { id: "UNISEX", label: "Unisex" },
];

const sizes: FilterOption[] = [
  { id: "xs", label: "XS" },
  { id: "s", label: "S" },
  { id: "m", label: "M" },
  { id: "l", label: "L" },
  { id: "xl", label: "XL" },
  { id: "xxl", label: "XXL" },
];

export function FilterSidebar({ className, onClose, onCategoryChange, onPriceRangeChange, onSizeChange, defaultCategory }: FilterSidebarProps) {
  const [minInput, setMinInput] = useState("");
  const [maxInput, setMaxInput] = useState("");
  const [priceApplied, setPriceApplied] = useState(false);
  // Single-select: null means "All"
  const [selectedCategory, setSelectedCategory] = useState<string | null>(defaultCategory ?? null);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);

  const handleSizeToggle = (id: string) => {
    const next = selectedSizes.includes(id)
      ? selectedSizes.filter((s) => s !== id)
      : [...selectedSizes, id];
    setSelectedSizes(next);
    if (onSizeChange) onSizeChange(next);
  };

  // Single-select: clicking the same category deselects it
  const handleCategoryToggle = (id: string) => {
    const next = selectedCategory === id ? null : id;
    setSelectedCategory(next);
    if (onCategoryChange) {
      onCategoryChange(next ?? undefined);
    }
  };

  const handleApplyPrice = () => {
    const min = minInput === "" ? 0 : Math.max(0, Number(minInput));
    const max = maxInput === "" ? undefined : Math.max(min, Number(maxInput));
    if (onPriceRangeChange) {
      onPriceRangeChange(min, max ?? 999999);
    }
    setPriceApplied(minInput !== "" || maxInput !== "");
  };

  const handleClearPrice = () => {
    setMinInput("");
    setMaxInput("");
    setPriceApplied(false);
    if (onPriceRangeChange) {
      onPriceRangeChange(0, 999999);
    }
  };

  const clearAll = () => {
    setSelectedCategory(null);
    setSelectedSizes([]);
    setMinInput("");
    setMaxInput("");
    setPriceApplied(false);
    if (onCategoryChange) onCategoryChange(undefined);
    if (onPriceRangeChange) onPriceRangeChange(0, 999999);
    if (onSizeChange) onSizeChange([]);
  };

  const hasFilters =
    selectedCategory !== null ||
    selectedSizes.length > 0 ||
    priceApplied;

  return (
    <div className={cn("bg-background", className)}>
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

      {/* Category — single-select */}
      <FilterSection title="Category">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => handleCategoryToggle(category.id)}
            className={cn(
              "w-full text-left px-3 py-1.5 text-sm rounded-lg border transition-colors",
              selectedCategory === category.id
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border hover:border-foreground"
            )}
          >
            {category.label}
          </button>
        ))}
      </FilterSection>

      {/* Size */}
      <FilterSection title="Size">
        <div className="flex flex-wrap gap-2">
          {sizes.map((size) => (
            <button
              key={size.id}
              onClick={() => handleSizeToggle(size.id)}
              className={cn(
                "px-3 py-1.5 text-sm border rounded-lg transition-colors",
                selectedSizes.includes(size.id)
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border hover:border-foreground"
              )}
            >
              {size.label}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Price Range */}
      <FilterSection title="Price Range">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
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
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
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

      {/* Brand */}
      {/* <FilterSection title="Brand">
        {brands.map((brand) => (
          <label key={brand.id} className="flex items-center gap-3 cursor-pointer">
            <Checkbox
              checked={selectedBrands.includes(brand.id)}
              onCheckedChange={() => toggleFilter(brand.id, selectedBrands, setSelectedBrands)}
            />
            <span className="text-sm flex-1">{brand.label}</span>
            {brand.count && (
              <span className="text-xs text-muted-foreground">{brand.count}</span>
            )}
          </label>
        ))}
      </FilterSection> */}
    </div>
  );
}
