import React from 'react';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { MessageCircle, Users, Bell } from 'lucide-react';
import DynamicIcon from '../icons/DynamicIcon';

export const WhatsAppCommunities = ({ config }) => {
  const data = config || {};
  const communityList = data.communities || [];

  const handleJoin = (link) => {
    if (link) window.open(link, '_blank');
  };

  return (
    <section className="py-16 md:py-24 bg-gradient-to-br from-green-50 to-emerald-50" data-testid="whatsapp-communities-section">
      <div className="container-custom">
        <div className="text-center mb-12">
          <Badge className="bg-green-100 text-green-700 border-green-200 mb-4">
            <MessageCircle className="w-3 h-3 mr-1" />
            {data.badge || 'WhatsApp Communities'}
          </Badge>
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            {data.title || "Join Our WhatsApp Communities"}
          </h2>
          <p className="text-slate-600 max-w-2xl mx-auto">
            {data.subtitle || "Connect with thousands of patients worldwide. Get exclusive offers, new product alerts, and be the first to know about flash sales and discounts."}
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {communityList.map((community, idx) => {
            return (
              <Card 
                key={idx} 
                className="group border-slate-100 hover:border-green-300 shadow-sm hover:shadow-xl transition-all duration-500 rounded-2xl overflow-hidden bg-white"
              >
                <CardContent className="p-7">
                  <div className="flex items-start gap-4 mb-5">
                    <div className={`w-14 h-14 ${community.color || 'bg-primary'} rounded-2xl flex items-center justify-center text-white flex-shrink-0 shadow-inner group-hover:rotate-6 transition-transform duration-300`}>
                      <DynamicIcon name={community.icon || 'MessageCircle'} className="w-7 h-7" fallback={MessageCircle} />
                    </div>
                    <div className="flex-1 pt-1">
                      <h3 className="font-heading font-bold text-xl text-slate-800 leading-tight mb-1 group-hover:text-green-600 transition-colors">
                        {community.name || community.title}
                      </h3>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-slate-400" />
                        <span className="text-sm font-medium text-slate-500">{community.members || '0+'} members</span>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-[15px] leading-relaxed text-slate-600 mb-6 line-clamp-2 min-h-[44px]">
                    {community.description}
                  </p>
                  
                  <Button 
                    onClick={() => handleJoin(community.link)}
                    className="w-full bg-[#12c864] hover:bg-[#0fa150] text-white font-bold py-6 rounded-2xl flex items-center justify-center gap-2 group/btn transition-all duration-300 shadow-md hover:shadow-lg active:scale-[0.98]"
                  >
                    <MessageCircle className="w-5 h-5 group-hover/btn:animate-bounce" />
                    Join Community
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="text-center mt-8">
          <p className="text-sm text-slate-500">
            <Bell className="w-4 h-4 inline mr-1" />
            {data.bottom_text || "Turn on notifications to never miss a deal!"}
          </p>
        </div>
      </div>
    </section>
  );
};

export default WhatsAppCommunities;
