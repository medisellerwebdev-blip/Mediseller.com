import React from 'react';
import { 
  ArrowRight, 
  Shield, 
  Truck, 
  Award, 
  Users, 
  Star, 
  Quote, 
  ChevronLeft, 
  ChevronRight, 
  Phone, 
  MessageCircle, 
  CheckCircle, 
  Globe, 
  FileText, 
  Clock, 
  Package, 
  Activity, 
  Ribbon, 
  ShieldAlert, 
  Zap, 
  Scale, 
  TrendingDown, 
  Target, 
  Eye, 
  Calendar,
  Search, 
  Edit, 
  Trash2, 
  Plus, 
  Settings,
  AlertCircle,
  DollarSign,
  FileSearch,
  Check
} from 'lucide-react';

const IconMap = {
  ArrowRight, Shield, Truck, Award, Users, Star, Quote, 
  ChevronLeft, ChevronRight, Phone, MessageCircle, CheckCircle, 
  Globe, FileText, Clock, Package, Activity, Ribbon, 
  ShieldAlert, Zap, Scale, TrendingDown, Target, Eye, Calendar,
  Search, Edit, Trash2, Plus, Settings, AlertCircle, DollarSign,
  FileSearch, Check
};

const DynamicIcon = ({ name, className, fallback = Package }) => {
  const IconComponent = IconMap[name] || fallback;
  return <IconComponent className={className} />;
};

export default DynamicIcon;
