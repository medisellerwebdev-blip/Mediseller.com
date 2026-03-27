import React from 'react';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { MessageCircle, Users, Gift, Bell, Pill, Heart, Activity, Zap } from 'lucide-react';

export const WhatsAppCommunities = ({ config }) => {
  const data = config || {};
  const communityList = data.communities || [
    {
      name: 'Cancer Support Community',
      description: 'Get updates on cancer medications, new treatments, and exclusive discounts',
      members: '5,000+',
      link: 'https://chat.whatsapp.com/cancer-community',
      color: 'bg-rose-500'
    },
    {
      name: 'HIV/AIDS Support',
      description: 'Connect with others, get medication updates and special pricing alerts',
      members: '3,500+',
      link: 'https://chat.whatsapp.com/hiv-community',
      color: 'bg-purple-500'
    },
    {
      name: 'Hepatitis Cure Community',
      description: 'Updates on HCV treatments, success stories, and member-only offers',
      members: '4,200+',
      link: 'https://chat.whatsapp.com/hepatitis-community',
      color: 'bg-emerald-500'
    }
  ];

  const handleJoin = (link) => {
    if (link) window.open(link, '_blank');
  };

  const getIcon = (name) => {
    if (name?.toLowerCase().includes('cancer')) return Heart;
    if (name?.toLowerCase().includes('hiv')) return Pill;
    if (name?.toLowerCase().includes('hepatitis')) return Activity;
    if (name?.toLowerCase().includes('diabetes')) return Zap;
    if (name?.toLowerCase().includes('weight')) return Activity;
    return MessageCircle;
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
            const Icon = getIcon(community.name);
            return (
              <Card 
                key={idx} 
                className="group border-slate-200 hover:border-green-300 hover:shadow-lg transition-all duration-300"
                data-testid={`community-card-${idx}`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 ${community.color || 'bg-primary'} rounded-xl flex items-center justify-center text-white flex-shrink-0 group-hover:scale-110 transition-transform`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-heading font-semibold text-lg mb-1">{community.name}</h3>
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="w-4 h-4 text-slate-400" />
                        <span className="text-sm text-slate-500">{community.members} members</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 mt-3 mb-4">{community.description}</p>
                  <Button 
                    onClick={() => handleJoin(community.link)}
                    className="w-full bg-green-500 hover:bg-green-600 rounded-full"
                    data-testid={`join-community-${idx}`}
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
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
