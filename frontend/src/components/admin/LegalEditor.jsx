import React, { useState, useEffect } from 'react';
import { Save, Loader2, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { toast } from "sonner";
import RichTextEditor from './RichTextEditor';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function LegalEditor() {
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
        data.legal_pages = data.legal_pages || {
          privacy_policy: { title: 'Privacy Policy', content: '', last_updated: '' },
          terms_of_service: { title: 'Terms of Service', content: '', last_updated: '' },
          refund_policy: { title: 'Refund Policy', content: '', last_updated: '' }
        };
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
        toast.success('Legal Pages configuration saved');
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
    <div className="min-h-[400px] flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  const pages = [
    { key: 'privacy_policy', label: 'Privacy Policy' },
    { key: 'terms_of_service', label: 'Terms of Service' },
    { key: 'refund_policy', label: 'Refund Policy' }
  ];

  const handlePageChange = (pageKey, field, value) => {
    setConfig(prev => ({
      ...prev,
      legal_pages: {
        ...prev.legal_pages,
        [pageKey]: {
          ...prev.legal_pages[pageKey],
          [field]: value
        }
      }
    }));
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex items-center justify-between bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h2 className="text-2xl font-bold font-heading text-slate-900 flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <FileText className="w-6 h-6 text-primary" />
            </div>
            Legal Pages Settings
          </h2>
          <p className="text-slate-500 mt-1">Manage Privacy Policy, Terms of Service, and Refund Policy content.</p>
        </div>
        <Button onClick={() => fetchConfig()} variant="outline" className="rounded-full shadow-sm">
          Discard Changes
        </Button>
      </div>

      <div className="space-y-6">
        {pages.map(({ key, label }) => {
          const pageData = config?.legal_pages?.[key] || { title: label, content: '', last_updated: '' };
          return (
            <Card key={key} className="border-slate-200 shadow-sm overflow-hidden">
              <CardHeader className="bg-slate-50 border-b">
                <CardTitle className="text-lg font-heading text-slate-800 flex items-center gap-2">
                   <FileText className="w-5 h-5 text-slate-400" />
                   {label}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Page Title</label>
                    <Input 
                      value={pageData.title} 
                      onChange={(e) => handlePageChange(key, 'title', e.target.value)}
                      className="bg-slate-50"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Last Updated Date</label>
                    <Input 
                      value={pageData.last_updated} 
                      placeholder="e.g. 2026-01-01 or January 1, 2026"
                      onChange={(e) => handlePageChange(key, 'last_updated', e.target.value)}
                      className="bg-slate-50"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Markdown Content</label>
                    <span className="text-xs text-slate-400">Supports Markdown formatting</span>
                  </div>
                  <RichTextEditor 
                    value={pageData.content} 
                    onChange={(val) => handlePageChange(key, 'content', val)}
                    placeholder={`# ${label}\n\nEnter the full policy text here...`}
                  />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="sticky bottom-8 flex justify-end z-10 pt-4">
        <Button size="lg" className="rounded-full shadow-2xl h-14 px-8" disabled={saving} onClick={handleSave}>
          {saving ? <Loader2 className="w-5 h-5 mr-3 animate-spin" /> : <Save className="w-5 h-5 mr-3" />}
          Save Legal Pages
        </Button>
      </div>
    </div>
  );
}
