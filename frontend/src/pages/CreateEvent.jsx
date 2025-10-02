import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { ChevronDown, ChevronUp, Ticket, Award, Users, Calendar, MapPin, DollarSign, Hash } from 'lucide-react';
import { createEvent, validateContractConfig } from '../utils/contractIntegration.js';
import { connectWallet, checkWalletConnection } from '../utils/walletUtils.js';

const CreateEvent = () => {
  const [account, setAccount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [contractConfigValid, setContractConfigValid] = useState(false);

  // Collapsible sections state
  const [expandedSections, setExpandedSections] = useState({
    tickets: true, // Tickets section is expanded by default (mandatory)
    poaps: false,
    badges: false
  });

  // Event data state
  const [eventData, setEventData] = useState({
    name: '',
    description: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    timezone: 'GMT+03:00',
    location: '',
    isVirtual: false,
    virtualLink: '',
    ticketPrice: '',
    totalTickets: '',
    capacity: 'unlimited',
    requireApproval: false,
    category: 'Technology',
    tags: '',
    coverImage: '',
    hostName: '',
    hostEmail: '',
    hostBio: '',
    eventWebsite: '',
    socialLinks: {
      twitter: '',
      linkedin: '',
      instagram: ''
    }
  });

  // POAP data state
  const [poapData, setPoapData] = useState({
    enabled: false,
    name: '',
    description: '',
    image: '',
    eventUrl: '',
    city: '',
    country: '',
    startDate: '',
    endDate: '',
    expiryDate: ''
  });

  // Badge data state
  const [badgeData, setBadgeData] = useState({
    enabled: false,
    name: '',
    description: '',
    image: '',
    criteria: '',
    validUntil: ''
  });

  useEffect(() => {
    const init = async () => {
      try {
        // Check if wallet is already connected
        const connectedAddress = await checkWalletConnection();
        if (connectedAddress) {
          setAccount(connectedAddress);
        }

        // Validate contract configuration
        const isValid = await validateContractConfig();
        setContractConfigValid(isValid);

        // Listen for account changes
        if (window.ethereum) {
          window.ethereum.on('accountsChanged', (accounts) => {
            setAccount(accounts.length > 0 ? accounts[0] : '');
          });
        }
      } catch (error) {
        console.error('Error initializing:', error);
        setContractConfigValid(false);
      }
    };
    init();

    // Cleanup event listeners
    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners('accountsChanged');
      }
    };
  }, []);

  // Toggle section expansion
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Handle event data changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setEventData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle POAP data changes
  const handlePoapChange = (e) => {
    const { name, value, type, checked } = e.target;
    setPoapData({
      ...poapData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  // Handle badge data changes
  const handleBadgeChange = (e) => {
    const { name, value, type, checked } = e.target;
    setBadgeData({
      ...badgeData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!account) {
      alert("Please connect your wallet first!");
      return;
    }

    if (!contractConfigValid) {
      alert("Smart contract configuration is invalid. Please check environment settings.");
      return;
    }

    setIsLoading(true);

    try {
      // Create event using the new smart contract integration
      const result = await createEvent({
        name: eventData.name,
        title: eventData.name,
        description: eventData.description,
        date: eventData.startDate,
        venue: eventData.isVirtual ? eventData.virtualLink : eventData.location,
        location: eventData.isVirtual ? eventData.virtualLink : eventData.location,
        ticketPrice: eventData.ticketPrice,
        totalTickets: eventData.capacity === 'unlimited' ? 10000 : eventData.totalTickets,
        maxTickets: eventData.capacity === 'unlimited' ? 10000 : eventData.totalTickets
      });

      console.log('Event created successfully:', result);

      // If POAP is enabled, create POAP (simulated for now)
      if (poapData.enabled) {
        console.log('Creating POAP with data:', poapData);
        // In a real implementation, this would call POAP API
        // await createPOAP(poapData);
      }

      // If badges are enabled, create badges (simulated for now)
      if (badgeData.enabled) {
        console.log('Creating attendance badge with data:', badgeData);
        // In a real implementation, this would call badge creation contract
        // await createAttendanceBadge(badgeData);
      }

      alert(`Event created successfully! Event ID: ${result.eventId}. Contract: ${result.eventContract}. ${poapData.enabled ? 'POAP ' : ''}${badgeData.enabled ? 'and attendance badges ' : ''}${(poapData.enabled || badgeData.enabled) ? 'will be available for attendees.' : ''}`);

      // Update hybrid database and notify components
      try {
        const { default: hybridDB } = await import('../database/HybridDB.js');
        if (hybridDB.isInitialized) {
          await hybridDB.upsertEvent({
            eventId: result.eventId,
            eventContract: result.eventContract,
            organizer: account,
            title: eventData.name,
            eventDate: Math.floor(new Date(eventData.date).getTime() / 1000),
            ticketPrice: ethers.parseEther(eventData.ticketPrice.toString()),
            maxTickets: parseInt(eventData.totalTickets),
            isActive: true,
            createdAt: Math.floor(Date.now() / 1000)
          });
        }
      } catch (dbError) {
        console.warn('Failed to update hybrid database:', dbError);
      }
      
      // Dispatch custom event to notify other components
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('eventCreated', { 
          detail: { eventId: result.eventId, eventContract: result.eventContract } 
        }));
        console.log('Event creation notification dispatched');
      }, 1000);
      
      // Optional: Navigate to events page or refresh
      // window.location.reload(); // Uncomment if you prefer full page refresh

      // Reset all forms
      setEventData({
        name: '', description: '', startDate: '', startTime: '', endDate: '', endTime: '',
        timezone: 'GMT+03:00', location: '', isVirtual: false, virtualLink: '',
        ticketPrice: '', totalTickets: '', capacity: 'unlimited', requireApproval: false,
        category: 'Technology', tags: '', coverImage: '', hostName: '', hostEmail: '',
        hostBio: '', eventWebsite: '', socialLinks: { twitter: '', linkedin: '', instagram: '' }
      });
      setPoapData({ enabled: false, name: '', description: '', image: '', eventUrl: '', city: '', country: '', startDate: '', endDate: '', expiryDate: '' });
      setBadgeData({ enabled: false, name: '', description: '', image: '', criteria: '', validUntil: '' });

    } catch (error) {
      console.error('Error creating event:', error);
      alert(`Failed to create the event: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Connect wallet function
  const handleConnectWallet = async () => {
    try {
      const { address } = await connectWallet();
      setAccount(address);
    } catch (error) {
      console.error('Error connecting wallet:', error);
      alert(`Failed to connect wallet: ${error.message}`);
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white pt-24 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto p-6 bg-gray-800/50 backdrop-blur-lg rounded-xl border border-gray-700/50 shadow-2xl">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent text-center mb-8">
          Create New Event
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Tickets Section - Mandatory */}
          <div className="border border-gray-600 rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection('tickets')}
              className="w-full flex items-center justify-between p-4 bg-gray-700/30 hover:bg-gray-700/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Ticket className="w-5 h-5 text-purple-400" />
                <span className="text-lg font-semibold text-white">Event Tickets</span>
                <span className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-full">Required</span>
              </div>
              {expandedSections.tickets ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>

            {expandedSections.tickets ? (
              <div className="p-6 bg-gray-800/30 space-y-4">
                <div className="mb-4">
                  <label className="block text-gray-300 font-semibold mb-2" htmlFor="name">
                    Event Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={eventData.name}
                    onChange={handleChange}
                    className="w-full p-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Event Name"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-gray-300 font-semibold mb-2" htmlFor="description">
                    Add Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={eventData.description}
                    onChange={handleChange}
                    className="w-full p-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent min-h-[100px]"
                    placeholder="Tell people what your event is about..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-gray-300 font-semibold mb-2">
                      Start
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="date"
                        name="startDate"
                        value={eventData.startDate}
                        onChange={handleChange}
                        className="w-full p-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
                        required
                      />
                      <input
                        type="time"
                        name="startTime"
                        value={eventData.startTime}
                        onChange={handleChange}
                        className="w-full p-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-gray-300 font-semibold mb-2">
                      End
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="date"
                        name="endDate"
                        value={eventData.endDate}
                        onChange={handleChange}
                        className="w-full p-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
                      />
                      <input
                        type="time"
                        name="endTime"
                        value={eventData.endTime}
                        onChange={handleChange}
                        className="w-full p-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-gray-300 font-semibold mb-2">
                    Add Event Location
                  </label>
                  <div className="flex items-center gap-3 mb-3">
                    <input
                      type="checkbox"
                      id="isVirtual"
                      name="isVirtual"
                      checked={eventData.isVirtual}
                      onChange={(e) => setEventData({...eventData, isVirtual: e.target.checked})}
                      className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
                    />
                    <label htmlFor="isVirtual" className="text-gray-300">Virtual Event</label>
                  </div>
                  {eventData.isVirtual ? (
                    <input
                      type="url"
                      name="virtualLink"
                      value={eventData.virtualLink}
                      onChange={handleChange}
                      className="w-full p-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500"
                      placeholder="Virtual event link (Zoom, Meet, etc.)"
                    />
                  ) : (
                    <input
                      type="text"
                      name="location"
                      value={eventData.location}
                      onChange={handleChange}
                      className="w-full p-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500"
                      placeholder="Offline location or virtual link"
                      required
                    />
                  )}
                </div>

                <div className="mb-4">
                  <label className="block text-gray-300 font-semibold mb-2">
                    Tickets
                  </label>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-gray-300">Price:</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        name="ticketPrice"
                        value={eventData.ticketPrice}
                        onChange={handleChange}
                        className="w-24 p-2 bg-gray-700/50 border border-gray-600 rounded text-white focus:ring-2 focus:ring-purple-500"
                        placeholder="0.001"
                        min="0.001"
                        step="0.001"
                        required
                      />
                      <span className="text-gray-400">ETH</span>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex items-center gap-3 mb-3">
                    <input
                      type="checkbox"
                      id="requireApproval"
                      name="requireApproval"
                      checked={eventData.requireApproval}
                      onChange={(e) => setEventData({...eventData, requireApproval: e.target.checked})}
                      className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
                    />
                    <label htmlFor="requireApproval" className="text-gray-300">Require Approval</label>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-gray-300 font-semibold mb-2">
                    Capacity
                  </label>
                  <div className="flex items-center gap-3">
                    <select
                      name="capacity"
                      value={eventData.capacity}
                      onChange={handleChange}
                      className="p-2 bg-gray-700/50 border border-gray-600 rounded text-white focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="unlimited">Unlimited</option>
                      <option value="limited">Limited</option>
                    </select>
                    {eventData.capacity === 'limited' && (
                      <input
                        type="number"
                        name="totalTickets"
                        value={eventData.totalTickets}
                        onChange={handleChange}
                        className="w-24 p-2 bg-gray-700/50 border border-gray-600 rounded text-white focus:ring-2 focus:ring-purple-500"
                        placeholder="100"
                        min="1"
                        required
                      />
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-gray-300 font-semibold mb-2">
                      Category
                    </label>
                    <select
                      name="category"
                      value={eventData.category}
                      onChange={handleChange}
                      className="w-full p-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="Technology">Technology</option>
                      <option value="Music">Music</option>
                      <option value="Art">Art</option>
                      <option value="Finance">Finance</option>
                      <option value="Gaming">Gaming</option>
                      <option value="Sports">Sports</option>
                      <option value="Education">Education</option>
                      <option value="Business">Business</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-300 font-semibold mb-2">
                      Cover Image URL
                    </label>
                    <input
                      type="url"
                      name="coverImage"
                      value={eventData.coverImage}
                      onChange={handleChange}
                      className="w-full p-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500"
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-gray-300 font-semibold mb-2">
                    Host Information
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      name="hostName"
                      value={eventData.hostName}
                      onChange={handleChange}
                      className="w-full p-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500"
                      placeholder="Host Name"
                    />
                    <input
                      type="email"
                      name="hostEmail"
                      value={eventData.hostEmail}
                      onChange={handleChange}
                      className="w-full p-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500"
                      placeholder="Host Email"
                    />
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          {/* POAP Section - Optional */}
          <div className="border border-gray-600 rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection('poaps')}
              className="w-full flex items-center justify-between p-4 bg-gray-700/30 hover:bg-gray-700/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Award className="w-5 h-5 text-orange-400" />
                <span className="text-lg font-semibold text-white">POAP (Proof of Attendance Protocol)</span>
                <span className="px-2 py-1 bg-orange-500/20 text-orange-300 text-xs rounded-full">Optional</span>
              </div>
              {expandedSections.poaps ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>

            {expandedSections.poaps ? (
              <div className="p-6 bg-gray-800/30 space-y-4">
                <div className="flex items-center gap-3 mb-4">
                  <input
                    type="checkbox"
                    id="poapEnabled"
                    name="enabled"
                    checked={poapData.enabled}
                    onChange={handlePoapChange}
                    className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
                  />
                  <label htmlFor="poapEnabled" className="text-gray-300 font-medium">
                    Enable POAP for this event
                  </label>
                </div>

                {poapData.enabled && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-gray-300 font-semibold mb-2" htmlFor="poapName">
                          POAP Name
                        </label>
                        <input
                          type="text"
                          id="poapName"
                          name="name"
                          value={poapData.name}
                          onChange={handlePoapChange}
                          className="w-full p-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          placeholder="e.g., Blockchain Summit 2025 Attendee"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-300 font-semibold mb-2" htmlFor="poapCity">
                          City
                        </label>
                        <input
                          type="text"
                          id="poapCity"
                          name="city"
                          value={poapData.city}
                          onChange={handlePoapChange}
                          className="w-full p-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          placeholder="e.g., San Francisco"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-gray-300 font-semibold mb-2" htmlFor="poapDescription">
                        Description
                      </label>
                      <textarea
                        id="poapDescription"
                        name="description"
                        value={poapData.description}
                        onChange={handlePoapChange}
                        className="w-full p-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent min-h-[80px]"
                        placeholder="Describe what this POAP represents..."
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-gray-300 font-semibold mb-2" htmlFor="poapStartDate">
                          Event Start Date
                        </label>
                        <input
                          type="date"
                          id="poapStartDate"
                          name="startDate"
                          value={poapData.startDate}
                          onChange={handlePoapChange}
                          className="w-full p-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-300 font-semibold mb-2" htmlFor="poapEndDate">
                          Event End Date
                        </label>
                        <input
                          type="date"
                          id="poapEndDate"
                          name="endDate"
                          value={poapData.endDate}
                          onChange={handlePoapChange}
                          className="w-full p-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-gray-300 font-semibold mb-2" htmlFor="poapImage">
                        POAP Image URL
                      </label>
                      <input
                        type="url"
                        id="poapImage"
                        name="image"
                        value={poapData.image}
                        onChange={handlePoapChange}
                        className="w-full p-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="https://example.com/poap-image.png"
                      />
                    </div>
                  </>
                )}
              </div>
            ) : null}
          </div>

          {/* Attendance Badges Section - Optional */}
          <div className="border border-gray-600 rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection('badges')}
              className="w-full flex items-center justify-between p-4 bg-gray-700/30 hover:bg-gray-700/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-blue-400" />
                <span className="text-lg font-semibold text-white">"I am Attending" Badges</span>
                <span className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full">Optional</span>
              </div>
              {expandedSections.badges ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>

            {expandedSections.badges ? (
              <div className="p-6 bg-gray-800/30 space-y-4">
                <div className="flex items-center gap-3 mb-4">
                  <input
                    type="checkbox"
                    id="badgeEnabled"
                    name="enabled"
                    checked={badgeData.enabled}
                    onChange={handleBadgeChange}
                    className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
                  />
                  <label htmlFor="badgeEnabled" className="text-gray-300 font-medium">
                    Enable attendance badges for this event
                  </label>
                </div>

                {badgeData.enabled && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-gray-300 font-semibold mb-2" htmlFor="badgeName">
                          Badge Name
                        </label>
                        <input
                          type="text"
                          id="badgeName"
                          name="name"
                          value={badgeData.name}
                          onChange={handleBadgeChange}
                          className="w-full p-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="e.g., Blockchain Summit 2025 Attendee"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-300 font-semibold mb-2" htmlFor="badgeValidUntil">
                          Valid Until
                        </label>
                        <input
                          type="date"
                          id="badgeValidUntil"
                          name="validUntil"
                          value={badgeData.validUntil}
                          onChange={handleBadgeChange}
                          className="w-full p-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-gray-300 font-semibold mb-2" htmlFor="badgeDescription">
                        Badge Description
                      </label>
                      <textarea
                        id="badgeDescription"
                        name="description"
                        value={badgeData.description}
                        onChange={handleBadgeChange}
                        className="w-full p-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[80px]"
                        placeholder="Describe what this badge represents..."
                      />
                    </div>

                    <div>
                      <label className="block text-gray-300 font-semibold mb-2" htmlFor="badgeCriteria">
                        Attendance Criteria
                      </label>
                      <textarea
                        id="badgeCriteria"
                        name="criteria"
                        value={badgeData.criteria}
                        onChange={handleBadgeChange}
                        className="w-full p-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[80px]"
                        placeholder="e.g., Must check-in at the event venue, participate in at least 2 sessions..."
                      />
                    </div>

                    <div>
                      <label className="block text-gray-300 font-semibold mb-2" htmlFor="badgeImage">
                        Badge Image URL
                      </label>
                      <input
                        type="url"
                        id="badgeImage"
                        name="image"
                        value={badgeData.image}
                        onChange={handleBadgeChange}
                        className="w-full p-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="https://example.com/badge-image.png"
                      />
                    </div>
                  </>
                )}
              </div>
            ) : null}
          </div>

          {/* Submit Button */}
          <div className="text-center pt-6">
            <button
              type="submit"
              className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 px-8 rounded-lg font-medium hover:opacity-90 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-purple-500/20 text-lg"
              style={{ backgroundSize: '200% auto' }}
            >
              Create Event & Mint Assets
            </button>
            <p className="text-gray-400 text-sm mt-3">
              This will create your event{poapData.enabled ? ', mint POAPs' : ''}{badgeData.enabled ? ', and create attendance badges' : ''} on the blockchain
            </p>
          </div>

        </form>
      </div>
    </div>
  );
};

export default CreateEvent;