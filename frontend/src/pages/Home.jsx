import React, { useState, useEffect, useRef } from 'react';
import { Moon, Ticket, Calendar, Users, TrendingUp, ChevronRight, Star, Zap, Activity, Globe, Power } from 'lucide-react';
import bitcoinImage from "../assets/tig.png";
import Chatbit from './Chatbit';
import Testimonials from './Testimonials';
import Discover from './Discover';
// Footer is now handled elsewhere in the application
import Teams from './Teams';
import { ethers } from 'ethers';
import { Link } from 'react-router-dom';

// Base Network Configuration
const BASE_MAINNET_PARAMS = {
  chainId: '0x2105', // Hex chain ID for Base Mainnet
  chainName: 'Base Mainnet',
  nativeCurrency: {
    name: 'ETH',
    symbol: 'ETH',
    decimals: 18
  },
  rpcUrls: ['https://mainnet.base.org'],
  blockExplorerUrls: ['https://basescan.org/']
};

const addBaseNetwork = async () => {
  if (typeof window.ethereum !== "undefined") {
      try {
          await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [BASE_MAINNET_PARAMS],
          });
          console.log("Base network added successfully!");
      } catch (error) {
          console.error("Error adding Base network:", error);
      }
  } else {
      console.error("MetaMask is not installed.");
  }
};

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

const AnimatedCard = ({ children, delay, onClick, isSelected }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={`relative group transition-all duration-500 transform
        ${isSelected ? 'scale-105 -translate-y-2' : ''}
        ${isHovered ? 'translate-y-[-8px]' : ''}`}
      style={{ animationDelay: `${delay}ms` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-xl blur-xl
        group-hover:blur-2xl transition-all duration-300" />
      <div className="relative bg-black/40 backdrop-blur-xl rounded-xl border border-purple-500/30
        group-hover:border-purple-500/50 p-6 transition-all duration-300">
        {children}
      </div>
    </div>
  );
};

const UltimateEventPlatform = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [activeStat, setActiveStat] = useState(null);
  const [walletAddress, setWalletAddress] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    checkWalletConnection();

    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('disconnect', handleDisconnect);
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('disconnect', handleDisconnect);
      }
    };
  }, []);

  const features = [
    {
      icon: <Ticket className="w-8 h-8" />,
      title: "Quantum Ticketing",
      description: "Next-gen blockchain verification with quantum security in less than 2 seconds only on Base",
      color: "from-purple-600 to-blue-600"
    },
    {
      icon: <Globe className="w-8 h-8" />,
      title: "Maximizing Saving on Events",
      description: "Leveraging Base's Low Fees for More Affordable Event Ticketing",
      color: "from-blue-600 to-purple-600"
    },
    {
      icon: <Activity className="w-8 h-8" />,
      title: "Your Tickets, Your Security",
      description: "Safeguard Your Tickets with Base's Trusted Blockchain Technology",
      color: "from-purple-600 to-pink-600"
    }
  ];

  const checkWalletConnection = async () => {
    if (typeof window.ethereum !== "undefined") {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
        }
      } catch (error) {
        console.error("Error checking wallet connection:", error);
      }
    }
  };

  const handleAccountsChanged = (accounts) => {
    if (accounts.length > 0) {
      setWalletAddress(accounts[0]);
    } else {
      setWalletAddress(null);
    }
  };

  const handleDisconnect = () => {
    setWalletAddress(null);
  };

  const connectWallet = async () => {
    if (typeof window.ethereum === "undefined") {
      alert("Please install MetaMask to connect your wallet!");
      return;
    }

    setIsConnecting(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      if (accounts.length > 0) {
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        setWalletAddress(address);
        console.log("Connected Address:", address);
      }
    } catch (error) {
      console.error("Error connecting to wallet:", error);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setWalletAddress(null);
  };

  return (
    <div className="min-h-screen bg-primary text-primary overflow-hidden">
      <ParticleField />

      {/* Dynamic Cursor Effect */}
      <div
        className="fixed w-64 h-64 pointer-events-none z-50 transition-transform duration-100"
        style={{
          transform: `translate(${mousePosition.x - 128}px, ${mousePosition.y - 128}px)`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-full blur-3xl" />
      </div>

      {/* Hero Section */}
      <main className="relative pt-16 pb-12 sm:pt-20 md:pt-28 lg:pt-32 px-4 sm:px-6 max-w-8xl mx-auto bg-primary">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          <div className={`text-center lg:text-left transition-all duration-1000 delay-300 ${
            isVisible ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'
          }`}>
            <h1 className="text-4xl xs:text-5xl sm:text-6xl md:text-7xl font-bold mb-4 sm:mb-6 leading-tight">
              <div className="overflow-hidden">
                <span className="inline-block animate-slide-up-fade">Experience</span>
              </div>
              <div className="overflow-hidden">
                <span className="inline-block animate-slide-up-fade delay-200">The Future of</span>
              </div>
              <div className="overflow-hidden">
                <span className="inline-block bg-gradient-to-r from-purple-400 to-blue-400
                  bg-clip-text text-transparent animate-slide-up-fade delay-400">
                  Event Ticketing
                </span>
              </div>
            </h1>

            <p className="text-base sm:text-lg md:text-xl text-secondary mb-8 sm:mb-10 opacity-0 animate-fade-in delay-700 px-2 sm:px-0">
              Step into a world where events transcend reality. Experience seamless ticketing,
              immersive venues, and next-generation event management.
            </p>

            <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4 sm:gap-6">
              <a href="/ticketsell" className="w-full xs:w-auto">
                <button className="w-full group relative px-6 py-3 sm:px-8 sm:py-3.5 rounded-xl overflow-hidden transition-all duration-300 hover:scale-[1.03]">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600" />
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 blur-xl
                    group-hover:blur-2xl transition-all duration-300" />
                  <div className="relative z-10 flex items-center justify-center gap-2 font-medium">
                    <span>Explore Events</span>
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>
              </a>

              <a href="/qrcode" className="w-full xs:w-auto">
                <button className="w-full group relative px-6 py-3 sm:px-8 sm:py-3.5 rounded-xl overflow-hidden hover:scale-[1.03] transition-all duration-300">
                  <div className="absolute inset-0 border border-purple-500/50 rounded-xl group-hover:border-purple-400/70 transition-colors" />
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-blue-500/5
                    transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
                  <span className="relative z-10 font-medium">Tickets Collection</span>
                </button>
              </a>
            </div>
          </div>

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

      {/* Features Section */}
     {/* Features with Interactive Animations */}
     <section className="py-12 md:py-20 px-4 sm:px-6 relative">
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {features.map((feature, index) => (
            <AnimatedCard
              key={index}
              delay={index * 200}
              isSelected={selectedFeature === index}
              onClick={() => setSelectedFeature(index)}
            >
              <div className={`relative group-hover:scale-105 transition-transform duration-300`}>
                <div className={`w-12 h-12 sm:w-16 sm:h-16 mb-4 sm:mb-6 rounded-xl bg-gradient-to-r ${feature.color}
                  flex items-center justify-center transform group-hover:rotate-12 transition-all duration-500`}>
                  {feature.icon}
                </div>
                <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-4 bg-gradient-to-r from-white to-gray-300
                  bg-clip-text text-transparent">{feature.title}</h3>
                <p className="text-sm sm:text-base text-gray-400 group-hover:text-gray-300 transition-colors">
                  {feature.description}
                </p>
              </div>
            </AnimatedCard>
          ))}
        </div>
      </section>

      {/* Interactive Stats with Hover Effects */}
      <section className="py-12 md:py-20 px-4 sm:px-6 relative">
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {[
            { value: "100K+", label: "Active Users", icon: <Users />, color: "purple" },
            { value: "50K+", label: "Events Hosted", icon: <Calendar />, color: "blue" },
            { value: "1M+", label: "Tickets Sold", icon: <Ticket />, color: "purple" },
            { value: "99%", label: "Security  Assurance", icon: <Star />, color: "blue" }
          ].map((stat, index) => (
            <div
              key={index}
              className="relative group cursor-pointer"
              onMouseEnter={() => setActiveStat(index)}
              onMouseLeave={() => setActiveStat(null)}
            >
              <div className={`absolute inset-0 bg-gradient-to-r from-${stat.color}-500/20 to-${stat.color}-600/20
                rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-all duration-300`} />
              <div className="relative bg-black/40 backdrop-blur-xl rounded-xl border border-purple-500/30
                group-hover:border-purple-500/50 p-4 sm:p-6 transform group-hover:translate-y-[-8px]
                transition-all duration-300">
                <div className="flex flex-col items-center">
                  <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-${stat.color}-500/20
                    flex items-center justify-center mb-3 sm:mb-4 transform group-hover:scale-110
                    group-hover:rotate-12 transition-all duration-500`}>
                    {stat.icon}
                  </div>
                  <div className={`text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-${stat.color}-400
                    to-${stat.color}-600 bg-clip-text text-transparent mb-1 sm:mb-2`}>
                    {stat.value}
                  </div>
                  <div className="text-sm sm:text-base text-gray-400 group-hover:text-gray-300 transition-colors">
                    {stat.label}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
      <section>
        <div>
          <Chatbit />
        </div>
      </section>
      <section>
        <div>
          <Testimonials />
        </div>
      </section>
      <section>
        <div>
          <Discover />
        </div>
      </section>
      <section>
        <div>
          <Teams />
        </div>
      </section>
      {/* Footer section removed to fix duplicate footer issue */}
    </div>
  );
};

export default UltimateEventPlatform;
