import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Building, Loader2 } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import DynamicIcon from '../components/icons/DynamicIcon';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function AboutPage() {
  const [siteConfig, setSiteConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  // Debugging: Ensure it doesn't return null
  console.log("Rendering AboutPage, siteConfig:", siteConfig);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch(`${API_URL}/api/site-config`);
        if (res.ok) {
          const data = await res.json();
          setSiteConfig(data);
        }
      } catch (error) {
        console.error('Error fetching site config:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, []);

  const aboutData = siteConfig?.about_page || {};
  const stats = aboutData.stats || [];
  const timeline = aboutData.timeline || [];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Loading About MediSeller...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" data-testid="about-page">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-slate-200">
        <div className="container-custom py-4">
          <div className="flex items-center gap-2 text-sm">
            <Link to="/" className="text-slate-500 hover:text-primary">Home</Link>
            <ChevronRight className="w-4 h-4 text-slate-400" />
            <span className="text-slate-900 font-medium">About Us</span>
          </div>
        </div>
      </div>

      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white py-20">
        <div className="container-custom">
          <div className="max-w-3xl">
            <Badge className="bg-primary/20 text-primary-200 border-primary/30 mb-4">
              {aboutData.hero_badge || '45+ Years of Excellence'}
            </Badge>
            <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              {aboutData.hero_title || 'Trusted Pharmaceutical Partner Since 1981'}
            </h1>
            <p className="text-xl text-slate-300 leading-relaxed">
              {aboutData.hero_subtitle || 'MediSeller has been at the forefront of pharmaceutical distribution for over four decades.'}
            </p>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container-custom">
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h2 className="font-heading text-3xl font-bold mb-4">
                {aboutData.mission_title || 'Our Mission'}
              </h2>
              <p className="text-slate-600 text-lg leading-relaxed">
                {aboutData.mission_text || 'To make life-saving medications accessible and affordable to patients worldwide.'}
              </p>
            </div>
            <div>
              <h2 className="font-heading text-3xl font-bold mb-4">
                {aboutData.vision_title || 'Our Vision'}
              </h2>
              <p className="text-slate-600 text-lg leading-relaxed">
                {aboutData.vision_text || 'To become the most trusted global online pharmacy, known for authenticity, affordability, and excellent customer care.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-slate-50">
        <div className="container-custom">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <p className="text-4xl md:text-5xl font-bold text-primary">{stat.value}</p>
                <p className="text-slate-600 mt-2">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4">
              {aboutData.advantage_section?.title || "The MediSeller Advantage"}
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              {aboutData.advantage_section?.subtitle || "What sets us apart in the pharmaceutical distribution industry"}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {(aboutData.advantage_section?.items || aboutData.advantage_section?.cards || []).map((card, idx) => (
              <Card key={idx} className="border-slate-200">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                    <DynamicIcon name={card.icon_name} className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-heading font-semibold text-xl mb-2">{card.title}</h3>
                  <p className="text-slate-600">{card.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-16 md:py-24 bg-slate-50">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4">
              {aboutData.timeline_title || 'Our Journey'}
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              {aboutData.timeline_subtitle || '45+ years of growth, trust, and commitment to patient care'}
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            <div className="space-y-8">
              {timeline.map((milestone, index) => (
                <div key={index} className="flex gap-6">
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center font-bold">
                      {milestone.year.slice(-2)}
                    </div>
                    {index < timeline.length - 1 && (
                      <div className="w-0.5 h-full bg-slate-300 mt-2" />
                    )}
                  </div>
                  <div className="pb-8">
                    <p className="font-semibold text-primary">{milestone.year}</p>
                    <p className="text-slate-600">{milestone.event}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Compliance */}
      <section className="py-16 bg-white">
        <div className="container-custom">
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row items-start gap-6">
                <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Building className="w-8 h-8 text-green-600" />
                </div>
                <div>
                  <h3 className="font-heading text-2xl font-bold text-green-900 mb-2">
                    {aboutData.compliance_section?.title || 'Licensed & Certified'}
                  </h3>
                  <p className="text-green-800 mb-4">
                    {aboutData.compliance_section?.subtitle || 'MediSeller (A Unit of Medicare) is a government-certified global exporter, all-India wholesaler, and retailer of authentic pharmaceutical products.'}
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <div className="bg-white rounded-lg px-4 py-2 border border-green-200">
                      <p className="text-xs text-green-600">GST Number</p>
                      <p className="font-mono font-semibold text-green-900">{aboutData.compliance_section?.gst_number || '07AAIPG2896A1ZV'}</p>
                    </div>
                    <div className="bg-white rounded-lg px-4 py-2 border border-green-200">
                      <p className="text-xs text-green-600">IEC Code</p>
                      <p className="font-mono font-semibold text-green-900">{aboutData.compliance_section?.iec_code || '0514067152'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-24 bg-slate-900 text-white">
        <div className="container-custom text-center">
          <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4">
            {aboutData.bottom_cta?.title || 'Ready to Get Started?'}
          </h2>
          <p className="text-slate-400 text-lg mb-8 max-w-2xl mx-auto">
            {aboutData.bottom_cta?.subtitle || 'Browse our catalog of authentic medications or speak with our expert team to find the right solutions.'}
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to={aboutData.bottom_cta?.primary_button_link || "/products"}>
              <Button size="lg" className="rounded-full h-12 px-8 bg-white text-slate-900 hover:bg-slate-100">
                {aboutData.bottom_cta?.primary_button_text || 'Browse Products'}
              </Button>
            </Link>
            <Link to={aboutData.bottom_cta?.secondary_button_link || "/consultation"}>
              <Button size="lg" variant="outline" className="rounded-full h-12 px-8 border-slate-600 text-white hover:bg-slate-800">
                {aboutData.bottom_cta?.secondary_button_text || 'Talk to Expert'}
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
