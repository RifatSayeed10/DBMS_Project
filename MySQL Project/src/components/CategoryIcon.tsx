import {
  Utensils,
  Car,
  Home,
  HeartPulse,
  GraduationCap,
  Sparkles,
  ShoppingBag,
  Gift,
  CircleEllipsis,
  Briefcase,
  TrendingUp,
  Coins,
  Award,
  Laptop,
  DollarSign,
  PlusCircle,
  TrendingDown,
  Calendar,
  Trash2,
  Edit2,
  LogOut,
  Info,
  ChevronLeft,
  ChevronRight,
  Filter,
  Check,
  X,
  Search,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  AlertCircle
} from 'lucide-react';

interface IconProps {
  name: string;
  className?: string;
  size?: number;
}

export default function CategoryIcon({ name, className = '', size = 20 }: IconProps) {
  switch (name) {
    case 'Utensils':
      return <Utensils className={className} size={size} />;
    case 'Car':
      return <Car className={className} size={size} />;
    case 'Home':
      return <Home className={className} size={size} />;
    case 'HeartPulse':
      return <HeartPulse className={className} size={size} />;
    case 'GraduationCap':
      return <GraduationCap className={className} size={size} />;
    case 'Sparkles':
      return <Sparkles className={className} size={size} />;
    case 'ShoppingBag':
      return <ShoppingBag className={className} size={size} />;
    case 'Gift':
      return <Gift className={className} size={size} />;
    case 'Briefcase':
      return <Briefcase className={className} size={size} />;
    case 'TrendingUp':
      return <TrendingUp className={className} size={size} />;
    case 'Coins':
      return <Coins className={className} size={size} />;
    case 'Award':
      return <Award className={className} size={size} />;
    case 'Laptop':
      return <Laptop className={className} size={size} />;
    case 'DollarSign':
      return <DollarSign className={className} size={size} />;
    case 'PlusCircle':
      return <PlusCircle className={className} size={size} />;
    case 'TrendingDown':
      return <TrendingDown className={className} size={size} />;
    case 'Calendar':
      return <Calendar className={className} size={size} />;
    case 'Trash2':
      return <Trash2 className={className} size={size} />;
    case 'Edit2':
      return <Edit2 className={className} size={size} />;
    case 'LogOut':
      return <LogOut className={className} size={size} />;
    case 'Info':
      return <Info className={className} size={size} />;
    case 'ChevronLeft':
      return <ChevronLeft className={className} size={size} />;
    case 'ChevronRight':
      return <ChevronRight className={className} size={size} />;
    case 'Filter':
      return <Filter className={className} size={size} />;
    case 'Check':
      return <Check className={className} size={size} />;
    case 'X':
      return <X className={className} size={size} />;
    case 'Search':
      return <Search className={className} size={size} />;
    case 'Wallet':
      return <Wallet className={className} size={size} />;
    case 'ArrowUpRight':
      return <ArrowUpRight className={className} size={size} />;
    case 'ArrowDownLeft':
      return <ArrowDownLeft className={className} size={size} />;
    case 'AlertCircle':
      return <AlertCircle className={className} size={size} />;
    default:
      return <CircleEllipsis className={className} size={size} />;
  }
}
