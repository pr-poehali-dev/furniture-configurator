import { lazy, Suspense } from 'react';
import Navbar from '@/components/Navbar';
import Breadcrumbs from '@/components/Breadcrumbs';
import HeroSection from '@/components/HeroSection';
import WhyUsSection from '@/components/WhyUsSection';

const ProjectsCarousel = lazy(() => import('@/components/ProjectsCarousel'));
const ConstructorSection = lazy(() => import('@/components/ConstructorSection'));
const QuizSection = lazy(() => import('@/components/QuizSection'));
const CatalogSection = lazy(() => import('@/components/CatalogSection'));
const MaterialsSection = lazy(() => import('@/components/MaterialsSection'));
const ReviewsSection = lazy(() => import('@/components/ReviewsSection'));
const ContactsSection = lazy(() => import('@/components/ContactsSection'));
const FooterSection = lazy(() => import('@/components/FooterSection'));
const AIChatWidget = lazy(() => import('@/components/AIChatWidget'));

export default function Index() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <HeroSection />
      <Breadcrumbs />
      <WhyUsSection />
      <Suspense fallback={null}>
        <ProjectsCarousel />
        <ConstructorSection />
        <QuizSection />
        <CatalogSection />
        <MaterialsSection />
        <ReviewsSection />
        <ContactsSection />
        <FooterSection />
        <AIChatWidget />
      </Suspense>
    </div>
  );
}
