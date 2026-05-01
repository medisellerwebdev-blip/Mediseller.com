import React from 'react';
import { 
  ArrowRight, Shield, Truck, Award, Users, Star, Quote, 
  ChevronLeft, ChevronRight, Phone, MessageCircle, CheckCircle, 
  Globe, FileText, Clock, Package, 
  Activity, Ribbon, ShieldAlert, Zap, Scale, 
  TrendingDown, Target, Eye, Calendar, Search, 
  Edit, Trash2, Plus, Settings, AlertCircle, 
  DollarSign, FileSearch, Check, Heart, Pill, Gift
} from 'lucide-react';

const IconMap = {
  arrowright: ArrowRight, shield: Shield, truck: Truck, award: Award, users: Users, star: Star, quote: Quote, 
  chevronleft: ChevronLeft, chevronright: ChevronRight, phone: Phone, messagecircle: MessageCircle, checkcircle: CheckCircle, 
  globe: Globe, filetext: FileText, clock: Clock, package: Package, activity: Activity, ribbon: Ribbon, 
  shieldalert: ShieldAlert, zap: Zap, scale: Scale, trendingdown: TrendingDown, target: Target, eye: Eye, calendar: Calendar,
  search: Search, edit: Edit, trash2: Trash2, plus: Plus, settings: Settings, alertcircle: AlertCircle, dollarsign: DollarSign,
  filesearch: FileSearch, check: Check, heart: Heart, pill: Pill, gift: Gift
};

const DynamicIcon = ({ name, className, fallback = Package }) => {
  const normalizedName = (name || "").toLowerCase();
  const IconComponent = IconMap[normalizedName] || fallback;
  return <IconComponent className={className} />;
};

export default DynamicIcon;
