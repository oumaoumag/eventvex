import React, { useState, useEffect, useRef } from 'react';
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
  Users,
  MapPin,
  Navigation,
  Eye
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

  // Map and Location States
  const [userLocation, setUserLocation] = useState(null);
  const [mapCenter, setMapCenter] = useState([39.8283, -98.5795]); // Center of USA as default
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventDetails, setShowEventDetails] = useState(false);
  const [locationError, setLocationError] = useState(null);

  useEffect(() => {
    setIsVisible(true);
    getUserLocation();
  }, []);

  // Get user's current location
  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation([latitude, longitude]);
          setMapCenter([latitude, longitude]);
          setLocationError(null);
        },
        (error) => {
          console.error('Error getting location:', error);
          setLocationError('Unable to get your location. Showing all events.');
          // Keep default center if location fails
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    } else {
      setLocationError('Geolocation is not supported by this browser.');
    }
  };

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
      coordinates: [37.7749, -122.4194],
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
      coordinates: [30.2672, -97.7431],
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
      coordinates: [40.7128, -74.0060],
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
      coordinates: [51.5074, -0.1278],
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
      coordinates: [35.6762, 139.6503],
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
      coordinates: [25.7617, -80.1918],
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

  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; // Distance in kilometers
    return distance;
  };

  // Get distance from user to event
  const getDistanceToEvent = (event) => {
    if (!userLocation) return null;
    return calculateDistance(
      userLocation[0], userLocation[1],
      event.coordinates[0], event.coordinates[1]
    );
  };

  // Handle event marker click
  const handleEventClick = (event) => {
    setSelectedEvent(event);
    setShowEventDetails(true);
  };

  // Convert coordinates to map position
  const getMapPosition = (coordinates) => {
    // Simple projection for display purposes
    const [lat, lng] = coordinates;
    const x = ((lng + 180) / 360) * 100; // Convert longitude to percentage
    const y = ((90 - lat) / 180) * 100;  // Convert latitude to percentage
    return { x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) };
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Add custom styles for map markers */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes pulse {
            0% {
              transform: scale(1);
              opacity: 1;
            }
            50% {
              transform: scale(1.2);
              opacity: 0.7;
            }
            100% {
              transform: scale(1);
              opacity: 1;
            }
          }
          .user-marker div {
            animation: pulse 2s infinite;
          }
        `
      }} />

      {/* Header Section */}
      <section className="py-8 sm:py-12 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-blue-400
            bg-clip-text text-transparent text-center">
            Choose Your Event
          </h1>
          <p className="text-gray-400 text-center text-lg mb-6">
            Discover events near you on our interactive map
          </p>

          {/* Location Status */}
          {locationError && (
            <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-3 mb-4 text-center">
              <p className="text-yellow-400 text-sm">{locationError}</p>
            </div>
          )}

          {userLocation && (
            <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-3 mb-4 text-center">
              <p className="text-green-400 text-sm flex items-center justify-center gap-2">
                <Navigation className="w-4 h-4" />
                Location found! Showing events near you
              </p>
            </div>
          )}
        </div>

        {/* Search Bar */}
        <div className="max-w-4xl mx-auto mb-6">
          <div className="relative">
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
        </div>

        {/* Filter Toggle */}
        <div className="max-w-4xl mx-auto mb-6 flex justify-between items-center">
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
          <div className="max-w-4xl mx-auto bg-black/40 backdrop-blur-xl border border-purple-500/30 rounded-xl p-6 mb-6
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
            </div>
          </div>
        )}

        {/* Interactive Map */}
        <div className="max-w-7xl mx-auto">
          <div className="bg-black/40 backdrop-blur-xl rounded-xl border border-purple-500/30 overflow-hidden">
            <div className="h-[600px] relative bg-gradient-to-br from-slate-800 to-slate-900">
              {/* World Map Background */}
              <div className="absolute inset-0 opacity-40">
                <svg viewBox="0 0 1000 500" className="w-full h-full">
                  {/* Grid lines for geographic reference */}
                  <defs>
                    <pattern id="grid" width="50" height="25" patternUnits="userSpaceOnUse">
                      <path d="M 50 0 L 0 0 0 25" fill="none" stroke="rgba(139, 92, 246, 0.2)" strokeWidth="0.5"/>
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />

                  {/* Continents - Simplified shapes */}
                  {/* North America */}
                  <path
                    d="M100,150 Q150,120 200,140 L250,130 Q300,140 350,150 L400,140 Q450,130 500,140 L520,160 Q480,180 450,200 L400,190 Q350,200 300,190 L250,200 Q200,190 150,180 L120,170 Z"
                    fill="rgba(139, 92, 246, 0.3)"
                    stroke="rgba(139, 92, 246, 0.5)"
                    strokeWidth="1"
                  />

                  {/* Europe */}
                  <path
                    d="M450,120 Q480,110 510,120 L540,115 Q570,120 600,125 L620,140 Q590,150 560,145 L530,150 Q500,145 470,140 L455,135 Z"
                    fill="rgba(139, 92, 246, 0.3)"
                    stroke="rgba(139, 92, 246, 0.5)"
                    strokeWidth="1"
                  />

                  {/* Asia */}
                  <path
                    d="M600,100 Q650,90 700,100 L750,95 Q800,100 850,110 L880,130 Q850,150 800,145 L750,150 Q700,145 650,140 L620,135 Q610,125 600,120 Z"
                    fill="rgba(139, 92, 246, 0.3)"
                    stroke="rgba(139, 92, 246, 0.5)"
                    strokeWidth="1"
                  />

                  {/* South America */}
                  <path
                    d="M250,250 Q280,240 310,250 L340,260 Q350,280 340,300 L320,320 Q300,340 280,360 L260,380 Q240,360 250,340 L245,320 Q240,300 245,280 L248,260 Z"
                    fill="rgba(139, 92, 246, 0.3)"
                    stroke="rgba(139, 92, 246, 0.5)"
                    strokeWidth="1"
                  />

                  {/* Africa */}
                  <path
                    d="M480,200 Q510,190 540,200 L570,210 Q580,230 575,250 L570,270 Q565,290 560,310 L555,330 Q550,350 540,370 L520,380 Q500,370 485,350 L475,330 Q470,310 475,290 L480,270 Q485,250 480,230 L478,210 Z"
                    fill="rgba(139, 92, 246, 0.3)"
                    stroke="rgba(139, 92, 246, 0.5)"
                    strokeWidth="1"
                  />

                  {/* Australia */}
                  <path
                    d="M750,320 Q780,310 810,320 L840,330 Q850,340 845,350 L830,360 Q810,365 790,360 L770,355 Q755,350 750,340 Z"
                    fill="rgba(139, 92, 246, 0.3)"
                    stroke="rgba(139, 92, 246, 0.5)"
                    strokeWidth="1"
                  />

                  {/* Latitude lines */}
                  <line x1="0" y1="125" x2="1000" y2="125" stroke="rgba(139, 92, 246, 0.2)" strokeWidth="1" strokeDasharray="5,5"/>
                  <line x1="0" y1="250" x2="1000" y2="250" stroke="rgba(139, 92, 246, 0.3)" strokeWidth="1" strokeDasharray="5,5"/>
                  <line x1="0" y1="375" x2="1000" y2="375" stroke="rgba(139, 92, 246, 0.2)" strokeWidth="1" strokeDasharray="5,5"/>

                  {/* Longitude lines */}
                  <line x1="250" y1="0" x2="250" y2="500" stroke="rgba(139, 92, 246, 0.2)" strokeWidth="1" strokeDasharray="5,5"/>
                  <line x1="500" y1="0" x2="500" y2="500" stroke="rgba(139, 92, 246, 0.3)" strokeWidth="1" strokeDasharray="5,5"/>
                  <line x1="750" y1="0" x2="750" y2="500" stroke="rgba(139, 92, 246, 0.2)" strokeWidth="1" strokeDasharray="5,5"/>
                </svg>
              </div>

              {/* Map Labels */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-16 left-32 text-purple-300 text-sm font-medium opacity-60">North America</div>
                <div className="absolute top-12 left-1/2 text-purple-300 text-sm font-medium opacity-60">Europe</div>
                <div className="absolute top-10 right-32 text-purple-300 text-sm font-medium opacity-60">Asia</div>
                <div className="absolute bottom-32 left-72 text-purple-300 text-sm font-medium opacity-60">Africa</div>
                <div className="absolute bottom-16 left-80 text-purple-300 text-sm font-medium opacity-60">South America</div>
                <div className="absolute bottom-20 right-24 text-purple-300 text-sm font-medium opacity-60">Australia</div>
              </div>

              {/* User Location Marker */}
              {userLocation && (
                <div
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20"
                  style={{
                    left: `${getMapPosition(userLocation).x}%`,
                    top: `${getMapPosition(userLocation).y}%`
                  }}
                >
                  <div className="relative">
                    <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg animate-pulse"></div>
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                      You are here
                    </div>
                  </div>
                </div>
              )}

              {/* Event Markers */}
              {filteredEvents.map((event) => {
                const position = getMapPosition(event.coordinates);
                return (
                  <div
                    key={event.id}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10 cursor-pointer group"
                    style={{
                      left: `${position.x}%`,
                      top: `${position.y}%`
                    }}
                    onClick={() => handleEventClick(event)}
                  >
                    <div className="relative">
                      <div
                        className={`w-5 h-5 rounded-full border-2 border-white shadow-lg transition-all duration-300 group-hover:scale-125 ${
                          event.available > 0 ? 'bg-green-500' : 'bg-red-500'
                        }`}
                      ></div>

                      {/* Event Popup */}
                      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-xl p-4 min-w-[280px] opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none group-hover:pointer-events-auto">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold text-gray-800 text-sm">{event.name}</h3>
                          <span className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded-full">
                            {event.category}
                          </span>
                        </div>
                        <div className="space-y-1 text-sm text-gray-600 mb-3">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{event.date}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            <span>{event.location}</span>
                          </div>
                          {userLocation && (
                            <div className="flex items-center gap-1">
                              <Navigation className="w-3 h-3" />
                              <span>{getDistanceToEvent(event)?.toFixed(1)} km away</span>
                            </div>
                          )}
                        </div>
                        <div className="flex justify-between items-center mb-3">
                          <span className="font-semibold text-purple-600">{event.price}</span>
                          <span className={`text-sm ${event.available > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {event.available > 0 ? `${event.available} available` : 'Sold Out'}
                          </span>
                        </div>
                        <a href='/ticket' className="block">
                          <button className="w-full px-3 py-2 bg-gradient-to-r from-purple-600 to-blue-600
                            text-white rounded-lg text-sm hover:shadow-lg transition-all duration-300">
                            View Details
                          </button>
                        </a>

                        {/* Arrow pointing to marker */}
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white"></div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* No events message */}
              {filteredEvents.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-gray-400 text-lg mb-4">No events found matching your criteria</div>
                    <button
                      onClick={clearFilters}
                      className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg
                        hover:shadow-lg hover:shadow-purple-500/20 transition-all duration-300"
                    >
                      Clear Filters
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Map Legend */}
          <div className="mt-6 bg-black/40 backdrop-blur-xl rounded-xl border border-purple-500/30 p-4">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Map Legend
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white"></div>
                <span>Your Location</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                <span>Available Events</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-500 rounded-full border-2 border-white"></div>
                <span>Sold Out Events</span>
              </div>
            </div>
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

