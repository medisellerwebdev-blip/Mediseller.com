import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Save, Loader2, Plus, Trash2, Globe, Layout, Shield, FileText, Share2, Info, Truck } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const GlobalSettingsEditor = () => {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await fetch(`${API_URL}/api/site-config`);
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
      }
    } catch (error) {
      console.error('Error fetching global config:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/site-config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(config)
      });
      if (res.ok) {
        toast.success('Global settings saved successfully');
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      toast.error('Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !config) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Safe accessors
  const header = config.header || { nav_items: [] };
  const footer = config.footer || { social_links: [], footer_links: [] };
  const productsPage = config.products_page || {};
  const productCategories = config.product_categories || [];
  const seo = config.seo || { title: 'Mediseller', description: '', keywords: '' };
  const shipping = config.shipping || { base_cost: 15, free_threshold: 100, tax_rate: 0 };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm sticky top-0 z-[40] mb-6 px-6 py-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Global Settings</h2>
          <p className="text-sm text-slate-500">Manage Header, Footer, and Platform-wide settings</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="bg-primary hover:bg-primary/90 shadow-sm px-6">
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Save All Settings
        </Button>
      </div>

      {/* Header & Top Bar Settings */}
      <Card className="border-slate-200">
        <CardHeader className="bg-slate-50/50 border-b">
          <div className="flex items-center gap-2">
            <Layout className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg font-heading text-slate-700">Header & Top Bar</CardTitle>
          </div>
          <CardDescription>Logo, navigation, and top notification bar</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-slate-500">Logo Text</label>
              <Input 
                value={header.logo_text || ''} 
                onChange={(e) => setConfig({...config, header: {...header, logo_text: e.target.value}})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-slate-500">Logo Image URL</label>
              <Input 
                value={header.logo_url || ''} 
                placeholder="https://..."
                onChange={(e) => setConfig({...config, header: {...header, logo_url: e.target.value}})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-slate-500">Top Bar Text</label>
              <Input 
                value={config.top_bar_text || ''} 
                onChange={(e) => setConfig({...config, top_bar_text: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-slate-500">Top Bar Phone</label>
              <Input 
                value={config.top_bar_phone || ''} 
                onChange={(e) => setConfig({...config, top_bar_phone: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t">
            <label className="text-xs font-bold uppercase text-slate-500">Navigation Links</label>
            <div className="space-y-3">
              {(header.nav_items || []).map((item, idx) => (
                <div key={idx} className="flex gap-4 items-center bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <Input 
                    placeholder="Label (e.g. About)" 
                    value={item.label} 
                    className="flex-1"
                    onChange={(e) => {
                      const newNav = [...header.nav_items];
                      newNav[idx].label = e.target.value;
                      setConfig({...config, header: {...header, nav_items: newNav}});
                    }}
                  />
                  <Input 
                    placeholder="Path (e.g. /about)" 
                    value={item.path} 
                    className="flex-1"
                    onChange={(e) => {
                      const newNav = [...header.nav_items];
                      newNav[idx].path = e.target.value;
                      setConfig({...config, header: {...header, nav_items: newNav}});
                    }}
                  />
                  <Button variant="ghost" size="icon" onClick={() => {
                    const newNav = header.nav_items.filter((_, i) => i !== idx);
                    setConfig({...config, header: {...header, nav_items: newNav}});
                  }}>
                    <Trash2 className="w-4 h-4 text-slate-400" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm" className="w-full border-dashed" onClick={() => {
                const newNav = [...(header.nav_items || []), {label: '', path: ''}];
                setConfig({...config, header: {...header, nav_items: newNav}});
              }}>
                <Plus className="w-4 h-4 mr-2" /> Add Link
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Footer Settings */}
      <Card className="border-slate-200">
        <CardHeader className="bg-slate-50/50 border-b">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg font-heading text-slate-700">Footer & Compliance</CardTitle>
          </div>
          <CardDescription>Brand description, compliance numbers, and social links</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-slate-500">Brand Description</label>
            <textarea 
              className="flex min-h-[80px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
              value={footer.brand_description || ''} 
              onChange={(e) => setConfig({...config, footer: {...footer, brand_description: e.target.value}})}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-slate-500">GST Number</label>
              <Input 
                value={footer.gst_number || ''} 
                onChange={(e) => setConfig({...config, footer: {...footer, gst_number: e.target.value}})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-slate-500">IEC Code</label>
              <Input 
                value={footer.iec_code || ''} 
                onChange={(e) => setConfig({...config, footer: {...footer, iec_code: e.target.value}})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-slate-500">Copyright Text</label>
              <Input 
                value={footer.copyright_text || ''} 
                onChange={(e) => setConfig({...config, footer: {...footer, copyright_text: e.target.value}})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-slate-500">Compliance Notice</label>
              <Input 
                value={config.compliance_notice || ''} 
                onChange={(e) => setConfig({...config, compliance_notice: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-4 pt-6 border-t">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layout className="w-4 h-4 text-primary" />
                <label className="text-xs font-bold uppercase text-slate-500">Footer Link Columns</label>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  const newFooterLinks = [...(footer.footer_links || []), {title: 'New Column', items: []}];
                  setConfig({...config, footer: {...footer, footer_links: newFooterLinks}});
                }}
              >
                <Plus className="w-3 h-3 mr-2" /> Add Column
              </Button>
            </div>
            
            <div className="space-y-6">
              {(() => {
                const editableFooterColumns = Array.isArray(footer.footer_links) && footer.footer_links.some(c => c.title)
                  ? footer.footer_links
                  : (footer.links || []);
                
                return editableFooterColumns.map((column, colIdx) => (
                  <div key={colIdx} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                  <div className="flex gap-4 items-center">
                    <div className="flex-1 space-y-1">
                      <label className="text-[10px] font-bold uppercase text-slate-400">Column Title</label>
                      <Input 
                        value={column.title} 
                        className="bg-white font-semibold"
                        onChange={(e) => {
                          const newFooterLinks = [...footer.footer_links];
                          newFooterLinks[colIdx].title = e.target.value;
                          setConfig({...config, footer: {...footer, footer_links: newFooterLinks}});
                        }}
                      />
                    </div>
                    <Button variant="ghost" size="icon" className="mt-5" onClick={() => {
                      const newFooterLinks = footer.footer_links.filter((_, i) => i !== colIdx);
                      setConfig({...config, footer: {...footer, footer_links: newFooterLinks}});
                    }}>
                      <Trash2 className="w-4 h-4 text-slate-400 hover:text-red-500" />
                    </Button>
                  </div>

                  <div className="space-y-2 pl-4 border-l-2 border-slate-200">
                    <label className="text-[10px] font-bold uppercase text-slate-400">Links</label>
                    <div className="space-y-2">
                      {(column.items || []).map((item, itemIdx) => (
                        <div key={itemIdx} className="flex gap-2 items-center">
                          <Input 
                            placeholder="Label" 
                            className="flex-1 bg-white h-8 text-xs"
                            value={item.label}
                            onChange={(e) => {
                              const newFooterLinks = [...footer.footer_links];
                              newFooterLinks[colIdx].items[itemIdx].label = e.target.value;
                              setConfig({...config, footer: {...footer, footer_links: newFooterLinks}});
                            }}
                          />
                          <Input 
                            placeholder="Path" 
                            className="flex-1 bg-white h-8 text-xs"
                            value={item.path}
                            onChange={(e) => {
                              const newFooterLinks = [...footer.footer_links];
                              newFooterLinks[colIdx].items[itemIdx].path = e.target.value;
                              setConfig({...config, footer: {...footer, footer_links: newFooterLinks}});
                            }}
                          />
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                            const newFooterLinks = [...footer.footer_links];
                            newFooterLinks[colIdx].items = newFooterLinks[colIdx].items.filter((_, i) => i !== itemIdx);
                            setConfig({...config, footer: {...footer, footer_links: newFooterLinks}});
                          }}>
                            <Trash2 className="w-3 h-3 text-slate-400" />
                          </Button>
                        </div>
                      ))}
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-xs h-8 border border-dashed border-slate-300 w-full hover:bg-white"
                        onClick={() => {
                          const newFooterLinks = [...footer.footer_links];
                          if (!newFooterLinks[colIdx].items) newFooterLinks[colIdx].items = [];
                          newFooterLinks[colIdx].items.push({label: '', path: ''});
                          setConfig({...config, footer: {...footer, footer_links: newFooterLinks}});
                        }}
                      >
                        <Plus className="w-3 h-3 mr-1" /> Add Link to {column.title}
                      </Button>
                  </div>
                </div>
              </div>
              ));
              })()}
            </div>
          </div>

          <div className="space-y-4 pt-6 border-t">
            <div className="flex items-center gap-2">
              <Share2 className="w-4 h-4 text-primary" />
              <label className="text-xs font-bold uppercase text-slate-500">Social Links</label>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(footer.social_links || []).map((link, idx) => (
                <div key={idx} className="flex gap-2 items-center bg-slate-50 p-2 rounded-lg border">
                  <Input 
                    value={link.platform} 
                    className="w-24 bg-white"
                    onChange={(e) => {
                      const newLinks = [...footer.social_links];
                      newLinks[idx].platform = e.target.value;
                      setConfig({...config, footer: {...footer, social_links: newLinks}});
                    }}
                  />
                  <Input 
                    value={link.url} 
                    className="flex-1 bg-white"
                    onChange={(e) => {
                      const newLinks = [...footer.social_links];
                      newLinks[idx].url = e.target.value;
                      setConfig({...config, footer: {...footer, social_links: newLinks}});
                    }}
                  />
                  <Button variant="ghost" size="icon" onClick={() => {
                    const newLinks = footer.social_links.filter((_, i) => i !== idx);
                    setConfig({...config, footer: {...footer, social_links: newLinks}});
                  }}>
                    <Trash2 className="w-4 h-4 text-slate-400" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm" className="w-full border-dashed" onClick={() => {
                const newLinks = [...(footer.social_links || []), {platform: 'Facebook', url: ''}];
                setConfig({...config, footer: {...footer, social_links: newLinks}});
              }}>
                <Plus className="w-4 h-4 mr-2" /> Add Social Link
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pages Settings */}
      <Card className="border-slate-200">
        <CardHeader className="bg-slate-50/50 border-b">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg font-heading text-slate-700">Page Headers</CardTitle>
          </div>
          <CardDescription>Custom titles and subtitles for inner pages</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="bg-slate-50 p-4 rounded-xl border">
            <h4 className="font-bold text-sm text-slate-700 mb-4 flex items-center gap-2">
              <Info className="w-4 h-4" /> Products Listing Page
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-slate-500">Main Title</label>
                <Input 
                  value={productsPage.title || ''} 
                  onChange={(e) => setConfig({...config, products_page: {...productsPage, title: e.target.value}})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-slate-500">Subtitle</label>
                <Input 
                  value={productsPage.subtitle || ''} 
                  onChange={(e) => setConfig({...config, products_page: {...productsPage, subtitle: e.target.value}})}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Product Categories Settings */}
      <Card className="border-slate-200">
        <CardHeader className="bg-slate-50/50 border-b">
          <div className="flex items-center gap-2">
            <Layout className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg font-heading text-slate-700">Product Categories</CardTitle>
          </div>
          <CardDescription>Manage the list of categories available for products</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {productCategories.map((cat, idx) => (
                <div key={idx} className="flex gap-2 items-center bg-slate-50 p-2 pl-4 rounded-xl border border-slate-100 group">
                  <span className="flex-1 text-sm font-medium text-slate-700">{cat}</span>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-white" onClick={() => {
                    const newCats = productCategories.filter((_, i) => i !== idx);
                    setConfig({...config, product_categories: newCats});
                  }}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <div className="bg-white p-2 rounded-xl border border-dashed border-slate-300 flex items-center gap-2 pr-4 focus-within:border-primary transition-all">
                <Input 
                  placeholder="New Category..." 
                  className="border-none shadow-none focus-visible:ring-0 h-8 text-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.target.value.trim()) {
                      const val = e.target.value.trim();
                      if (!productCategories.includes(val)) {
                        setConfig({...config, product_categories: [...productCategories, val]});
                        e.target.value = '';
                      } else {
                        toast.error('Category already exists');
                      }
                    }
                  }}
                />
                <Plus className="w-4 h-4 text-slate-300" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SEO Settings */}
      <Card className="border-slate-200">
        <CardHeader className="bg-slate-50/50 border-b">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg font-heading text-slate-700">SEO & Metadata</CardTitle>
          </div>
          <CardDescription>Global search engine optimization settings</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-slate-500">Global Site Title</label>
            <Input 
              value={seo.title || ''} 
              onChange={(e) => setConfig({...config, seo: {...seo, title: e.target.value}})}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-slate-500">Meta Description</label>
            <textarea 
              className="flex min-h-[80px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
              value={seo.description || ''} 
              onChange={(e) => setConfig({...config, seo: {...seo, description: e.target.value}})}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-slate-500">Keywords (Comma separated)</label>
            <Input 
              value={seo.keywords || ''} 
              placeholder="medicine, health, pharmacy"
              onChange={(e) => setConfig({...config, seo: {...seo, keywords: e.target.value}})}
            />
          </div>
        </CardContent>
      </Card>

      {/* Shipping & Tax Settings */}
      <Card className="border-slate-200">
        <CardHeader className="bg-slate-50/50 border-b">
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg font-heading text-slate-700">Shipping & Delivery</CardTitle>
          </div>
          <CardDescription>Configure delivery costs and tax percentages</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-slate-500">Base Shipping Cost ($)</label>
              <Input 
                type="number"
                value={shipping.base_cost || 0} 
                onChange={(e) => setConfig({...config, shipping: {...shipping, base_cost: parseFloat(e.target.value)}})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-slate-500">Free Shipping Threshold ($)</label>
              <Input 
                type="number"
                value={shipping.free_threshold || 0} 
                onChange={(e) => setConfig({...config, shipping: {...shipping, free_threshold: parseFloat(e.target.value)}})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-slate-500">Tax Rate (%)</label>
              <Input 
                type="number"
                value={shipping.tax_rate || 0} 
                onChange={(e) => setConfig({...config, shipping: {...shipping, tax_rate: parseFloat(e.target.value)}})}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GlobalSettingsEditor;
