import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { useCart } from '../../context/CartContext';
import { useCurrency } from '../../context/CurrencyContext';
import { ShoppingCart, FileText, Check, Star } from 'lucide-react';
import { toast } from 'sonner';

export const ProductCard = ({ product }) => {
  const { addToCart, loading } = useCart();
  const { formatPrice } = useCurrency();

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const success = await addToCart(product.product_id);
    if (success) {
      toast.success(`${product.name} added to cart`);
    } else {
      toast.error('Failed to add item to cart');
    }
  };

  const savings = (product.original_price || 0) - (product.price || 0);
  const savings_inr = (product.original_price_inr || 0) - (product.price_inr || 0);

  return (
    <Link to={`/products/${product.product_id}`} data-testid={`product-card-${product.product_id}`}>
      <Card className="group overflow-hidden border-slate-100 shadow-sm hover:shadow-lg transition-all duration-300 h-full">
        <div className="relative aspect-square bg-slate-50 overflow-hidden">
          <img
            src={product.image_url || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400'}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          {product.discount_percentage > 0 && (
            <Badge className="absolute top-3 left-3 bg-primary text-white border-0">
              {product.discount_percentage}% OFF
            </Badge>
          )}
          {product.requires_prescription && (
            <Badge variant="outline" className="absolute top-3 right-3 bg-white/90 text-amber-700 border-amber-200">
              <FileText className="w-3 h-3 mr-1" />
              Rx
            </Badge>
          )}
          {!product.in_stock && (
            <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center">
              <span className="text-white font-semibold">Out of Stock</span>
            </div>
          )}
        </div>
        <CardContent className="p-4">
          <div className="mb-2">
            <p className="text-xs text-slate-500 uppercase tracking-wider">{product.category}</p>
            <h3 className="font-heading font-semibold text-slate-900 group-hover:text-primary transition-colors line-clamp-1">
              {product.name}
            </h3>
            <div className="flex items-center gap-2 mb-1">
              <div className="flex items-center">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                <span className="text-[10px] font-bold text-slate-700 ml-1">{product.rating || '4.8'}</span>
              </div>
              <span className="text-[10px] text-slate-400">•</span>
              <span className="text-[10px] text-slate-500 font-medium">{product.order_count || '150'}+ ordered</span>
            </div>
            <p className="text-sm text-slate-500">{product.generic_name}</p>
          </div>
          
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg font-bold text-primary">
              {formatPrice(product.price, product.price_inr)}
            </span>
            {((product.original_price > product.price) || (product.original_price_inr > product.price_inr)) && (
              <span className="text-sm text-slate-400 line-through">
                {formatPrice(product.original_price, product.original_price_inr)}
              </span>
            )}
          </div>

          <p className="text-xs text-slate-500 mb-3">
            {product.dosage} • {product.quantity_per_pack} {product.form}s
          </p>

          { (savings > 0 || savings_inr > 0) && (
            <div className="flex items-center gap-1 text-xs text-green-600 mb-3">
              <Check className="w-3 h-3" />
              Save {formatPrice(savings, savings_inr)} per pack
            </div>
          )}

          <Button
            onClick={handleAddToCart}
            disabled={loading || !product.in_stock}
            className="w-full rounded-full"
            size="sm"
            data-testid={`add-to-cart-${product.product_id}`}
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            Add to Cart
          </Button>
        </CardContent>
      </Card>
    </Link>
  );
};

export default ProductCard;
