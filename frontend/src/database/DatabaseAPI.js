/**
 * EventVex Database API Layer
 * Unified API for all database operations across SQLite3, IPFS, and Blockchain
 * Provides super-fast queries with intelligent caching and real-time sync
 */

import hybridDB from './HybridDB';
import { uploadJSONToIPFS, uploadFileToIPFS, createEventMetadata, createTicketMetadata } from '../utils/ipfs';
import { ethers } from 'ethers';

class DatabaseAPI {
  constructor() {
    this.initialized = false;
    this.eventListeners = new Map();
  }

  /**
   * Initialize the database API
   */
  async initialize() {
    if (this.initialized) return;
    
    await hybridDB.initialize();
    this.initialized = true;
    
    // Set up event forwarding
    hybridDB.addEventListener('events_synced', (data) => this.emit('events_updated', data));
    hybridDB.addEventListener('event_synced', (data) => this.emit('event_updated', data));
    hybridDB.addEventListener('user_tickets_synced', (data) => this.emit('tickets_updated', data));
    
    console.log('✅ DatabaseAPI initialized');
  }

  // ==================== EVENT OPERATIONS ====================

  /**
   * Get all events with filtering and pagination
   */
  async getEvents(options = {}) {
    await this.ensureInitialized();
    return await hybridDB.getEvents(options);
  }

  /**
   * Get single event by ID
   */
  async getEvent(eventId, forceRefresh = false) {
    await this.ensureInitialized();
    return await hybridDB.getEvent(eventId, forceRefresh);
  }

  /**
   * Create new event (uploads to IPFS and blockchain)
   */
  async createEvent(eventData, imageFile = null) {
    await this.ensureInitialized();
    
    try {
      let imageHash = null;
      
      // Upload image to IPFS if provided
      if (imageFile) {
        const imageResult = await uploadFileToIPFS(imageFile, {
          name: `event-${Date.now()}-image`,
          type: 'image',
          category: 'event-banner'
        });
        imageHash = imageResult.hash;
      }
      
      // Create and upload metadata to IPFS
      const metadata = createEventMetadata(eventData, imageHash);
      const metadataResult = await uploadJSONToIPFS(metadata, {
        name: `event-${Date.now()}-metadata.json`,
        type: 'metadata',
        category: 'event'
      });
      
      // Create event on blockchain (this would call your smart contract)
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      const factoryABI = await import('../abi/EventFactory.json');
      const factory = new ethers.Contract(
        import.meta.env.VITE_EVENT_FACTORY_ADDRESS,
        factoryABI.abi,
        signer
      );
      
      const tx = await factory.createEvent(
        eventData.title,
        eventData.description,
        eventData.location,
        metadataResult.hash,
        Math.floor(new Date(eventData.eventDate).getTime() / 1000),
        ethers.parseEther(eventData.ticketPrice.toString()),
        eventData.maxTickets,
        ethers.parseEther(eventData.maxResalePrice?.toString() || eventData.ticketPrice.toString())
      );
      
      const receipt = await tx.wait();
      
      // Extract event ID from transaction logs
      const eventCreatedLog = receipt.logs.find(log => 
        log.topics[0] === ethers.id('EventCreated(uint256,address,address,string,string,uint256,uint256,uint256)')
      );
      
      if (eventCreatedLog) {
        const eventId = parseInt(eventCreatedLog.topics[1], 16);
        
        // Sync the new event to local database
        await hybridDB.syncEventFromBlockchain(eventId);
        
        this.emit('event_created', { eventId, transactionHash: tx.hash });
        
        return { eventId, transactionHash: tx.hash, metadataHash: metadataResult.hash };
      }
      
      throw new Error('Failed to extract event ID from transaction');
      
    } catch (error) {
      console.error('Failed to create event:', error);
      throw error;
    }
  }

  /**
   * Update event metadata
   */
  async updateEvent(eventId, updates, imageFile = null) {
    await this.ensureInitialized();
    
    try {
      const currentEvent = await this.getEvent(eventId);
      if (!currentEvent) throw new Error('Event not found');
      
      let imageHash = currentEvent.image_uri;
      
      // Upload new image if provided
      if (imageFile) {
        const imageResult = await uploadFileToIPFS(imageFile, {
          name: `event-${eventId}-image-updated`,
          type: 'image',
          category: 'event-banner'
        });
        imageHash = imageResult.hash;
      }
      
      // Create updated metadata
      const updatedData = { ...currentEvent, ...updates };
      const metadata = createEventMetadata(updatedData, imageHash);
      
      const metadataResult = await uploadJSONToIPFS(metadata, {
        name: `event-${eventId}-metadata-updated.json`,
        type: 'metadata',
        category: 'event'
      });
      
      // Update on blockchain (if contract supports it)
      // This would depend on your smart contract implementation
      
      this.emit('event_updated', { eventId, metadataHash: metadataResult.hash });
      
      return { metadataHash: metadataResult.hash };
      
    } catch (error) {
      console.error('Failed to update event:', error);
      throw error;
    }
  }

  // ==================== TICKET OPERATIONS ====================

  /**
   * Get user's tickets
   */
  async getUserTickets(walletAddress, forceRefresh = false) {
    await this.ensureInitialized();
    return await hybridDB.getUserTickets(walletAddress, forceRefresh);
  }

  /**
   * Purchase ticket (mints NFT)
   */
  async purchaseTicket(eventId, seatNumber, ticketData = {}) {
    await this.ensureInitialized();
    
    try {
      const event = await this.getEvent(eventId);
      if (!event) throw new Error('Event not found');
      
      // Create ticket metadata
      const ticketMetadata = createTicketMetadata({
        tokenId: Date.now(), // Temporary, will be replaced with actual token ID
        seatNumber,
        eventId,
        owner: ticketData.owner || 'pending'
      }, event.metadata);
      
      const metadataResult = await uploadJSONToIPFS(ticketMetadata, {
        name: `ticket-${eventId}-${seatNumber}-metadata.json`,
        type: 'metadata',
        category: 'ticket'
      });
      
      // Mint ticket on blockchain
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      const ticketABI = await import('../abi/EventTicket.json');
      const ticketContract = new ethers.Contract(
        event.contract_address,
        ticketABI.abi,
        signer
      );
      
      const tx = await ticketContract.mintTicket(seatNumber, metadataResult.hash, {
        value: ethers.parseEther(event.ticket_price)
      });
      
      const receipt = await tx.wait();
      
      this.emit('ticket_purchased', { 
        eventId, 
        seatNumber, 
        transactionHash: tx.hash,
        metadataHash: metadataResult.hash 
      });
      
      return { transactionHash: tx.hash, metadataHash: metadataResult.hash };
      
    } catch (error) {
      console.error('Failed to purchase ticket:', error);
      throw error;
    }
  }

  // ==================== MARKETPLACE OPERATIONS ====================

  /**
   * Get marketplace listings
   */
  async getMarketplaceListings(options = {}) {
    await this.ensureInitialized();
    return await hybridDB.getMarketplaceListings(options);
  }

  /**
   * List ticket for resale
   */
  async listTicketForSale(tokenId, contractAddress, price, duration = null) {
    await this.ensureInitialized();
    
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      const marketplaceABI = await import('../abi/TicketMarketplace.json');
      const marketplace = new ethers.Contract(
        import.meta.env.VITE_TICKET_MARKETPLACE_ADDRESS,
        marketplaceABI.abi,
        signer
      );
      
      const durationSeconds = duration || (7 * 24 * 60 * 60); // 7 days default
      
      const tx = await marketplace.listTicket(
        contractAddress,
        tokenId,
        ethers.parseEther(price.toString()),
        durationSeconds
      );
      
      const receipt = await tx.wait();
      
      this.emit('ticket_listed', { tokenId, contractAddress, price, transactionHash: tx.hash });
      
      return { transactionHash: tx.hash };
      
    } catch (error) {
      console.error('Failed to list ticket:', error);
      throw error;
    }
  }

  // ==================== SEARCH OPERATIONS ====================

  /**
   * Search across all content
   */
  async search(query, type = null, limit = 20) {
    await this.ensureInitialized();
    return await hybridDB.search(query, type, limit);
  }

  // ==================== USER OPERATIONS ====================

  /**
   * Get or create user profile
   */
  async getUserProfile(walletAddress) {
    await this.ensureInitialized();
    
    const stmt = hybridDB.db.prepare('SELECT * FROM users WHERE wallet_address = ?');
    const result = stmt.getAsObject([walletAddress]);
    stmt.free();
    
    if (result.length === 0) {
      // Create new user profile
      hybridDB.db.run(`
        INSERT INTO users (wallet_address, created_at, last_synced)
        VALUES (?, strftime('%s', 'now'), strftime('%s', 'now'))
      `, [walletAddress]);
      
      hybridDB.saveDatabase();
      
      return {
        wallet_address: walletAddress,
        username: null,
        email: null,
        is_organizer: false,
        is_verified_organizer: false,
        events_created: 0,
        tickets_purchased: 0
      };
    }
    
    return result[0];
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Get database statistics
   */
  async getStats() {
    await this.ensureInitialized();
    return hybridDB.getStats();
  }

  /**
   * Force sync all data from blockchain
   */
  async forceSync() {
    await this.ensureInitialized();
    
    hybridDB.queueSync('events', 'fetch_all', {}, 1); // High priority
    
    this.emit('sync_started');
  }

  /**
   * Clear local cache
   */
  async clearCache() {
    await this.ensureInitialized();
    
    hybridDB.db.run('DELETE FROM ipfs_cache');
    hybridDB.saveDatabase();
    
    this.emit('cache_cleared');
  }

  /**
   * Ensure database is initialized
   */
  async ensureInitialized() {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  /**
   * Add event listener
   */
  addEventListener(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);
  }

  /**
   * Emit event
   */
  emit(event, data) {
    const listeners = this.eventListeners.get(event) || [];
    listeners.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('Event listener error:', error);
      }
    });
  }
}

// Create singleton instance
const databaseAPI = new DatabaseAPI();

export default databaseAPI;
