import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { useConfig } from '../context/ConfigContext';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Checkbox } from '../components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Sheet, SheetContent, SheetTrigger } from '../components/ui/sheet';
import ProductCard from '../components/products/ProductCard';
import { Search, Filter, X, ChevronRight, Loader2, Activity } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Dynamic categories will be fetched from API

const sortOptions = [
  { value: 'discount', label: 'Highest Discount' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'name', label: 'Name A-Z' },
];

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [sortBy, setSortBy] = useState('discount');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const { config: siteConfig } = useConfig();
  
  const searchFromUrl = searchParams.get('search') || '';
  const selectedCategory = searchParams.get('category') || '';

  const dynamicCategories = [
    { name: 'All Categories', slug: '' },
    ...(siteConfig?.categories_section?.cards || []).map(cat => ({
      name: cat.title,
      slug: cat.slug || cat.title, // Support both for safety
    }))
  ];

  // Sync search input when URL changes
  useEffect(() => {
    setSearchQuery(searchFromUrl);
  }, [searchFromUrl]);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (selectedCategory) params.append('category', selectedCategory);
        if (searchFromUrl) params.append('search', searchFromUrl);
        if (inStockOnly) params.append('in_stock', 'true');

        const response = await fetch(`${API_URL}/api/products?${params.toString()}`);
        if (response.ok) {
          let data = await response.json();
          
          // Sort products
          data = sortProducts(data, sortBy);
          setProducts(data);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [selectedCategory, searchFromUrl, inStockOnly, sortBy]);

  const sortProducts = (products, sort) => {
    switch (sort) {
      case 'discount':
        return [...products].sort((a, b) => b.discount_percentage - a.discount_percentage);
      case 'price-low':
        return [...products].sort((a, b) => a.price - b.price);
      case 'price-high':
        return [...products].sort((a, b) => b.price - a.price);
      case 'name':
        return [...products].sort((a, b) => a.name.localeCompare(b.name));
      default:
        return products;
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (searchQuery) {
      params.set('search', searchQuery);
    } else {
      params.delete('search');
    }
    setSearchParams(params);
  };

  const handleCategoryChange = (category) => {
    const params = new URLSearchParams(searchParams);
    if (category) {
      params.set('category', category);
    } else {
      params.delete('category');
    }
    setSearchParams(params);
  };

  const clearFilters = () => {
    setInStockOnly(false);
    setSortBy('discount');
    setSearchParams({});
  };

  const FilterContent = () => (
    <div className="space-y-8 pb-10">
      {/* Search - Mobile only (redundant but helpful) */}
      <div className="lg:hidden mb-2">
        <p className="text-xs font-bold uppercase tracking-[0.1em] text-slate-400 mb-3 px-1">Search</p>
        <form onSubmit={handleSearch} className="relative">
          <Input
            placeholder="Search medications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-4 pr-10 rounded-xl h-12 border-slate-100 focus:border-primary/30"
          />
          <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
            <Search className="w-5 h-5 transition-colors hover:text-primary" />
          </button>
        </form>
      </div>

      {/* Categories */}
      <div>
        <div className="flex items-center justify-between mb-4 px-1">
          <Label className="text-xs font-bold uppercase tracking-[0.1em] text-slate-400">Categories</Label>
          {selectedCategory && (
            <button 
              onClick={() => handleCategoryChange('')} 
              className="text-[10px] font-semibold text-primary hover:text-primary-600 transition-colors uppercase tracking-wider"
            >
              Clear All
            </button>
          )}
        </div>
        <div className="flex lg:flex-col overflow-x-auto lg:overflow-visible gap-2 pb-2 lg:pb-0 scrollbar-hide">
          {dynamicCategories.map((cat) => (
            <button
              key={cat.slug}
              onClick={() => handleCategoryChange(cat.slug)}
              className={`group flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all duration-300 border text-left min-w-[160px] lg:min-w-0 ${
                selectedCategory === cat.slug
                  ? 'bg-primary border-primary text-white shadow-md shadow-primary/20 scale-[1.02]'
                  : 'bg-white border-slate-100 text-slate-600 hover:border-primary/30 hover:bg-primary/5'
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                selectedCategory === cat.slug ? 'bg-white/20' : 'bg-slate-50 group-hover:bg-primary/10'
              }`}>
                <Activity className={`w-4 h-4 ${selectedCategory === cat.slug ? 'text-white' : 'text-primary'}`} />
              </div>
              <span className="font-medium flex-1 leading-tight">{cat.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Stock filter */}
      <div className="pt-4 border-t border-slate-100">
        <Label className="text-xs font-bold uppercase tracking-[0.1em] text-slate-400 mb-4 block px-1">Availability</Label>
        <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors">
          <Checkbox 
            id="stock"
            checked={inStockOnly}
            onCheckedChange={setInStockOnly}
            className="border-slate-300 data-[state=checked]:bg-primary"
          />
          <span className="text-sm font-medium text-slate-600">In Stock Only</span>
        </label>
      </div>

      {/* Clear filters */}
      <Button
        variant="outline"
        onClick={clearFilters}
        className="w-full"
        data-testid="clear-filters-btn"
      >
        Clear All Filters
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50" data-testid="products-page">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-slate-200">
        <div className="container-custom py-4">
          <div className="flex items-center gap-2 text-sm">
            <Link to="/" className="text-slate-500 hover:text-primary">Home</Link>
            <ChevronRight className="w-4 h-4 text-slate-400" />
            <span className="text-slate-900 font-medium">Products</span>
            {selectedCategory && (
              <>
                <ChevronRight className="w-4 h-4 text-slate-400" />
                <span className="text-primary font-medium">{selectedCategory}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="container-custom py-8">
          <h1 className="font-heading text-3xl md:text-4xl font-bold text-slate-900 mb-2">
            {selectedCategory 
              ? (dynamicCategories.find(c => c.slug === selectedCategory)?.name || selectedCategory)
              : (siteConfig?.products_page?.title || 'All Medications')}
          </h1>
          <p className="text-slate-600">
            {selectedCategory ? `Browse our selection of ${selectedCategory} medications` : (siteConfig?.products_page?.subtitle || 'Browse our selection of authentic generic medications at affordable prices')}
          </p>
        </div>
      </div>

      <div className="container-custom py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar filters - Desktop */}
          <aside className="hidden lg:block w-72 flex-shrink-0">
            <div className="sticky top-24 max-h-[calc(100vh-120px)] overflow-y-auto pr-2 scrollbar-hide">
              <div className="flex items-center gap-2 mb-6 px-1">
                <Filter className="w-5 h-5 text-primary" />
                <h3 className="font-heading font-bold text-xl text-slate-900">Filters</h3>
              </div>
              <FilterContent />
            </div>
          </aside>

          {/* Main content */}
          <div className="flex-1">
            {/* Search and sort bar */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              {/* Mobile filter button */}
              <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" className="lg:hidden h-12 rounded-xl border-slate-200" data-testid="mobile-filter-btn">
                    <Filter className="w-4 h-4 mr-2" />
                    Filters
                    {(selectedCategory || inStockOnly) && (
                      <Badge className="ml-2 bg-primary text-white">Active</Badge>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[300px] sm:w-[350px] p-6 pt-10 overflow-y-auto">
                    <div className="flex items-center gap-2 mb-8 px-1">
                      <Filter className="w-5 h-5 text-primary" />
                      <h3 className="font-heading font-bold text-xl text-slate-900">Filters</h3>
                    </div>
                  <FilterContent />
                </SheetContent>
              </Sheet>

              {/* Search */}
              <form onSubmit={handleSearch} className="flex-1">
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Search medications..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-11 pr-4 h-12 rounded-xl border-slate-200 focus:border-primary/30"
                    data-testid="products-search-input"
                  />
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                </div>
              </form>

              {/* Sort */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full sm:w-48 h-12 rounded-xl border-slate-200 focus:border-primary/30" data-testid="sort-select">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Active filters */}
            {(selectedCategory || searchQuery || inStockOnly) && (
              <div className="flex flex-wrap items-center gap-2 mb-6">
                <span className="text-sm text-slate-500">Active filters:</span>
                {selectedCategory && (
                  <Badge variant="secondary" className="gap-1">
                    {selectedCategory}
                    <button onClick={() => handleCategoryChange('')}>
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}
                {searchQuery && (
                  <Badge variant="secondary" className="gap-1">
                    "{searchQuery}"
                    <button onClick={() => {
                      setSearchQuery('');
                      searchParams.delete('search');
                      setSearchParams(searchParams);
                    }}>
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}
                {inStockOnly && (
                  <Badge variant="secondary" className="gap-1">
                    In Stock
                    <button onClick={() => setInStockOnly(false)}>
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}
              </div>
            )}

            {/* Results count */}
            <p className="text-sm text-slate-500 mb-6">
              Showing {products.length} products
            </p>

            {/* Products grid */}
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-10 h-10 text-slate-300" />
                </div>
                <h3 className="font-heading font-semibold text-xl mb-2">No products found</h3>
                <p className="text-slate-500 mb-6">
                  Try adjusting your filters or search query
                </p>
                <Button onClick={clearFilters} className="rounded-full">
                  Clear Filters
                </Button>
              </div>
            ) : (
                <div className="grid grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
                  {products.map((product) => (
                    <ProductCard key={product.product_id} product={product} />
                  ))}
                </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
