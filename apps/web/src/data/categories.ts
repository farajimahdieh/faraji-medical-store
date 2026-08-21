import {
  Accessibility,
  Bandage,
  Droplets,
  FlaskConical,
  Footprints,
  Scissors,
  Stethoscope,
  Syringe,
  type LucideIcon,
} from "lucide-react";

export interface Category {
  slug: string;
  name: string;
  description: string;
  icon: LucideIcon;
}

export const categories: Category[] = [
  {
    slug: "dressing-wound-care",
    name: "پانسمان و زخم بستر",
    description: "انواع باند، گاز استریل و محصولات مراقبت از زخم",
    icon: Bandage,
  },
  {
    slug: "medical-footwear",
    name: "کفش و کفی طبی",
    description: "کفش و کفی طبی متناسب با نیاز پا",
    icon: Footprints,
  },
  {
    slug: "surgical-instruments",
    name: "ابزار جراحی و تجهیزات مطب",
    description: "ابزار دقیق جراحی و تجهیزات مورد نیاز مطب",
    icon: Scissors,
  },
  {
    slug: "medical-consumables",
    name: "تجهیزات مصرفی پزشکی و بیمارستانی",
    description: "دستکش، سرنگ، ماسک و سایر اقلام مصرفی",
    icon: Syringe,
  },
  {
    slug: "diagnostics-respiratory",
    name: "تشخیص، پایش سلامت و تجهیزات تنفسی",
    description: "فشارسنج، پالس‌اکسیمتر و نبولایزر",
    icon: Stethoscope,
  },
  {
    slug: "orthopedic-mobility",
    name: "ارتوپدی، حرکتی و توانبخشی",
    description: "ویلچر، واکر، زانوبند و لوازم توانبخشی",
    icon: Accessibility,
  },
  {
    slug: "hygiene-disinfection",
    name: "بهداشت و ضدعفونی",
    description: "محلول‌ها و تجهیزات بهداشت و ضدعفونی",
    icon: Droplets,
  },
  {
    slug: "lab-equipment",
    name: "تجهیزات و ملزومات آزمایشگاهی",
    description: "میکروسکوپ، لوله آزمایش و ملزومات آزمایشگاه",
    icon: FlaskConical,
  },
];
