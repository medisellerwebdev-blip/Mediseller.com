import React, { useState, useEffect } from 'react';
import { Save, Loader2, MapPin, Phone, Mail, Clock, MessageCircle, Trash2, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { toast } from "sonner";

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function ContactEditor() {
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
        toast.success('Contact page configuration saved');
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

  if (!config && !loading) return (
    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
        <MessageCircle className="w-8 h-8 text-slate-300" />
      </div>
      <h3 className="text-xl font-heading font-bold text-slate-700">No Contact Page Configuration Found</h3>
      <p className="text-slate-500 text-sm max-w-sm text-center mt-2 mb-6">
        The contact details for your website haven't been set up yet.
      </p>
      <div className="flex gap-4">
        <Button variant="outline" onClick={fetchConfig}>Retry Connection</Button>
        <Button onClick={() => setConfig({
          ...config,
          contact_page: {
            hero_title: "Get in Touch",
            hero_subtitle: "Have questions about our products or services? Our team is here to help.",
            address: "Plot No. 12, Export Zone, Okhla Phase III, New Delhi, India 110020",
            phone: "+91 9876543210",
            email: "support@mediseller.com",
            business_hours: [
              "Monday - Friday: 9:00 AM - 6:00 PM",
              "Saturday: 10:00 AM - 2:00 PM",
              "Sunday: Closed"
            ],
            whatsapp_title: "Quick Support",
            whatsapp_number: "919876543210",
            whatsapp_description: "Chat with us for instant assistance regarding orders and products."
          }
        })}>
          Initialize Contact Page
        </Button>
      </div>
    </div>
  );

  const contactData = config?.contact_page || {};

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm sticky top-0 z-[40] mb-6 px-6 py-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Contact Page Editor</h2>
          <p className="text-sm text-slate-500">Manage address, phone, email and WhatsApp details</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="bg-primary hover:bg-primary/90 shadow-sm px-6">
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Save Changes
        </Button>
      </div>

      {/* Hero Section */}
      <Card className="border-slate-200">
        <CardHeader className="bg-slate-50/50 border-b">
          <CardTitle className="text-lg font-heading text-slate-700">Contact Hero Section</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Hero Title</label>
              <Input 
                value={contactData.hero_title || ''} 
                onChange={(e) => setConfig({...config, contact_page: {...contactData, hero_title: e.target.value}})}
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Hero Subtitle</label>
              <textarea 
                className="flex min-h-[80px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                value={contactData.hero_subtitle || ''} 
                onChange={(e) => setConfig({...config, contact_page: {...contactData, hero_subtitle: e.target.value}})}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Info */}
      <Card className="border-slate-200">
        <CardHeader className="bg-slate-50/50 border-b">
          <CardTitle className="text-lg font-heading text-slate-700">Contact Information</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="space-y-4">
            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div className="flex-1 space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Physical Address</label>
                <textarea 
                  className="flex min-h-[80px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                  value={contactData.address || ''} 
                  onChange={(e) => setConfig({...config, contact_page: {...contactData, address: e.target.value}})}
                />
              </div>
            </div>
            <div className="flex gap-4 items-center">
              <div className="w-10 h-10 bg-green-50 text-green-600 rounded-lg flex items-center justify-center shrink-0">
                <Phone className="w-5 h-5" />
              </div>
              <div className="flex-1 space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Phone Number</label>
                <Input 
                  value={contactData.phone || ''} 
                  className="bg-white h-9"
                  onChange={(e) => setConfig({...config, contact_page: {...contactData, phone: e.target.value}})}
                />
              </div>
            </div>
            <div className="flex gap-4 items-center">
              <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center shrink-0">
                <Mail className="w-5 h-5" />
              </div>
              <div className="flex-1 space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Support Email</label>
                <Input 
                  value={contactData.email || ''} 
                  className="bg-white h-9"
                  onChange={(e) => setConfig({...config, contact_page: {...contactData, email: e.target.value}})}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Business Hours */}
      <Card className="border-slate-200">
        <CardHeader className="bg-slate-50/50 border-b">
          <CardTitle className="text-lg font-heading text-slate-700">Business Hours</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="space-y-3">
            {(contactData.business_hours || []).map((hour, idx) => (
              <div key={idx} className="flex gap-3 items-center">
                <Clock className="w-4 h-4 text-slate-400" />
                <Input 
                  value={hour} 
                  className="bg-white h-9"
                  onChange={(e) => {
                    const newHours = [...contactData.business_hours];
                    newHours[idx] = e.target.value;
                    setConfig({...config, contact_page: {...contactData, business_hours: newHours}});
                  }}
                />
                <Button variant="ghost" size="icon" className="shrink-0 text-slate-300 hover:text-red-500" onClick={() => {
                  const newHours = contactData.business_hours.filter((_, i) => i !== idx);
                  setConfig({...config, contact_page: {...contactData, business_hours: newHours}});
                }}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm" className="w-full border-dashed" onClick={() => {
              const newHours = [...(contactData.business_hours || []), ''];
              setConfig({...config, contact_page: {...contactData, business_hours: newHours}});
            }}>
              <Plus className="w-3 h-3 mr-2" /> Add Hours Row
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* WhatsApp Support */}
      <Card className="border-slate-200">
        <CardHeader className="bg-slate-50/50 border-b">
          <CardTitle className="text-lg font-heading text-slate-700">WhatsApp Support</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">WhatsApp Title</label>
              <Input 
                value={contactData.whatsapp_title || ''} 
                onChange={(e) => setConfig({...config, contact_page: {...contactData, whatsapp_title: e.target.value}})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">WhatsApp Number</label>
              <Input 
                value={contactData.whatsapp_number || ''} 
                placeholder="e.g. 1234567890 (no + or spaces)"
                onChange={(e) => setConfig({...config, contact_page: {...contactData, whatsapp_number: e.target.value}})}
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">WhatsApp Description</label>
              <textarea 
                className="flex min-h-[80px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                value={contactData.whatsapp_description || ''} 
                onChange={(e) => setConfig({...config, contact_page: {...contactData, whatsapp_description: e.target.value}})}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="sticky bottom-8 flex justify-end">
        <Button size="lg" className="rounded-full shadow-2xl h-14 px-8" disabled={saving} onClick={handleSave}>
          {saving ? <Loader2 className="w-5 h-5 mr-3 animate-spin" /> : <Save className="w-5 h-5 mr-3" />}
          Save Contact Page
        </Button>
      </div>
    </div>
  );
}
