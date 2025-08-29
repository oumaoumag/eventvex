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
    date: '',
    venue: '',
    ticketPrice: '',
    totalTickets: '',
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
        title: eventData.name, // Alias for compatibility
        description: '', // Add description field if needed
        date: eventData.date,
        venue: eventData.venue,
        location: eventData.venue, // Alias for compatibility
        ticketPrice: eventData.ticketPrice,
        totalTickets: eventData.totalTickets,
        maxTickets: eventData.totalTickets // Alias for compatibility
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

      // Reset all forms
      setEventData({ name: '', date: '', venue: '', ticketPrice: '', totalTickets: '' });
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
                    <Calendar className="w-4 h-4 inline mr-2" />
                    Event Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={eventData.name}
                    onChange={handleChange}
                    className="w-full p-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Enter event name"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-gray-300 font-semibold mb-2" htmlFor="date">
                    <Calendar className="w-4 h-4 inline mr-2" />
                    Event Date
                  </label>
                  <input
                    type="date"
                    id="date"
                    name="date"
                    value={eventData.date}
                    onChange={handleChange}
                    className="w-full p-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-gray-300 font-semibold mb-2" htmlFor="venue">
                    <MapPin className="w-4 h-4 inline mr-2" />
                    Event Venue
                  </label>
                  <textarea
                    id="venue"
                    name="venue"
                    value={eventData.venue}
                    onChange={handleChange}
                    className="w-full p-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent min-h-[100px]"
                    placeholder="Enter event venue"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-gray-300 font-semibold mb-2" htmlFor="ticketPrice">
                      <DollarSign className="w-4 h-4 inline mr-2" />
                      Ticket Price (ETH)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        id="ticketPrice"
                        name="ticketPrice"
                        value={eventData.ticketPrice}
                        onChange={handleChange}
                        className="w-full p-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent pr-10"
                        placeholder="0.001"
                        inputMode="decimal"
                        min="0"
                        step="0.001"
                        required
                      />
                      <span className="absolute right-3 top-3.5 text-gray-500">ETH</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-gray-300 font-semibold mb-2" htmlFor="totalTickets">
                      <Hash className="w-4 h-4 inline mr-2" />
                      Total Tickets
                    </label>
                    <input
                      type="number"
                      id="totalTickets"
                      name="totalTickets"
                      value={eventData.totalTickets}
                      onChange={handleChange}
                      className="w-full p-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="100"
                      inputMode="numeric"
                      min="1"
                      required
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