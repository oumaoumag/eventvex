import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Users, Clock, Star, ArrowLeft, ShoppingCart, Tag, User } from 'lucide-react';

const EventTicketListing = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [selectedTicketType, setSelectedTicketType] = useState('all');
  const [sortBy, setSortBy] = useState('price-low');
  const [loading, setLoading] = useState(true);

  // Sample events data (in a real app, this would come from an API)
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
      image: "/src/assets/summit.png",
      tickets: {
        original: [
          { id: "orig-1-1", seatNumber: "A1", price: 0.5, available: true, type: "VIP" },
          { id: "orig-1-2", seatNumber: "A2", price: 0.5, available: true, type: "VIP" },
          { id: "orig-1-3", seatNumber: "B1", price: 0.3, available: true, type: "General" },
          { id: "orig-1-4", seatNumber: "B2", price: 0.3, available: true, type: "General" },
          { id: "orig-1-5", seatNumber: "C1", price: 0.2, available: true, type: "Standard" }
        ],
        resale: [
          { id: "resale-1-1", seatNumber: "A3", originalPrice: 0.5, resalePrice: 0.7, seller: "0x1234...5678", type: "VIP" },
          { id: "resale-1-2", seatNumber: "B3", originalPrice: 0.3, resalePrice: 0.4, seller: "0x8765...4321", type: "General" }
        ]
      }
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
      image: "/src/assets/dr.png",
      tickets: {
        original: [
          { id: "orig-2-1", seatNumber: "VIP-1", price: 1.2, available: true, type: "VIP" },
          { id: "orig-2-2", seatNumber: "VIP-2", price: 1.2, available: true, type: "VIP" },
          { id: "orig-2-3", seatNumber: "GA-1", price: 0.8, available: true, type: "General Admission" },
          { id: "orig-2-4", seatNumber: "GA-2", price: 0.8, available: true, type: "General Admission" }
        ],
        resale: [
          { id: "resale-2-1", seatNumber: "VIP-3", originalPrice: 1.2, resalePrice: 1.5, seller: "0x2468...1357", type: "VIP" },
          { id: "resale-2-2", seatNumber: "GA-3", originalPrice: 0.8, resalePrice: 1.0, seller: "0x1357...2468", type: "General Admission" },
          { id: "resale-2-3", seatNumber: "VIP-4", originalPrice: 1.2, resalePrice: 1.8, seller: "0x9876...5432", type: "VIP" }
        ]
      }
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
      tickets: {
        original: [
          { id: "orig-3-1", seatNumber: "Premium-1", price: 0.8, available: true, type: "Premium" },
          { id: "orig-3-2", seatNumber: "Premium-2", price: 0.8, available: true, type: "Premium" },
          { id: "orig-3-3", seatNumber: "Standard-1", price: 0.5, available: true, type: "Standard" },
          { id: "orig-3-4", seatNumber: "Standard-2", price: 0.5, available: true, type: "Standard" },
          { id: "orig-3-5", seatNumber: "Student-1", price: 0.3, available: true, type: "Student" }
        ],
        resale: [
          { id: "resale-3-1", seatNumber: "Premium-3", originalPrice: 0.8, resalePrice: 1.0, seller: "0x3456...7890", type: "Premium" },
          { id: "resale-3-2", seatNumber: "Standard-3", originalPrice: 0.5, resalePrice: 0.6, seller: "0x7890...3456", type: "Standard" }
        ]
      }
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
      image: "/src/assets/summit.png",
      tickets: {
        original: [
          { id: "orig-4-1", seatNumber: "Front-1", price: 0.3, available: true, type: "Front Row" },
          { id: "orig-4-2", seatNumber: "Front-2", price: 0.3, available: true, type: "Front Row" },
          { id: "orig-4-3", seatNumber: "Mid-1", price: 0.2, available: true, type: "Middle" },
          { id: "orig-4-4", seatNumber: "Back-1", price: 0.1, available: true, type: "Back" }
        ],
        resale: [
          { id: "resale-4-1", seatNumber: "Front-3", originalPrice: 0.3, resalePrice: 0.35, seller: "0x4567...8901", type: "Front Row" }
        ]
      }
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
      image: "/src/assets/dr.png",
      tickets: {
        original: [
          { id: "orig-5-1", seatNumber: "VR-1", price: 0.9, available: true, type: "VR Experience" },
          { id: "orig-5-2", seatNumber: "VR-2", price: 0.9, available: true, type: "VR Experience" },
          { id: "orig-5-3", seatNumber: "GA-1", price: 0.6, available: true, type: "General" },
          { id: "orig-5-4", seatNumber: "GA-2", price: 0.6, available: true, type: "General" }
        ],
        resale: [
          { id: "resale-5-1", seatNumber: "VR-3", originalPrice: 0.9, resalePrice: 1.1, seller: "0x5678...9012", type: "VR Experience" }
        ]
      }
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
      image: "/src/assets/im.png",
      tickets: {
        original: [
          { id: "orig-6-1", seatNumber: "Court-1", price: 0.6, available: true, type: "Courtside" },
          { id: "orig-6-2", seatNumber: "Court-2", price: 0.6, available: true, type: "Courtside" },
          { id: "orig-6-3", seatNumber: "Box-1", price: 0.4, available: true, type: "Box Seat" },
          { id: "orig-6-4", seatNumber: "Gen-1", price: 0.2, available: true, type: "General" }
        ],
        resale: [
          { id: "resale-6-1", seatNumber: "Court-3", originalPrice: 0.6, resalePrice: 0.8, seller: "0x6789...0123", type: "Courtside" },
          { id: "resale-6-2", seatNumber: "Box-2", originalPrice: 0.4, resalePrice: 0.5, seller: "0x7890...1234", type: "Box Seat" }
        ]
      }
    }
  ];

  useEffect(() => {
    // Simulate loading and find the event
    const foundEvent = sampleEvents.find(e => e.id === parseInt(eventId));
    setEvent(foundEvent);
    setLoading(false);
  }, [eventId]);

  const getAllTickets = () => {
    if (!event) return [];
    
    const originalTickets = event.tickets.original.map(ticket => ({
      ...ticket,
      isResale: false,
      finalPrice: ticket.price
    }));
    
    const resaleTickets = event.tickets.resale.map(ticket => ({
      ...ticket,
      isResale: true,
      finalPrice: ticket.resalePrice
    }));
    
    return [...originalTickets, ...resaleTickets];
  };

  const getFilteredAndSortedTickets = () => {
    let tickets = getAllTickets();
    
    // Filter by ticket type
    if (selectedTicketType !== 'all') {
      if (selectedTicketType === 'original') {
        tickets = tickets.filter(ticket => !ticket.isResale);
      } else if (selectedTicketType === 'resale') {
        tickets = tickets.filter(ticket => ticket.isResale);
      }
    }
    
    // Sort tickets
    switch (sortBy) {
      case 'price-low':
        tickets.sort((a, b) => a.finalPrice - b.finalPrice);
        break;
      case 'price-high':
        tickets.sort((a, b) => b.finalPrice - a.finalPrice);
        break;
      case 'type':
        tickets.sort((a, b) => a.type.localeCompare(b.type));
        break;
      default:
        break;
    }
    
    return tickets;
  };

  const handleTicketPurchase = (ticket) => {
    // Navigate to purchase page with ticket details
    navigate(`/ticket-purchase`, { 
      state: { 
        event: event,
        ticket: ticket
      }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading event details...</div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Event not found</div>
      </div>
    );
  }

  const filteredTickets = getFilteredAndSortedTickets();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Events
          </button>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Event Info */}
            <div className="lg:col-span-2">
              <div className="bg-black/40 backdrop-blur-xl rounded-2xl border border-purple-500/30 p-8">
                <div className="flex items-start gap-6">
                  <img 
                    src={event.image} 
                    alt={event.name}
                    className="w-24 h-24 rounded-xl object-cover"
                  />
                  <div className="flex-1">
                    <h1 className="text-3xl font-bold text-white mb-2">{event.name}</h1>
                    <p className="text-gray-300 mb-4">{event.description}</p>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2 text-gray-300">
                        <Calendar className="w-4 h-4" />
                        {event.date}
                      </div>
                      <div className="flex items-center gap-2 text-gray-300">
                        <MapPin className="w-4 h-4" />
                        {event.location}
                      </div>
                      <div className="flex items-center gap-2 text-gray-300">
                        <Users className="w-4 h-4" />
                        {event.available} / {event.total} available
                      </div>
                      <div className="flex items-center gap-2 text-gray-300">
                        <Tag className="w-4 h-4" />
                        {event.category}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Quick Stats */}
            <div className="bg-black/40 backdrop-blur-xl rounded-2xl border border-purple-500/30 p-6">
              <h3 className="text-xl font-semibold text-white mb-4">Ticket Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">Original Tickets</span>
                  <span className="text-white">{event.tickets.original.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">Resale Tickets</span>
                  <span className="text-white">{event.tickets.resale.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">Starting Price</span>
                  <span className="text-purple-400 font-semibold">{Math.min(...getAllTickets().map(t => t.finalPrice))} ETH</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Tickets */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Filter Controls */}
        <div className="bg-black/40 backdrop-blur-xl rounded-2xl border border-purple-500/30 p-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Filter by Type</label>
                <select
                  value={selectedTicketType}
                  onChange={(e) => setSelectedTicketType(e.target.value)}
                  className="px-4 py-2 bg-black/60 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:border-purple-500/50"
                >
                  <option value="all">All Tickets</option>
                  <option value="original">Original Tickets</option>
                  <option value="resale">Resale Tickets</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Sort by</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-2 bg-black/60 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:border-purple-500/50"
                >
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="type">Ticket Type</option>
                </select>
              </div>
            </div>

            <div className="text-sm text-gray-300">
              Showing {filteredTickets.length} tickets
            </div>
          </div>
        </div>

        {/* Tickets Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTickets.map((ticket) => (
            <div
              key={ticket.id}
              className="bg-black/40 backdrop-blur-xl rounded-2xl border border-purple-500/30 p-6 hover:border-purple-500/50 transition-all duration-300 group"
            >
              {/* Ticket Header */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold text-white">{ticket.type}</h3>
                    {ticket.isResale && (
                      <span className="px-2 py-1 bg-orange-500/20 text-orange-300 text-xs rounded-full">
                        Resale
                      </span>
                    )}
                    {!ticket.isResale && (
                      <span className="px-2 py-1 bg-green-500/20 text-green-300 text-xs rounded-full">
                        Original
                      </span>
                    )}
                  </div>
                  <p className="text-gray-400 text-sm">Seat: {ticket.seatNumber}</p>
                </div>

                <div className="text-right">
                  <div className="text-2xl font-bold text-purple-400">
                    {ticket.finalPrice} ETH
                  </div>
                  {ticket.isResale && (
                    <div className="text-xs text-gray-400">
                      Original: {ticket.originalPrice} ETH
                    </div>
                  )}
                </div>
              </div>

              {/* Resale Info */}
              {ticket.isResale && (
                <div className="flex items-center gap-2 mb-4 p-3 bg-orange-500/10 rounded-lg">
                  <User className="w-4 h-4 text-orange-300" />
                  <span className="text-sm text-orange-300">
                    Sold by: {ticket.seller}
                  </span>
                </div>
              )}

              {/* Purchase Button */}
              <button
                onClick={() => handleTicketPurchase(ticket)}
                className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg
                  hover:from-purple-700 hover:to-blue-700 transition-all duration-300
                  group-hover:shadow-lg group-hover:shadow-purple-500/20 flex items-center justify-center gap-2"
              >
                <ShoppingCart className="w-4 h-4" />
                Purchase Ticket
              </button>
            </div>
          ))}
        </div>

        {/* No tickets message */}
        {filteredTickets.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg mb-4">No tickets found matching your criteria</div>
            <button
              onClick={() => {
                setSelectedTicketType('all');
                setSortBy('price-low');
              }}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:shadow-lg transition-all"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventTicketListing;
