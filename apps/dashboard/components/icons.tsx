import {
  BadgeDollarSign,
  Bell,
  BookOpenText,
  Building2,
  Bot,
  BookMarked,
  Calendar,
  CalendarClock,
  ChartColumn,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeftRightEllipsis,
  CircleHelp,
  Clock3,
  ContactRound,
  LayoutDashboard,
  Languages,
  Menu,
  MessageSquare,
  Route,
  Search,
  Settings,
  Sparkles,
  Ticket,
  Users,
  Workflow,
  X,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/components/ui";

type IconName =
  | "overview"
  | "calendar"
  | "calendarClock"
  | "team"
  | "routing"
  | "workflows"
  | "bookings"
  | "analytics"
  | "developerHub"
  | "settings"
  | "search"
  | "help"
  | "notifications"
  | "bot"
  | "spark"
  | "revenue"
  | "users"
  | "building2"
  | "clock"
  | "contactRound"
  | "messageSquare"
  | "ticket"
  | "bookOpenText"
  | "chevronDown"
  | "chevronLeft"
  | "chevronRight"
  | "languages"
  | "check"
  | "menu"
  | "close";

const ICONS: Record<IconName, LucideIcon> = {
  overview: LayoutDashboard,
  calendar: Calendar,
  calendarClock: CalendarClock,
  team: Users,
  routing: Route,
  workflows: Workflow,
  bookings: BookMarked,
  analytics: ChartColumn,
  developerHub: ChevronsLeftRightEllipsis,
  settings: Settings,
  search: Search,
  help: CircleHelp,
  notifications: Bell,
  bot: Bot,
  spark: Sparkles,
  revenue: BadgeDollarSign,
  users: Users,
  building2: Building2,
  clock: Clock3,
  contactRound: ContactRound,
  messageSquare: MessageSquare,
  ticket: Ticket,
  bookOpenText: BookOpenText,
  chevronDown: ChevronDown,
  chevronLeft: ChevronLeft,
  chevronRight: ChevronRight,
  languages: Languages,
  check: Check,
  menu: Menu,
  close: X,
};

export function Icon({
  name,
  className,
}: Readonly<{
  name: IconName;
  className?: string;
}>) {
  const IconComponent = ICONS[name];

  return (
    <IconComponent
      className={cn("size-5", className)}
      strokeWidth={1.8}
      aria-hidden="true"
    />
  );
}
