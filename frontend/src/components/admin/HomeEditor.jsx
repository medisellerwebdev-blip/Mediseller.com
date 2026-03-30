import React, { useState, useEffect, useRef } from 'react';
import { 
  Save, 
  Plus, 
  Trash2, 
  Image as ImageIcon, 
  Upload, 
  Loader2, 
  Link as LinkIcon,
  CheckCircle,
  Package,
  Activity,
  Ribbon,
  ShieldAlert,
  Zap,
  Stethoscope,
  Scale,
  History,
  Home,
  Globe
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { toast } from "sonner";
import RichTextEditor from './RichTextEditor';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const ImageUploadField = ({ label, value, onChange, placeholder = "https://example.com/image.jpg" }) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/upload-image`, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      onChange(data.url);
      toast.success('Image uploaded successfully');
    } catch (err) {
      toast.error('Image upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center mb-0.5">
        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</label>
        {value && (
          <a href={value} target="_blank" rel="noreferrer" className="text-[10px] text-primary flex items-center gap-1 hover:underline">
            <ImageIcon className="w-3 h-3" /> Preview
          </a>
        )}
      </div>
      <div className="flex gap-2">
        <Input 
          value={value || ''} 
          className="bg-white border-slate-200 flex-1 h-9 text-sm"
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*" 
          onChange={handleUpload}
        />
        <Button 
          type="button" 
          variant="outline" 
          size="icon" 
          className="shrink-0 border-slate-200 h-9 w-9" 
          onClick={() => fileInputRef.current.click()}
          disabled={uploading}
        >
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );
};

export default function HomeEditor() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await fetch(`${API_URL}/api/site-config`);
      const data = await res.json();
      // Ensure all sub-objects exist with safe defaults
      if (data) {
        data.header = data.header || { logo_text: '', nav_items: [] };
        data.header.nav_items = data.header.nav_items || [];
        data.hero = data.hero || {};
        data.hero.trust_avatars = data.hero.trust_avatars || [];
        data.stats = data.stats || { items: [] };
        data.stats.items = data.stats.items || [];
        data.categories_section = data.categories_section || { cards: [] };
        data.categories_section.cards = data.categories_section.cards || [];
        data.how_it_works = data.how_it_works || { steps: [] };
        data.how_it_works.steps = data.how_it_works.steps || [];
        data.testimonials = data.testimonials || { items: [] };
        data.testimonials.items = data.testimonials.items || [];
        data.faq = data.faq || { items: [] };
        data.faq.items = data.faq.items || [];
        data.manufacturers = data.manufacturers || [];
        data.manufacturers_config = data.manufacturers_config || { subtitle: '' };
        data.featured_products = data.featured_products || { badge: '', title: '' };
        data.price_comparison = data.price_comparison || { title: '', subtitle: '', rows: [] };
        data.price_comparison.rows = data.price_comparison.rows || [];
        data.prescription_cta = data.prescription_cta || { title: '', text: '', button_text: '' };
        data.whatsapp_communities = data.whatsapp_communities || { title: '', communities: [] };
        data.whatsapp_communities.communities = data.whatsapp_communities.communities || [];
        data.bottom_cta = data.bottom_cta || { title: '', text: '', primary_button: {text: '', path: ''}, secondary_button: {text: '', path: ''} };
      }
      setConfig(data);
    } catch (error) {
      toast.error('Failed to load site configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm('Are you sure you want to reset ALL home page sections to their original default content? This cannot be undone.')) return;
    
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/reset-config`, {
        method: 'POST',
        credentials: 'include'
      });
      if (res.ok) {
        toast.success('Configuration reset to defaults');
        fetchConfig();
      } else {
        const error = await res.json();
        toast.error(error.detail || 'Failed to reset configuration');
      }
    } catch (error) {
      toast.error('Error resetting configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/site-config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
        credentials: 'include'
      });
      if (res.ok) {
        toast.success('Configuration saved successfully');
      } else {
        const error = await res.json();
        toast.error(error.detail || 'Failed to save configuration');
      }
    } catch (error) {
      toast.error('Error saving configuration');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center py-20">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
  
  if (!config) return (
    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
        <Home className="w-8 h-8 text-slate-300" />
      </div>
      <h3 className="text-xl font-heading font-bold text-slate-700">No Home Configuration Found</h3>
      <p className="text-slate-500 text-sm max-w-sm text-center mt-2 mb-6">
        Your home page content hasn't been initialized yet. Start by creating a default configuration.
      </p>
      <div className="flex gap-4">
        <Button variant="outline" onClick={fetchConfig}>Retry Connection</Button>
        <Button onClick={() => setConfig({
          header: { logo_text: "MediSeller", nav_links: [{label: "Home", path: "/"}, {label: "About", path: "/about"}, {label: "Contact", path: "/contact"}] },
          hero: { title: "Your Trusted Health Partner", subtitle: "Quality medications at your doorstep", image_url: "", badge: "Est. 1980" },
          stats: { items: [{label: "Countries", value: "30+"}, {label: "Satisfied", value: "10k+"}] },
          categories: [
            { title: "Erectile Dysfunction", subtitle: "Trusted ED medications", icon_name: "Zap", color_class: "from-blue-500/10 to-blue-500/5", path: "/products?category=ED" },
            { title: "Diabetes", subtitle: "Insulin and oral meds", icon_name: "Stethoscope", color_class: "from-orange-500/10 to-orange-500/5", path: "/products?category=Diabetes" }
          ],
          how_it_works: { badge: "PROCESS", title: "How It Works", subtitle: "Simple steps to order", steps: [{title: "Browse", description: "Select your medicine", icon: "Search"}] },
          testimonials: { badge: "CLIENTS", title: "What They Say", subtitle: "Customer stories", items: [] },
          faq: { badge: "FAQ", title: "Questions?", items: [] },
          manufacturers: ["Pfizer", "GSK", "Roche"],
          manufacturers_config: { subtitle: "Trusted products from top pharmaceutical manufacturers" },
          featured_products: { badge: "Best Sellers", title: "Most Popular Products" }
        })}>
          Initialize Default Site
        </Button>
      </div>
    </div>
  );

  // Safe defaults for sub-objects — prevents crashes if any nested key is missing
  const header = config.header || { logo_text: '', nav_items: [] };
  const hero = config.hero || {};
  const stats = config.stats || { items: [] };
  const categoriesSection = config.categories_section || { cards: [] };
  const howItWorks = config.how_it_works || { steps: [] };
  const testimonials = config.testimonials || { items: [] };
  const faq = config.faq || { items: [] };
  const priceComparison = config.price_comparison || { rows: [] };
  const whatsappCommunities = config.whatsapp_communities || { communities: [] };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm sticky top-0 z-[40] mb-6 px-6 py-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Home Page Editor</h2>
          <p className="text-sm text-slate-500">Manage all hero, sections, and dynamic content</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleReset} disabled={loading || saving} className="text-slate-600 border-slate-200 hover:bg-slate-50">
            <History className="w-4 h-4 mr-2" /> Reset to Defaults
          </Button>
          <Button onClick={handleSave} disabled={loading || saving} className="bg-primary hover:bg-primary/90 shadow-sm px-6">
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Changes
          </Button>
        </div>
      </div>
      {/* Header Config */}
      <Card className="border-slate-200">
        <CardHeader className="bg-slate-50/50 border-b">
          <CardTitle className="text-lg font-heading text-slate-700">Header Configuration</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Logo Text</label>
              <Input 
                value={config.header.logo_text} 
                className="bg-slate-50 border-slate-200"
                onChange={(e) => setConfig({...config, header: {...config.header, logo_text: e.target.value}})}
              />
            </div>
            <ImageUploadField 
              label="Logo Image URL" 
              value={config.header.logo_url} 
              onChange={(val) => setConfig({...config, header: {...config.header, logo_url: val}})}
            />
            <ImageUploadField 
              label="Favicon URL" 
              value={config.favicon_url} 
              placeholder="/favicon.ico"
              onChange={(val) => setConfig({...config, favicon_url: val})}
            />
          </div>
          <div className="space-y-3">
             <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Navigation Items</label>
             <div className="space-y-4">
                {config.header.nav_items.map((item, idx) => (
                  <div key={idx} className="flex gap-4 items-center bg-slate-50 p-3 rounded-lg border border-slate-100 group transition-all hover:border-slate-300">
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Label</label>
                        <Input 
                          placeholder="e.g. Home" 
                          value={item.label} 
                          className="bg-white border-slate-200 h-9"
                          onChange={(e) => {
                            const newNav = [...config.header.nav_items];
                            newNav[idx].label = e.target.value;
                            setConfig({...config, header: {...config.header, nav_items: newNav}});
                          }}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Path</label>
                        <Input 
                          placeholder="e.g. /home" 
                          value={item.path} 
                          className="bg-white border-slate-200 h-9"
                          onChange={(e) => {
                            const newNav = [...config.header.nav_items];
                            newNav[idx].path = e.target.value;
                            setConfig({...config, header: {...config.header, nav_items: newNav}});
                          }}
                        />
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:text-red-500 hover:bg-white border-transparent hover:border-red-100 border" onClick={() => {
                      const newNav = config.header.nav_items.filter((_, i) => i !== idx);
                      setConfig({...config, header: {...config.header, nav_items: newNav}});
                    }}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" className="w-full border-dashed" onClick={() => {
                  const newNav = [...config.header.nav_items, {label: '', path: ''}];
                  setConfig({...config, header: {...config.header, nav_items: newNav}});
                }}>
                  <Plus className="w-3 h-3 mr-2" /> Add Navigation Item
                </Button>
             </div>
          </div>
        </CardContent>
      </Card>

      {/* Hero Section Config */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="bg-slate-50/50 border-b">
          <CardTitle className="text-lg font-heading text-slate-700">Hero Section Configuration</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Badge Text</label>
                <Input 
                  value={config.hero.badge} 
                  className="bg-slate-50 border-slate-200"
                  onChange={(e) => setConfig({...config, hero: {...config.hero, badge: e.target.value}})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Hero Main Title (H1)</label>
                <Input 
                  value={config.hero.title} 
                  className="bg-slate-50 border-slate-200 font-bold"
                  onChange={(e) => setConfig({...config, hero: {...config.hero, title: e.target.value}})}
                />
              </div>
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Hero Subtitle</label>
                <RichTextEditor 
                  value={config.hero.subtitle} 
                  onChange={(val) => setConfig({...config, hero: {...config.hero, subtitle: val}})}
                  placeholder="Main hero section subtitle..."
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-50/50 p-5 border rounded-xl space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-primary">Primary CTA (View Products)</h4>
                  <p className="text-[10px] text-slate-400">Main action button text and path</p>
                  <div className="space-y-3">
                    <Input placeholder="Button Text" value={config.hero.primary_cta.text} className="bg-white" onChange={(e) => setConfig({...config, hero: {...config.hero, primary_cta: {...config.hero.primary_cta, text: e.target.value}}})} />
                    <Input placeholder="Redirect Path" value={config.hero.primary_cta.path} className="bg-white" onChange={(e) => setConfig({...config, hero: {...config.hero, primary_cta: {...config.hero.primary_cta, path: e.target.value}}})} />
                  </div>
                </div>
                <div className="bg-slate-50/50 p-5 border rounded-xl space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Secondary CTA (Consultation)</h4>
                  <p className="text-[10px] text-slate-400">Secondary action button text and path</p>
                  <div className="space-y-3">
                    <Input placeholder="Button Text" value={config.hero.secondary_cta.text} className="bg-white" onChange={(e) => setConfig({...config, hero: {...config.hero, secondary_cta: {...config.hero.secondary_cta, text: e.target.value}}})} />
                    <Input placeholder="Redirect Path" value={config.hero.secondary_cta.path} className="bg-white" onChange={(e) => setConfig({...config, hero: {...config.hero, secondary_cta: {...config.hero.secondary_cta, path: e.target.value}}})} />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <ImageUploadField 
                label="Hero Image URL (The Doctor/Pharmacist)" 
                value={config.hero.image_url} 
                onChange={(val) => setConfig({...config, hero: {...config.hero, image_url: val}})}
              />
              <ImageUploadField 
                label="Hero Background Image (Optional Overlay)" 
                value={config.hero.background_image_url} 
                onChange={(val) => setConfig({...config, hero: {...config.hero, background_image_url: val}})}
              />
              
              <div className="space-y-4">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Trust Avatars (Profile Images)</label>
                <div className="space-y-3">
                  {(config.hero.trust_avatars || []).map((avatar, idx) => (
                    <div key={idx} className="flex gap-3 items-start bg-slate-50 p-3 rounded-lg border border-slate-100 group">
                      <div className="flex-1">
                        <ImageUploadField 
                          label={`Avatar ${idx + 1}`} 
                          value={avatar} 
                          onChange={(val) => {
                            const newAvatars = [...config.hero.trust_avatars];
                            newAvatars[idx] = val;
                            setConfig({...config, hero: {...config.hero, trust_avatars: newAvatars}});
                          }}
                        />
                      </div>
                      <Button variant="ghost" size="icon" className="mt-5 h-9 w-9 text-slate-400 hover:text-red-500 hover:bg-white border-transparent hover:border-red-100 border" onClick={() => {
                        const newAvatars = config.hero.trust_avatars.filter((_, i) => i !== idx);
                        setConfig({...config, hero: {...config.hero, trust_avatars: newAvatars}});
                      }}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" className="w-full border-dashed" onClick={() => {
                    const newAvatars = [...(config.hero.trust_avatars || []), 'https://i.pravatar.cc/150?u=' + Math.random()];
                    setConfig({...config, hero: {...config.hero, trust_avatars: newAvatars}});
                  }}>
                    <Plus className="w-3 h-3 mr-2" /> Add Avatar
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Patients Count Label</label>
                  <Input value={config.hero.patients_count} className="bg-slate-50 border-slate-200" onChange={(e) => setConfig({...config, hero: {...config.hero, patients_count: e.target.value}})} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Star Rating Number</label>
                  <Input type="number" step="0.1" value={config.hero.rating} className="bg-slate-50 border-slate-200" onChange={(e) => setConfig({...config, hero: {...config.hero, rating: parseFloat(e.target.value)}})} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-50/50 p-5 border rounded-xl space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-green-600">Floating Trust Card</h4>
                  <div className="space-y-3">
                    <Input placeholder="Card Title" value={config.hero.floating_card_title} className="bg-white text-sm" onChange={(e) => setConfig({...config, hero: {...config.hero, floating_card_title: e.target.value}})} />
                    <Input placeholder="Card Subtitle" value={config.hero.floating_card_subtitle} className="bg-white text-sm" onChange={(e) => setConfig({...config, hero: {...config.hero, floating_card_subtitle: e.target.value}})} />
                    <Input placeholder="Icon Name (Lucide)" value={config.hero.floating_card_icon} className="bg-white text-sm" onChange={(e) => setConfig({...config, hero: {...config.hero, floating_card_icon: e.target.value}})} />
                  </div>
                </div>
                <div className="bg-slate-50/50 p-5 border rounded-xl space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-600">Savings Badge (Overlay)</h4>
                  <div className="space-y-3">
                    <Input placeholder="Percentage (e.g. 60%)" value={config.hero.savings_badge_percentage} className="bg-white text-sm" onChange={(e) => setConfig({...config, hero: {...config.hero, savings_badge_percentage: e.target.value}})} />
                    <Input placeholder="Label (e.g. Average Savings)" value={config.hero.savings_badge_text} className="bg-white text-sm" onChange={(e) => setConfig({...config, hero: {...config.hero, savings_badge_text: e.target.value}})} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Bar Configuration */}
      <Card className="border-slate-200">
        <CardHeader className="bg-slate-50/50 border-b">
          <CardTitle className="text-lg font-heading text-slate-700">Stats Bar Configuration</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="space-y-4">
            {(config.stats?.items || []).map((item, idx) => (
              <div key={idx} className="flex gap-4 items-center bg-slate-50 p-3 rounded-lg border border-slate-100 group transition-all hover:border-slate-300">
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Value (e.g. 45+)</label>
                    <Input 
                      value={item.value} 
                      className="bg-white border-slate-200 h-9"
                      onChange={(e) => {
                        const newStats = [...config.stats.items];
                        newStats[idx].value = e.target.value;
                        setConfig({...config, stats: {...config.stats, items: newStats}});
                      }}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Label</label>
                    <Input 
                      value={item.label} 
                      className="bg-white border-slate-200 h-9"
                      onChange={(e) => {
                        const newStats = [...config.stats.items];
                        newStats[idx].label = e.target.value;
                        setConfig({...config, stats: {...config.stats, items: newStats}});
                      }}
                    />
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:text-red-500 hover:bg-white border-transparent hover:border-red-100 border" onClick={() => {
                  const newStats = config.stats.items.filter((_, i) => i !== idx);
                  setConfig({...config, stats: {...config.stats, items: newStats}});
                }}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
            <Button variant="outline" className="w-full border-dashed border-2 hover:bg-slate-50 h-11" onClick={() => {
              const newStats = [...(config.stats?.items || []), {value: '', label: ''}];
              setConfig({...config, stats: {...config.stats, items: newStats}});
            }}>
              <Plus className="w-4 h-4 mr-2" /> Add Stat Item
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Categories Section Configuration */}
      <Card className="border-slate-200">
        <CardHeader className="bg-slate-50/50 border-b">
          <CardTitle className="text-lg font-heading text-slate-700">Categories Section Configuration</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b">
            <div className="md:col-span-2 space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Section Badge</label>
              <Input 
                value={config.categories_section?.badge || ''} 
                className="bg-slate-50 border-slate-200"
                onChange={(e) => setConfig({...config, categories_section: {...config.categories_section, badge: e.target.value}})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Main Title</label>
              <Input 
                value={config.categories_section?.title || ''} 
                className="bg-slate-50 border-slate-200 font-bold"
                onChange={(e) => setConfig({...config, categories_section: {...config.categories_section, title: e.target.value}})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Subtitle</label>
              <textarea 
                className="flex min-h-[80px] w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                value={config.categories_section?.subtitle || ''} 
                onChange={(e) => setConfig({...config, categories_section: {...config.categories_section, subtitle: e.target.value}})}
              />
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Category Cards</label>
            <div className="space-y-4">
              {(config.categories_section?.cards || []).map((card, idx) => (
                <div key={idx} className="bg-slate-50 p-4 rounded-xl border border-slate-100 group transition-all hover:border-slate-300">
                  <div className="flex gap-4 items-start">
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Title</label>
                        <Input value={card.title} className="bg-white h-9" onChange={(e) => {
                          const newCards = [...config.categories_section.cards];
                          newCards[idx].title = e.target.value;
                          setConfig({...config, categories_section: {...config.categories_section, cards: newCards}});
                        }} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Sub-text</label>
                        <Input value={card.subtitle} className="bg-white h-9" onChange={(e) => {
                          const newCards = [...config.categories_section.cards];
                          newCards[idx].subtitle = e.target.value;
                          setConfig({...config, categories_section: {...config.categories_section, cards: newCards}});
                        }} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Icon Name (Lucide)</label>
                        <Input value={card.icon_name} className="bg-white h-9" onChange={(e) => {
                          const newCards = [...config.categories_section.cards];
                          newCards[idx].icon_name = e.target.value;
                          setConfig({...config, categories_section: {...config.categories_section, cards: newCards}});
                        }} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Redirect Path</label>
                        <Input value={card.path} className="bg-white h-9" onChange={(e) => {
                          const newCards = [...config.categories_section.cards];
                          newCards[idx].path = e.target.value;
                          setConfig({...config, categories_section: {...config.categories_section, cards: newCards}});
                        }} />
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:text-red-500 hover:bg-white border border-transparent hover:border-red-100" onClick={() => {
                      const newCards = config.categories_section.cards.filter((_, i) => i !== idx);
                      setConfig({...config, categories_section: {...config.categories_section, cards: newCards}});
                    }}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
              <Button variant="outline" className="w-full border-dashed border-2 hover:bg-slate-50 h-11" onClick={() => {
                const newCards = [...(config.categories_section?.cards || []), {title: '', subtitle: '', icon_name: 'Package', color_class: 'from-primary/10 to-primary/5', path: '/products'}];
                setConfig({...config, categories_section: {...config.categories_section, cards: newCards}});
              }}>
                <Plus className="w-4 h-4 mr-2" /> Add Category Card
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* How It Works Configuration */}
      <Card className="border-slate-200">
        <CardHeader className="bg-slate-50/50 border-b">
          <CardTitle className="text-lg font-heading text-slate-700">How It Works Section</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Badge</label>
              <Input 
                value={config.how_it_works?.badge || ''} 
                onChange={(e) => setConfig({...config, how_it_works: {...config.how_it_works, badge: e.target.value}})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Title</label>
              <Input 
                value={config.how_it_works?.title || ''} 
                onChange={(e) => setConfig({...config, how_it_works: {...config.how_it_works, title: e.target.value}})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Subtitle</label>
              <Input 
                value={config.how_it_works?.subtitle || ''} 
                onChange={(e) => setConfig({...config, how_it_works: {...config.how_it_works, subtitle: e.target.value}})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Action Button Text</label>
              <Input 
                value={config.how_it_works?.button_text || ''} 
                onChange={(e) => setConfig({...config, how_it_works: {...config.how_it_works, button_text: e.target.value}})}
              />
            </div>
          </div>
          <div className="space-y-4">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Steps</label>
            {(config.how_it_works?.steps || []).map((step, idx) => (
              <div key={idx} className="bg-slate-50 p-4 rounded-xl border flex gap-4 items-start">
                <div className="flex-1 space-y-3">
                  <Input placeholder="Step Title" value={step.title} onChange={(e) => {
                    const newSteps = [...config.how_it_works.steps];
                    newSteps[idx].title = e.target.value;
                    setConfig({...config, how_it_works: {...config.how_it_works, steps: newSteps}});
                  }} />
                  <Input placeholder="Description" value={step.description} onChange={(e) => {
                    const newSteps = [...config.how_it_works.steps];
                    newSteps[idx].description = e.target.value;
                    setConfig({...config, how_it_works: {...config.how_it_works, steps: newSteps}});
                  }} />
                  <Input placeholder="Icon Name (Lucide)" value={step.icon} onChange={(e) => {
                    const newSteps = [...config.how_it_works.steps];
                    newSteps[idx].icon = e.target.value;
                    setConfig({...config, how_it_works: {...config.how_it_works, steps: newSteps}});
                  }} />
                </div>
                <Button variant="ghost" size="icon" className="text-slate-400 hover:text-red-500" onClick={() => {
                  const newSteps = config.how_it_works.steps.filter((_, i) => i !== idx);
                  setConfig({...config, how_it_works: {...config.how_it_works, steps: newSteps}});
                }}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
            <Button variant="outline" className="w-full border-dashed" onClick={() => {
              const newSteps = [...(config.how_it_works?.steps || []), {title: '', description: '', icon: 'CheckCircle'}];
              setConfig({...config, how_it_works: {...config.how_it_works, steps: newSteps}});
            }}>
              <Plus className="w-4 h-4 mr-2" /> Add Step
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Testimonials Configuration */}
      <Card className="border-slate-200">
        <CardHeader className="bg-slate-50/50 border-b">
          <CardTitle className="text-lg font-heading text-slate-700">Testimonials Section</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Badge</label>
              <Input 
                value={config.testimonials?.badge || ''} 
                onChange={(e) => setConfig({...config, testimonials: {...config.testimonials, badge: e.target.value}})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Title</label>
              <Input 
                value={config.testimonials?.title || ''} 
                onChange={(e) => setConfig({...config, testimonials: {...config.testimonials, title: e.target.value}})}
              />
            </div>
             <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Subtitle</label>
              <Input 
                value={config.testimonials?.subtitle || ''} 
                onChange={(e) => setConfig({...config, testimonials: {...config.testimonials, subtitle: e.target.value}})}
              />
            </div>
          </div>
          <div className="space-y-4">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Customer Items</label>
            {(config.testimonials?.items || []).map((item, idx) => (
              <div key={idx} className="bg-slate-50 p-4 rounded-xl border space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-500">Testimonial #{idx + 1}</span>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-500" onClick={() => {
                    const newItems = config.testimonials.items.filter((_, i) => i !== idx);
                    setConfig({...config, testimonials: {...config.testimonials, items: newItems}});
                  }}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input placeholder="Customer Name" value={item.name} onChange={(e) => {
                    const newItems = [...config.testimonials.items];
                    newItems[idx].name = e.target.value;
                    setConfig({...config, testimonials: {...config.testimonials, items: newItems}});
                  }} />
                  <Input placeholder="Country" value={item.country} onChange={(e) => {
                    const newItems = [...config.testimonials.items];
                    newItems[idx].country = e.target.value;
                    setConfig({...config, testimonials: {...config.testimonials, items: newItems}});
                  }} />
                </div>
                <textarea 
                  className="flex min-h-[80px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                  placeholder="Review Comment"
                  value={item.comment} 
                  onChange={(e) => {
                    const newItems = [...config.testimonials.items];
                    newItems[idx].comment = e.target.value;
                    setConfig({...config, testimonials: {...config.testimonials, items: newItems}});
                  }} 
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input type="number" step="1" max="5" placeholder="Rating (1-5)" value={item.rating} onChange={(e) => {
                    const newItems = [...config.testimonials.items];
                    newItems[idx].rating = parseInt(e.target.value);
                    setConfig({...config, testimonials: {...config.testimonials, items: newItems}});
                  }} />
                  <Input placeholder="Avatar URL" value={item.avatar_url} onChange={(e) => {
                    const newItems = [...config.testimonials.items];
                    newItems[idx].avatar_url = e.target.value;
                    setConfig({...config, testimonials: {...config.testimonials, items: newItems}});
                  }} />
                </div>
              </div>
            ))}
            <Button variant="outline" className="w-full border-dashed" onClick={() => {
              const newItems = [...(config.testimonials?.items || []), {name: '', country: '', comment: '', rating: 5, avatar_url: ''}];
              setConfig({...config, testimonials: {...config.testimonials, items: newItems}});
            }}>
              <Plus className="w-4 h-4 mr-2" /> Add Testimonial
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* FAQ Configuration */}
      <Card className="border-slate-200">
        <CardHeader className="bg-slate-50/50 border-b">
          <CardTitle className="text-lg font-heading text-slate-700">FAQ Section</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Badge</label>
              <Input 
                value={config.faq?.badge || ''} 
                onChange={(e) => setConfig({...config, faq: {...config.faq, badge: e.target.value}})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Title</label>
              <Input 
                value={config.faq?.title || ''} 
                onChange={(e) => setConfig({...config, faq: {...config.faq, title: e.target.value}})}
              />
            </div>
          </div>
          <div className="space-y-4">
             {(config.faq?.items || []).map((item, idx) => (
              <div key={idx} className="bg-slate-50 p-4 rounded-xl border space-y-3">
                 <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-500">Question #{idx + 1}</span>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-500" onClick={() => {
                    const newItems = config.faq.items.filter((_, i) => i !== idx);
                    setConfig({...config, faq: {...config.faq, items: newItems}});
                  }}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <Input placeholder="Question" value={item.question} onChange={(e) => {
                  const newItems = [...config.faq.items];
                  newItems[idx].question = e.target.value;
                  setConfig({...config, faq: {...config.faq, items: newItems}});
                }} />
                <textarea 
                  className="flex min-h-[80px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                  placeholder="Answer"
                  value={item.answer} 
                  onChange={(e) => {
                    const newItems = [...config.faq.items];
                    newItems[idx].answer = e.target.value;
                    setConfig({...config, faq: {...config.faq, items: newItems}});
                  }} 
                />
              </div>
             ))}
             <Button variant="outline" className="w-full border-dashed" onClick={() => {
              const newItems = [...(config.faq?.items || []), {question: '', answer: ''}];
              setConfig({...config, faq: {...config.faq, items: newItems}});
            }}>
              <Plus className="w-4 h-4 mr-2" /> Add FAQ Item
            </Button>
          </div>
        </CardContent>
      </Card>
      {/* Featured Products (Popular) Section */}
      <Card className="border-slate-200">
        <CardHeader className="bg-slate-50/50 border-b">
          <CardTitle className="text-lg font-heading text-slate-700">Popular Products Section</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Badge (e.g. Best Sellers)</label>
              <Input 
                value={config.featured_products?.badge || ''} 
                onChange={(e) => setConfig({...config, featured_products: {...config.featured_products, badge: e.target.value}})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Main Title</label>
              <Input 
                value={config.featured_products?.title || ''} 
                onChange={(e) => setConfig({...config, featured_products: {...config.featured_products, title: e.target.value}})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Button Text</label>
              <Input 
                value={config.featured_products?.view_all_text || ''} 
                onChange={(e) => setConfig({...config, featured_products: {...config.featured_products, view_all_text: e.target.value}})}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Price Comparison Configuration */}
      <Card className="border-slate-200">
        <CardHeader className="bg-slate-50/50 border-b">
          <CardTitle className="text-lg font-heading text-slate-700">Price Comparison Table</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Section Title</label>
              <Input 
                value={config.price_comparison?.title || ''} 
                onChange={(e) => setConfig({...config, price_comparison: {...config.price_comparison, title: e.target.value}})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Subtitle</label>
              <Input 
                value={config.price_comparison?.subtitle || ''} 
                onChange={(e) => setConfig({...config, price_comparison: {...config.price_comparison, subtitle: e.target.value}})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Badge Text</label>
              <Input 
                value={config.price_comparison?.badge_text || ''} 
                onChange={(e) => setConfig({...config, price_comparison: {...config.price_comparison, badge_text: e.target.value}})}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Banner Title</label>
              <Input 
                value={config.price_comparison?.banner_title || ''} 
                onChange={(e) => setConfig({...config, price_comparison: {...config.price_comparison, banner_title: e.target.value}})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Banner Description</label>
              <textarea 
                className="flex min-h-[80px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                value={config.price_comparison?.banner_text || ''} 
                onChange={(e) => setConfig({...config, price_comparison: {...config.price_comparison, banner_text: e.target.value}})}
              />
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t">
            <h4 className="text-sm font-bold text-slate-600">Annual Savings Calculator</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input placeholder="Calculator Title" value={config.price_comparison?.annual_savings_title || ''} onChange={(e) => setConfig({...config, price_comparison: {...config.price_comparison, annual_savings_title: e.target.value}})} />
              <Input placeholder="Calculator Subtitle" value={config.price_comparison?.annual_savings_subtitle || ''} onChange={(e) => setConfig({...config, price_comparison: {...config.price_comparison, annual_savings_subtitle: e.target.value}})} />
              
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">US Cost Label</label>
                  <Input value={config.price_comparison?.us_annual_label || ''} onChange={(e) => setConfig({...config, price_comparison: {...config.price_comparison, us_annual_label: e.target.value}})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">US Amount ($)</label>
                  <Input type="number" value={config.price_comparison?.us_annual_cost || 0} onChange={(e) => setConfig({...config, price_comparison: {...config.price_comparison, us_annual_cost: parseFloat(e.target.value)}})} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">India Cost Label</label>
                  <Input value={config.price_comparison?.india_annual_label || ''} onChange={(e) => setConfig({...config, price_comparison: {...config.price_comparison, india_annual_label: e.target.value}})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">India Amount ($)</label>
                  <Input type="number" value={config.price_comparison?.india_annual_cost || 0} onChange={(e) => setConfig({...config, price_comparison: {...config.price_comparison, india_annual_cost: parseFloat(e.target.value)}})} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Shipping Label</label>
                  <Input value={config.price_comparison?.shipping_annual_label || ''} onChange={(e) => setConfig({...config, price_comparison: {...config.price_comparison, shipping_annual_label: e.target.value}})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Shipping Amount ($)</label>
                  <Input type="number" value={config.price_comparison?.shipping_annual_cost || 0} onChange={(e) => setConfig({...config, price_comparison: {...config.price_comparison, shipping_annual_cost: parseFloat(e.target.value)}})} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Savings Label</label>
                  <Input value={config.price_comparison?.savings_label || ''} onChange={(e) => setConfig({...config, price_comparison: {...config.price_comparison, savings_label: e.target.value}})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Savings Footer</label>
                  <Input value={config.price_comparison?.savings_footer || ''} onChange={(e) => setConfig({...config, price_comparison: {...config.price_comparison, savings_footer: e.target.value}})} />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Trust Indicators (Under Table)</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(config.price_comparison?.trust_indicators || []).map((indicator, idx) => (
                <div key={idx} className="bg-slate-50 p-3 rounded-lg border space-y-2">
                  <Input placeholder="Title" value={indicator.title} className="h-8 text-xs" onChange={(e) => {
                    const newInd = [...config.price_comparison.trust_indicators];
                    newInd[idx].title = e.target.value;
                    setConfig({...config, price_comparison: {...config.price_comparison, trust_indicators: newInd}});
                  }} />
                  <Input placeholder="Description" value={indicator.description} className="h-8 text-xs" onChange={(e) => {
                    const newInd = [...config.price_comparison.trust_indicators];
                    newInd[idx].description = e.target.value;
                    setConfig({...config, price_comparison: {...config.price_comparison, trust_indicators: newInd}});
                  }} />
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-red-400" onClick={() => {
                    const newInd = config.price_comparison.trust_indicators.filter((_, i) => i !== idx);
                    setConfig({...config, price_comparison: {...config.price_comparison, trust_indicators: newInd}});
                  }}><Trash2 className="w-3 h-3" /></Button>
                </div>
              ))}
              <Button variant="outline" size="sm" className="border-dashed" onClick={() => {
                const newInd = [...(config.price_comparison?.trust_indicators || []), {title: '', description: '', icon: 'Check'}];
                setConfig({...config, price_comparison: {...config.price_comparison, trust_indicators: newInd}});
              }}><Plus className="w-3 h-3 mr-2" /> Add Indicator</Button>
            </div>
          </div>
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Comparison Rows</label>
            {(config.price_comparison?.rows || []).map((row, idx) => (
              <div key={idx} className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-lg border">
                <Input placeholder="Medication Name" value={row.medication} onChange={(e) => {
                  const newRows = [...config.price_comparison.rows];
                  newRows[idx].medication = e.target.value;
                  setConfig({...config, price_comparison: {...config.price_comparison, rows: newRows}});
                }} />
                <Input placeholder="Brand Price" value={row.brand_price} onChange={(e) => {
                  const newRows = [...config.price_comparison.rows];
                  newRows[idx].brand_price = e.target.value;
                  setConfig({...config, price_comparison: {...config.price_comparison, rows: newRows}});
                }} />
                <Input placeholder="Our Price" value={row.mediseller_price} onChange={(e) => {
                  const newRows = [...config.price_comparison.rows];
                  newRows[idx].mediseller_price = e.target.value;
                  setConfig({...config, price_comparison: {...config.price_comparison, rows: newRows}});
                }} />
                <div className="flex gap-2">
                  <Input placeholder="Savings %" value={row.savings} onChange={(e) => {
                    const newRows = [...config.price_comparison.rows];
                    newRows[idx].savings = e.target.value;
                    setConfig({...config, price_comparison: {...config.price_comparison, rows: newRows}});
                  }} />
                  <Button variant="ghost" size="icon" className="text-red-400" onClick={() => {
                    const newRows = config.price_comparison.rows.filter((_, i) => i !== idx);
                    setConfig({...config, price_comparison: {...config.price_comparison, rows: newRows}});
                  }}><Trash2 className="w-4 h-4" /></Button>
                </div>
              </div>
            ))}
            <Button variant="outline" size="sm" className="w-full border-dashed" onClick={() => {
                const newRows = [...(config.price_comparison?.rows || []), {medication: '', brand_price: '', mediseller_price: '', savings: ''}];
                setConfig({...config, price_comparison: {...config.price_comparison, rows: newRows}});
            }}>
              <Plus className="w-3 h-3 mr-2" /> Add Row
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Prescription CTA Configuration */}
      <Card className="border-slate-200">
        <CardHeader className="bg-slate-50/50 border-b">
          <CardTitle className="text-lg font-heading text-slate-700">Prescription CTA Section</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Section Badge</label>
              <Input 
                value={config.prescription_cta?.badge || ''} 
                onChange={(e) => setConfig({...config, prescription_cta: {...config.prescription_cta, badge: e.target.value}})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">CTA Title</label>
              <Input 
                value={config.prescription_cta?.title || ''} 
                onChange={(e) => setConfig({...config, prescription_cta: {...config.prescription_cta, title: e.target.value}})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Upload Button Text</label>
              <Input 
                value={config.prescription_cta?.button_text || ''} 
                onChange={(e) => setConfig({...config, prescription_cta: {...config.prescription_cta, button_text: e.target.value}})}
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Main Description (Subtitle)</label>
            <textarea 
              className="flex min-h-[80px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
              value={config.prescription_cta?.subtitle || ''} 
              onChange={(e) => setConfig({...config, prescription_cta: {...config.prescription_cta, subtitle: e.target.value}})}
            />
          </div>

          {/* Steps */}
          <div className="space-y-4 pt-4 border-t">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Steps (1, 2, 3)</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(config.prescription_cta?.steps || []).map((step, idx) => (
                <div key={idx} className="bg-slate-50 p-3 rounded-lg border space-y-2">
                  <div className="flex justify-between">
                    <span className="text-[10px] font-bold text-slate-400">Step {idx + 1}</span>
                    <Button variant="ghost" size="icon" className="h-4 w-4 text-red-400" onClick={() => {
                      const newSteps = config.prescription_cta.steps.filter((_, i) => i !== idx);
                      setConfig({...config, prescription_cta: {...config.prescription_cta, steps: newSteps}});
                    }}><Trash2 className="w-3 h-3" /></Button>
                  </div>
                  <Input placeholder="Step Title" value={step.title} className="h-8 text-xs" onChange={(e) => {
                    const newSteps = [...config.prescription_cta.steps];
                    newSteps[idx].title = e.target.value;
                    setConfig({...config, prescription_cta: {...config.prescription_cta, steps: newSteps}});
                  }} />
                  <Input placeholder="Description" value={step.description} className="h-8 text-[10px]" onChange={(e) => {
                    const newSteps = [...config.prescription_cta.steps];
                    newSteps[idx].description = e.target.value;
                    setConfig({...config, prescription_cta: {...config.prescription_cta, steps: newSteps}});
                  }} />
                </div>
              ))}
              <Button variant="outline" size="sm" className="border-dashed h-full min-h-[100px]" onClick={() => {
                const newSteps = [...(config.prescription_cta?.steps || []), {title: '', description: ''}];
                setConfig({...config, prescription_cta: {...config.prescription_cta, steps: newSteps}});
              }}><Plus className="w-4 h-4 mr-2" /> Add Step</Button>
            </div>
          </div>

          {/* Right Card */}
          <div className="space-y-4 pt-4 border-t">
            <h4 className="text-sm font-bold text-slate-600">WhatsApp Expert Card (Right Side)</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input placeholder="Card Title" value={config.prescription_cta?.card_title || ''} onChange={(e) => setConfig({...config, prescription_cta: {...config.prescription_cta, card_title: e.target.value}})} />
              <Input placeholder="Card Subtitle" value={config.prescription_cta?.card_subtitle || ''} onChange={(e) => setConfig({...config, prescription_cta: {...config.prescription_cta, card_subtitle: e.target.value}})} />
              <Input placeholder="WhatsApp Phone (e.g. +1...)" value={config.prescription_cta?.whatsapp_number || ''} onChange={(e) => setConfig({...config, prescription_cta: {...config.prescription_cta, whatsapp_number: e.target.value}})} />
              <Input placeholder="WhatsApp CTA Text" value={config.prescription_cta?.whatsapp_cta_text || ''} onChange={(e) => setConfig({...config, prescription_cta: {...config.prescription_cta, whatsapp_cta_text: e.target.value}})} />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(config.prescription_cta?.card_features || []).map((feat, idx) => (
                <div key={idx} className="bg-slate-50 p-3 rounded-lg border space-y-2">
                  <div className="flex justify-between">
                    <span className="text-[10px] font-bold text-slate-400">Feature {idx + 1}</span>
                    <Button variant="ghost" size="icon" className="h-4 w-4 text-red-400" onClick={() => {
                      const newFeats = config.prescription_cta.card_features.filter((_, i) => i !== idx);
                      setConfig({...config, prescription_cta: {...config.prescription_cta, card_features: newFeats}});
                    }}><Trash2 className="w-3 h-3" /></Button>
                  </div>
                  <Input placeholder="Feature Title" value={feat.title} className="h-8 text-xs font-bold" onChange={(e) => {
                    const newFeats = [...config.prescription_cta.card_features];
                    newFeats[idx].title = e.target.value;
                    setConfig({...config, prescription_cta: {...config.prescription_cta, card_features: newFeats}});
                  }} />
                  <Input placeholder="Subtitle" value={feat.description} className="h-8 text-[10px]" onChange={(e) => {
                    const newFeats = [...config.prescription_cta.card_features];
                    newFeats[idx].description = e.target.value;
                    setConfig({...config, prescription_cta: {...config.prescription_cta, card_features: newFeats}});
                  }} />
                  <Input placeholder="Icon Name" value={feat.icon} className="h-8 text-[10px]" onChange={(e) => {
                    const newFeats = [...config.prescription_cta.card_features];
                    newFeats[idx].icon = e.target.value;
                    setConfig({...config, prescription_cta: {...config.prescription_cta, card_features: newFeats}});
                  }} />
                </div>
              ))}
              <Button variant="outline" size="sm" className="border-dashed h-full min-h-[100px]" onClick={() => {
                const newFeats = [...(config.prescription_cta?.card_features || []), {title: '', description: '', icon: 'CheckCircle'}];
                setConfig({...config, prescription_cta: {...config.prescription_cta, card_features: newFeats}});
              }}><Plus className="w-4 h-4 mr-2" /> Add Feature</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* WhatsApp Communities Configuration */}
      <Card className="border-slate-200">
        <CardHeader className="bg-slate-50/50 border-b">
          <CardTitle className="text-lg font-heading text-slate-700">WhatsApp Communities</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Section Badge</label>
              <Input 
                value={config.whatsapp_communities?.badge || ''} 
                onChange={(e) => setConfig({...config, whatsapp_communities: {...config.whatsapp_communities, badge: e.target.value}})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Main Title</label>
              <Input 
                value={config.whatsapp_communities?.title || ''} 
                onChange={(e) => setConfig({...config, whatsapp_communities: {...config.whatsapp_communities, title: e.target.value}})}
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Section Subtitle</label>
            <textarea 
              className="flex min-h-[80px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
              value={config.whatsapp_communities?.subtitle || ''} 
              onChange={(e) => setConfig({...config, whatsapp_communities: {...config.whatsapp_communities, subtitle: e.target.value}})}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Bottom Notice Text</label>
            <Input 
              value={config.whatsapp_communities?.bottom_text || ''} 
              onChange={(e) => setConfig({...config, whatsapp_communities: {...config.whatsapp_communities, bottom_text: e.target.value}})}
            />
          </div>
          <div className="space-y-4">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Communities</label>
            {(config.whatsapp_communities?.communities || []).map((comm, idx) => (
              <div key={idx} className="bg-slate-50 p-4 rounded-xl border space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-500">Community #{idx + 1}</span>
                  <Button variant="ghost" size="icon" className="text-slate-400 hover:text-red-500" onClick={() => {
                    const newComms = config.whatsapp_communities.communities.filter((_, i) => i !== idx);
                    setConfig({...config, whatsapp_communities: {...config.whatsapp_communities, communities: newComms}});
                  }}><Trash2 className="w-4 h-4" /></Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input placeholder="Title" value={comm.title} onChange={(e) => {
                    const newComms = [...config.whatsapp_communities.communities];
                    newComms[idx].title = e.target.value;
                    setConfig({...config, whatsapp_communities: {...config.whatsapp_communities, communities: newComms}});
                  }} />
                  <Input placeholder="Icon Name" value={comm.icon} onChange={(e) => {
                    const newComms = [...config.whatsapp_communities.communities];
                    newComms[idx].icon = e.target.value;
                    setConfig({...config, whatsapp_communities: {...config.whatsapp_communities, communities: newComms}});
                  }} />
                </div>
                <Input placeholder="Subtitle / Description" value={comm.description} onChange={(e) => {
                  const newComms = [...config.whatsapp_communities.communities];
                  newComms[idx].description = e.target.value;
                  setConfig({...config, whatsapp_communities: {...config.whatsapp_communities, communities: newComms}});
                }} />
                <Input placeholder="WhatsApp Link" value={comm.link} onChange={(e) => {
                  const newComms = [...config.whatsapp_communities.communities];
                  newComms[idx].link = e.target.value;
                  setConfig({...config, whatsapp_communities: {...config.whatsapp_communities, communities: newComms}});
                }} />
              </div>
            ))}
            <Button variant="outline" className="w-full border-dashed" onClick={() => {
              const newComms = [...(config.whatsapp_communities?.communities || []), {title: '', description: '', link: '', icon: 'Ribbon'}];
              setConfig({...config, whatsapp_communities: {...config.whatsapp_communities, communities: newComms}});
            }}>
              <Plus className="w-4 h-4 mr-2" /> Add Community
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Global Bottom CTA Configuration */}
      <Card className="border-slate-200">
        <CardHeader className="bg-slate-50/50 border-b">
          <CardTitle className="text-lg font-heading text-slate-700">Global Bottom CTA</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">CTA Title</label>
            <Input 
              value={config.bottom_cta?.title || ''} 
              onChange={(e) => setConfig({...config, bottom_cta: {...config.bottom_cta, title: e.target.value}})}
            />
          </div>
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">CTA Description</label>
            <RichTextEditor 
              value={config.bottom_cta?.text || ''} 
              onChange={(val) => setConfig({...config, bottom_cta: {...config.bottom_cta, text: val}})}
              placeholder="Bottom call to action content..."
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 border rounded-xl bg-primary/5 space-y-3">
              <label className="text-[10px] font-bold uppercase text-primary">Primary Button</label>
              <Input placeholder="Label" value={config.bottom_cta?.primary_button?.text || ''} onChange={(e) => setConfig({...config, bottom_cta: {...config.bottom_cta, primary_button: {...config.bottom_cta.primary_button, text: e.target.value}}})} />
              <Input placeholder="Path" value={config.bottom_cta?.primary_button?.path || ''} onChange={(e) => setConfig({...config, bottom_cta: {...config.bottom_cta, primary_button: {...config.bottom_cta.primary_button, path: e.target.value}}})} />
            </div>
            <div className="p-4 border rounded-xl bg-slate-50 space-y-3">
              <label className="text-[10px] font-bold uppercase text-slate-400">Secondary Button</label>
              <Input placeholder="Label" value={config.bottom_cta?.secondary_button?.text || ''} onChange={(e) => setConfig({...config, bottom_cta: {...config.bottom_cta, secondary_button: {...config.bottom_cta.secondary_button, text: e.target.value}}})} />
              <Input placeholder="Path" value={config.bottom_cta?.secondary_button?.path || ''} onChange={(e) => setConfig({...config, bottom_cta: {...config.bottom_cta, secondary_button: {...config.bottom_cta.secondary_button, path: e.target.value}}})} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Manufacturers Configuration */}
      <Card className="border-slate-200">
        <CardHeader className="bg-slate-50/50 border-b">
          <CardTitle className="text-lg font-heading text-slate-700">Manufacturers Management</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Section Subtitle</label>
            <Input 
              value={config.manufacturers_config?.subtitle || ''} 
              onChange={(e) => setConfig({...config, manufacturers_config: {...config.manufacturers_config, subtitle: e.target.value}})}
            />
          </div>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {(config.manufacturers || []).map((name, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
                  <span className="text-sm font-medium">{name}</span>
                  <button onClick={() => {
                    const newMans = config.manufacturers.filter((_, i) => i !== idx);
                    setConfig({...config, manufacturers: newMans});
                  }}>
                    <Trash2 className="w-3.5 h-3.5 text-slate-400 hover:text-red-500" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input 
                placeholder="Add manufacturer name..." 
                className="max-w-xs"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const val = e.target.value.trim();
                    if (val && !config.manufacturers.includes(val)) {
                      setConfig({...config, manufacturers: [...config.manufacturers, val]});
                      e.target.value = '';
                    }
                  }
                }}
              />
              <Button onClick={(e) => {
                const input = e.currentTarget.previousSibling;
                const val = input.value.trim();
                if (val && !config.manufacturers.includes(val)) {
                  setConfig({...config, manufacturers: [...config.manufacturers, val]});
                  input.value = '';
                }
              }}>Add</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="sticky bottom-8 flex justify-end">
        <Button size="lg" className="rounded-full shadow-2xl h-14 px-8" disabled={saving} onClick={handleSave}>
          {saving ? <Loader2 className="w-5 h-5 mr-3 animate-spin" /> : <Save className="w-5 h-5 mr-3" />}
          Publish Site Updates
        </Button>
      </div>
    </div>
  );
}
