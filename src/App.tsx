import React from 'react';
import { RafikiProvider, useRafiki } from './context/RafikiContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { FloatingMobileWhatsApp } from './components/ui/ContactButtons';
import { HomePage } from './pages/HomePage';
import { StaysPage } from './pages/StaysPage';
import { PropertyDetailPage } from './pages/PropertyDetailPage';
import { DestinationsPage } from './pages/DestinationsPage';
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';
import { BookingConfirmationPage } from './pages/BookingConfirmationPage';
import { AdminLoginPage } from './pages/admin/AdminLoginPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { NotFoundPage } from './pages/NotFoundPage';

const RouterViewport: React.FC = () => {
  const { pathname } = useRafiki();
  const cleanPath = pathname.replace(/\/+$/, '') || '/';

  if (cleanPath === '/admin/login') {
    return <AdminLoginPage />;
  }

  if (cleanPath === '/admin' || cleanPath.startsWith('/admin/')) {
    const subRoute = cleanPath.replace('/admin', '').replace(/^\/+/, '') || 'dashboard';
    return <AdminDashboardPage initialSubRoute={subRoute} />;
  }

  let pageContent: React.ReactNode = null;

  if (cleanPath === '/') {
    pageContent = <HomePage />;
  } else if (cleanPath === '/stays') {
    pageContent = <StaysPage />;
  } else if (cleanPath.startsWith('/stays/')) {
    const slug = decodeURIComponent(cleanPath.slice('/stays/'.length).split('/')[0]);
    pageContent = <PropertyDetailPage slug={slug} />;
  } else if (cleanPath === '/destinations') {
    pageContent = <DestinationsPage />;
  } else if (cleanPath === '/about') {
    pageContent = <AboutPage />;
  } else if (cleanPath === '/contact') {
    pageContent = <ContactPage />;
  } else if (cleanPath === '/booking') {
    pageContent = <BookingConfirmationPage bookingIdOrRef="" />;
  } else if (cleanPath.startsWith('/booking/')) {
    const idOrRef = decodeURIComponent(cleanPath.slice('/booking/'.length).split('/')[0]);
    pageContent = <BookingConfirmationPage bookingIdOrRef={idOrRef} />;
  } else {
    pageContent = <NotFoundPage />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FBF9F5] text-[#1A1D1B]">
      <Navbar />
      <main className="flex-1">{pageContent}</main>
      <Footer />
      <FloatingMobileWhatsApp />
    </div>
  );
};

export default function App() {
  return (
    <RafikiProvider>
      <RouterViewport />
    </RafikiProvider>
  );
}
