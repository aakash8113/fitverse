import { useState } from "react";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
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
}

const categories: FilterOption[] = [
  { id: "women", label: "Women", count: 245 },
  { id: "men", label: "Men", count: 189 },
  { id: "unisex", label: "Unisex", count: 67 },
];

const sizes: FilterOption[] = [
  { id: "xs", label: "XS" },
  { id: "s", label: "S" },
  { id: "m", label: "M" },
  { id: "l", label: "L" },
  { id: "xl", label: "XL" },
  { id: "xxl", label: "XXL" },
];

const brands: FilterOption[] = [
  { id: "zara", label: "Zara", count: 56 },
  { id: "hm", label: "H&M", count: 43 },
  { id: "uniqlo", label: "Uniqlo", count: 38 },
  { id: "nike", label: "Nike", count: 29 },
  { id: "adidas", label: "Adidas", count: 24 },
];

export function FilterSidebar({ className, onClose, onCategoryChange, onPriceRangeChange }: FilterSidebarProps) {
  const [priceRange, setPriceRange] = useState([0, 500]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);

  const toggleFilter = (
    id: string,
    selected: string[],
    setSelected: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    setSelected(
      selected.includes(id)
        ? selected.filter((item) => item !== id)
        : [...selected, id]
    );
  };

  const handleCategoryToggle = (id: string) => {
    const newCategories = selectedCategories.includes(id)
      ? selectedCategories.filter((item) => item !== id)
      : [...selectedCategories, id];
    
    setSelectedCategories(newCategories);
    
    // Call the callback with the first selected category or undefined
    if (onCategoryChange) {
      onCategoryChange(newCategories.length > 0 ? newCategories[0] : undefined);
    }
  };

  const handlePriceChange = (value: number[]) => {
    setPriceRange(value);
    
    // Call the callback with the new price range
    if (onPriceRangeChange) {
      onPriceRangeChange(value[0], value[1]);
    }
  };

  const clearAll = () => {
    setSelectedCategories([]);
    setSelectedSizes([]);
    setSelectedBrands([]);
    setPriceRange([0, 500]);
    
    // Reset filters in parent component
    if (onCategoryChange) {
      onCategoryChange(undefined);
    }
    if (onPriceRangeChange) {
      onPriceRangeChange(0, 500);
    }
  };

  const hasFilters = 
    selectedCategories.length > 0 ||
    selectedSizes.length > 0 || 
    selectedBrands.length > 0 ||
    priceRange[0] > 0 ||
    priceRange[1] < 500;

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

      {/* Category */}
      <FilterSection title="Category">
        {categories.map((category) => (
          <label key={category.id} className="flex items-center gap-3 cursor-pointer">
            <Checkbox
              checked={selectedCategories.includes(category.id)}
              onCheckedChange={() => toggleFilter(category.id, selectedCategories, setSelectedCategories)}
            />
            <span className="text-sm flex-1">{category.label}</span>
            {category.count && (
              <span className="text-xs text-muted-foreground">{category.count}</span>
            )}
          </label>
        ))}
      </FilterSection>

      {/* Size */}
      <FilterSection title="Size">
        <div className="flex flex-wrap gap-2">
          {sizes.map((size) => (
            <button
              key={size.id}
              onClick={() => toggleFilter(size.id, selectedSizes, setSelectedSizes)}
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
        <div className="px-1">
          <Slider
            value={priceRange}
            onValueChange={handlePriceChange}
            max={500}
            step={10}
            className="mb-4"
          />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>${priceRange[0]}</span>
            <span>${priceRange[1]}+</span>
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
