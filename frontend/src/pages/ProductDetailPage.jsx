import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { useCart } from '../context/CartContext';
import { useCurrency } from '../context/CurrencyContext';
import ProductCard from '../components/products/ProductCard';
import { toast } from 'sonner';
import DOMPurify from 'dompurify';
import {
  ShoppingCart,
  ChevronRight,
  FileText,
  Shield,
  Truck,
  Clock,
  Check,
  Minus,
  Plus,
  AlertCircle,
  Loader2,
  Package,
  Star,
} from 'lucide-react';
import * as Icons from 'lucide-react';
import PrescriptionUpload from '../components/prescription/PrescriptionUpload';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function ProductDetailPage() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { addToCart, loading: cartLoading } = useCart();
  const { formatPrice } = useCurrency();
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [siteConfig, setSiteConfig] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_URL}/api/products/${productId}`);
        if (response.ok) {
          const data = await response.json();
          setProduct(data);

          // Fetch related products
          const relatedRes = await fetch(
            `${API_URL}/api/products?category=${encodeURIComponent(data.category)}&limit=4`
          );
          if (relatedRes.ok) {
            const relatedData = await relatedRes.json();
            setRelatedProducts(relatedData.filter((p) => p.product_id !== productId).slice(0, 4));
          }

          // Fetch site config
          const configRes = await fetch(`${API_URL}/api/site-config`);
          if (configRes.ok) {
            const configData = await configRes.json();
            setSiteConfig(configData);
          }
        } else {
          navigate('/products');
        }
      } catch (error) {
        console.error('Error fetching product:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId, navigate]);

  const handleAddToCart = async () => {
    for (let i = 0; i < quantity; i++) {
      await addToCart(product.product_id);
    }
    toast.success(`${quantity} x ${product.name} added to cart`);
  };

  const savings = product ? (product.original_price - product.price) : 0;
  const savings_inr = product ? ((product.original_price_inr || 0) - (product.price_inr || 0)) : 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!product) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white" data-testid="product-detail-page">
      {/* Breadcrumb */}
      <div className="bg-slate-50 border-b border-slate-200">
        <div className="container-custom py-4">
          <div className="flex items-center gap-2 text-sm">
            <Link to="/" className="text-slate-500 hover:text-primary">Home</Link>
            <ChevronRight className="w-4 h-4 text-slate-400" />
            <Link to="/products" className="text-slate-500 hover:text-primary">Products</Link>
            <ChevronRight className="w-4 h-4 text-slate-400" />
            <Link
              to={`/products?category=${encodeURIComponent(product.category)}`}
              className="text-slate-500 hover:text-primary"
            >
              {product.category}
            </Link>
            <ChevronRight className="w-4 h-4 text-slate-400" />
            <span className="text-slate-900 font-medium truncate max-w-[200px]">{product.name}</span>
          </div>
        </div>
      </div>

      {/* Product Details */}
      <div className="container-custom py-8 md:py-12">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Product Image & Gallery */}
          <div>
            <div className="aspect-square bg-slate-50 rounded-2xl overflow-hidden mb-4 border border-slate-100 shadow-sm">
              <img
                src={[product.image_url, ...(product.additional_images || [])][selectedImage] || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800'}
                alt={product.name}
                className="w-full h-full object-cover transition-all duration-300"
              />
            </div>
            
            {/* Gallery Thumbnails */}
            {product.additional_images && product.additional_images.length > 0 && (
              <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
                {[product.image_url, ...product.additional_images].map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all ${
                      selectedImage === idx ? 'border-primary ring-2 ring-primary/10' : 'border-transparent hover:border-slate-200'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Trust badges */}
            <div className="grid grid-cols-3 gap-4">
              {(siteConfig?.trust_badges?.badges?.slice(0, 3) || [
                {title: '100% Authentic', icon: 'Shield'},
                {title: 'Global Shipping', icon: 'Truck'},
                {title: 'Secure Delivery', icon: 'Package'}
              ]).map((badge, idx) => {
                const IconComp = Icons[badge.icon] || Shield;
                const colors = ['text-green-600', 'text-blue-600', 'text-purple-600'];
                return (
                  <div key={idx} className="flex flex-col items-center justify-center p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                    <IconComp className={`w-6 h-6 ${colors[idx % 3]} mb-1`} />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{badge.title}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Product Info */}
          <div>
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline">{product.category}</Badge>
                {product.requires_prescription && (
                  <Badge className="bg-amber-50 text-amber-700 border-amber-200">
                    <FileText className="w-3 h-3 mr-1" />
                    Prescription Required
                  </Badge>
                )}
              </div>
              <h1 className="font-heading text-3xl md:text-4xl font-bold text-slate-900 mb-2">
                {product.name}
              </h1>
              <p className="text-lg text-slate-600">{product.generic_name}</p>
              <p className="text-slate-500">by {product.brand}</p>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center bg-amber-50 px-3 py-1 rounded-full border border-amber-100">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400 mr-1.5" />
                <span className="font-bold text-amber-700">{product.rating || '4.8'}</span>
              </div>
              <Separator orientation="vertical" className="h-4" />
              <span className="text-sm text-slate-500 font-medium">
                <span className="text-slate-900 font-bold">{product.order_count}+</span> orders worldwide
              </span>
            </div>

            {/* Price */}
            <div className="bg-slate-50 rounded-xl p-6 mb-6">
              <div className="flex items-end gap-3 mb-2">
                <span className="text-4xl font-bold text-primary">
                  {formatPrice(product.price, product.price_inr)}
                </span>
                {((product.original_price > product.price) || (product.original_price_inr > product.price_inr)) && (
                  <span className="text-xl text-slate-400 line-through">
                    {formatPrice(product.original_price, product.original_price_inr)}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4">
                <Badge className="bg-green-100 text-green-700 border-green-200">
                  Save {product.discount_percentage}%
                </Badge>
                <span className="text-green-600 font-medium">
                  You save {formatPrice(savings, savings_inr)} per pack
                </span>
              </div>
              <p className="text-sm text-slate-500 mt-2">
                Price per {product.form.toLowerCase()} • {product.quantity_per_pack} {product.form}s per pack
              </p>
            </div>

            {/* Product specs */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-4 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-500">Dosage</p>
                <p className="font-semibold">{product.dosage}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-500">Form</p>
                <p className="font-semibold">{product.form}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-500">Pack Size</p>
                <p className="font-semibold">{product.quantity_per_pack} {product.form}s</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-500">Manufacturer</p>
                <p className="font-semibold">{product.manufacturer}</p>
              </div>
            </div>

            {/* Quantity selector */}
            <div className="flex items-center gap-4 mb-6">
              <span className="text-slate-600">Quantity:</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
                  data-testid="decrease-quantity-btn"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-12 text-center font-semibold text-lg">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
                  data-testid="increase-quantity-btn"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Add to cart */}
            <div className="space-y-3">
              <Button
                onClick={handleAddToCart}
                disabled={!product.in_stock || cartLoading}
                className="w-full h-14 rounded-full text-lg"
                data-testid="add-to-cart-detail-btn"
              >
                {cartLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                ) : (
                  <ShoppingCart className="w-5 h-5 mr-2" />
                )}
                Add to Cart - {formatPrice(product.price * quantity, (product.price_inr || 0) * quantity)}
              </Button>

              {product.requires_prescription && (
                <PrescriptionUpload
                  trigger={
                    <Button variant="outline" className="w-full h-12 rounded-full" data-testid="upload-rx-product-btn">
                      <FileText className="w-4 h-4 mr-2" />
                      Upload Prescription
                    </Button>
                  }
                />
              )}
            </div>

            {/* Stock status */}
            <div className="flex items-center gap-2 mt-4">
              {product.in_stock ? (
                <>
                  <Check className="w-4 h-4 text-green-600" />
                  <span className="text-green-600 font-medium">In Stock</span>
                  <span className="text-slate-500">• Ready to ship</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <span className="text-red-500 font-medium">Out of Stock</span>
                </>
              )}
            </div>

            {/* Delivery info */}
            <div className="mt-6 p-4 bg-blue-50 rounded-xl">
              <div className="flex items-start gap-3">
                <Truck className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-900">Express Global Delivery</p>
                  <p className="text-sm text-blue-700">
                    Estimated delivery: {siteConfig?.shipping_settings?.delivery_estimate || '7-14 business days'} • Insured shipping
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Product tabs */}
        <div className="mt-12">
          <Tabs defaultValue="description">
            <TabsList className="grid w-full grid-cols-3 max-w-md">
              <TabsTrigger value="description">Description</TabsTrigger>
              <TabsTrigger value="usage">Usage</TabsTrigger>
              <TabsTrigger value="shipping">Shipping</TabsTrigger>
            </TabsList>
            <TabsContent value="description" className="mt-6">
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-heading font-semibold text-lg mb-4">Product Description</h3>
                  <div 
                    className="text-slate-600 leading-relaxed prose-content"
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(product.description) }}
                  />
                  <Separator className="my-6" />
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-2">Active Ingredient</h4>
                      <p className="text-slate-600">{product.generic_name}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Manufacturer</h4>
                      <p className="text-slate-600">{product.manufacturer}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="usage" className="mt-6">
              <Card className="border-slate-200">
                <CardContent className="p-8">
                  <div className="grid md:grid-cols-2 gap-12">
                    <div className="space-y-6">
                      <div>
                        <h3 className="font-heading font-bold text-lg mb-4 flex items-center gap-2">
                          <Check className="w-5 h-5 text-green-600" />
                          Usage Instructions
                        </h3>
                        {product.usage_instructions && product.usage_instructions.length > 0 ? (
                          <ul className="space-y-3">
                            {product.usage_instructions.map((step, idx) => (
                              <li key={idx} className="flex gap-3 text-slate-600 leading-relaxed">
                                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 mt-0.5">
                                  {idx + 1}
                                </span>
                                {step}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-slate-500 italic">Consult your doctor for specific use instructions.</p>
                        )}
                      </div>

                      {product.storage_info && (
                        <div>
                          <h3 className="font-heading font-bold text-lg mb-4 flex items-center gap-2 text-slate-900">
                            <Package className="w-5 h-5 text-blue-600" />
                            Storage \u0026 Handling
                          </h3>
                          <div 
                            className="text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100 prose-content"
                            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(product.storage_info) }}
                          />
                        </div>
                      )}
                    </div>

                    <div className="space-y-6">
                      <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6">
                        <div className="flex items-start gap-4 mb-4">
                          <div className="p-2 bg-white rounded-lg shadow-sm">
                            <AlertCircle className="w-6 h-6 text-amber-600" />
                          </div>
                          <p className="font-bold text-amber-900">Medical Warning</p>
                        </div>
                        <p className="text-sm text-amber-800 leading-relaxed">
                          {siteConfig?.medical_warning || 'Always consult your healthcare provider before starting, stopping, or changing any medication. This information is for reference only and not a substitute for professional medical advice.'}
                        </p>
                      </div>

                      {product.side_effects && (
                        <div>
                          <h3 className="font-heading font-bold text-lg mb-4 text-slate-900">Possible Side Effects</h3>
                          <div 
                            className="text-slate-600 leading-relaxed border-l-4 border-slate-100 pl-4 py-1 prose-content"
                            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(product.side_effects) }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="shipping" className="mt-6">
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-heading font-semibold text-lg mb-4">Shipping Information</h3>
                  <div className="space-y-4">
                    {(siteConfig?.trust_badges?.badges?.length > 0 ? siteConfig.trust_badges.badges : [
                      {title: 'Express Air Shipping', description: '7-14 business days delivery', icon: 'Truck'},
                      {title: 'Fully Insured', description: 'All shipments are insured against loss or damage', icon: 'Shield'},
                      {title: 'Discreet Packaging', description: 'No indication of contents on outer packaging', icon: 'Package'},
                      {title: 'Order Tracking', description: 'Real-time tracking provided for all orders', icon: 'Clock'}
                    ]).map((badge, idx) => {
                      const IconComponent = Icons[badge.icon] || Icons.Shield;
                      return (
                        <div key={idx} className="flex items-start gap-3">
                          <IconComponent className="w-5 h-5 text-primary mt-0.5" />
                          <div>
                            <p className="font-medium">{badge.title}</p>
                            <p className="text-slate-600 text-sm">{badge.description}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-16">
            <h2 className="font-heading text-2xl font-bold mb-6">Related Products</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((relatedProduct) => (
                <ProductCard key={relatedProduct.product_id} product={relatedProduct} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
