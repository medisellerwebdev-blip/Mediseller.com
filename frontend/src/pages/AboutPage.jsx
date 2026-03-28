import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Building } from 'lucide-react';
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

  return (
    <div className="min-h-screen py-20 px-4 text-center">
       <h1 className="text-4xl font-bold">About MediSeller</h1>
       <p className="mt-4 text-lg">We are currently loading our company profile...</p>
       {!loading && siteConfig && (
          <div className="mt-8">
             <h2 className="text-2xl font-semibold">{aboutData.hero_title || "Trusted Partner"}</h2>
             <p className="mt-2">{aboutData.hero_subtitle}</p>
          </div>
       )}
       {loading && <p className="mt-4">Fetching data from API...</p>}
       {!loading && !siteConfig && <p className="mt-4 text-red-500">Failed to load company profile. Please check back later.</p>}
    </div>
  );
}
