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
  Blend,
  RefreshCw,
  Shield,
  Search,
  Filter,
  X,
  ChevronDown,
  Calendar,
  DollarSign,
  Users
} from 'lucide-react';

const TokenizedTicketing = () => {
  const [selectedSection, setSelectedSection] = useState('buy');
  const [hoveredCard, setHoveredCard] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  // Search and Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    category: '',
    priceRange: { min: '', max: '' },
    dateRange: { start: '', end: '' },
    availability: '',
    location: ''
  });
  const [filteredEvents, setFilteredEvents] = useState([]);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const sampleEvents = [
    {
      id: 1,
      name: "Blockchain Summit 2025",
      date: "March 15, 2025",
      dateObj: new Date("2025-03-15"),
      price: "0.5 ETH",
      priceValue: 0.5,
      available: 150,
      total: 500,
      category: "Technology",
      location: "San Francisco, CA",
      description: "The premier blockchain conference featuring industry leaders",
      image: "/src/assets/summit.png"
    },
    {
      id: 2,
      name: "Web3 Music Festival",
      date: "April 20, 2025",
      dateObj: new Date("2025-04-20"),
      price: "1.2 ETH",
      priceValue: 1.2,
      available: 75,
      total: 1000,
      category: "Music",
      location: "Austin, TX",
      description: "Revolutionary music festival powered by Web3 technology",
      image: "/src/assets/dr.png"
    },
    {
      id: 3,
      name: "NFT Art Exhibition",
      date: "May 5, 2025",
      dateObj: new Date("2025-05-05"),
      price: "0.8 ETH",
      priceValue: 0.8,
      available: 200,
      total: 300,
      category: "Art",
      location: "New York, NY",
      description: "Exclusive showcase of digital art and NFT collections",
      image: "/src/assets/im.png",
      url: "/src/pages/qrcode",
    },
    {
      id: 4,
      name: "DeFi Conference 2025",
      date: "June 10, 2025",
      dateObj: new Date("2025-06-10"),
      price: "0.3 ETH",
      priceValue: 0.3,
      available: 300,
      total: 400,
      category: "Finance",
      location: "London, UK",
      description: "Decentralized finance summit with top DeFi protocols",
      image: "/src/assets/summit.png"
    },
    {
      id: 5,
      name: "Gaming Metaverse Expo",
      date: "July 22, 2025",
      dateObj: new Date("2025-07-22"),
      price: "0.9 ETH",
      priceValue: 0.9,
      available: 50,
      total: 800,
      category: "Gaming",
      location: "Tokyo, Japan",
      description: "Explore the future of gaming in the metaverse",
      image: "/src/assets/dr.png"
    },
    {
      id: 6,
      name: "Crypto Sports Championship",
      date: "August 15, 2025",
      dateObj: new Date("2025-08-15"),
      price: "0.6 ETH",
      priceValue: 0.6,
      available: 400,
      total: 600,
      category: "Sports",
      location: "Miami, FL",
      description: "First-ever cryptocurrency-powered sports tournament",
      image: "/src/assets/im.png"
    }
  ];

  // Filter and search logic
  useEffect(() => {
    let filtered = sampleEvents.filter(event => {
      // Search term filter
      const matchesSearch = event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           event.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           event.description.toLowerCase().includes(searchTerm.toLowerCase());

      // Category filter
      const matchesCategory = !filters.category || event.category === filters.category;

      // Price range filter
      const matchesPriceMin = !filters.priceRange.min || event.priceValue >= parseFloat(filters.priceRange.min);
      const matchesPriceMax = !filters.priceRange.max || event.priceValue <= parseFloat(filters.priceRange.max);

      // Date range filter
      const matchesDateStart = !filters.dateRange.start || event.dateObj >= new Date(filters.dateRange.start);
      const matchesDateEnd = !filters.dateRange.end || event.dateObj <= new Date(filters.dateRange.end);

      // Availability filter
      const matchesAvailability = !filters.availability ||
        (filters.availability === 'available' && event.available > 0) ||
        (filters.availability === 'limited' && event.available > 0 && event.available < event.total * 0.2) ||
        (filters.availability === 'soldout' && event.available === 0);

      // Location filter
      const matchesLocation = !filters.location || event.location.toLowerCase().includes(filters.location.toLowerCase());

      return matchesSearch && matchesCategory && matchesPriceMin && matchesPriceMax &&
             matchesDateStart && matchesDateEnd && matchesAvailability && matchesLocation;
    });

    setFilteredEvents(filtered);
  }, [searchTerm, filters]);

  // Initialize filtered events
  useEffect(() => {
    setFilteredEvents(sampleEvents);
  }, []);

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const handlePriceRangeChange = (type, value) => {
    setFilters(prev => ({
      ...prev,
      priceRange: {
        ...prev.priceRange,
        [type]: value
      }
    }));
  };

  const handleDateRangeChange = (type, value) => {
    setFilters(prev => ({
      ...prev,
      dateRange: {
        ...prev.dateRange,
        [type]: value
      }
    }));
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilters({
      category: '',
      priceRange: { min: '', max: '' },
      dateRange: { start: '', end: '' },
      availability: '',
      location: ''
    });
  };

  const categories = ['Technology', 'Music', 'Art', 'Finance', 'Gaming', 'Sports'];
  const availabilityOptions = [
    { value: 'available', label: 'Available' },
    { value: 'limited', label: 'Limited (<20%)' },
    { value: 'soldout', label: 'Sold Out' }
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
              title: "Efficiency",
              description: "Fast and secure transactions powered by Base"
            },
            {
              icon: <Blend />,
              title: "Transparent Marketplace",
              description: "Tracking of ticket sales and transfers"
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

        {/* Search and Filter Section */}
        <div className="max-w-7xl mx-auto mb-8 sm:mb-12">
          {/* Search Bar */}
          <div className="relative mb-6">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search events by name, location, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-black/40 backdrop-blur-xl border border-purple-500/30
                rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-500/50
                transition-all duration-300"
            />
          </div>

          {/* Filter Toggle and Clear */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30
                rounded-lg border border-purple-500/30 transition-all duration-300"
            >
              <Filter className="w-4 h-4" />
              <span>Filters</span>
              <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${showFilters ? 'rotate-180' : ''}`} />
            </button>

            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-400">
                {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''} found
              </span>
              <button
                onClick={clearFilters}
                className="flex items-center space-x-1 px-3 py-1 text-sm text-purple-400 hover:text-purple-300
                  transition-colors duration-300"
              >
                <X className="w-3 h-3" />
                <span>Clear</span>
              </button>
            </div>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="bg-black/40 backdrop-blur-xl border border-purple-500/30 rounded-xl p-6 mb-6
              transition-all duration-300">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

                {/* Category Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Category
                  </label>
                  <select
                    value={filters.category}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                    className="w-full px-3 py-2 bg-black/60 border border-purple-500/30 rounded-lg
                      text-white focus:outline-none focus:border-purple-500/50 transition-all duration-300"
                  >
                    <option value="">All Categories</option>
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>

                {/* Price Range Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <DollarSign className="w-4 h-4 inline mr-1" />
                    Price Range (ETH)
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={filters.priceRange.min}
                      onChange={(e) => handlePriceRangeChange('min', e.target.value)}
                      className="w-1/2 px-3 py-2 bg-black/60 border border-purple-500/30 rounded-lg
                        text-white placeholder-gray-400 focus:outline-none focus:border-purple-500/50
                        transition-all duration-300"
                      step="0.1"
                      min="0"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={filters.priceRange.max}
                      onChange={(e) => handlePriceRangeChange('max', e.target.value)}
                      className="w-1/2 px-3 py-2 bg-black/60 border border-purple-500/30 rounded-lg
                        text-white placeholder-gray-400 focus:outline-none focus:border-purple-500/50
                        transition-all duration-300"
                      step="0.1"
                      min="0"
                    />
                  </div>
                </div>

                {/* Availability Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <Users className="w-4 h-4 inline mr-1" />
                    Availability
                  </label>
                  <select
                    value={filters.availability}
                    onChange={(e) => handleFilterChange('availability', e.target.value)}
                    className="w-full px-3 py-2 bg-black/60 border border-purple-500/30 rounded-lg
                      text-white focus:outline-none focus:border-purple-500/50 transition-all duration-300"
                  >
                    <option value="">All Events</option>
                    {availabilityOptions.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>

                {/* Date Range Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Date Range
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="date"
                      value={filters.dateRange.start}
                      onChange={(e) => handleDateRangeChange('start', e.target.value)}
                      className="w-1/2 px-3 py-2 bg-black/60 border border-purple-500/30 rounded-lg
                        text-white focus:outline-none focus:border-purple-500/50 transition-all duration-300"
                    />
                    <input
                      type="date"
                      value={filters.dateRange.end}
                      onChange={(e) => handleDateRangeChange('end', e.target.value)}
                      className="w-1/2 px-3 py-2 bg-black/60 border border-purple-500/30 rounded-lg
                        text-white focus:outline-none focus:border-purple-500/50 transition-all duration-300"
                    />
                  </div>
                </div>

                {/* Location Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    placeholder="Search by location..."
                    value={filters.location}
                    onChange={(e) => handleFilterChange('location', e.target.value)}
                    className="w-full px-3 py-2 bg-black/60 border border-purple-500/30 rounded-lg
                      text-white placeholder-gray-400 focus:outline-none focus:border-purple-500/50
                      transition-all duration-300"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Token Actions */}
        <div className="max-w-7xl mx-auto">

          {/* Event Cards */}
          {filteredEvents.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-lg mb-4">No events found matching your criteria</div>
              <button
                onClick={clearFilters}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg
                  hover:shadow-lg hover:shadow-purple-500/20 transition-all duration-300"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {filteredEvents.map((event, index) => (
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
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg sm:text-xl font-semibold">{event.name}</h3>
                      <span className="px-2 py-1 text-xs bg-purple-600/20 text-purple-300 rounded-full">
                        {event.category}
                      </span>
                    </div>
                    <div className="space-y-2 mb-3 sm:mb-4">
                      <div className="flex items-center space-x-2 text-gray-400">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm sm:text-base">{event.date}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-gray-400">
                        <Users className="w-4 h-4" />
                        <span className="text-sm sm:text-base">{event.location}</span>
                      </div>
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
          )}
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

