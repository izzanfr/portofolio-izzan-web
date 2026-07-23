import {
  BrainCircuit,
  ClipboardCheck,
  Compass,
  Database,
  Layers,
  LineChart,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
  Wrench,
  type LucideIcon,
} from "lucide-react";

/**
 * Content JSON refers to icons by name; this map is the only place those names
 * are resolved, so adding an icon means adding one line here.
 */
const icons: Record<string, LucideIcon> = {
  BrainCircuit,
  ClipboardCheck,
  Compass,
  Database,
  Layers,
  LineChart,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
  Wrench,
};

export function DynamicIcon({
  name,
  size = 18,
  className,
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  const Icon = icons[name] ?? Sparkles;
  return <Icon size={size} className={className} aria-hidden />;
}
