import React, { useState } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { MessageCircle, Users } from 'lucide-react';
import DynamicIcon from '../icons/DynamicIcon';
import { useConfig } from '../../context/ConfigContext';

const WhatsAppCommunities = () => {
  const { config } = useConfig();
  const whatsappConfig = config?.whatsapp_communities || {};
  const communityList = whatsappConfig.communities || [];
  
  // State to manage visible cards
  const initialLimit = whatsappConfig.initial_count || 6;
  const [visibleCount, setVisibleCount] = useState(initialLimit);

  const handleJoin = (link) => {
    if (link) window.open(link, '_blank');
  };

  const handleLoadMore = () => {
    // Load next set of cards based on initial_count
    setVisibleCount(prev => prev + initialLimit);
  };

  if (!communityList.length) return null;

  const hasMore = visibleCount < communityList.length;

  return (
    <section className="py-24 bg-slate-50/50 overflow-hidden" id="whatsapp-communities">
      <div className="container px-4 mx-auto relative">
        <div className="max-w-3xl mx-auto text-center mb-16 space-y-4">
          {whatsappConfig.badge && (
            <span className="inline-block px-4 py-1.5 bg-green-50 text-green-600 text-xs font-bold tracking-widest uppercase rounded-full border border-green-100 shadow-sm">
              {whatsappConfig.badge}
            </span>
          )}
          <h2 className="text-4xl md:text-5xl font-heading font-black text-slate-900 leading-tight">
            {whatsappConfig.title || 'Join Our WhatsApp Communities'}
          </h2>
          <p className="text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
            {whatsappConfig.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {communityList.slice(0, visibleCount).map((community, idx) => {
            return (
              <Card 
                key={idx} 
                className="group border-slate-100 hover:border-green-300 shadow-sm hover:shadow-xl transition-all duration-500 rounded-2xl overflow-hidden bg-white animate-in fade-in slide-in-from-bottom-4"
                style={{ animationDelay: `${(idx % initialLimit) * 100}ms` }}
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

        {/* Dynamic Load More Button */}
        {hasMore && (
          <div className="mt-16 text-center animate-in fade-in zoom-in duration-700">
            <Button 
              onClick={handleLoadMore}
              variant="outline"
              className="px-10 py-7 border-2 border-green-500 text-green-600 hover:bg-green-500 hover:text-white font-bold text-lg rounded-2xl transition-all duration-300 group shadow-lg hover:shadow-green-200"
            >
              <div className="flex flex-col items-center gap-1">
                <span>{whatsappConfig.button_text || 'View More Communities'}</span>
                <span className="text-[10px] uppercase tracking-widest opacity-70 group-hover:opacity-100 transition-opacity">
                  Showing {visibleCount} of {communityList.length} Categories
                </span>
              </div>
            </Button>
          </div>
        )}

        {whatsappConfig.bottom_text && (
          <div className="mt-12 text-center text-slate-400 text-sm flex items-center justify-center gap-2">
            <span className="w-8 h-[1px] bg-slate-200"></span>
            <span className="flex items-center gap-1.5 italic">
              <MessageCircle className="w-3 h-3 text-green-500" />
              {whatsappConfig.bottom_text}
            </span>
            <span className="w-8 h-[1px] bg-slate-200"></span>
          </div>
        )}
      </div>
    </section>
  );
};

export default WhatsAppCommunities;
