import {
  ShieldCheck,
  Users,
  Truck,
  Headset,
  FileCheck,
  Compass,
  Building2,
  LifeBuoy,
  type LucideIcon,
} from "lucide-react";

export type Accent = "primary" | "red" | "orange";

export interface TrustItem {
  icon: LucideIcon;
  title: string;
  caption: string;
  accent: Accent;
}

export const trustItems: TrustItem[] = [
  { icon: ShieldCheck, title: "تضمین اصالت کالا", caption: "کالاهای معتبر و اصل", accent: "primary" },
  { icon: Users, title: "مشاوره قبل از خرید", caption: "کمک برای انتخاب درست", accent: "orange" },
  { icon: Truck, title: "ارسال سریع و مطمئن", caption: "ارسال به سراسر کشور", accent: "primary" },
  { icon: Headset, title: "پشتیبانی واقعی", caption: "قبل و بعد از خرید", accent: "red" },
];

export interface WhyItem {
  icon: LucideIcon;
  title: string;
  caption: string;
}

export const whyFarajiItems: WhyItem[] = [
  { icon: FileCheck, title: "اطلاعات شفاف و دقیق", caption: "مشخصات کامل محصول و قیمت روشن" },
  { icon: Compass, title: "انتخاب آسان و مطمئن", caption: "راهنمای خرید و دسته‌بندی مناسب" },
  { icon: Building2, title: "مناسب خانه و مراکز درمانی", caption: "محصولات برای مصرف شخصی و حرفه‌ای" },
  { icon: LifeBuoy, title: "پشتیبانی واقعی", caption: "قبل و بعد از خرید در کنار مشتری" },
];
