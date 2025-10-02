import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Power, Menu, X, Home, Search, Plus, Users, BarChart3, Ticket } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import {
  checkWalletConnection,
  connectWallet,
  setupWalletListeners,
  formatWalletAddress
} from '../utils/walletUtils';
import { useEvents } from '../hooks/useHybridDB';

const Header = () => {
  const [walletAddress, setWalletAddress] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  
  // Get user's events to check if they've created any
  const { events } = useEvents({ createdBy: walletAddress });

  // Check if current path is active
  const isActivePath = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  useEffect(() => {
    setIsVisible(true);

    // Check if wallet is already connected
    const checkConnection = async () => {
      const address = await checkWalletConnection();
      if (address) {
        setWalletAddress(address);
      }
    };

    checkConnection();

    // Setup wallet event listeners
    const cleanup = setupWalletListeners({
      onAccountsChanged: (accounts) => {
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
        } else {
          setWalletAddress(null);
        }
      },
      onDisconnect: () => {
        setWalletAddress(null);
      }
    });

    return cleanup;
    // eslint-disable-next-line
  }, []);

  const handleConnectWallet = async () => {
    setIsConnecting(true);
    try {
      const { address } = await connectWallet();
      setWalletAddress(address);
    } catch (error) {
      console.error("Error connecting to wallet:", error);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setWalletAddress(null);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Base navigation links with icons
  const baseNavLinks = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Explore', path: '/ticketsell', icon: Search },
    { name: 'Create', path: '/create', icon: Plus },
    { name: 'Waitinglist', path: '/waiting', icon: Users }
  ];

  // Conditional navigation links
  const conditionalNavLinks = [];
  
  // Show Dashboard if user has created at least one event
  // if (events && events.length > 0) { 
  if (true) {
    conditionalNavLinks.push({ name: 'Dashboard', path: '/dashboard', icon: BarChart3 });
  }
  
  // Show Collections if wallet is connected
  if (walletAddress) {
    conditionalNavLinks.push({ name: 'Collections', path: '/collection', icon: Ticket });
  }

  // Combine all navigation links
  const navLinks = [...baseNavLinks.slice(0, 1), ...conditionalNavLinks, ...baseNavLinks.slice(1)];

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-1000 \
      ${isVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`}>
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900/10 to-blue-900/10 backdrop-blur-xl" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo and Theme Toggle */}
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-3 group cursor-pointer">
                <div className="relative w-10 h-10 sm:w-12 sm:h-12">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl \
                    group-hover:scale-110 group-hover:rotate-180 transition-all duration-700" />
                  <div className="absolute inset-1 bg-black rounded-lg" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xl sm:text-2xl font-bold text-white">E</span>
                  </div>
                </div>
                <span className="text-xl sm:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r \
                  from-purple-400 to-blue-400 group-hover:from-purple-300 group-hover:to-blue-300 \
                  transition-all duration-300">EventVerse</span>
              </div>
              <div className="h-8 w-px bg-gray-600 mx-1" />
              <ThemeToggle />
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-4 lg:space-x-8">
              {navLinks.map(({ name, path, icon: Icon }) => {
                const isActive = isActivePath(path);
                return (
                  <Link
                    key={name}
                    to={path}
                    className="relative group py-2"
                  >
                    <div className="flex items-center gap-2">
                      <Icon className={`w-4 h-4 transition-colors duration-300 ${
                        isActive ? 'text-purple-400' : 'text-gray-400 group-hover:text-white'
                      }`} />
                      <span className={`relative z-10 transition-colors duration-300 ${
                        isActive ? 'text-purple-300' : 'text-gray-300 group-hover:text-white'
                      }`}>
                        {name}
                      </span>
                    </div>
                    <span className={`absolute bottom-0 h-0.5 bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-300 ${
                      isActive ? 'w-full left-0' : 'w-0 left-1/2 group-hover:w-full group-hover:left-0'
                    }`} />
                  </Link>
                );
              })}
              <button
                onClick={walletAddress ? disconnectWallet : handleConnectWallet}
                disabled={isConnecting}
                className="group relative px-4 sm:px-6 md:px-8 py-2 sm:py-3 md:py-4 rounded-xl overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600" />
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 blur-xl \
                  group-hover:blur-2xl transition-all duration-300" />
                <div className="relative z-10 flex items-center gap-2">
                  {isConnecting ? (
                    'Connecting...'
                  ) : walletAddress ? (
                    <>
                      <span>{formatWalletAddress(walletAddress)}</span>
                      <Power className="w-4 h-4" />
                    </>
                  ) : (
                    'Connect Wallet'
                  )}
                </div>
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={toggleMobileMenu}
                className="text-gray-300 hover:text-white focus:outline-none"
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden mt-4 py-4 border-t border-gray-700">
              <div className="flex flex-col space-y-4">
                {navLinks.map(({ name, path, icon: Icon }) => {
                  const isActive = isActivePath(path);
                  return (
                    <Link
                      key={name}
                      to={path}
                      className={`flex items-center gap-2 px-2 py-2 transition-colors ${
                        isActive ? 'text-purple-300' : 'text-gray-300 hover:text-white'
                      }`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Icon className="w-4 h-4" />
                      {name}
                    </Link>
                  );
                })}
                <button
                  onClick={() => {
                    walletAddress ? disconnectWallet() : handleConnectWallet();
                    setIsMobileMenuOpen(false);
                  }}
                  disabled={isConnecting}
                  className="group relative px-4 py-2 rounded-xl overflow-hidden mt-2"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600" />
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 blur-xl \
                    group-hover:blur-2xl transition-all duration-300" />
                  <div className="relative z-10 flex items-center justify-center gap-2">
                    {isConnecting ? (
                      'Connecting...'
                    ) : walletAddress ? (
                      <>
                        <span>{formatWalletAddress(walletAddress)}</span>
                        <Power className="w-4 h-4" />
                      </>
                    ) : (
                      'Connect Wallet'
                    )}
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Header;
