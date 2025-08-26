import React, { useState, useEffect } from 'react';
import imImage from "../assets/im.png";
import Chatbit from './Chatbit';
import {
  Ticket,
  Wallet,
  Plus,
  ArrowRight,
  ShoppingCart,
  Clock,
  BarChart,
  RefreshCw,
  Shield
} from 'lucide-react';

const TokenizedTicketing = () => {
  const [selectedSection, setSelectedSection] = useState('buy');
  const [hoveredCard, setHoveredCard] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const sampleEvents = [

    {
      id: 1,
      name: "Blockchain Summit 2025",
      date: "March 15, 2025",
      price: "0.5 ETH",
      available: 150,
      total: 500,
      image: "/src/assets/summit.png"
    },
    {
      id: 2,
      name: "Web3 Music Festival",
      date: "April 20, 2025",
      price: "1.2 ETH",
      available: 75,
      total: 1000,
      image: "/src/assets/dr.png"
    },
    {
      id: 3,
      name: "NFT Art Exhibition",
      date: "May 5, 2025",
      price: "0.8 ETH",
      available: 200,
      total: 300,
      image: "/src/assets/im.png",
      url: "/src/pages/qrcode",
    }

  ];

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Feature Highlights */}
      <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto mb-8 sm:mb-12 md:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 bg-gradient-to-r from-purple-400 to-blue-400
            bg-clip-text text-transparent text-center sm:text-left">
            Tokenized Ticketing on Base
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-gray-400 text-center sm:text-left">Secure, transparent, and efficient event ticketing powered by blockchain</p>
        </div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-12 sm:mb-16 md:mb-20">
          {[
            {
              icon: <Shield />,
              title: "Secure Tokenization",
              description: "Event tickets are minted as unique tokens on Base blockchain"
            },
            {
              icon: <RefreshCw />,
              title: "Instant Transfers",
              description: "Fast and secure transactions with Base network"
            },
            {
              icon: <BarChart />,
              title: "Market Analytics",
              description: "Real-time tracking of ticket sales and transfers"
            }
          ].map((feature, index) => (
            <div
              key={index}
              className="group relative transform hover:scale-105 transition-all duration-300"
              onMouseEnter={() => setHoveredCard(index)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-xl
                blur-xl opacity-0 group-hover:opacity-100 transition-all duration-300" />
              <div className="relative bg-black/40 backdrop-blur-xl rounded-xl border border-purple-500/30
                p-6 sm:p-8 group-hover:border-purple-500/50 transition-all duration-300">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600
                  flex items-center justify-center mb-4 sm:mb-6 transform group-hover:rotate-12 transition-all duration-500">
                  {feature.icon}
                </div>
                <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-4">{feature.title}</h3>
                <p className="text-sm sm:text-base text-gray-400 group-hover:text-gray-300 transition-colors">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Token Actions */}
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 mb-8">
            <a href="/create" className="w-full sm:w-auto">
              <button className="w-full sm:w-auto relative px-4 sm:px-6 py-3 rounded-xl overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600" />
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <span className="relative text-white font-medium">
                  Create Event
                </span>
                <div className="absolute inset-0 shadow-lg shadow-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </button>
            </a>

            <a href="/resell" className="w-full sm:w-auto">
              <button className="w-full sm:w-auto relative px-4 sm:px-6 py-3 rounded-xl overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600" />
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <span className="relative text-white font-medium">
                  Resell
                </span>
                <div className="absolute inset-0 shadow-lg shadow-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </button>
            </a>
          </div>

          {/* Event Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {sampleEvents.map((event, index) => (
              <div
                key={event.id}
                className={`group relative transition-all duration-500 transform
                  hover:scale-105 hover:-translate-y-2`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-blue-600/20
                  rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-all duration-300" />
                <div className="relative bg-black/40 backdrop-blur-xl rounded-xl border border-purple-500/30
                  overflow-hidden">
                  <img
                    src={event.image}
                    alt={event.name}
                    className="w-full h-40 sm:h-48 object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="p-4 sm:p-6">
                    <h3 className="text-lg sm:text-xl font-semibold mb-2">{event.name}</h3>
                    <div className="flex items-center space-x-2 text-gray-400 mb-3 sm:mb-4">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm sm:text-base">{event.date}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
                      <span className="text-base sm:text-lg font-semibold text-purple-400">{event.price}</span>
                      <a href='/ticket'>
                        <button className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600
                          rounded-lg flex items-center justify-center sm:justify-start space-x-2 group-hover:shadow-lg
                          group-hover:shadow-purple-500/20 transition-all">
                          <span className="text-sm sm:text-base">{selectedSection === 'buy' ? 'Purchase' :
                                selectedSection === 'create' ? 'Create' : 'Resell'}</span>
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                      </a>
                    </div>
                    <div className="mt-4 bg-purple-900/20 rounded-lg p-2 sm:p-3">
                      <div className="flex justify-between text-xs sm:text-sm text-gray-400">
                        <span>Available: {event.available}</span>
                        <span>Total Supply: {event.total}</span>
                      </div>
                      <div className="mt-2 h-2 bg-purple-900/40 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-purple-500 to-blue-500"
                          style={{ width: `${(event.available / event.total) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section>
        <div>
          <Chatbit />
        </div>
      </section>
    </div>
  );
};

export default TokenizedTicketing;

