import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { toast } from 'sonner';
import { 
  X, 
  Save, 
  Upload, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  Package,
  Image as ImageIcon
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function ProductEditor({ product, onSave, onClose }) {
  const isEditing = !!product?.product_id;
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [categories, setCategories] = useState(["Cancer", "HIV/AIDS", "Hepatitis", "Erectile Dysfunction", "Diabetes & Insulin", "Weight Loss", "Fertility", "Other"]);
  const [formData, setFormData] = useState({
    name: '',
    generic_name: '',
    brand: '',
    category: 'Cancer',
    subcategory: '',
    description: '',
    dosage: '',
    form: 'Tablet',
    quantity_per_pack: 30,
    price: 0,
    original_price: 0,
    price_inr: 0,
    original_price_inr: 0,
    discount_percentage: 0,
    manufacturer: '',
    requires_prescription: true,
    in_stock: true,
    image_url: '',
    usage_instructions: [],
    side_effects: '',
    storage_info: '',
    rating: 4.8,
    order_count: 100,
    additional_images: []
  });

  useEffect(() => {
    if (product) {
      setFormData({
        ...formData,
        ...product,
        subcategory: product.subcategory || '',
        image_url: product.image_url || '',
        usage_instructions: product.usage_instructions || [],
        additional_images: product.additional_images || []
      });
    }
  }, [product]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch(`${API_URL}/api/site-config`);
        const data = await res.json();
        if (data && data.product_categories) {
          setCategories(data.product_categories);
        }
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      }
    };
    fetchCategories();
  }, []);

  // Auto-calculate discount or price
  useEffect(() => {
    if (formData.original_price > 0 && formData.price > 0) {
      const discount = Math.round(((formData.original_price - formData.price) / formData.original_price) * 100);
      if (discount !== formData.discount_percentage) {
        setFormData(prev => ({ ...prev, discount_percentage: discount }));
      }
    }
    
    // Auto-calculate INR if zero (helpful for new products)
    if (formData.price > 0 && (formData.price_inr === 0 || !formData.price_inr)) {
        setFormData(prev => ({ ...prev, price_inr: Math.round(formData.price * 83) }));
    }
    if (formData.original_price > 0 && (formData.original_price_inr === 0 || !formData.original_price_inr)) {
        setFormData(prev => ({ ...prev, original_price_inr: Math.round(formData.original_price * 83) }));
    }
  }, [formData.price, formData.original_price]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (type === 'number' ? parseFloat(value) : value)
    }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const uploadFormData = new FormData();
    uploadFormData.append('file', file);

    try {
      const res = await fetch(`${API_URL}/api/admin/upload-image`, {
        method: 'POST',
        body: uploadFormData,
      });

      if (res.ok) {
        const data = await res.json();
        setFormData(prev => ({ ...prev, image_url: data.url }));
        toast.success('Image uploaded successfully');
      } else {
        toast.error('Failed to upload image');
      }
    } catch (error) {
      toast.error('Upload error');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = isEditing 
        ? `${API_URL}/api/admin/products/${product.product_id}`
        : `${API_URL}/api/admin/products`;
      
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
        credentials: 'include'
      });

      if (res.ok) {
        toast.success(isEditing ? 'Product updated' : 'Product created');
        onSave();
      } else {
        const err = await res.json();
        toast.error(err.detail || 'Failed to save product');
      }
    } catch (error) {
      toast.error('Save error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl transition-all animate-in fade-in zoom-in duration-200">
        <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-center z-10">
          <div>
            <h2 className="text-2xl font-bold font-heading text-slate-900">
              {isEditing ? 'Edit Product' : 'Add New Product'}
            </h2>
            <p className="text-slate-500 text-sm">Fill in the details below to {isEditing ? 'update' : 'create'} a medication</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-slate-100">
            <X className="w-5 h-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          {/* Main Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Product Name</label>
              <Input 
                name="name" 
                value={formData.name} 
                onChange={handleInputChange} 
                placeholder="e.g. Gleevec" 
                required 
                className="rounded-xl border-slate-200"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Generic Name</label>
              <Input 
                name="generic_name" 
                value={formData.generic_name} 
                onChange={handleInputChange} 
                placeholder="e.g. Imatinib Mesylate" 
                required 
                className="rounded-xl border-slate-200"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Brand / Manufacturer</label>
              <Input 
                name="brand" 
                value={formData.brand} 
                onChange={handleInputChange} 
                placeholder="e.g. Novartis" 
                required 
                className="rounded-xl border-slate-200"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Category</label>
              <select 
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Dosage</label>
              <Input 
                name="dosage" 
                value={formData.dosage} 
                onChange={handleInputChange} 
                placeholder="e.g. 400mg" 
                required 
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Form</label>
              <Input 
                name="form" 
                value={formData.form} 
                onChange={handleInputChange} 
                placeholder="e.g. Tablet" 
                required 
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Quantity per Pack</label>
              <Input 
                type="number" 
                name="quantity_per_pack" 
                value={formData.quantity_per_pack} 
                onChange={handleInputChange} 
                required 
              />
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-slate-50 p-6 rounded-2xl space-y-6 border border-slate-100">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              Price & Discounts
              <Badge variant="outline" className="bg-white">Auto-calculated</Badge>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400">Original Price ($)</label>
                <Input 
                  type="number" 
                  step="0.01" 
                  name="original_price" 
                  value={formData.original_price} 
                  onChange={handleInputChange} 
                  className="bg-white"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400">Sale Price ($)</label>
                <Input 
                  type="number" 
                  step="0.01" 
                  name="price" 
                  value={formData.price} 
                  onChange={handleInputChange} 
                  className="bg-white border-primary"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400">Original Price (₹)</label>
                <Input 
                  type="number" 
                  name="original_price_inr" 
                  value={formData.original_price_inr} 
                  onChange={handleInputChange} 
                  className="bg-white"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400">Sale Price (₹)</label>
                <Input 
                  type="number" 
                  name="price_inr" 
                  value={formData.price_inr} 
                  onChange={handleInputChange} 
                  className="bg-white border-primary"
                />
              </div>
              <div className="space-y-2 md:col-span-1 lg:col-span-1">
                <label className="text-xs font-bold text-slate-400">Discount (%)</label>
                <Input 
                  type="number" 
                  name="discount_percentage" 
                  value={formData.discount_percentage} 
                  readOnly 
                  className="bg-slate-100 cursor-not-allowed font-bold text-primary"
                />
              </div>
            </div>
          </div>

          {/* Inventory & Presc */}
          <div className="flex flex-wrap gap-8 py-4 border-y">
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className={`w-12 h-6 rounded-full transition-colors relative ${formData.requires_prescription ? 'bg-primary' : 'bg-slate-300'}`}>
                <input 
                  type="checkbox" 
                  name="requires_prescription" 
                  checked={formData.requires_prescription} 
                  onChange={handleInputChange} 
                  className="hidden"
                />
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.requires_prescription ? 'left-7' : 'left-1'}`} />
              </div>
              <span className="text-sm font-medium text-slate-700">Requires Prescription</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer group">
              <div className={`w-12 h-6 rounded-full transition-colors relative ${formData.in_stock ? 'bg-green-500' : 'bg-red-400'}`}>
                <input 
                  type="checkbox" 
                  name="in_stock" 
                  checked={formData.in_stock} 
                  onChange={handleInputChange} 
                  className="hidden"
                />
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.in_stock ? 'left-7' : 'left-1'}`} />
              </div>
              <span className="text-sm font-medium text-slate-700">In Stock</span>
            </label>
          </div>
          {/* Description */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Product Description</label>
            <textarea 
              name="description" 
              value={formData.description} 
              onChange={handleInputChange} 
              rows={4}
              required
              className="flex w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              placeholder="Describe the medication, its uses and indications..."
            />
          </div>

          {/* Main Image */}
          <div className="space-y-4">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Primary Product Image</label>
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="w-full md:w-48 aspect-square rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center bg-slate-50 overflow-hidden relative group">
                {formData.image_url ? (
                  <>
                    <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button type="button" variant="ghost" size="icon" className="text-white" onClick={() => setFormData(p => ({...p, image_url: ''}))}>
                        <X className="w-5 h-5" />
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="text-center p-4">
                    <ImageIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-[10px] text-slate-400 uppercase font-bold">No Image Selected</p>
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-4 w-full">
                <div className="space-y-2">
                  <label className="text-xs text-slate-400">Direct Image URL</label>
                  <Input 
                    name="image_url" 
                    value={formData.image_url} 
                    onChange={handleInputChange} 
                    placeholder="https://images.unsplash.com/..." 
                    className="rounded-xl border-slate-200"
                  />
                </div>
                <div className="flex items-center gap-4">
                  <div className="h-px flex-1 bg-slate-100" />
                  <span className="text-[10px] uppercase font-bold text-slate-300">OR</span>
                  <div className="h-px flex-1 bg-slate-100" />
                </div>
                <div>
                  <input
                    type="file"
                    id="product-image-upload"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploading}
                  />
                  <label 
                    htmlFor="product-image-upload"
                    className={`flex items-center justify-center gap-2 w-full h-12 rounded-xl border-2 border-dashed border-primary/20 text-primary hover:bg-primary/5 cursor-pointer transition-all ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
                  >
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    <span className="font-medium">{uploading ? 'Uploading...' : 'Upload Image from Computer'}</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 border-b pb-2">Usage & Safety</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-500">Usage Instructions (One per line)</label>
                <textarea 
                  value={formData.usage_instructions.join('\n')} 
                  onChange={(e) => setFormData(prev => ({ ...prev, usage_instructions: e.target.value.split('\n').filter(l => l.trim()) }))}
                  rows={3}
                  className="flex w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  placeholder="Take with water after meals..."
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-500">Side Effects</label>
                  <textarea 
                    name="side_effects"
                    value={formData.side_effects} 
                    onChange={handleInputChange}
                    rows={2}
                    className="flex w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    placeholder="Common side effects..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-500">Storage Info</label>
                  <textarea 
                    name="storage_info"
                    value={formData.storage_info} 
                    onChange={handleInputChange}
                    rows={2}
                    className="flex w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    placeholder="Store at room temperature..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Social Proof */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 border-b pb-2">Social Proof</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-500">Manual Rating (1-5)</label>
                <Input 
                  type="number" 
                  step="0.1"
                  min="0"
                  max="5"
                  name="rating" 
                  value={formData.rating} 
                  onChange={handleInputChange} 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-500">Orders Count</label>
                <Input 
                  type="number" 
                  name="order_count" 
                  value={formData.order_count} 
                  onChange={handleInputChange} 
                />
              </div>
            </div>
          </div>

          {/* Gallery */}
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Additional Gallery Images</h3>
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                className="h-8 text-xs gap-1.5 rounded-lg"
                onClick={() => setFormData(prev => ({ ...prev, additional_images: [...prev.additional_images, ''] }))}
              >
                Add Image Slot
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {formData.additional_images.map((url, index) => (
                <div key={index} className="space-y-2 p-3 border rounded-xl bg-slate-50/50">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold uppercase text-slate-400">Image {index + 1}</label>
                    <button 
                      type="button" 
                      onClick={() => setFormData(prev => ({ 
                        ...prev, 
                        additional_images: prev.additional_images.filter((_, i) => i !== index) 
                      }))}
                      className="text-red-400 hover:text-red-600 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <Input 
                    value={url} 
                    onChange={(e) => {
                      const newImages = [...formData.additional_images];
                      newImages[index] = e.target.value;
                      setFormData(prev => ({ ...prev, additional_images: newImages }));
                    }}
                    placeholder="https://..."
                    className="h-8 text-xs bg-white"
                  />
                  {url && (
                    <div className="mt-2 aspect-video rounded-lg overflow-hidden border">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="sticky bottom-0 bg-white border-t p-6 flex justify-end gap-3 z-10 mx-[-2rem] mb-[-2rem]">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-full px-6">
              Discard Changes
            </Button>
            <Button type="submit" disabled={loading} className="rounded-full px-8 shadow-lg shadow-primary/20">
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              {isEditing ? 'Save Product' : 'Create Product'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
