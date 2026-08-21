import { BrandStory } from "@/components/home/BrandStory";
import { Brands } from "@/components/home/Brands";
import { BuyingGuides } from "@/components/home/BuyingGuides";
import { ConsultationCTA } from "@/components/home/ConsultationCTA";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { Hero } from "@/components/home/Hero";
import { ProductCategories } from "@/components/home/ProductCategories";
import { ShopByNeed } from "@/components/home/ShopByNeed";
import { SmartConsultation } from "@/components/home/SmartConsultation";
import { TrustBar } from "@/components/home/TrustBar";
import { WhyFaraji } from "@/components/home/WhyFaraji";

export default function Home() {
  return (
    <>
      <Hero />
      <TrustBar />
      <ProductCategories />
      <ShopByNeed />
      <FeaturedProducts />
      <BrandStory />
      <SmartConsultation />
      <WhyFaraji />
      <BuyingGuides />
      <Brands />
      <ConsultationCTA />
    </>
  );
}
