import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronDown, 
  ChevronUp, 
  Ticket, 
  Award, 
  Calendar, 
  DollarSign, 
  QrCode,
  MapPin,
  Clock,
  Users,
  Star,
  ExternalLink
} from 'lucide-react';

const Collection = () => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    tickets: true,
    poaps: false,
    attending: false
  });

  // Enhanced mock data for user's collection with more realistic data
  const [userTickets] = useState([
    {
      id: 'TKT-001',
      eventName: 'Blockchain Summit 2025',
      date: '2025-03-15',
      time: '10:00 AM',
      venue: 'Tech Convention Center',
      price: '0.05 ETH',
      seatNumber: 'A-42',
      status: 'active',
      txHash: '0x1234567890abcdef1234567890abcdef12345678',
      image: '/api/placeholder/300/200',
      category: 'Conference',
      organizer: 'Blockchain Foundation'
    },
    {
      id: 'TKT-002',
      eventName: 'NFT Art Gallery Opening',
      date: '2025-04-20',
      time: '7:00 PM',
      venue: 'Digital Arts Museum',
      price: '0.03 ETH',
      seatNumber: 'VIP-12',
      status: 'active',
      txHash: '0x8765432109876543210987654321098765432109',
      image: '/api/placeholder/300/200',
      category: 'Art',
      organizer: 'Digital Arts Collective'
    },
    {
      id: 'TKT-003',
      eventName: 'Web3 Developer Conference',
      date: '2025-05-10',
      time: '9:00 AM',
      venue: 'Innovation Hub',
      price: '0.08 ETH',
      seatNumber: 'B-15',
      status: 'active',
      txHash: '0x9999888877776666555544443333222211110000',
      image: '/api/placeholder/300/200',
      category: 'Technology',
      organizer: 'Web3 Developers Guild'
    },
    {
      id: 'TKT-004',
      eventName: 'DeFi Workshop Series',
      date: '2025-06-05',
      time: '2:00 PM',
      venue: 'Crypto Learning Center',
      price: '0.02 ETH',
      seatNumber: 'C-28',
      status: 'active',
      txHash: '0xaaabbbcccdddeeefffaaabbbcccdddeeefffaaab',
      image: '/api/placeholder/300/200',
      category: 'Workshop',
      organizer: 'DeFi Education Hub'
    }
  ]);

  const [userPOAPs] = useState([
    {
      id: 'POAP-001',
      name: 'ETH Denver 2024 Attendee',
      event: 'ETH Denver 2024',
      date: '2024-02-25',
      description: 'Proof of attendance for ETH Denver 2024',
      image: '/api/placeholder/150/150',
      rarity: 'Common',
      mintNumber: '#1247',
      totalSupply: 5000
    },
    {
      id: 'POAP-002',
      name: 'DeFi Summit Speaker',
      event: 'DeFi Summit 2024',
      date: '2024-06-15',
      description: 'Special POAP for summit speakers',
      image: '/api/placeholder/150/150',
      rarity: 'Rare',
      mintNumber: '#42',
      totalSupply: 150
    },
    {
      id: 'POAP-003',
      name: 'Consensus 2024 VIP',
      event: 'Consensus 2024',
      date: '2024-05-29',
      description: 'Exclusive VIP attendee badge',
      image: '/api/placeholder/150/150',
      rarity: 'Epic',
      mintNumber: '#18',
      totalSupply: 50
    },
    {
      id: 'POAP-004',
      name: 'Web3 Hackathon Winner',
      event: 'Global Web3 Hackathon',
      date: '2024-08-12',
      description: 'First place winner recognition',
      image: '/api/placeholder/150/150',
      rarity: 'Legendary',
      mintNumber: '#3',
      totalSupply: 10
    }
  ]);

  const [attendingBadges] = useState([
    {
      id: 'ATT-001',
      eventName: 'Crypto Meetup NYC',
      date: '2025-09-12',
      time: '6:00 PM',
      location: 'New York City',
      venue: 'Manhattan Tech Hub',
      attendees: 250,
      status: 'confirmed',
      image: '/api/placeholder/200/150',
      category: 'Meetup',
      organizer: 'NYC Crypto Community'
    },
    {
      id: 'ATT-002',
      eventName: 'Solana Hackathon',
      date: '2025-10-05',
      time: '9:00 AM',
      location: 'San Francisco',
      venue: 'Silicon Valley Convention Center',
      attendees: 500,
      status: 'pending',
      image: '/api/placeholder/200/150',
      category: 'Hackathon',
      organizer: 'Solana Foundation'
    },
    {
      id: 'ATT-003',
      eventName: 'Layer 2 Workshop',
      date: '2025-11-18',
      time: '1:00 PM',
      location: 'Austin',
      venue: 'Blockchain Education Center',
      attendees: 150,
      status: 'confirmed',
      image: '/api/placeholder/200/150',
      category: 'Workshop',
      organizer: 'Layer 2 Labs'
    }
  ]);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleResellTicket = (ticket) => {
    // Navigate to resell page with ticket data formatted for the existing resale component
    const resaleTicketData = {
      tokenId: ticket.id,
      occasionId: ticket.id.split('-')[1], // Extract numeric ID
      eventName: ticket.eventName,
      price: ticket.price,
      seatNumber: ticket.seatNumber,
      txHash: ticket.txHash,
      isForSale: false,
      resalePrice: 0
    };
    navigate('/resell', { state: { selectedTicket: resaleTicketData } });
  };

  const handleVerifyTicket = (ticket) => {
    // Navigate to QR code verification page with ticket data formatted for verification
    const verificationData = {
      id: ticket.id,
      event: ticket.eventName,
      date: ticket.date,
      venue: ticket.venue,
      price: ticket.price,
      txHash: ticket.txHash
    };
    navigate('/qrcode', { state: { selectedTicket: verificationData } });
  };

  const getRarityColor = (rarity) => {
    switch (rarity) {
      case 'Rare': return 'text-purple-400';
      case 'Epic': return 'text-blue-400';
      case 'Legendary': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-blue-900/20">
      <div className="relative pt-24 pb-16 px-4 sm:px-6">
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-6xl mx-auto">
          {/* Header */}
          <div className={`text-center mb-12 transition-all duration-1000
            ${isVisible ? 'translate-y-0 opacity-100' : '-translate-y-20 opacity-0'}`}>
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                My Collection
              </span>
            </h1>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              Manage your tickets, POAPs, and event attendance badges all in one place
            </p>
          </div>

          {/* Collection Sections */}
          <div className="space-y-6">
            {/* Tickets Section */}
            <div className={`bg-gray-900/50 backdrop-blur-xl rounded-2xl border border-purple-500/30 overflow-hidden
              transition-all duration-700 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}>
              <button
                onClick={() => toggleSection('tickets')}
                className="w-full flex items-center justify-between p-6 hover:bg-purple-500/10 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-500/20 rounded-xl">
                    <Ticket className="w-6 h-6 text-purple-400" />
                  </div>
                  <div className="text-left">
                    <h2 className="text-2xl font-bold text-white">My Tickets</h2>
                    <p className="text-gray-400">{userTickets.length} active tickets</p>
                  </div>
                </div>
                {expandedSections.tickets ? 
                  <ChevronUp className="w-6 h-6 text-gray-400" /> : 
                  <ChevronDown className="w-6 h-6 text-gray-400" />
                }
              </button>

              {expandedSections.tickets && (
                <div className="px-6 pb-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {userTickets.map((ticket, index) => (
                      <div
                        key={ticket.id}
                        className="group bg-gradient-to-br from-purple-900/30 to-blue-900/30 rounded-xl p-6 border border-purple-500/20 hover:border-purple-500/40 transition-all duration-300 hover:scale-105"
                      >
                        <div className="aspect-video bg-gray-800 rounded-lg mb-4 overflow-hidden">
                          <img 
                            src={ticket.image} 
                            alt={ticket.eventName}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        </div>
                        
                        <div className="space-y-3">
                          <h3 className="font-bold text-lg text-white line-clamp-2">{ticket.eventName}</h3>
                          
                          <div className="space-y-2 text-sm text-gray-400">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-purple-400" />
                              <span>{ticket.date} at {ticket.time}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-blue-400" />
                              <span>{ticket.venue}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <DollarSign className="w-4 h-4 text-green-400" />
                              <span>{ticket.price}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Ticket className="w-4 h-4 text-orange-400" />
                              <span>Seat {ticket.seatNumber}</span>
                            </div>
                          </div>

                          <div className="flex gap-2 pt-4">
                            <button
                              onClick={() => handleResellTicket(ticket)}
                              className="flex-1 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 rounded-lg text-white text-sm font-medium transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-green-500/25 flex items-center justify-center gap-2"
                            >
                              <DollarSign className="w-4 h-4" />
                              Resell
                            </button>
                            <button
                              onClick={() => handleVerifyTicket(ticket)}
                              className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 rounded-lg text-white text-sm font-medium transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-purple-500/25 flex items-center justify-center gap-2"
                            >
                              <QrCode className="w-4 h-4" />
                              Verify
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* POAPs Section */}
            <div className={`bg-gray-900/50 backdrop-blur-xl rounded-2xl border border-orange-500/30 overflow-hidden
              transition-all duration-700 delay-200 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}>
              <button
                onClick={() => toggleSection('poaps')}
                className="w-full flex items-center justify-between p-6 hover:bg-orange-500/10 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-orange-500/20 rounded-xl">
                    <Award className="w-6 h-6 text-orange-400" />
                  </div>
                  <div className="text-left">
                    <h2 className="text-2xl font-bold text-white">My POAPs</h2>
                    <p className="text-gray-400">{userPOAPs.length} proof of attendance badges</p>
                  </div>
                </div>
                {expandedSections.poaps ? 
                  <ChevronUp className="w-6 h-6 text-gray-400" /> : 
                  <ChevronDown className="w-6 h-6 text-gray-400" />
                }
              </button>

              {expandedSections.poaps && (
                <div className="px-6 pb-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {userPOAPs.map((poap, index) => (
                      <div
                        key={poap.id}
                        className="group bg-gradient-to-br from-orange-900/30 to-yellow-900/30 rounded-xl p-6 border border-orange-500/20 hover:border-orange-500/40 transition-all duration-300 hover:scale-105"
                      >
                        <div className="aspect-square bg-gray-800 rounded-lg mb-4 overflow-hidden">
                          <img 
                            src={poap.image} 
                            alt={poap.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <h3 className="font-bold text-white line-clamp-2">{poap.name}</h3>
                          <p className="text-sm text-gray-400">{poap.event}</p>
                          <p className="text-xs text-gray-500">{poap.date}</p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Star className="w-4 h-4 text-yellow-400" />
                              <span className={`text-sm ${getRarityColor(poap.rarity)}`}>{poap.rarity}</span>
                            </div>
                            <span className="text-xs text-gray-500">{poap.mintNumber}</span>
                          </div>
                          <div className="text-xs text-gray-500">
                            Supply: {poap.totalSupply.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* I Am Attending Section */}
            <div className={`bg-gray-900/50 backdrop-blur-xl rounded-2xl border border-blue-500/30 overflow-hidden
              transition-all duration-700 delay-400 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}>
              <button
                onClick={() => toggleSection('attending')}
                className="w-full flex items-center justify-between p-6 hover:bg-blue-500/10 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-500/20 rounded-xl">
                    <Users className="w-6 h-6 text-blue-400" />
                  </div>
                  <div className="text-left">
                    <h2 className="text-2xl font-bold text-white">I Am Attending</h2>
                    <p className="text-gray-400">{attendingBadges.length} upcoming events</p>
                  </div>
                </div>
                {expandedSections.attending ? 
                  <ChevronUp className="w-6 h-6 text-gray-400" /> : 
                  <ChevronDown className="w-6 h-6 text-gray-400" />
                }
              </button>

              {expandedSections.attending && (
                <div className="px-6 pb-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {attendingBadges.map((badge, index) => (
                      <div
                        key={badge.id}
                        className="group bg-gradient-to-br from-blue-900/30 to-cyan-900/30 rounded-xl p-6 border border-blue-500/20 hover:border-blue-500/40 transition-all duration-300 hover:scale-105"
                      >
                        <div className="flex gap-4">
                          <div className="w-20 h-20 bg-gray-800 rounded-lg overflow-hidden flex-shrink-0">
                            <img 
                              src={badge.image} 
                              alt={badge.eventName}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                          </div>
                          
                          <div className="flex-1 space-y-2">
                            <h3 className="font-bold text-white">{badge.eventName}</h3>
                            <div className="space-y-1 text-sm text-gray-400">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-blue-400" />
                                <span>{badge.date} at {badge.time}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-green-400" />
                                <span>{badge.venue}, {badge.location}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-purple-400" />
                                <span>{badge.attendees.toLocaleString()} attending</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-orange-400" />
                                <span>{badge.category}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                badge.status === 'confirmed' 
                                  ? 'bg-green-500/20 text-green-400' 
                                  : 'bg-yellow-500/20 text-yellow-400'
                              }`}>
                                {badge.status}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Collection;
