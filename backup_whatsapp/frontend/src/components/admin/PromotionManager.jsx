import React, { useState, useEffect } from 'react';
import { 
  Ticket, Plus, Trash2, Calendar, Tag, Percent, 
  DollarSign, Loader2, AlertCircle, CheckCircle2,
  Clock, RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Badge } from "../../components/ui/badge";
import { toast } from "sonner";

const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const PromotionManager = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newCoupon, setNewCoupon] = useState({
    code: '',
    discount_type: 'percentage',
    value: 0,
    min_order_value: 0,
    active: true,
    expiry_date: ''
  });

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/coupons`, {
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setCoupons(data);
      }
    } catch (error) {
      toast.error("Failed to fetch coupons");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newCoupon.code || !newCoupon.value) {
      toast.error("Please fill all required fields");
      return;
    }

    setCreating(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/coupons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCoupon),
        credentials: 'include'
      });
      if (res.ok) {
        toast.success("Coupon created successfully");
        setNewCoupon({ code: '', discount_type: 'percentage', value: 0, min_order_value: 0, active: true, expiry_date: '' });
        fetchCoupons();
      }
    } catch (error) {
      toast.error("Error creating coupon");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this coupon?")) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/coupons/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (res.ok) {
        toast.success("Coupon deleted");
        fetchCoupons();
      }
    } catch (error) {
      toast.error("Delete failed");
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold font-heading text-slate-800">Promotions & Coupons</h2>
          <p className="text-slate-500 text-sm">Manage discount codes and special offers</p>
        </div>
        <div className="p-2 bg-primary/10 rounded-full">
           <Ticket className="w-6 h-6 text-primary" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Create Form */}
        <Card className="border-slate-200 lg:col-span-1 h-fit sticky top-24">
          <CardHeader className="bg-slate-50/50 border-b">
            <CardTitle className="text-lg">New Coupon Code</CardTitle>
            <CardDescription>Setup a new discount for customers</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-slate-500">Coupon Code</label>
              <Input 
                placeholder="e.g. SAVE20" 
                value={newCoupon.code}
                onChange={(e) => setNewCoupon({...newCoupon, code: e.target.value.toUpperCase()})}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-slate-500">Type</label>
                <Select 
                  value={newCoupon.discount_type}
                  onValueChange={(val) => setNewCoupon({...newCoupon, discount_type: val})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                    <SelectItem value="fixed">Fixed Amount ($)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-slate-500">Value</label>
                <div className="relative">
                   {newCoupon.discount_type === 'percentage' ? 
                     <Percent className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /> : 
                     <DollarSign className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                   }
                   <Input 
                    type="number"
                    value={newCoupon.value}
                    onChange={(e) => setNewCoupon({...newCoupon, value: parseFloat(e.target.value)})}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-slate-500">Min. Order Value</label>
              <Input 
                type="number"
                placeholder="0 for no limit"
                value={newCoupon.min_order_value}
                onChange={(e) => setNewCoupon({...newCoupon, min_order_value: parseFloat(e.target.value)})}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-slate-500">Expiry Date</label>
              <Input 
                type="date"
                value={newCoupon.expiry_date}
                onChange={(e) => setNewCoupon({...newCoupon, expiry_date: e.target.value})}
              />
            </div>

            <Button className="w-full mt-4" onClick={handleCreate} disabled={creating}>
              {creating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
              Generate Coupon
            </Button>
          </CardContent>
        </Card>

        {/* Coupons List */}
        <div className="lg:col-span-2 space-y-4">
           {coupons.length > 0 ? coupons.map((coupon) => (
             <Card key={coupon.coupon_id} className="border-slate-200 hover:shadow-sm transition-all group">
               <CardContent className="p-0">
                 <div className="flex items-center">
                    <div className={`w-2 h-24 rounded-l-xl ${coupon.active ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                    <div className="flex-1 p-6 flex flex-col md:flex-row justify-between items-center gap-6">
                       <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                             <Tag className="w-6 h-6" />
                          </div>
                          <div>
                             <div className="flex items-center gap-2">
                                <h4 className="text-lg font-bold text-slate-800 font-mono tracking-tighter">{coupon.code}</h4>
                                {coupon.active ? 
                                  <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-50">Active</Badge> : 
                                  <Badge variant="secondary">Inactive</Badge>
                                }
                             </div>
                             <p className="text-sm text-slate-500">
                               {coupon.discount_type === 'percentage' ? `${coupon.value}% OFF` : `$${coupon.value} OFF`} 
                               {coupon.min_order_value > 0 && ` on orders over $${coupon.min_order_value}`}
                             </p>
                          </div>
                       </div>
                       
                       <div className="flex flex-col items-end gap-2 pr-2">
                          <div className="flex items-center text-xs text-slate-400">
                             <Clock className="w-3.5 h-3.5 mr-1" />
                             Expires: {coupon.expiry_date ? new Date(coupon.expiry_date).toLocaleDateString() : 'Never'}
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-slate-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleDelete(coupon.coupon_id)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" /> Delete
                          </Button>
                       </div>
                    </div>
                 </div>
               </CardContent>
             </Card>
           )) : (
             <div className="text-center py-20 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                <Ticket className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-slate-400">No active promotions</h3>
                <p className="text-slate-400 text-sm">Create your first coupon code to attract more customers.</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default PromotionManager;
