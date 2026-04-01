import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Loader2, ChevronRight, Scale, Shield, Receipt } from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { Card, CardContent } from '../components/ui/card';
import DOMPurify from 'dompurify';
import { marked } from 'marked';
import { useConfig } from '../context/ConfigContext';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function LegalPage() {
  const { policyType } = useParams(); // 'privacy', 'terms', 'refund'
  const { config, loading } = useConfig();

  const getPolicyData = () => {
    if (!config) return null;
    const pTypeMap = {
      'privacy': 'privacy_policy',
      'terms': 'terms_of_service',
      'refund': 'refund_policy'
    };
    const key = pTypeMap[policyType];
    return config.legal_pages?.[key] || {
      title: policyType === 'privacy' ? 'Privacy Policy' : policyType === 'terms' ? 'Terms of Service' : 'Refund Policy',
      content: '<p>Content has not been configured yet.</p>',
      last_updated: ''
    };
  };

  const policyData = getPolicyData();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const icons = {
    'privacy': <Shield className="w-12 h-12 text-primary" />,
    'terms': <Scale className="w-12 h-12 text-blue-600" />,
    'refund': <Receipt className="w-12 h-12 text-green-600" />
  };

  return (
    <div className="min-h-screen bg-slate-50 border-t border-slate-200" data-testid="legal-page">
      {/* Header */}
      <div className="bg-slate-900 text-white py-16 md:py-24 relative overflow-hidden">
        {/* Abstract background shapes */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
          <div className="absolute top-[-20%] right-[-10%] w-[50%] md:w-[30%] aspect-square rounded-full bg-primary/20 blur-3xl opacity-50" />
          <div className="absolute bottom-[-20%] left-[-10%] w-[40%] aspect-square rounded-full bg-blue-500/20 blur-3xl opacity-50" />
        </div>

        <div className="container-custom relative z-10 text-center">
          <div className="w-24 h-24 mx-auto bg-white/10 rounded-3xl flex items-center justify-center mb-6 shadow-2xl shadow-black/50 backdrop-blur-sm border border-white/10 overflow-hidden relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            {icons[policyType]}
          </div>
          <Badge className="bg-white/10 text-white border-white/20 mb-4 hover:bg-white/20 transition-colors">
            Legal & Compliance
          </Badge>
          <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold mb-4 tracking-tight drop-shadow-sm">
            {policyData?.title}
          </h1>
          {policyData?.last_updated && (
            <p className="text-slate-300 md:text-lg max-w-2xl mx-auto flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              Last Updated: {policyData.last_updated}
            </p>
          )}
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
        <div className="container-custom py-4">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Link to="/" className="hover:text-primary transition-colors flex items-center gap-1">
              Home
            </Link>
            <ChevronRight className="w-4 h-4 text-slate-400" />
            <span className="text-slate-900 font-medium">Legal</span>
            <ChevronRight className="w-4 h-4 text-slate-400" />
            <span className="text-slate-900 font-medium">{policyData?.title}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container-custom py-12 md:py-20">
        <div className="max-w-4xl mx-auto">
          <Card className="border-0 shadow-xl shadow-slate-200/50 rounded-2xl overflow-hidden bg-white">
            <CardContent className="p-8 md:p-12 prose prose-slate md:prose-lg max-w-none 
              prose-headings:font-heading prose-headings:font-bold prose-headings:text-slate-900
              prose-h2:text-2xl prose-h2:mb-4 prose-h2:mt-10
              prose-h3:text-xl prose-h3:text-slate-800
              prose-p:text-slate-600 prose-p:leading-relaxed
              prose-a:text-primary prose-a:no-underline hover:prose-a:underline
              prose-strong:text-slate-900 prose-strong:font-bold
              prose-ul:text-slate-600 prose-li:my-1
              prose-hr:border-slate-200">
              {policyData?.content ? (
                <div 
                  className="prose-content"
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(marked.parse(policyData.content)) }} 
                />
              ) : (
                <p>No content has been defined yet.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
