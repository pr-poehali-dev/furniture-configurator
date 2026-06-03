import { lazy, Suspense, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Breadcrumbs from '@/components/Breadcrumbs';
import HeroSection from '@/components/HeroSection';
import WhyUsSection from '@/components/WhyUsSection';

const ProjectsCarousel = lazy(() => import('@/components/ProjectsCarousel'));
const QuizSection = lazy(() => import('@/components/QuizSection'));
const RoomAISection = lazy(() => import('@/components/RoomAISection'));
const CatalogSection = lazy(() => import('@/components/CatalogSection'));
const MaterialsSection = lazy(() => import('@/components/MaterialsSection'));
const ReviewsSection = lazy(() => import('@/components/ReviewsSection'));
const ContactsSection = lazy(() => import('@/components/ContactsSection'));
const FooterSection = lazy(() => import('@/components/FooterSection'));
const AIChatWidget = lazy(() => import('@/components/AIChatWidget'));

export default function Index() {
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      const id = location.hash;
      const t = setTimeout(() => {
        document.querySelector(id)?.scrollIntoView({ behavior: 'smooth' });
      }, 400);
      return () => clearTimeout(t);
    }
  }, [location]);

  return (
    <div className="min-h-screen">
      <Navbar />
      <HeroSection />
      <Breadcrumbs />
      <WhyUsSection />
      <Suspense fallback={null}>
        <ProjectsCarousel />
        <QuizSection />
        <RoomAISection />
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