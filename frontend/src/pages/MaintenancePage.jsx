import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Twitter, Instagram, Linkedin, Github, Home, Users } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';
import bitcoinImage from "../assets/tig.png";

const ParticleField = () => {
  return (
    <div className="fixed inset-0 opacity-30">
      {[...Array(50)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full animate-float"
          style={{
            width: `${Math.random() * 4 + 1}px`,
            height: `${Math.random() * 4 + 1}px`,
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            background: `rgba(${Math.random() * 255}, ${Math.random() * 100 + 155}, 255, 0.6)`,
            animationDuration: `${Math.random() * 10 + 10}s`,
            animationDelay: `-${Math.random() * 10}s`,
          }}
        />
      ))}
    </div>
  );
};

const CountdownTimer = ({ targetDate }) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate - now;

      if (distance > 0) {
        setTimeLeft({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000)
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  return (
    <div className="grid grid-cols-4 gap-4 max-w-md mx-auto mb-8">
      {Object.entries(timeLeft).map(([unit, value]) => (
        <div key={unit} className="text-center">
          <div className="bg-black/40 backdrop-blur-xl rounded-xl border border-purple-500/30 p-4">
            <div className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              {value.toString().padStart(2, '0')}
            </div>
            <div className="text-xs text-gray-400 capitalize">{unit}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

const MaintenanceNavbar = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-1000 
      ${isVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`}>
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900/10 to-blue-900/10 backdrop-blur-xl" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo and Theme Toggle */}
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-3 group cursor-pointer">
                <div className="relative w-10 h-10 sm:w-12 sm:h-12">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl 
                    group-hover:scale-110 group-hover:rotate-180 transition-all duration-700" />
                  <div className="absolute inset-1 bg-black rounded-lg" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xl sm:text-2xl font-bold text-white">E</span>
                  </div>
                </div>
                <span className="text-xl sm:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r 
                  from-purple-400 to-blue-400 group-hover:from-purple-300 group-hover:to-blue-300 
                  transition-all duration-300">EventVerse</span>
              </div>
              <div className="h-8 w-px bg-gray-600 mx-1" />
              <ThemeToggle />
            </div>

            {/* Navigation Links */}
            <div className="flex items-center space-x-4 lg:space-x-8">
              <Link
                to="/"
                className="relative group py-2"
              >
                <div className="flex items-center gap-2">
                  <Home className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors duration-300" />
                  <span className="relative z-10 text-gray-300 group-hover:text-white transition-colors duration-300">
                    Home
                  </span>
                </div>
                <span className="absolute bottom-0 h-0.5 bg-gradient-to-r from-purple-500 to-blue-500 
                  w-0 left-1/2 group-hover:w-full group-hover:left-0 transition-all duration-300" />
              </Link>
              
              <Link
                to="/waiting"
                className="relative group py-2"
              >
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-400 transition-colors duration-300" />
                  <span className="relative z-10 text-purple-300 transition-colors duration-300">
                    Waitinglist
                  </span>
                </div>
                <span className="absolute bottom-0 h-0.5 bg-gradient-to-r from-purple-500 to-blue-500 
                  w-full left-0 transition-all duration-300" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

const MaintenanceFooter = () => {
  return (
    <footer className="relative bg-black/90 border-t border-purple-500/20 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
          <p className="text-sm text-gray-400 text-center sm:text-left">
            © 2025 EventVerse. All rights reserved.
          </p>
          <div className="flex space-x-4">
            {[Twitter, Instagram, Linkedin, Github].map((Icon, index) => (
              <button
                key={index}
                className="group relative p-2"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg
                  opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100 transition-all duration-300" />
                <Icon className="w-4 h-4 relative z-10 text-gray-400 group-hover:text-white transition-colors" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

const MaintenancePage = () => {
  const [isVisible, setIsVisible] = useState(false);
  
  // Set maintenance end time (7 days from now as default)
  const maintenanceEndTime = new Date().getTime() + (7 * 24 * 60 * 60 * 1000);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleJoinWaitlist = () => {
    window.open('https://forms.gle/rABHhncF9CNrZNGc8', '_blank');
  };

  return (
    <div className="min-h-screen bg-primary text-primary overflow-hidden flex flex-col">
      <ParticleField />
      
      <MaintenanceNavbar />

      {/* Main Content */}
      <main className="flex-1 relative pt-20 pb-12 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center min-h-[80vh]">
          
          {/* Hero Content */}
          <div className={`text-center lg:text-left transition-all duration-1000 delay-300 
            ${isVisible ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'}`}>
            
            {/* Maintenance Badge */}
            <div className="mb-8 inline-block">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-orange-600 to-red-600 rounded-xl blur-xl 
                  group-hover:blur-2xl transition-all duration-300" />
                <div className="relative bg-black/40 backdrop-blur-xl rounded-xl border border-orange-500/30 
                  px-6 py-2">
                  <span className="text-sm font-medium text-orange-300">Site Under Maintenance</span>
                </div>
              </div>
            </div>

            <h1 className="text-4xl xs:text-5xl sm:text-6xl md:text-7xl font-bold mb-6 leading-tight">
              <div className="overflow-hidden">
                <span className="inline-block animate-slide-up-fade">Site Under</span>
              </div>
              <div className="overflow-hidden">
                <span className="inline-block animate-slide-up-fade delay-200">Maintenance</span>
              </div>
            </h1>

            <p className="text-base sm:text-lg md:text-xl text-secondary mb-8 opacity-0 animate-fade-in delay-700">
              Join our waitlist to be the first to experience the Future of Event Management and Ticketing - 
              Featuring custom NFT, Badges and QR code
            </p>

            {/* Countdown Timer */}
            <CountdownTimer targetDate={maintenanceEndTime} />

            {/* CTA Button */}
            <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4 sm:gap-6 mb-8">
              <button
                onClick={handleJoinWaitlist}
                className="group relative px-6 py-3 sm:px-8 sm:py-3.5 rounded-xl overflow-hidden transition-all duration-300 hover:scale-[1.03]"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600" />
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 blur-xl
                  group-hover:blur-2xl transition-all duration-300" />
                <div className="relative z-10 flex items-center justify-center gap-2 font-medium">
                  <span>Join Waitlist</span>
                </div>
              </button>
            </div>

            {/* Social Media Icons */}
            <div className="flex justify-center lg:justify-start space-x-4">
              {[Twitter, Instagram, Linkedin, Github].map((Icon, index) => (
                <button
                  key={index}
                  className="group relative p-2"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg
                    opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100 transition-all duration-300" />
                  <Icon className="w-5 h-5 relative z-10 text-gray-400 group-hover:text-white transition-colors" />
                </button>
              ))}
            </div>
          </div>

          {/* Robot Image with Animation */}
          <div className={`mt-8 sm:mt-12 lg:mt-0 relative transition-all duration-1000 delay-500 ${
            isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
          }`}>
            <div className="relative w-full max-w-2xl mx-auto aspect-square group">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="absolute inset-0 bg-gradient-to-r from-purple-500 to-blue-500 rounded-3xl
                    opacity-20 blur-3xl group-hover:blur-2xl transition-all duration-500"
                  style={{
                    transform: `rotate(${i * 30}deg)`,
                    animationDelay: `${i * 200}ms`
                  }}
                />
              ))}
              <img
                src={bitcoinImage}
                alt="VR Experience"
                className="relative z-10 w-full h-auto object-cover rounded-3xl transform
                  group-hover:scale-[1.02] group-hover:rotate-1 transition-all duration-700"
                loading="eager"
              />
            </div>
          </div>
        </div>
      </main>

      <MaintenanceFooter />
    </div>
  );
};

export default MaintenancePage;