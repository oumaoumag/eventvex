/**
 * EventListIntegrated - Component for displaying events from smart contracts
 * Integrates with EventFactory to fetch and display active events
 */

import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Users, DollarSign, ExternalLink } from 'lucide-react';
import { getActiveEvents, getEventDetails } from '../utils/contractIntegration';
import { formatWalletAddress } from '../utils/walletUtils';

const EventListIntegrated = ({ onEventSelect, showPurchaseButton = true }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Load events from smart contract
  const loadEvents = async () => {
    try {
      setError('');
      const activeEvents = await getActiveEvents();
      setEvents(activeEvents);
    } catch (err) {
      console.error('Error loading events:', err);
      setError(`Failed to load events: ${err.message}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadEvents();
  }, []);

  // Refresh events
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadEvents();
  };

  // Format date for display
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Handle event selection
  const handleEventClick = (event) => {
    if (onEventSelect) {
      onEventSelect(event);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading events...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 m-4">
        <div className="flex items-center">
          <div className="text-red-600 font-medium">Error loading events</div>
        </div>
        <div className="text-red-600 text-sm mt-1">{error}</div>
        <button
          onClick={handleRefresh}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="text-center p-8">
        <div className="text-gray-500 text-lg mb-4">No active events found</div>
        <button
          onClick={handleRefresh}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Refresh
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with refresh button */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Active Events</h2>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Events grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {events.map((event) => (
          <div
            key={event.id}
            className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => handleEventClick(event)}
          >
            {/* Event header */}
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-semibold text-gray-900 line-clamp-2">
                  {event.title}
                </h3>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                  Active
                </span>
              </div>

              {/* Event details */}
              <div className="space-y-3">
                {/* Date */}
                <div className="flex items-center text-gray-600">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span className="text-sm">{formatDate(event.eventDate)}</span>
                </div>

                {/* Organizer */}
                <div className="flex items-center text-gray-600">
                  <Users className="h-4 w-4 mr-2" />
                  <span className="text-sm">
                    Organizer: {formatWalletAddress(event.organizer)}
                  </span>
                </div>

                {/* Price */}
                <div className="flex items-center text-gray-600">
                  <DollarSign className="h-4 w-4 mr-2" />
                  <span className="text-sm font-medium">
                    {event.ticketPrice} ETH per ticket
                  </span>
                </div>

                {/* Max tickets */}
                <div className="flex items-center text-gray-600">
                  <Users className="h-4 w-4 mr-2" />
                  <span className="text-sm">
                    Max {event.maxTickets} tickets
                  </span>
                </div>
              </div>

              {/* Event metadata */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex justify-between items-center text-xs text-gray-500">
                  <span>Event ID: {event.id}</span>
                  <span>Created: {formatDate(event.createdAt)}</span>
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  Contract: {formatWalletAddress(event.contractAddress, 8, 6)}
                </div>
              </div>

              {/* Action buttons */}
              {showPurchaseButton && (
                <div className="mt-4 flex space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEventClick(event);
                    }}
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    View Details
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(`https://sepolia.basescan.org/address/${event.contractAddress}`, '_blank');
                    }}
                    className="px-3 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                    title="View on Block Explorer"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Footer info */}
      <div className="text-center text-sm text-gray-500 mt-8">
        Showing {events.length} active event{events.length !== 1 ? 's' : ''} from the blockchain
      </div>
    </div>
  );
};

export default EventListIntegrated;
