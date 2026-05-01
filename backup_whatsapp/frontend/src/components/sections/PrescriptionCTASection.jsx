import React, { useState } from 'react';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import PrescriptionUpload from '../prescription/PrescriptionUpload';
import { WhatsAppContactButton } from '../whatsapp/WhatsAppButton';
import { 
  Upload, 
  MessageCircle, 
  FileText, 
  CheckCircle, 
  Clock, 
  Shield,
  ArrowRight,
  Phone
} from 'lucide-react';
import DynamicIcon from '../icons/DynamicIcon';

export const PrescriptionCTASection = ({ config }) => {
  const [uploadedRxId, setUploadedRxId] = useState(null);
  const data = config || {};

  return (
    <section className="py-16 md:py-24 bg-gradient-to-br from-amber-50 to-orange-50" data-testid="prescription-cta-section">
      <div className="container-custom">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div>
            <Badge className="bg-amber-100 text-amber-700 border-amber-200 mb-4">
              <FileText className="w-3 h-3 mr-1" />
              {data.badge || 'Prescription Required'}
            </Badge>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              {data.title || "Have a Prescription? Let's Get You Started"}
            </h2>
            <p className="text-slate-600 text-lg mb-6">
              {data.subtitle || "Upload your prescription and our expert pharmacists will verify it within 24 hours. Or connect with our team on WhatsApp for instant assistance with your medication needs."}
            </p>

            {/* Steps */}
            <div className="space-y-4 mb-8">
              {(data.steps || [
                { title: 'Upload Your Prescription', description: 'JPEG, PNG, PDF - max 10MB' },
                { title: 'Expert Verification', description: 'Our pharmacists review within 24 hours' },
                { title: 'Complete Your Order', description: 'Get best prices with doorstep delivery' }
              ]).map((step, index) => (
                <div key={index} className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="font-bold text-amber-700">{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-semibold">{step.title}</p>
                    <p className="text-sm text-slate-500">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <PrescriptionUpload
                onUploadSuccess={(id) => setUploadedRxId(id)}
                trigger={
                  <Button size="lg" className="rounded-full h-12 px-8" data-testid="upload-rx-cta-btn">
                    <Upload className="w-5 h-5 mr-2" />
                    {data.button_text || 'Upload Prescription'}
                  </Button>
                }
              />
              <WhatsAppContactButton
                message={`Hi MediSeller! I have a prescription and need help ordering my medication.`}
                phone={data.whatsapp_number}
                variant="outline"
                className="h-12"
              >
                Chat with Expert
              </WhatsAppContactButton>
            </div>

            {uploadedRxId && (
              <div className="mt-4 flex items-center gap-2 text-green-600">
                <CheckCircle className="w-5 h-5" />
                <span>Prescription uploaded! ID: {uploadedRxId}</span>
              </div>
            )}
          </div>

          {/* Right Card */}
          <div>
            <Card className="border-0 shadow-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-white">
                <MessageCircle className="w-10 h-10 mb-3" />
                <h3 className="font-heading text-2xl font-bold mb-2">
                  {data.card_title || "Connect with Our Experts"}
                </h3>
                <p className="text-green-100">
                  {data.card_subtitle || "Get instant help via WhatsApp - available 24/7"}
                </p>
              </div>
              <CardContent className="p-6 space-y-4">
                {(data.card_features || [
                  { title: "Quick Response", description: "Get replies within minutes, not hours", icon: "Clock" },
                  { title: "Expert Guidance", description: "Licensed pharmacists help you find the right medication", icon: "Shield" },
                  { title: "Prescription Help", description: "We can help source hard-to-find medications", icon: "FileText" }
                ]).map((feat, idx) => (
                  <div key={idx} className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl">
                    <div className="w-6 h-6 text-primary mt-0.5">
                      {/* Dynamic Icon support for Prescription Card */}
                      <div className="flex items-center justify-center">
                        <DynamicIcon name={feat.icon} />
                      </div>
                    </div>
                    <div>
                      <p className="font-semibold">{feat.title}</p>
                      <p className="text-sm text-slate-500">{feat.description}</p>
                    </div>
                  </div>
                ))}

                <WhatsAppContactButton
                  phone={data.whatsapp_number}
                  message="Hello MediSeller! I need expert guidance on medication options."
                  className="w-full justify-center h-12"
                >
                  <MessageCircle className="w-5 h-5 mr-2" />
                  {data.whatsapp_cta_text || 'Message Us on WhatsApp'}
                </WhatsAppContactButton>

                <p className="text-center text-sm text-slate-500">
                  Or call us directly: <a href={`tel:${data.whatsapp_number?.replace(/\s+/g, '')}`} className="text-primary font-medium">{data.whatsapp_number || '+1 (234) 567-890'}</a>
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PrescriptionCTASection;
