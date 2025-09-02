import React, { useState, useEffect, useRef } from 'react';
import imImage from "../assets/im.png";
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
  Eye,
  Map,
  List
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
  const [mapCenter, setMapCenter] = useState([-1.2921, 36.8219]); // Center of Kenya as default
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventDetails, setShowEventDetails] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  // View Mode State
  const [viewMode, setViewMode] = useState('map'); // 'map' or 'list'

  useEffect(() => {
    setIsVisible(true);
    getUserLocation();
    loadBlockchainEvents(); // Load events from blockchain

    // Initialize map only once when component mounts
    const timer = setTimeout(() => {
      if (!mapInstanceRef.current) {
        initializeMap();
      }
    }, 100);
    
    // Listen for new events created
    const handleEventCreated = () => {
      console.log('New event detected, refreshing map...');
      loadBlockchainEvents();
    };
    
    window.addEventListener('eventCreated', handleEventCreated);

    // Cleanup function to properly destroy map when component unmounts
    return () => {
      clearTimeout(timer);
      window.removeEventListener('eventCreated', handleEventCreated);
      if (mapInstanceRef.current) {
        console.log('Cleaning up map instance');
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Initialize the map
  const initializeMap = async () => {
    // Prevent multiple initializations
    if (mapInstanceRef.current) {
      console.log('Map already initialized, skipping...');
      return;
    }

    if (typeof window !== 'undefined' && mapRef.current) {
      try {
        console.log('Initializing new map instance...');

        // Check if the container already has a map
        if (mapRef.current._leaflet_id) {
          console.log('Map container already has Leaflet instance, clearing...');
          mapRef.current._leaflet_id = undefined;
        }

        // Dynamically import Leaflet to avoid SSR issues
        const L = await import('leaflet');

        // Fix for default markers
        delete L.default.Icon.Default.prototype._getIconUrl;
        L.default.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        });

        // Create map instance
        const map = L.default.map(mapRef.current).setView(mapCenter, userLocation ? 6 : 4);

        // Add OpenStreetMap tiles (free, no API key needed)
        L.default.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 18,
        }).addTo(map);

        mapInstanceRef.current = map;
        console.log('Map instance created successfully');

        // Wait for map to be ready, then add markers
        setTimeout(() => {
          console.log('Adding markers to newly initialized map');
          updateMapMarkers(L.default);
        }, 500);

      } catch (error) {
        console.error('Error initializing map:', error);
      }
    } else {
      console.log('Cannot initialize map: window or mapRef not available');
    }
  };

  // Update map center when user location changes
  useEffect(() => {
    if (mapInstanceRef.current && userLocation) {
      mapInstanceRef.current.setView(userLocation, 6);
      setMapCenter(userLocation);
    }
  }, [userLocation]);

  // Update markers when filtered events or user location changes
  useEffect(() => {
    if (mapInstanceRef.current && filteredEvents.length >= 0) {
      console.log('Updating markers due to filteredEvents/userLocation change');
      setTimeout(() => {
        updateMapMarkers();
      }, 300);
    }
  }, [mapInstanceRef.current, filteredEvents]);

  // Check if map needs reinitialization when component becomes visible
  useEffect(() => {
    const checkAndReinitializeMap = () => {
      if (mapRef.current && !mapInstanceRef.current) {
        console.log('Map container exists but map instance is missing, reinitializing...');
        initializeMap();
      }
    };

    // Check immediately
    checkAndReinitializeMap();

    // Also check after a short delay in case the DOM needs time to settle
    const timeoutId = setTimeout(checkAndReinitializeMap, 500);

    return () => clearTimeout(timeoutId);
  }, [isVisible]);

  // Reinitialize map when switching to map view
  useEffect(() => {
    if (viewMode === 'map') {
      // Clean up existing map instance first
      if (mapInstanceRef.current) {
        console.log('Cleaning up existing map instance before reinitializing');
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      // Small delay to ensure DOM is ready
      const timeoutId = setTimeout(() => {
        if (mapRef.current) {
          console.log('Switching to map view, reinitializing map...');
          initializeMap();
        }
      }, 200);

      return () => clearTimeout(timeoutId);
    } else {
      // When switching away from map view, clean up the map
      if (mapInstanceRef.current) {
        console.log('Switching away from map view, cleaning up map instance');
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    }
  }, [viewMode]);

  // Add intersection observer to detect when map container becomes visible
  useEffect(() => {
    if (!mapRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !mapInstanceRef.current) {
            console.log('Map container became visible, reinitializing map...');
            setTimeout(() => {
              initializeMap();
            }, 100);
          }
        });
      },
      { threshold: 0.1 }
    );

    observer.observe(mapRef.current);

    return () => {
      observer.disconnect();
    };
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

  // State for blockchain events
  const [blockchainEvents, setBlockchainEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  
  // Load events using hybrid database for fast loading
  const loadBlockchainEvents = async () => {
    try {
      setLoadingEvents(true);
      const { getActiveEvents } = await import('../utils/contractIntegration');
      const events = await getActiveEvents();
      
      // Transform events using data processor
      const { transformBlockchainEvent, validateEventData } = await import('../utils/eventDataProcessor');
      const formattedEvents = events
        .filter(validateEventData)
        .map(transformBlockchainEvent);
      
      setBlockchainEvents(formattedEvents);
    } catch (error) {
      console.error('Error loading events:', error);
      setBlockchainEvents([]); // No fallback to hardcoded data
    } finally {
      setLoadingEvents(false);
    }
  };
  
  // Events now loaded from SQLite database - no hardcoded data

  // Filter and search logic
  useEffect(() => {
    let filtered = blockchainEvents.filter(event => {
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
  }, [searchTerm, filters, blockchainEvents]);

  // Initialize filtered events when blockchain events load
  useEffect(() => {
    setFilteredEvents(blockchainEvents);
  }, [blockchainEvents]);

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

  // Update map markers
  const updateMapMarkers = async (L) => {
    if (!mapInstanceRef.current) {
      console.log('Map instance not ready');
      return;
    }

    // Import Leaflet if not provided
    if (!L) {
      try {
        L = (await import('leaflet')).default;
      } catch (error) {
        console.error('Error importing Leaflet:', error);
        return;
      }
    }

    console.log('Updating markers. User location:', userLocation, 'Filtered events:', filteredEvents.length);

    // Clear existing markers (but keep the tile layer)
    mapInstanceRef.current.eachLayer((layer) => {
      if (layer.options && layer.options.attribution) {
        // This is the tile layer, keep it
        return;
      }
      // Remove all other layers (markers)
      mapInstanceRef.current.removeLayer(layer);
    });

    // Add user location marker
    if (userLocation && userLocation.length === 2) {
      console.log('Adding user location marker at:', userLocation);
      try {
        const userIcon = L.divIcon({
          html: `<div style="background-color: #3b82f6; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
          className: 'user-marker',
          iconSize: [22, 22],
          iconAnchor: [11, 11]
        });

        const userMarker = L.marker(userLocation, { icon: userIcon })
          .addTo(mapInstanceRef.current)
          .bindPopup(`
            <div style="text-align: center; padding: 8px;">
              <div style="font-weight: bold; color: #3b82f6; margin-bottom: 4px;">Your Location</div>
              <div style="font-size: 12px; color: #666;">You are here</div>
            </div>
          `);

        console.log('User marker added successfully');
      } catch (error) {
        console.error('Error adding user marker:', error);
      }
    }

    // Add event markers
    filteredEvents.forEach((event, index) => {
      if (!event.coordinates || event.coordinates.length !== 2) {
        console.warn('Invalid coordinates for event:', event.name, event.coordinates);
        return;
      }

      console.log(`Adding event marker ${index + 1}:`, event.name, 'at', event.coordinates);

      try {
        const color = event.available > 0 ? '#10b981' : '#ef4444';
        const eventIcon = L.divIcon({
          html: `<div style="background-color: ${color}; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
          className: 'event-marker',
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        });

        const distanceText = userLocation ?
          `<div style="display: flex; align-items: center; gap: 4px; margin: 4px 0;">
            <span style="font-size: 12px;">📍</span>
            <span style="font-size: 12px;">${getDistanceToEvent(event)?.toFixed(1)} km away</span>
          </div>` : '';

        const eventMarker = L.marker(event.coordinates, { icon: eventIcon })
          .addTo(mapInstanceRef.current)
          .bindPopup(`
            <div style="max-width: 280px; padding: 4px;">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                <h3 style="font-weight: bold; color: #1f2937; margin: 0; font-size: 14px; flex: 1;">${event.name}</h3>
                <span style="background-color: #f3e8ff; color: #7c3aed; padding: 2px 6px; border-radius: 12px; font-size: 10px; margin-left: 8px; white-space: nowrap;">
                  ${event.category}
                </span>
              </div>
              <div style="margin-bottom: 12px;">
                <div style="display: flex; align-items: center; gap: 4px; margin: 4px 0;">
                  <span style="font-size: 12px;">🕒</span>
                  <span style="font-size: 12px; color: #666;">${event.date}</span>
                </div>
                <div style="display: flex; align-items: center; gap: 4px; margin: 4px 0;">
                  <span style="font-size: 12px;">📍</span>
                  <span style="font-size: 12px; color: #666;">${event.location}</span>
                </div>
                ${distanceText}
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                <span style="font-weight: bold; color: #7c3aed;">${event.price}</span>
                <span style="font-size: 12px; color: ${event.available > 0 ? '#059669' : '#dc2626'};">
                  ${event.available > 0 ? `${event.available} available` : 'Sold Out'}
                </span>
              </div>
              <a href="/event/${event.id}/tickets" style="display: block; text-decoration: none;">
                <button style="width: 100%; padding: 8px 12px; background: linear-gradient(to right, #7c3aed, #3b82f6); color: white; border: none; border-radius: 6px; font-size: 12px; cursor: pointer; transition: all 0.2s;">
                  View Tickets
                </button>
              </a>
            </div>
          `);

        console.log(`Event marker ${index + 1} added successfully`);
      } catch (error) {
        console.error(`Error adding marker for event ${event.name}:`, error);
      }
    });

    console.log('Finished updating markers');
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Add custom styles for map markers and Leaflet */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @import url('https://unpkg.com/leaflet@1.9.4/dist/leaflet.css');

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

          /* Custom map styling */
          .leaflet-container {
            background: #1e293b !important;
          }

          .leaflet-popup-content-wrapper {
            border-radius: 8px !important;
            box-shadow: 0 10px 25px rgba(0,0,0,0.3) !important;
          }

          .leaflet-popup-tip {
            background: white !important;
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
              {loadingEvents ? 'Loading...' : `${filteredEvents.length} event${filteredEvents.length !== 1 ? 's' : ''} found`}
            </span>
            <button
              onClick={loadBlockchainEvents}
              className="flex items-center space-x-1 px-3 py-1 text-sm text-blue-400 hover:text-blue-300
                transition-colors duration-300"
              disabled={loadingEvents}
            >
              <RefreshCw className={`w-3 h-3 ${loadingEvents ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
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

        {/* View Mode Tabs */}
        <div className="max-w-7xl mx-auto mb-6">
          <div className="flex justify-center">
            <div className="bg-black/40 backdrop-blur-xl rounded-xl border border-purple-500/30 p-1 flex">
              <button
                onClick={() => setViewMode('map')}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-all duration-300 ${
                  viewMode === 'map'
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Map className="w-4 h-4" />
                Map View
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-all duration-300 ${
                  viewMode === 'list'
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <List className="w-4 h-4" />
                List View
              </button>
            </div>
          </div>
        </div>

        {/* Map View */}
        {viewMode === 'map' && (
          <div className="max-w-7xl mx-auto">
            <div className="bg-black/40 backdrop-blur-xl rounded-xl border border-purple-500/30 overflow-hidden">
            {/* Real Leaflet Map */}
            <div
              ref={mapRef}
              key={`map-${viewMode}`}
              className="h-[600px] w-full rounded-xl"
              style={{ minHeight: '600px', position: 'relative', zIndex: 1 }}
            />

            {/* No events message overlay */}
            {filteredEvents.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-xl">
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

          {/* Map Legend and Debug */}
          <div className="mt-6 bg-black/40 backdrop-blur-xl rounded-xl border border-purple-500/30 p-4">
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Map Legend
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    console.log('Manual map refresh triggered');
                    if (!mapInstanceRef.current) {
                      console.log('Map instance missing, reinitializing...');
                      initializeMap();
                    } else {
                      console.log('Map instance exists, updating markers...');
                      updateMapMarkers();
                    }
                  }}
                  className="px-3 py-1 text-xs bg-purple-600/20 hover:bg-purple-600/30 rounded border border-purple-500/30 transition-all"
                >
                  {mapInstanceRef.current ? 'Refresh Markers' : 'Reinit Map'}
                </button>
                <button
                  onClick={() => {
                    console.log('Force map reinitialization');
                    if (mapInstanceRef.current) {
                      mapInstanceRef.current.remove();
                      mapInstanceRef.current = null;
                    }
                    setTimeout(() => {
                      initializeMap();
                    }, 100);
                  }}
                  className="px-3 py-1 text-xs bg-red-600/20 hover:bg-red-600/30 rounded border border-red-500/30 transition-all"
                >
                  Force Reinit
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm mb-3">
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
            <div className="text-xs text-gray-400 border-t border-purple-500/20 pt-3">
              Debug: {filteredEvents.length} events, User location: {userLocation ? 'Found' : 'Not found'}
              {userLocation && ` (${userLocation[0].toFixed(4)}, ${userLocation[1].toFixed(4)})`}
              <br />
              Map instance: {mapInstanceRef.current ? 'Active' : 'Missing'}, View mode: {viewMode}
              <br />
              Kenya events: {filteredEvents.filter(e => e.location.includes('Kenya')).length}
            </div>
          </div>
        </div>
        )}

        {/* List View */}
        {viewMode === 'list' && (
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.map((event) => (
                <div
                  key={event.id}
                  className="bg-black/40 backdrop-blur-xl rounded-xl border border-purple-500/30 overflow-hidden
                    hover:border-purple-400/50 transition-all duration-300 group"
                >
                  <div className="relative">
                    <img
                      src={event.image}
                      alt={event.name}
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute top-3 right-3">
                      <span className="bg-purple-600/90 text-white px-2 py-1 rounded-full text-xs">
                        {event.category}
                      </span>
                    </div>
                    <div className="absolute bottom-3 left-3">
                      <span className="bg-black/70 text-white px-2 py-1 rounded text-xs">
                        {event.available > 0 ? `${event.available} available` : 'Sold Out'}
                      </span>
                    </div>
                  </div>

                  <div className="p-6">
                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-purple-300 transition-colors">
                      {event.name}
                    </h3>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-gray-300">
                        <Calendar className="w-4 h-4" />
                        <span className="text-sm">{event.date}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-300">
                        <MapPin className="w-4 h-4" />
                        <span className="text-sm">{event.location}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-300">
                        <DollarSign className="w-4 h-4" />
                        <span className="text-sm font-semibold text-purple-400">{event.price}</span>
                      </div>
                    </div>

                    <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                      {event.description}
                    </p>

                    <div className="flex gap-2">
                      <a
                        href={`/event/${event.id}/tickets`}
                        className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-lg
                          hover:shadow-lg hover:shadow-purple-500/20 transition-all duration-300 text-center text-sm"
                      >
                        View Tickets
                      </a>
                      {userLocation && (
                        <div className="flex items-center gap-1 text-xs text-gray-400 px-2">
                          <Navigation className="w-3 h-3" />
                          {getDistanceToEvent(event)?.toFixed(1)} km
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredEvents.length === 0 && (
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
            )}
          </div>
        )}
      </section>
    </div>
  );
};

export default TokenizedTicketing;

