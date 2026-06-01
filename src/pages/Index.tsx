import Navbar from '@/components/Navbar';
import HeroSection from '@/components/HeroSection';
import WhyUsSection from '@/components/WhyUsSection';
import ProjectsCarousel from '@/components/ProjectsCarousel';
import ConstructorSection from '@/components/ConstructorSection';
import CatalogSection from '@/components/CatalogSection';
import MaterialsSection from '@/components/MaterialsSection';
import ContactsSection from '@/components/ContactsSection';
import FooterSection from '@/components/FooterSection';

export default function Index() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <HeroSection />
      <WhyUsSection />
      <ProjectsCarousel />
      <ConstructorSection />
      <CatalogSection />
      <MaterialsSection />
      <ContactsSection />
      <FooterSection />
    </div>
  );
}
