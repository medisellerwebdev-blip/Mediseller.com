import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Phone, 
  Mail, 
  MapPin, 
  Facebook, 
  Twitter, 
  Linkedin, 
  Instagram,
  Shield,
  Truck,
  CreditCard,
  HeadphonesIcon,
  ChevronRight,
  Globe
} from 'lucide-react';
import * as Icons from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export const Footer = () => {
  const [siteConfig, setSiteConfig] = useState(null);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch(`${API_URL}/api/site-config`);
        if (res.ok) {
          const data = await res.json();
          setSiteConfig(data);
        }
      } catch (error) {
        console.error('Error fetching site config for footer:', error);
      }
    };
    fetchConfig();
  }, []);

  const footerData = siteConfig?.footer || {};
  const contactData = siteConfig?.contact_page || {};

  const getSocialIcon = (platform) => {
    switch (platform.toLowerCase()) {
      case 'facebook': return <Facebook className="w-4 h-4" />;
      case 'twitter': return <Twitter className="w-4 h-4" />;
      case 'linkedin': return <Linkedin className="w-4 h-4" />;
      case 'instagram': return <Instagram className="w-4 h-4" />;
      default: return <Globe className="w-4 h-4" />;
    }
  };

  return (
    <footer className="bg-[#0f172a] text-slate-200 border-t border-slate-800">
      {/* Top Section: Trust Badges */}
      <div className="border-b border-slate-800/50 bg-[#1e293b]/30">
        <div className="container-custom py-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {(siteConfig?.trust_badges?.badges?.length > 0 ? siteConfig.trust_badges.badges : [
              {title: '100% Authentic', description: 'Verified Quality', icon: 'Shield'},
              {title: 'Global Delivery', description: '30+ Countries', icon: 'Truck'},
              {title: 'Secure Payment', description: 'SSL Encrypted', icon: 'CreditCard'},
              {title: 'Expert Support', description: '24/7 Available', icon: 'HeadphonesIcon'}
            ]).map((badge, idx) => {
              const IconComponent = Icons[badge.icon] || Icons.Shield;
              return (
                <div key={idx} className="flex items-center gap-4 group">
                  <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center group-hover:bg-primary/20 transition-all duration-300">
                    <IconComponent className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-100 tracking-tight">{badge.title}</p>
                    <p className="text-xs text-slate-400 font-medium">{badge.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Footer: 4-Column Grid */}
      <div className="container-custom py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8">
          
          {/* Column 1: Brand & Social (Column Span 4) */}
          <div className="lg:col-span-4 space-y-6">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                <span className="text-white font-bold text-xl font-heading">M</span>
              </div>
              <span className="font-heading font-bold text-2xl text-white tracking-tight italic">
                {siteConfig?.header?.logo_text || 'MediSeller'}
              </span>
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
              {footerData.brand_description || 'Your trusted global online pharmacy with 45+ years of excellence. Sourcing authentic medications directly from licensed manufacturers.'}
            </p>
            <div className="flex gap-3 pt-2">
              {(footerData.social_links || [
                { platform: 'Facebook', url: '#' },
                { platform: 'Twitter', url: '#' },
                { platform: 'LinkedIn', url: '#' },
                { platform: 'Instagram', url: '#' }
              ]).map((link, idx) => (
                <a 
                  key={idx} 
                  href={link.url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="w-10 h-10 bg-slate-800/50 border border-slate-700/50 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-primary hover:border-primary transition-all duration-300"
                  aria-label={link.platform}
                >
                  {getSocialIcon(link.platform)}
                </a>
              ))}
            </div>
          </div>

          {/* Column 2 & 3: Dynamic Links (Column Span 2 each) */}
          {(() => {
            const cols = Array.isArray(footerData.footer_links) && footerData.footer_links.some(c => c.title)
              ? footerData.footer_links
              : (footerData.links || []);
            
            return cols.filter(col => col.title).map((column, colIdx) => (
              <div key={colIdx} className="lg:col-span-2">
                <h4 className="font-bold text-white mb-6 text-sm uppercase tracking-widest">{column.title}</h4>
                <ul className="space-y-4">
                  {(column.items || []).map((link, idx) => (
                    <li key={idx}>
                      <Link 
                        to={link.path}
                        className="text-slate-400 hover:text-primary flex items-center gap-2 group transition-colors text-sm font-medium"
                      >
                        <ChevronRight className="w-3 h-3 text-slate-600 group-hover:text-primary transition-colors" />
                        {link.label || link.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ));
          })()}

          {/* Column 4: Contact Info (Column Span 4) */}
          <div className="lg:col-span-4">
            <h4 className="font-bold text-white mb-6 text-sm uppercase tracking-widest">Contact Details</h4>
            <div className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-6 space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-tighter mb-1">Office Address</p>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {contactData.address || 'No. 1520/110, First Floor, Jagson Pal Building, Bhagirath Palace, New Delhi - 110006'}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
                <a href={`tel:${contactData.phone}`} className="flex items-center gap-4 group">
                  <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-primary transition-colors">
                    <Phone className="w-5 h-5 text-primary group-hover:text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-tighter mb-1">Call Us</p>
                    <p className="text-sm text-slate-300 font-semibold group-hover:text-white transition-colors">{contactData.phone || '+1 (234) 567-890'}</p>
                  </div>
                </a>

                <a href={`mailto:${contactData.email}`} className="flex items-center gap-4 group">
                  <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-primary transition-colors">
                    <Mail className="w-5 h-5 text-primary group-hover:text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-tighter mb-1">Email Support</p>
                    <p className="text-sm text-slate-300 font-semibold group-hover:text-white transition-colors truncate">{contactData.email || 'support@mediseller.com'}</p>
                  </div>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Manufacturers Strip */}
      <div className="bg-[#020617] py-8 border-y border-slate-800/50">
        <div className="container-custom">
          <div className="flex flex-wrap justify-center gap-x-10 gap-y-4 opacity-30 invert brightness-0 grayscale hover:grayscale-0 hover:invert-0 hover:brightness-100 transition-all duration-700">
            {(siteConfig?.manufacturers || []).map((brand, idx) => (
              <span key={idx} className="text-[10px] font-black tracking-[0.2em] text-slate-300 uppercase whitespace-nowrap">
                {brand}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Compliance & Bottom Bar */}
      <div className="bg-[#020617] pt-12 pb-8">
        <div className="container-custom">
          {/* Compliance Notice */}
          <div className="max-w-4xl mx-auto mb-10 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/50 border border-slate-700 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">
              <Shield className="w-3 h-3 text-primary" /> Regulatory Compliance
            </div>
            <p className="text-xs text-slate-500 leading-relaxed italic">
              {siteConfig?.compliance_notice || 'MediSeller is a licensed pharmaceutical distributor. All medications require a valid prescription. We comply with international pharmaceutical regulations and Indian pharmacy laws.'}
            </p>
          </div>
          
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 pt-8 border-t border-slate-800/50">
            <div className="text-center md:text-left">
              <p className="text-xs text-slate-500 font-medium">
                © {new Date().getFullYear()} {footerData.copyright_text || 'MediSeller. All rights reserved.'}
              </p>
              <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-2 text-[10px] font-bold text-slate-600 uppercase tracking-tighter">
                <span>GST: {footerData.gst_number || '07AAIPG2896A1ZV'}</span>
                <span className="hidden sm:inline">•</span>
                <span>IEC: {footerData.iec_code || '0514067152'}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="flex gap-6 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                <Link to="/legal/privacy" className="hover:text-primary transition-colors">Privacy</Link>
                <Link to="/legal/terms" className="hover:text-primary transition-colors">Terms</Link>
                <Link to="/legal/refund" className="hover:text-primary transition-colors">Refund</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
