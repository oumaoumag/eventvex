import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Power, Menu, X } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import {
  checkWalletConnection,
  connectWallet,
  setupWalletListeners,
  formatWalletAddress
} from '../utils/walletUtils';

const Header = () => {
  const [walletAddress, setWalletAddress] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'WaitingList', path: '/waiting' },
    { name: 'TicketMinting', path: '/mint' },
  ];

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
              {navLinks.map(({ name, path }) => (
                <Link
                  key={name}
                  to={path}
                  className="relative group py-2"
                >
                  <span className="relative z-10 text-gray-300 group-hover:text-white transition-colors duration-300">
                    {name}
                  </span>
                  <span className="absolute bottom-0 left-1/2 w-0 h-0.5 bg-gradient-to-r from-purple-500 to-blue-500 \
                    group-hover:w-full group-hover:left-0 transition-all duration-300" />
                </Link>
              ))}
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
                {navLinks.map(({ name, path }) => (
                  <Link
                    key={name}
                    to={path}
                    className="text-gray-300 hover:text-white px-2 py-2"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {name}
                  </Link>
                ))}
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
