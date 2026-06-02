import {
  Package,
  Sparkles,
  ShoppingBag,
  MessageSquare,
  Truck,
  BarChart3,
  Upload,
  Wand2,
  Send,
  BadgeCheck,
  Users,
  Headphones,
  FileSpreadsheet,
  MessageCircle,
  Image as ImageIcon,
  PhoneCall,
  Star,
  HelpCircle,
  ShieldCheck,
  ArrowRight,
  type LucideIcon
} from "lucide-react";

const REGISTRY: Record<string, LucideIcon> = {
  Package,
  Sparkles,
  ShoppingBag,
  MessageSquare,
  Truck,
  BarChart3,
  Upload,
  Wand2,
  Send,
  BadgeCheck,
  Users,
  Headphones,
  FileSpreadsheet,
  MessageCircle,
  Image: ImageIcon,
  PhoneCall,
  Star,
  HelpCircle,
  ShieldCheck,
  ArrowRight
};

export function getIcon(name: string): LucideIcon {
  return REGISTRY[name] ?? HelpCircle;
}
