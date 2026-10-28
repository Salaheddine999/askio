import React from "react";
import {
  Anchor as PhAnchor,
  Archive as PhArchive,
  ArrowClockwise as PhArrowClockwise,
  ArrowCounterClockwise as PhArrowCounterClockwise,
  ArrowDown as PhArrowDown,
  ArrowDownRight as PhArrowDownRight,
  ArrowLeft as PhArrowLeft,
  ArrowRight as PhArrowRight,
  ArrowSquareOut as PhArrowSquareOut,
  ArrowUp as PhArrowUp,
  ArrowUpRight as PhArrowUpRight,
  ArrowsDownUp as PhArrowsDownUp,
  Bell as PhBell,
  BellSlash as PhBellSlash,
  BookOpen as PhBookOpen,
  Briefcase as PhBriefcase,
  CaretDown as PhCaretDown,
  CaretLeft as PhCaretLeft,
  CaretRight as PhCaretRight,
  CaretUp as PhCaretUp,
  CaretUpDown as PhCaretUpDown,
  ChartBar as PhChartBar,
  ChatCenteredDots as PhChatCenteredDots,
  ChatCenteredText as PhChatCenteredText,
  ChatCircle as PhChatCircle,
  Chats as PhChats,
  Check as PhCheck,
  CheckCircle as PhCheckCircle,
  CircleNotch as PhCircleNotch,
  Clock as PhClock,
  Code as PhCode,
  Copy as PhCopy,
  Cpu as PhCpu,
  CreditCard as PhCreditCard,
  DotsSixVertical as PhDotsSixVertical,
  DotsThree as PhDotsThree,
  DownloadSimple as PhDownloadSimple,
  EnvelopeSimple as PhEnvelopeSimple,
  Eye as PhEye,
  EyeSlash as PhEyeSlash,
  FileCsv as PhFileCsv,
  Flask as PhFlask,
  Gear as PhGear,
  Globe as PhGlobe,
  GridFour as PhGridFour,
  HandWaving as PhHandWaving,
  Info as PhInfo,
  Key as PhKey,
  Leaf as PhLeaf,
  Lifebuoy as PhLifebuoy,
  Lightbulb as PhLightbulb,
  Lightning as PhLightning,
  List as PhList,
  ListBullets as PhListBullets,
  ListChecks as PhListChecks,
  MagnifyingGlass as PhMagnifyingGlass,
  MagnifyingGlassMinus as PhMagnifyingGlassMinus,
  Minus as PhMinus,
  Monitor as PhMonitor,
  Moon as PhMoon,
  Palette as PhPalette,
  PaperPlaneRight as PhPaperPlaneRight,
  Pause as PhPause,
  PencilSimple as PhPencilSimple,
  Percent as PhPercent,
  Play as PhPlay,
  PlugsConnected as PhPlugsConnected,
  Plus as PhPlus,
  Prohibit as PhProhibit,
  PuzzlePiece as PhPuzzlePiece,
  Question as PhQuestion,
  Robot as PhRobot,
  Rocket as PhRocket,
  ShieldCheck as PhShieldCheck,
  ShieldWarning as PhShieldWarning,
  ShoppingBag as PhShoppingBag,
  Sidebar as PhSidebar,
  SidebarSimple as PhSidebarSimple,
  SignOut as PhSignOut,
  Smiley as PhSmiley,
  SquaresFour as PhSquaresFour,
  Star as PhStar,
  Sun as PhSun,
  TextT as PhTextT,
  ThumbsDown as PhThumbsDown,
  ThumbsUp as PhThumbsUp,
  Translate as PhTranslate,
  Trash as PhTrash,
  Tray as PhTray,
  TrendUp as PhTrendUp,
  Truck as PhTruck,
  User as PhUser,
  UserPlus as PhUserPlus,
  Users as PhUsers,
  Warning as PhWarning,
  X as PhX,
  CrownSimple,
  Plant,
  StarFour,
  type Icon as PhosphorIcon,
  type IconWeight,
} from "@phosphor-icons/react";

// Every icon in Askio comes from Phosphor. The names below are the ones the
// app has always used, so components keep importing { Check, X, ... } from
// here; each maps to its Phosphor equivalent. Props stay the same: size
// (24 by default), className, and strokeWidth, which picks a Phosphor weight
// (thin strokes: light, the default: regular, heavier: bold). fill="currentColor"
// gives the filled weight.
export type IconProps = Omit<React.SVGProps<SVGSVGElement>, "ref"> & {
  size?: number | string;
  strokeWidth?: number | string;
  weight?: IconWeight;
};
export type LucideIcon = React.ForwardRefExoticComponent<IconProps & React.RefAttributes<SVGSVGElement>>;

function weightFor({ weight, strokeWidth, fill }: IconProps, fallback: IconWeight): IconWeight {
  if (weight) return weight;
  if (fill === "currentColor") return "fill";
  const stroke = Number(strokeWidth);
  if (!strokeWidth || Number.isNaN(stroke)) return fallback;
  if (stroke >= 2.25) return "bold";
  if (stroke <= 1.6) return "light";
  return "regular";
}

function icon(Ph: PhosphorIcon, name: string, fallback: IconWeight = "regular"): LucideIcon {
  const Wrapped = React.forwardRef<SVGSVGElement, IconProps>((props, ref) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { size = 24, strokeWidth, weight, fill, ...rest } = props;
    return <Ph ref={ref} size={size} weight={weightFor(props, fallback)} {...(rest as object)} />;
  });
  Wrapped.displayName = name;
  return Wrapped;
}

export const AlertTriangle = icon(PhWarning, "AlertTriangle");
export const Anchor = icon(PhAnchor, "Anchor");
export const Archive = icon(PhArchive, "Archive");
export const ArrowDown = icon(PhArrowDown, "ArrowDown");
export const ArrowDownRight = icon(PhArrowDownRight, "ArrowDownRight");
export const ArrowLeft = icon(PhArrowLeft, "ArrowLeft");
export const ArrowRight = icon(PhArrowRight, "ArrowRight");
export const ArrowUp = icon(PhArrowUp, "ArrowUp");
export const ArrowUpDown = icon(PhArrowsDownUp, "ArrowUpDown");
export const ArrowUpRight = icon(PhArrowUpRight, "ArrowUpRight");
export const Ban = icon(PhProhibit, "Ban");
export const BarChart2 = icon(PhChartBar, "BarChart2");
export const BarChart3 = icon(PhChartBar, "BarChart3");
export const Beaker = icon(PhFlask, "Beaker");
export const Bell = icon(PhBell, "Bell");
export const BellOff = icon(PhBellSlash, "BellOff");
export const Blocks = icon(PhPuzzlePiece, "Blocks");
export const BookOpen = icon(PhBookOpen, "BookOpen");
export const Bot = icon(PhRobot, "Bot");
export const Briefcase = icon(PhBriefcase, "Briefcase");
export const Check = icon(PhCheck, "Check");
export const CheckCircle2 = icon(PhCheckCircle, "CheckCircle2");
export const ChevronDown = icon(PhCaretDown, "ChevronDown");
export const ChevronLeft = icon(PhCaretLeft, "ChevronLeft");
export const ChevronRight = icon(PhCaretRight, "ChevronRight");
export const ChevronUp = icon(PhCaretUp, "ChevronUp");
export const ChevronsUpDown = icon(PhCaretUpDown, "ChevronsUpDown");
export const CircleCheck = icon(PhCheckCircle, "CircleCheck");
export const CircleHelp = icon(PhQuestion, "CircleHelp");
export const Clock = icon(PhClock, "Clock");
export const Code = icon(PhCode, "Code");
export const Code2 = icon(PhCode, "Code2");
export const Copy = icon(PhCopy, "Copy");
export const Cpu = icon(PhCpu, "Cpu");
export const CreditCard = icon(PhCreditCard, "CreditCard");
export const Download = icon(PhDownloadSimple, "Download");
export const Edit2 = icon(PhPencilSimple, "Edit2");
export const ExternalLink = icon(PhArrowSquareOut, "ExternalLink");
export const Eye = icon(PhEye, "Eye");
export const EyeOff = icon(PhEyeSlash, "EyeOff");
export const FileSpreadsheet = icon(PhFileCsv, "FileSpreadsheet");
export const Globe = icon(PhGlobe, "Globe");
export const GripVertical = icon(PhDotsSixVertical, "GripVertical");
export const Hand = icon(PhHandWaving, "Hand");
export const HelpCircle = icon(PhQuestion, "HelpCircle");
export const Inbox = icon(PhTray, "Inbox");
export const Info = icon(PhInfo, "Info");
export const KeyRound = icon(PhKey, "KeyRound");
export const Languages = icon(PhTranslate, "Languages");
export const LayoutDashboard = icon(PhSquaresFour, "LayoutDashboard");
export const LayoutGrid = icon(PhGridFour, "LayoutGrid");
export const Leaf = icon(PhLeaf, "Leaf");
export const LifeBuoy = icon(PhLifebuoy, "LifeBuoy");
export const Lightbulb = icon(PhLightbulb, "Lightbulb");
export const List = icon(PhListBullets, "List");
export const ListChecks = icon(PhListChecks, "ListChecks");
export const LoaderCircle = icon(PhCircleNotch, "LoaderCircle");
export const LogOut = icon(PhSignOut, "LogOut");
export const Mail = icon(PhEnvelopeSimple, "Mail");
export const Menu = icon(PhList, "Menu");
export const MessageCircle = icon(PhChatCircle, "MessageCircle");
export const MessageSquare = icon(PhChatCenteredText, "MessageSquare");
export const MessageSquareHeart = icon(PhChatCenteredDots, "MessageSquareHeart");
export const MessageSquareText = icon(PhChatCenteredText, "MessageSquareText");
export const MessagesSquare = icon(PhChats, "MessagesSquare");
export const Minus = icon(PhMinus, "Minus");
export const Monitor = icon(PhMonitor, "Monitor");
export const Moon = icon(PhMoon, "Moon");
export const MoreHorizontal = icon(PhDotsThree, "MoreHorizontal");
export const Palette = icon(PhPalette, "Palette");
export const PanelLeft = icon(PhSidebar, "PanelLeft");
export const PanelLeftClose = icon(PhSidebarSimple, "PanelLeftClose");
export const PanelLeftOpen = icon(PhSidebarSimple, "PanelLeftOpen");
export const PanelRight = icon(PhSidebar, "PanelRight");
export const Pause = icon(PhPause, "Pause");
export const Pencil = icon(PhPencilSimple, "Pencil");
export const Percent = icon(PhPercent, "Percent");
export const Play = icon(PhPlay, "Play");
export const Plus = icon(PhPlus, "Plus");
export const RefreshCw = icon(PhArrowClockwise, "RefreshCw");
export const Rocket = icon(PhRocket, "Rocket");
export const RotateCcw = icon(PhArrowCounterClockwise, "RotateCcw");
export const Search = icon(PhMagnifyingGlass, "Search");
export const SearchX = icon(PhMagnifyingGlassMinus, "SearchX");
export const Send = icon(PhPaperPlaneRight, "Send");
export const Settings = icon(PhGear, "Settings");
export const ShieldAlert = icon(PhShieldWarning, "ShieldAlert");
export const ShieldCheck = icon(PhShieldCheck, "ShieldCheck");
export const ShoppingBag = icon(PhShoppingBag, "ShoppingBag");
export const Smile = icon(PhSmiley, "Smile");
export const Star = icon(PhStar, "Star");
export const Sun = icon(PhSun, "Sun");
export const ThumbsDown = icon(PhThumbsDown, "ThumbsDown");
export const ThumbsUp = icon(PhThumbsUp, "ThumbsUp");
export const Trash2 = icon(PhTrash, "Trash2");
export const TrendingUp = icon(PhTrendUp, "TrendingUp");
export const Truck = icon(PhTruck, "Truck");
export const Type = icon(PhTextT, "Type");
export const Unplug = icon(PhPlugsConnected, "Unplug");
export const UserPlus = icon(PhUserPlus, "UserPlus");
export const UserRound = icon(PhUser, "UserRound");
export const Users = icon(PhUsers, "Users");
// A one-letter name reads as a constant to the fast-refresh check; it is a component.
// eslint-disable-next-line react-refresh/only-export-components
export const X = icon(PhX, "X");
export const Zap = icon(PhLightning, "Zap");

/** AI at work: AI replies, AI-written FAQs, the AI persona. */
export const AiIcon = icon(StarFour as PhosphorIcon, "AiIcon", "duotone");
/** The Pro plan: plan cards and upgrade buttons. */
export const ProIcon = icon(CrownSimple as PhosphorIcon, "ProIcon", "duotone");
/** The Free plan: a seedling, the start you grow from; never the Pro crown. */
export const FreeIcon = icon(Plant as PhosphorIcon, "FreeIcon", "duotone");
