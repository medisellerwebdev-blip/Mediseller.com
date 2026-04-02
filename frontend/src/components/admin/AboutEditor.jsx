import React, { useState, useEffect } from 'react';
import { Save, Loader2, Plus, Trash2, Shield, Truck, TrendingDown, Target, Eye, Building, Calendar, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { toast } from "sonner";
import RichTextEditor from './RichTextEditor';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const IconMap = {
  Shield: Shield,
  Truck: Truck,
  TrendingDown: TrendingDown,
  Target: Target,
  Eye: Eye,
  Building: Building,
  Calendar: Calendar
};

export default function AboutEditor() {
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
      if (data) {
        data.about_page = data.about_page || {};
        data.about_page.stats = data.about_page.stats || [];
        data.about_page.advantage_section = data.about_page.advantage_section || [];
        data.about_page.timeline = data.about_page.timeline || [];
        data.about_page.compliance_section = data.about_page.compliance_section || { title: '', subtitle: '', gst_number: '', iec_code: '' };
        data.about_page.bottom_cta = data.about_page.bottom_cta || { title: '', subtitle: '', primary_button_text: '', primary_button_link: '', secondary_button_text: '', secondary_button_link: '' };
      }
      setConfig(data);
    } catch (error) {
      toast.error('Failed to load site configuration');
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
        toast.success('About page configuration saved');
        // Re-fetch to ensure the state is perfectly in sync with the server
        fetchConfig();
      } else {
        const error = await res.json();
        toast.error(error.detail || 'Failed to save');
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

  const about = config?.about_page || {};

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm sticky top-0 z-[40] mb-6 px-6 py-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">About Page Editor</h2>
          <p className="text-sm text-slate-500">Manage mission, vision, timeline and advantage sections</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="bg-primary hover:bg-primary/90 shadow-sm px-6">
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Save Changes
        </Button>
      </div>

      {/* Hero Section */}
      <Card className="border-slate-200">
        <CardHeader className="bg-slate-50/50 border-b">
          <CardTitle className="text-lg font-heading text-slate-700">Hero Section</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Badge</label>
              <Input 
                value={about.hero_badge || ''} 
                onChange={(e) => setConfig({...config, about_page: {...about, hero_badge: e.target.value}})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Title</label>
              <Input 
                value={about.hero_title || ''} 
                onChange={(e) => setConfig({...config, about_page: {...about, hero_title: e.target.value}})}
              />
            </div>
          </div>
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Subtitle</label>
            <RichTextEditor 
              value={about.hero_subtitle || ''} 
              onChange={(val) => setConfig({...config, about_page: {...about, hero_subtitle: val}})}
              placeholder="Hero section subtitle..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Mission & Vision */}
      <Card className="border-slate-200">
        <CardHeader className="bg-slate-50/50 border-b">
          <CardTitle className="text-lg font-heading text-slate-700">Mission & Vision</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 text-primary">Mission Title</label>
                <Input value={about.mission_title || ''} onChange={(e) => setConfig({...config, about_page: {...about, mission_title: e.target.value}})} />
              </div>
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Mission Text</label>
                <RichTextEditor 
                  value={about.mission_text || ''} 
                  onChange={(val) => setConfig({...config, about_page: {...about, mission_text: val}})}
                  placeholder="Describe your company's mission..."
                />
              </div>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 text-primary">Vision Title</label>
                <Input value={about.vision_title || ''} onChange={(e) => setConfig({...config, about_page: {...about, vision_title: e.target.value}})} />
              </div>
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Vision Text</label>
                <RichTextEditor 
                  value={about.vision_text || ''} 
                  onChange={(val) => setConfig({...config, about_page: {...about, vision_text: val}})}
                  placeholder="Describe your company's vision..."
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Bar */}
      <Card className="border-slate-200">
        <CardHeader className="bg-slate-50/50 border-b">
          <CardTitle className="text-lg font-heading text-slate-700">Stats Bar</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {(Array.isArray(about.stats) ? about.stats : []).map((stat, idx) => (
              <div key={idx} className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2">
                <div className="flex justify-between items-center">
                   <label className="text-[10px] font-bold text-slate-400 uppercase">Stat #{idx+1}</label>
                   <Button variant="ghost" size="icon" className="h-6 w-6 text-red-400" onClick={() => {
                     const newStats = about.stats.filter((_, i) => i !== idx);
                     setConfig({...config, about_page: {...about, stats: newStats}});
                   }}><Trash2 className="w-3 h-3" /></Button>
                </div>
                <Input placeholder="Value (e.g. 45+)" value={stat.value} className="h-8 text-sm" onChange={(e) => {
                  const newStats = [...about.stats];
                  newStats[idx].value = e.target.value;
                  setConfig({...config, about_page: {...about, stats: newStats}});
                }} />
                <Input placeholder="Label" value={stat.label} className="h-8 text-sm" onChange={(e) => {
                  const newStats = [...about.stats];
                  newStats[idx].label = e.target.value;
                  setConfig({...config, about_page: {...about, stats: newStats}});
                }} />
              </div>
            ))}
            <Button variant="outline" className="border-dashed h-full min-h-[100px]" onClick={() => {
              const newStats = [...about.stats, {value: '', label: ''}];
              setConfig({...config, about_page: {...about, stats: newStats}});
            }}><Plus className="w-4 h-4 mr-2" /> Add Stat</Button>
          </div>
        </CardContent>
      </Card>

      {/* Advantage Cards */}
      <Card className="border-slate-200">
        <CardHeader className="bg-slate-50/50 border-b">
          <CardTitle className="text-lg font-heading text-slate-700">Advantage Cards</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Section Title</label>
              <Input value={about.advantage_title || ''} onChange={(e) => setConfig({...config, about_page: {...about, advantage_title: e.target.value}})} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Section Subtitle</label>
              <Input value={about.advantage_subtitle || ''} onChange={(e) => setConfig({...config, about_page: {...about, advantage_subtitle: e.target.value}})} />
            </div>
          </div>
          <div className="space-y-4">
            {(Array.isArray(about.advantage_section) ? about.advantage_section : []).map((card, idx) => (
              <div key={idx} className="bg-slate-50 p-4 rounded-xl border flex gap-4 items-start">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Title</label>
                    <Input value={card.title} className="h-9 bg-white" onChange={(e) => {
                      const newItems = [...about.advantage_section];
                      newItems[idx].title = e.target.value;
                      setConfig({...config, about_page: {...about, advantage_section: newItems}});
                    }} />
                  </div>
                  <div className="space-y-1 md:col-span-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Icon Name (Lucide)</label>
                    <Input value={card.icon_name} className="h-9 bg-white" onChange={(e) => {
                      const newItems = [...about.advantage_section];
                      newItems[idx].icon_name = e.target.value;
                      setConfig({...config, about_page: {...about, advantage_section: newItems}});
                    }} />
                  </div>
                  <div className="space-y-3 md:col-span-3">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Description</label>
                    <RichTextEditor 
                      value={card.description} 
                      onChange={(val) => {
                        const newItems = [...about.advantage_section];
                        newItems[idx].description = val;
                        setConfig({...config, about_page: {...about, advantage_section: newItems}});
                      }}
                      placeholder="Card description..."
                    />
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="text-red-400" onClick={() => {
                  const newItems = about.advantage_section.filter((_, i) => i !== idx);
                  setConfig({...config, about_page: {...about, advantage_section: newItems}});
                }}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
            <Button variant="outline" className="w-full border-dashed" onClick={() => {
              const newItems = [...about.advantage_section, {title: '', description: '', icon_name: 'Shield'}];
              setConfig({...config, about_page: {...about, advantage_section: newItems}});
            }}><Plus className="w-4 h-4 mr-2" /> Add Card</Button>
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card className="border-slate-200">
        <CardHeader className="bg-slate-50/50 border-b">
          <CardTitle className="text-lg font-heading text-slate-700">Journey Timeline</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Timeline Title</label>
              <Input value={about.timeline_title || ''} onChange={(e) => setConfig({...config, about_page: {...about, timeline_title: e.target.value}})} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Timeline Subtitle</label>
              <Input value={about.timeline_subtitle || ''} onChange={(e) => setConfig({...config, about_page: {...about, timeline_subtitle: e.target.value}})} />
            </div>
          </div>
          <div className="space-y-4">
            {(Array.isArray(about.timeline) ? about.timeline : []).map((milestone, idx) => (
              <div key={idx} className="flex gap-4 items-center bg-slate-50 p-3 rounded-lg border">
                <div className="w-24">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Year</label>
                  <Input value={milestone.year} className="h-9 bg-white" onChange={(e) => {
                    const newItems = [...about.timeline];
                    newItems[idx].year = e.target.value;
                    setConfig({...config, about_page: {...about, timeline: newItems}});
                  }} />
                </div>
                <div className="flex-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Event Description</label>
                  <Input value={milestone.event} className="h-9 bg-white" onChange={(e) => {
                    const newItems = [...about.timeline];
                    newItems[idx].event = e.target.value;
                    setConfig({...config, about_page: {...about, timeline: newItems}});
                  }} />
                </div>
                <Button variant="ghost" size="icon" className="text-red-400" onClick={() => {
                  const newItems = about.timeline.filter((_, i) => i !== idx);
                  setConfig({...config, about_page: {...about, timeline: newItems}});
                }}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
            <Button variant="outline" className="w-full border-dashed" onClick={() => {
              const newItems = [...about.timeline, {year: '', event: ''}];
              setConfig({...config, about_page: {...about, timeline: newItems}});
            }}><Plus className="w-4 h-4 mr-2" /> Add Milestone</Button>
          </div>
        </CardContent>
      </Card>

      {/* Compliance Section */}
      <Card className="border-slate-200">
        <CardHeader className="bg-slate-50/50 border-b">
          <CardTitle className="text-lg font-heading text-slate-700">Compliance & Certifications</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Compliance Title</label>
              <Input 
                value={about.compliance_section?.title || ''} 
                onChange={(e) => setConfig({...config, about_page: {...about, compliance_section: {...about.compliance_section, title: e.target.value}}})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">GST Number</label>
              <Input 
                value={about.compliance_section?.gst_number || ''} 
                onChange={(e) => setConfig({...config, about_page: {...about, compliance_section: {...about.compliance_section, gst_number: e.target.value}}})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">IEC Code</label>
              <Input 
                value={about.compliance_section?.iec_code || ''} 
                onChange={(e) => setConfig({...config, about_page: {...about, compliance_section: {...about.compliance_section, iec_code: e.target.value}}})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Description</label>
              <textarea 
                className="flex min-h-[80px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                value={about.compliance_section?.subtitle || ''} 
                onChange={(e) => setConfig({...config, about_page: {...about, compliance_section: {...about.compliance_section, subtitle: e.target.value}}})}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bottom CTA */}
      <Card className="border-slate-200">
        <CardHeader className="bg-slate-50/50 border-b">
          <CardTitle className="text-lg font-heading text-slate-700">Bottom CTA Banner</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 text-primary">CTA Title</label>
              <Input value={about.bottom_cta?.title || ''} onChange={(e) => setConfig({...config, about_page: {...about, bottom_cta: {...about.bottom_cta, title: e.target.value}}})} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">CTA Subtitle</label>
              <Input value={about.bottom_cta?.subtitle || ''} onChange={(e) => setConfig({...config, about_page: {...about, bottom_cta: {...about.bottom_cta, subtitle: e.target.value}}})} />
            </div>
            <div className="bg-slate-50 p-4 rounded-lg border space-y-3">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Primary Button</label>
              <Input placeholder="Text" value={about.bottom_cta?.primary_button_text} onChange={(e) => setConfig({...config, about_page: {...about, bottom_cta: {...about.bottom_cta, primary_button_text: e.target.value}}})} />
              <Input placeholder="Link" value={about.bottom_cta?.primary_button_link} onChange={(e) => setConfig({...config, about_page: {...about, bottom_cta: {...about.bottom_cta, primary_button_link: e.target.value}}})} />
            </div>
            <div className="bg-slate-50 p-4 rounded-lg border space-y-3">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Secondary Button</label>
              <Input placeholder="Text" value={about.bottom_cta?.secondary_button_text} onChange={(e) => setConfig({...config, about_page: {...about, bottom_cta: {...about.bottom_cta, secondary_button_text: e.target.value}}})} />
              <Input placeholder="Link" value={about.bottom_cta?.secondary_button_link} onChange={(e) => setConfig({...config, about_page: {...about, bottom_cta: {...about.bottom_cta, secondary_button_link: e.target.value}}})} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="sticky bottom-8 flex justify-end">
        <Button size="lg" className="rounded-full shadow-2xl h-14 px-8" disabled={saving} onClick={handleSave}>
          {saving ? <Loader2 className="w-5 h-5 mr-3 animate-spin" /> : <Save className="w-5 h-5 mr-3" />}
          Save About Page
        </Button>
      </div>
    </div>
  );
}
