import React, { useEffect } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import Chatbit from './pages/Chatbit';
import ThemeToggle from './components/ThemeToggle';

const Layout = ({ children }) => {
  // Apply theme class on initial load
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  return (
    <div className="min-h-screen bg-primary text-primary transition-theme">
      <Header />
      <main className="min-h-[80vh] bg-primary">
        {children}
      </main>
      <Chatbit />
      <Footer />
    </div>
  );
};

export default Layout;
