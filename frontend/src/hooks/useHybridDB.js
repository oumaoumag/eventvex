/**
 * React Hook for EventVex Hybrid Database
 * Provides reactive database operations with real-time updates
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import databaseAPI from '../database/DatabaseAPI';

/**
 * Main hook for database operations
 */
export const useHybridDB = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const initializeDB = async () => {
      try {
        await databaseAPI.initialize();
        setIsInitialized(true);
        setError(null);
        
        // Get initial stats
        const dbStats = await databaseAPI.getStats();
        setStats(dbStats);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    initializeDB();
  }, []);

  const forceSync = useCallback(async () => {
    try {
      await databaseAPI.forceSync();
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const clearCache = useCallback(async () => {
    try {
      await databaseAPI.clearCache();
      const dbStats = await databaseAPI.getStats();
      setStats(dbStats);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  return {
    isInitialized,
    isLoading,
    error,
    stats,
    forceSync,
    clearCache
  };
};

/**
 * Hook for event operations
 */
export const useEvents = (options = {}) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const optionsRef = useRef(options);

  // Update options ref when options change
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  const loadEvents = useCallback(async (refresh = false) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await databaseAPI.getEvents({
        ...optionsRef.current,
        forceSync: refresh
      });
      
      setEvents(result);
      setHasMore(result.length === (optionsRef.current.limit || 50));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return;
    
    try {
      const offset = events.length;
      const result = await databaseAPI.getEvents({
        ...optionsRef.current,
        offset
      });
      
      setEvents(prev => [...prev, ...result]);
      setHasMore(result.length === (optionsRef.current.limit || 50));
    } catch (err) {
      setError(err.message);
    }
  }, [events.length, hasMore, loading]);

  const createEvent = useCallback(async (eventData, imageFile) => {
    try {
      setError(null);
      const result = await databaseAPI.createEvent(eventData, imageFile);
      
      // Refresh events list
      await loadEvents(true);
      
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [loadEvents]);

  // Load events on mount and when options change
  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  // Listen for real-time updates
  useEffect(() => {
    const handleEventsUpdated = () => {
      loadEvents(true);
    };

    databaseAPI.addEventListener('events_updated', handleEventsUpdated);
    databaseAPI.addEventListener('event_created', handleEventsUpdated);
    databaseAPI.addEventListener('event_updated', handleEventsUpdated);

    return () => {
      // Note: In a real implementation, you'd want to remove specific listeners
    };
  }, [loadEvents]);

  return {
    events,
    loading,
    error,
    hasMore,
    loadEvents,
    loadMore,
    createEvent,
    refresh: () => loadEvents(true)
  };
};

/**
 * Hook for single event
 */
export const useEvent = (eventId) => {
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadEvent = useCallback(async (refresh = false) => {
    if (!eventId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const result = await databaseAPI.getEvent(eventId, refresh);
      setEvent(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    loadEvent();
  }, [loadEvent]);

  // Listen for updates to this specific event
  useEffect(() => {
    const handleEventUpdated = (data) => {
      if (data.eventId === eventId) {
        loadEvent(true);
      }
    };

    databaseAPI.addEventListener('event_updated', handleEventUpdated);
    
    return () => {
      // Remove listener
    };
  }, [eventId, loadEvent]);

  return {
    event,
    loading,
    error,
    refresh: () => loadEvent(true)
  };
};

/**
 * Hook for user tickets
 */
export const useUserTickets = (walletAddress) => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadTickets = useCallback(async (refresh = false) => {
    if (!walletAddress) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const result = await databaseAPI.getUserTickets(walletAddress, refresh);
      setTickets(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [walletAddress]);

  const purchaseTicket = useCallback(async (eventId, seatNumber, ticketData) => {
    try {
      setError(null);
      const result = await databaseAPI.purchaseTicket(eventId, seatNumber, ticketData);
      
      // Refresh tickets
      await loadTickets(true);
      
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [loadTickets]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  // Listen for ticket updates
  useEffect(() => {
    const handleTicketsUpdated = (data) => {
      if (data.walletAddress === walletAddress) {
        loadTickets(true);
      }
    };

    databaseAPI.addEventListener('tickets_updated', handleTicketsUpdated);
    databaseAPI.addEventListener('ticket_purchased', handleTicketsUpdated);
    
    return () => {
      // Remove listeners
    };
  }, [walletAddress, loadTickets]);

  return {
    tickets,
    loading,
    error,
    purchaseTicket,
    refresh: () => loadTickets(true)
  };
};

/**
 * Hook for marketplace operations
 */
export const useMarketplace = (options = {}) => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadListings = useCallback(async (refresh = false) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await databaseAPI.getMarketplaceListings(options);
      setListings(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [options]);

  const listTicket = useCallback(async (tokenId, contractAddress, price, duration) => {
    try {
      setError(null);
      const result = await databaseAPI.listTicketForSale(tokenId, contractAddress, price, duration);
      
      // Refresh listings
      await loadListings(true);
      
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [loadListings]);

  useEffect(() => {
    loadListings();
  }, [loadListings]);

  return {
    listings,
    loading,
    error,
    listTicket,
    refresh: () => loadListings(true)
  };
};

/**
 * Hook for search functionality
 */
export const useSearch = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const search = useCallback(async (query, type = null, limit = 20) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const result = await databaseAPI.search(query, type, limit);
      setResults(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearResults = useCallback(() => {
    setResults([]);
    setError(null);
  }, []);

  return {
    results,
    loading,
    error,
    search,
    clearResults
  };
};

/**
 * Hook for user profile
 */
export const useUserProfile = (walletAddress) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadProfile = async () => {
      if (!walletAddress) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const result = await databaseAPI.getUserProfile(walletAddress);
        setProfile(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [walletAddress]);

  return {
    profile,
    loading,
    error
  };
};
