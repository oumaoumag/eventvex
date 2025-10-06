import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Wallet, ImageIcon, Sparkles, ChevronRight, Plus, MinusCircle, Loader, AlertCircle, Calendar, MapPin, Users, Tag } from 'lucide-react';
import { 
  BASE_MAINNET_PARAMS, 
  BASE_SEPOLIA_PARAMS, 
  switchNetwork,
  getCurrentNetwork
} from '../utils/walletUtils';

// Choose the appropriate network (Base Mainnet as default)
const NETWORK_PARAMS = BASE_MAINNET_PARAMS;

// Use environment variable for contract address
const CONTRACT_ADDRESS = import.meta.env.VITE_EVENT_FACTORY_ADDRESS || "0x4f0fcF4af03569d543d1988d80d358DC40aBd56c";
const CONTRACT_ABI = [
  "function mint(uint256 quantity) public payable",
  "function totalSupply() public view returns (uint256)",
  "function maxSupply() public view returns (uint256)",
  "function balanceOf(address owner) public view returns (uint256)"
];

const Ticket = () => {
  // UI States
  const [isVisible, setIsVisible] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [selectedPreview, setSelectedPreview] = useState(0);

  // Wallet & Contract States
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [mintCount, setMintCount] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // NFT States
  const [totalMinted, setTotalMinted] = useState(0);
  const [maxSupply, setMaxSupply] = useState(10000);
  const [userBalance, setUserBalance] = useState(0);
  
  // Tickets States
  const [tickets, setTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const PRICE_PER_NFT = 0.005; // ETH for Base network

  const previewImages = [
    "/src/assets/summit.png",
    "/src/assets/chairstables.jpg",
    "/src/assets/rb.png",
    "/src/assets/rb2.png",
    "/src/assets/ast.png",
    "/src/assets/rb1.png",
    "/src/assets/im.png"
  ];
  
  const categories = ['all', 'Technology', 'Music', 'Art', 'Finance', 'Gaming', 'Sports', 'Education', 'Business'];

  useEffect(() => {
    setIsVisible(true);
    checkWalletConnection();
    loadTickets();
    
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', () => window.location.reload());
    }
    
    // Listen for new events created
    const handleEventCreated = () => {
      loadTickets();
    };
    
    window.addEventListener('eventCreated', handleEventCreated);

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      }
      window.removeEventListener('eventCreated', handleEventCreated);
    };
  }, []);

  useEffect(() => {
    if (isWalletConnected) {
      updateContractInfo();
    }
  }, [isWalletConnected]);

  const handleAccountsChanged = (accounts) => {
    if (accounts.length === 0) {
      // User disconnected wallet
      setIsWalletConnected(false);
      setWalletAddress('');
    } else {
      // User switched accounts
      setWalletAddress(accounts[0]);
    }
  };

  const checkWalletConnection = async () => {
    if (typeof window.ethereum !== "undefined") {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
          setIsWalletConnected(true);
        }
      } catch (error) {
        console.error("Error checking wallet connection:", error);
      }
    }
  };

  const updateContractInfo = async () => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

      console.log("Fetching contract info...");

      const supply = await contract.totalSupply().catch(e => {
        console.error("Error fetching totalSupply:", e);
        return "N/A";
      });
      const max = await contract.maxSupply().catch(e => {
        console.error("Error fetching maxSupply:", e);
        return "N/A";
      });
      const balance = await contract.balanceOf(walletAddress).catch(e => {
        console.error("Error fetching balanceOf:", e);
        return "N/A";
      });

      console.log("Contract info fetched:", { supply, max, balance });

      setTotalMinted(supply === "N/A" ? 0 : Number(supply));
      setMaxSupply(max === "N/A" ? 10000 : Number(max));
      setUserBalance(balance === "N/A" ? 0 : Number(balance));
    } catch (error) {
      console.error("Error updating contract info:", error);
      setError("Failed to fetch contract information. Please check your connection and try again.");
    }
  };

  const connectWallet = async () => {
    if (typeof window.ethereum === "undefined") {
      setError("Please install MetaMask to connect your wallet!");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Request account access and switch to desired network using the imported function
      try {
        await switchNetwork(NETWORK_PARAMS);
      } catch (switchError) {
        console.warn("Network switch error:", switchError);
        // Continue connecting even if network switch fails
      }

      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      if (accounts.length > 0) {
        setWalletAddress(accounts[0]);
        setIsWalletConnected(true);
      }
    } catch (error) {
      console.error("Error connecting wallet:", error);
      setError("Failed to connect wallet. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const checkBalance = async (requiredAmount) => {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const balance = await provider.getBalance(walletAddress);
    return balance >= requiredAmount;
  };

  const handleMint = async () => {
    if (!isWalletConnected) {
      await connectWallet();
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      // Calculate price in wei
      const priceInEth = (PRICE_PER_NFT * mintCount).toString();
      const priceInWei = ethers.parseEther(priceInEth);

      // Check user's balance
      const hasEnoughBalance = await checkBalance(priceInWei);
      if (!hasEnoughBalance) {
        throw new Error("Insufficient funds to complete the transaction.");
      }

      // Estimate gas to check if transaction will fail
      const estimatedGas = await contract.mint.estimateGas(mintCount, { value: priceInWei });

      // Add 10% buffer to estimated gas
      const gasLimit = estimatedGas * BigInt(110) / BigInt(100);

      // Execute transaction
      const tx = await contract.mint(mintCount, {
        value: priceInWei,
        gasLimit: gasLimit
      });

      // Wait for confirmation
      await tx.wait();

      // Update contract info
      await updateContractInfo();

      // Show success message
      alert(`Successfully minted ${mintCount} NFT${mintCount > 1 ? 's' : ''}!`);
    } catch (error) {
      console.error("Error minting NFT:", error);
      setError(error.message || "Failed to mint NFT. Please check your balance and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const formatAddress = (address) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };
  
  const loadTickets = async () => {
    try {
      setLoadingTickets(true);
      const { default: hybridDB } = await import('../database/HybridDB.js');
      
      if (!hybridDB.isInitialized) {
        await hybridDB.initialize();
      }
      
      const ticketData = await hybridDB.getAllTickets({
        category: selectedCategory === 'all' ? null : selectedCategory,
        search: searchQuery || null,
        limit: 50
      });
      
      setTickets(ticketData || []);
    } catch (error) {
      console.error('Failed to load tickets:', error);
      setTickets([]);
    } finally {
      setLoadingTickets(false);
    }
  };
  
  useEffect(() => {
    loadTickets();
  }, [selectedCategory, searchQuery]);
  
  const formatDate = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const formatPrice = (price) => {
    try {
      return `${parseFloat(price).toFixed(3)} ETH`;
    } catch {
      return '0.000 ETH';
    }
  };
  
  const handleTicketPurchase = (ticket) => {
    // Navigate to ticket purchase page or handle purchase logic
    console.log('Purchasing ticket:', ticket);
    // You can implement the actual purchase logic here
    alert(`Purchasing ticket for ${ticket.event_title}`);
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 opacity-20">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-pulse"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              width: `${Math.random() * 300}px`,
              height: `${Math.random() * 300}px`,
              background: 'radial-gradient(circle, rgba(147,51,234,0.3) 0%, rgba(0,0,0,0) 70%)',
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${5 + Math.random() * 5}s`
            }}
          />
        ))}
      </div>

      {/* Main Content */}
      <main className="relative pt-12 sm:pt-16 md:pt-20 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          {/* Title Section */}
          <div className={`text-center mb-8 sm:mb-12 md:mb-16 transition-all duration-1000
            ${isVisible ? 'translate-y-0 opacity-100' : '-translate-y-20 opacity-0'}`}>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6">
              <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                Event Tickets Collection
              </span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-gray-400 max-w-xs sm:max-w-lg md:max-w-2xl mx-auto">
              Discover and purchase tickets for amazing events. Each ticket is a unique digital asset stored securely on the blockchain.
            </p>
          </div>
          
          {/* Filters */}
          <div className={`mb-8 transition-all duration-1000 delay-200
            ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}>
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              {/* Search */}
              <div className="w-full sm:w-auto">
                <input
                  type="text"
                  placeholder="Search events..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full sm:w-80 px-4 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              
              {/* Category Filter */}
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                      selectedCategory === category
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'
                    }`}
                  >
                    {category === 'all' ? 'All Categories' : category}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Tickets Grid */}
          {loadingTickets ? (
            <div className="flex justify-center items-center py-20">
              <Loader className="w-8 h-8 animate-spin text-purple-400" />
              <span className="ml-3 text-gray-400">Loading tickets...</span>
            </div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">🎫</div>
              <h3 className="text-2xl font-bold text-gray-300 mb-2">No Tickets Available</h3>
              <p className="text-gray-400 mb-6">Create an event to see tickets here!</p>
              <a
                href="/create"
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:opacity-90 transition-opacity"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create Event
              </a>
            </div>
          ) : (
            <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 transition-all duration-1000 delay-300
              ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}>
              {tickets.map((ticket, index) => (
                <div
                  key={ticket.id || index}
                  className="bg-gray-900/50 backdrop-blur-xl rounded-xl border border-purple-500/30 overflow-hidden group hover:border-purple-400/50 transition-all duration-300 transform hover:scale-105"
                >
                  {/* Ticket Image */}
                  <div className="relative aspect-video overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-blue-500/20 group-hover:opacity-70 transition-opacity duration-300" />
                    <img
                      src={ticket.image_url || ticket.cover_image || '/src/assets/tig.png'}
                      alt={ticket.event_title}
                      className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                      onError={(e) => {
                        e.target.src = '/src/assets/tig.png';
                      }}
                    />
                    
                    {/* Category Badge */}
                    <div className="absolute top-3 left-3">
                      <span className="px-2 py-1 bg-purple-600/80 backdrop-blur-sm text-white text-xs rounded-full">
                        {ticket.category || 'Technology'}
                      </span>
                    </div>
                    
                    {/* Price Badge */}
                    <div className="absolute top-3 right-3">
                      <span className="px-2 py-1 bg-black/80 backdrop-blur-sm text-white text-xs rounded-full font-bold">
                        {formatPrice(ticket.ticket_price)}
                      </span>
                    </div>
                  </div>
                  
                  {/* Ticket Content */}
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-white mb-2 line-clamp-2">
                      {ticket.event_title}
                    </h3>
                    
                    {ticket.description && (
                      <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                        {ticket.description}
                      </p>
                    )}
                    
                    {/* Event Details */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-gray-300 text-sm">
                        <Calendar className="w-4 h-4 mr-2 text-purple-400" />
                        <span>{formatDate(ticket.event_date)}</span>
                      </div>
                      
                      {ticket.location && (
                        <div className="flex items-center text-gray-300 text-sm">
                          <MapPin className="w-4 h-4 mr-2 text-purple-400" />
                          <span className="truncate">{ticket.location}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center text-gray-300 text-sm">
                        <Users className="w-4 h-4 mr-2 text-purple-400" />
                        <span>{ticket.max_tickets} tickets available</span>
                      </div>
                    </div>
                    
                    {/* Purchase Button */}
                    <button
                      onClick={() => handleTicketPurchase(ticket)}
                      className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:opacity-90 transition-all duration-300 transform hover:scale-105 flex items-center justify-center space-x-2"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Purchase Ticket</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Collection Stats */}
      <section className="mt-12 sm:mt-16 md:mt-20 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {[
            { label: "Available Tickets", value: tickets.length.toString() },
            { label: "Categories", value: new Set(tickets.map(t => t.category)).size.toString() },
            { label: "Avg Price", value: tickets.length > 0 ? `${(tickets.reduce((sum, t) => sum + parseFloat(t.ticket_price || 0), 0) / tickets.length).toFixed(3)} ETH` : "0.000 ETH" },
            { label: "Total Events", value: new Set(tickets.map(t => t.event_id)).size.toString() }
          ].map((stat, index) => (
            <div
              key={index}
              className={`bg-gray-900/50 backdrop-blur-xl rounded-xl border border-purple-500/30 p-4 sm:p-6
                transform hover:scale-105 transition-all duration-300 cursor-pointer
                ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}
              style={{ transitionDelay: `${800 + index * 100}ms` }}
            >
              <div className="text-sm sm:text-base text-gray-400 mb-1 sm:mb-2">{stat.label}</div>
              <div className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400
                bg-clip-text text-transparent">
                {stat.value}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Ticket;

