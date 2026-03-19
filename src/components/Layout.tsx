import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnnouncementBar } from './AnnouncementBar';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

export const Layout: React.FC = () => {
  const location = useLocation();

  return (
    <div className="flex flex-col min-h-screen">
      <AnnouncementBar />
      <Navbar />
      <main className="flex-grow overflow-x-clip">
        <div key={location.pathname} className="min-h-full page-fade-in">
          <Outlet />
        </div>
      </main>
      <Footer />
    </div>
  );
};
