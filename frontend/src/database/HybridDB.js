/**
 * EventVex Hybrid Database Manager
 * Combines SQLite3 (local cache), IPFS (decentralized storage), and Blockchain (source of truth)
 * for super-fast rendering with efficiency and scalability
 */

import initSqlJs from 'sql.js';
import { ethers } from 'ethers';
import { retrieveFromIPFS, uploadJSONToIPFS, getIPFSUrl } from '../utils/ipfs';

class HybridDB {
  constructor() {
    this.db = null;
    this.isInitialized = false;
    this.syncQueue = [];
    this.syncInProgress = false;
    this.cacheConfig = {
      defaultTTL: 24 * 60 * 60, // 24 hours in seconds
      maxCacheSize: 100 * 1024 * 1024, // 100MB
      cleanupInterval: 60 * 60 * 1000, // 1 hour in milliseconds
    };
    this.eventListeners = new Map();
  }

  /**
   * Initialize the hybrid database
   */
  async initialize() {
    if (this.isInitialized) return;

    try {
      // Initialize SQL.js
      const SQL = await initSqlJs({
        locateFile: file => `https://sql.js.org/dist/${file}`
      });

      // Check database version and recreate if needed
      const currentVersion = '1.3';
      const savedVersion = localStorage.getItem('eventvex_db_version');
      const savedDB = localStorage.getItem('eventvex_db');
      const isSeeded = localStorage.getItem('eventvex_db_seeded') === 'true';
      
      if (savedDB && savedVersion === currentVersion) {
        // Always load existing database if version matches
        const uint8Array = new Uint8Array(JSON.parse(savedDB));
        this.db = new SQL.Database(uint8Array);
        console.log('✅ Loaded existing database from localStorage');
      } else {
        console.log('🔄 Creating new database with updated schema...');
        this.db = new SQL.Database();
        await this.createSchema();
        localStorage.setItem('eventvex_db_version', currentVersion);
        localStorage.removeItem('eventvex_db_seeded'); // Reset seeding flag for new schema
      }

      this.isInitialized = true;
      
      // Start background processes
      this.startSyncWorker();
      this.startCacheCleanup();
      
      console.log('✅ HybridDB initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize HybridDB:', error);
      throw error;
    }
  }

  /**
   * Create database schema
   */
  async createSchema() {
    try {
      const schemaResponse = await fetch('/src/database/schema.sql');
      const schema = await schemaResponse.text();
      this.db.exec(schema);
      this.saveDatabase();
    } catch (error) {
      console.error('Failed to create schema:', error);
      throw error;
    }
  }

  /**
   * Save database to localStorage
   */
  saveDatabase() {
    if (!this.db) return;
    
    try {
      const data = this.db.export();
      const buffer = Array.from(data);
      localStorage.setItem('eventvex_db', JSON.stringify(buffer));
    } catch (error) {
      console.error('Failed to save database:', error);
    }
  }

  /**
   * Get events with intelligent caching
   */
  async getEvents(options = {}) {
    const {
      limit = 50,
      offset = 0,
      organizer = null,
      active = true,
      search = null,
      forceSync = false
    } = options;

    // Build query
    let query = `
      SELECT * FROM events 
      WHERE 1=1
    `;
    const params = [];

    if (organizer) {
      query += ` AND organizer_address = ?`;
      params.push(organizer);
    }

    if (active !== null) {
      query += ` AND is_active = ? AND is_cancelled = 0`;
      params.push(active ? 1 : 0);
    }

    if (search) {
      query += ` AND search_text LIKE ?`;
      params.push(`%${search}%`);
    }

    query += ` ORDER BY event_date DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    // Get from local cache first - use exec to get all rows
    const execResult = this.db.exec(query, params);
    let results = [];
    
    if (execResult.length > 0 && execResult[0].values) {
      const columns = execResult[0].columns;
      results = execResult[0].values.map(row => {
        const obj = {};
        columns.forEach((col, index) => {
          obj[col] = row[index];
        });
        return obj;
      });
    }

    console.log(`Database query returned ${results.length} events`);
    console.log('Raw results:', results);

    // Check if we need to sync from blockchain
    const needsSync = forceSync || this.shouldSync('events');
    if (needsSync) {
      this.queueSync('events', 'fetch_all', { options });
    }

    // Enhance results with IPFS data
    return await this.enhanceWithIPFS(results, 'event');
  }

  /**
   * Get single event by ID
   */
  async getEvent(eventId, forceSync = false) {
    // Try local cache first
    const stmt = this.db.prepare('SELECT * FROM events WHERE event_id = ?');
    const result = stmt.getAsObject([eventId]);
    stmt.free();

    if (result.length === 0 || forceSync) {
      // Fetch from blockchain
      await this.syncEventFromBlockchain(eventId);
      
      // Try again from cache
      const stmt2 = this.db.prepare('SELECT * FROM events WHERE event_id = ?');
      const result2 = stmt2.getAsObject([eventId]);
      stmt2.free();
      
      if (result2.length === 0) return null;
      return await this.enhanceWithIPFS(result2[0], 'event');
    }

    return await this.enhanceWithIPFS(result[0], 'event');
  }

  /**
   * Get user tickets
   */
  async getUserTickets(walletAddress, forceSync = false) {
    const query = `
      SELECT t.*, e.title as event_title, e.event_date, e.location, e.image_uri
      FROM tickets t
      JOIN events e ON t.event_id = e.event_id
      WHERE t.owner_address = ?
      ORDER BY e.event_date DESC
    `;

    const stmt = this.db.prepare(query);
    const results = stmt.getAsObject([walletAddress]);
    stmt.free();

    if (forceSync || this.shouldSync('tickets', walletAddress)) {
      this.queueSync('tickets', 'fetch_user', { walletAddress });
    }

    return await this.enhanceWithIPFS(results, 'ticket');
  }

  /**
   * Get marketplace listings
   */
  async getMarketplaceListings(options = {}) {
    const {
      limit = 50,
      offset = 0,
      seller = null,
      active = true,
      eventId = null
    } = options;

    let query = `
      SELECT ml.*, t.seat_number, e.title as event_title, e.event_date, e.image_uri
      FROM marketplace_listings ml
      JOIN tickets t ON ml.ticket_token_id = t.token_id AND ml.ticket_contract = t.contract_address
      JOIN events e ON t.event_id = e.event_id
      WHERE 1=1
    `;
    const params = [];

    if (seller) {
      query += ` AND ml.seller_address = ?`;
      params.push(seller);
    }

    if (active) {
      query += ` AND ml.is_active = 1 AND (ml.expiration_time IS NULL OR ml.expiration_time > strftime('%s', 'now'))`;
    }

    if (eventId) {
      query += ` AND e.event_id = ?`;
      params.push(eventId);
    }

    query += ` ORDER BY ml.listing_time DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const stmt = this.db.prepare(query);
    const results = stmt.getAsObject(params);
    stmt.free();

    return await this.enhanceWithIPFS(results, 'listing');
  }

  /**
   * Search across all content
   */
  async search(query, type = null, limit = 20) {
    let searchQuery = `
      SELECT si.record_id, si.type, 
             CASE 
               WHEN si.type = 'event' THEN (SELECT json_object(
                 'id', event_id, 'title', title, 'description', description,
                 'location', location, 'event_date', event_date, 'image_uri', image_uri
               ) FROM events WHERE event_id = si.record_id)
               WHEN si.type = 'user' THEN (SELECT json_object(
                 'wallet_address', wallet_address, 'username', username, 'bio', bio
               ) FROM users WHERE wallet_address = si.record_id)
             END as data
      FROM search_index si
      WHERE (si.title LIKE ? OR si.content LIKE ? OR si.tags LIKE ?)
    `;

    const searchTerm = `%${query}%`;
    const params = [searchTerm, searchTerm, searchTerm];

    if (type) {
      searchQuery += ` AND si.type = ?`;
      params.push(type);
    }

    searchQuery += ` LIMIT ?`;
    params.push(limit);

    const stmt = this.db.prepare(searchQuery);
    const results = stmt.getAsObject(params);
    stmt.free();

    return results.map(row => ({
      ...row,
      data: JSON.parse(row.data)
    }));
  }

  /**
   * Store base64 image in database
   */
  async storeImage(imageBase64, type = 'event', recordId) {
    const imageId = `${type}_${recordId}_${Date.now()}`;
    
    this.db.run(`
      INSERT OR REPLACE INTO images
      (image_id, type, record_id, base64_data, created_at)
      VALUES (?, ?, ?, ?, strftime('%s', 'now'))
    `, [imageId, type, recordId, imageBase64]);
    
    this.saveDatabase();
    return imageId;
  }

  /**
   * Get base64 image from database
   */
  async getImage(imageId) {
    const stmt = this.db.prepare('SELECT base64_data FROM images WHERE image_id = ?');
    const result = stmt.getAsObject([imageId]);
    stmt.free();
    
    return result.length > 0 ? result[0].base64_data : null;
  }

  /**
   * Cache IPFS content locally
   */
  async cacheIPFSContent(ipfsHash, contentType = 'metadata') {
    // Check if already cached and not expired
    const stmt = this.db.prepare(`
      SELECT * FROM ipfs_cache 
      WHERE ipfs_hash = ? AND (expires_at IS NULL OR expires_at > strftime('%s', 'now'))
    `);
    const cached = stmt.getAsObject([ipfsHash]);
    stmt.free();

    if (cached.length > 0) {
      // Update access count and time
      this.db.run(`
        UPDATE ipfs_cache 
        SET access_count = access_count + 1, last_accessed = strftime('%s', 'now')
        WHERE ipfs_hash = ?
      `, [ipfsHash]);
      
      return cached[0].content_type === 'metadata' 
        ? JSON.parse(cached[0].content_text)
        : cached[0].content;
    }

    try {
      // Fetch from IPFS
      const isJSON = contentType === 'metadata';
      const content = await retrieveFromIPFS(ipfsHash, isJSON);
      
      // Cache the content
      const expiresAt = Math.floor(Date.now() / 1000) + this.cacheConfig.defaultTTL;
      
      this.db.run(`
        INSERT OR REPLACE INTO ipfs_cache 
        (ipfs_hash, content_type, content, content_text, expires_at, access_count, last_accessed)
        VALUES (?, ?, ?, ?, ?, 1, strftime('%s', 'now'))
      `, [
        ipfsHash,
        contentType,
        isJSON ? null : content,
        isJSON ? JSON.stringify(content) : null,
        expiresAt
      ]);

      this.saveDatabase();
      return content;
    } catch (error) {
      console.error(`Failed to cache IPFS content ${ipfsHash}:`, error);
      return null;
    }
  }

  /**
   * Enhance results with IPFS metadata
   */
  async enhanceWithIPFS(results, type) {
    if (!results) return results;
    
    const items = Array.isArray(results) ? results : [results];
    
    const enhanced = await Promise.all(items.map(async (item) => {
      const enhanced = { ...item };
      
      console.log(`🖼️ Processing image for ${item.title}:`);
      console.log('  - cover_image:', item.cover_image);
      console.log('  - image_uri:', item.image_uri);
      
      // Load metadata from IPFS if available
      if (item.metadata_uri) {
        const metadata = await this.cacheIPFSContent(item.metadata_uri, 'metadata');
        if (metadata) {
          enhanced.metadata = metadata;
        }
      }
      
      // Use cover image first, then IPFS image as fallback
      if (item.cover_image) {
        enhanced.image_url = item.cover_image;
        console.log('  ✅ Using cover_image:', enhanced.image_url);
      } else if (item.image_uri) {
        enhanced.image_url = getIPFSUrl(item.image_uri);
        console.log('  ✅ Using IPFS image_uri:', enhanced.image_url);
      } else {
        // Assign fallback image based on category or event type
        const fallbackImages = {
          'Technology': 'src/assets/tig.png',
          'Music': 'src/assets/concert1.jpg',
          'Art': 'src/assets/ast.png',
          'default': 'src/assets/tig.png'
        };
        enhanced.image_url = fallbackImages[item.category] || fallbackImages.default;
        console.log('  🔄 Using fallback image:', enhanced.image_url);
      }
      
      return enhanced;
    }));
    
    return Array.isArray(results) ? enhanced : enhanced[0];
  }

  /**
   * Queue sync operation
   */
  queueSync(table, operation, data, priority = 5) {
    this.syncQueue.push({
      id: Date.now() + Math.random(),
      table,
      operation,
      data,
      priority,
      timestamp: Date.now()
    });

    // Sort by priority
    this.syncQueue.sort((a, b) => a.priority - b.priority);
    
    // Trigger sync if not already running
    if (!this.syncInProgress) {
      this.processSyncQueue();
    }
  }

  /**
   * Process sync queue
   */
  async processSyncQueue() {
    if (this.syncInProgress || this.syncQueue.length === 0) return;
    
    this.syncInProgress = true;
    
    while (this.syncQueue.length > 0) {
      const task = this.syncQueue.shift();
      
      try {
        await this.processSyncTask(task);
      } catch (error) {
        console.error('Sync task failed:', error);
      }
    }
    
    this.syncInProgress = false;
  }

  /**
   * Process individual sync task
   */
  async processSyncTask(task) {
    const { table, operation, data } = task;
    
    switch (table) {
      case 'events':
        if (operation === 'fetch_all') {
          await this.syncEventsFromBlockchain(data.options);
        }
        break;
      case 'tickets':
        if (operation === 'fetch_user') {
          await this.syncUserTicketsFromBlockchain(data.walletAddress);
        }
        break;
      // Add more sync operations as needed
    }
  }

  /**
   * Check if data needs syncing
   */
  shouldSync(table, identifier = null) {
    const syncThreshold = 5 * 60; // 5 minutes
    const now = Math.floor(Date.now() / 1000);
    
    let query = `SELECT last_synced FROM ${table} WHERE last_synced < ?`;
    const params = [now - syncThreshold];
    
    if (identifier) {
      if (table === 'events') {
        query += ` AND event_id = ?`;
      } else if (table === 'tickets') {
        query += ` AND owner_address = ?`;
      }
      params.push(identifier);
    }
    
    const stmt = this.db.prepare(query);
    const results = stmt.getAsObject(params);
    stmt.free();
    
    return results.length > 0;
  }

  /**
   * Start background sync worker
   */
  startSyncWorker() {
    setInterval(() => {
      if (!this.syncInProgress && this.syncQueue.length > 0) {
        this.processSyncQueue();
      }
    }, 1000); // Check every second
  }

  /**
   * Start cache cleanup process
   */
  startCacheCleanup() {
    setInterval(() => {
      this.cleanupCache();
    }, this.cacheConfig.cleanupInterval);
  }

  /**
   * Cleanup expired cache entries
   */
  cleanupCache() {
    try {
      // Remove expired IPFS cache
      this.db.run(`
        DELETE FROM ipfs_cache 
        WHERE expires_at IS NOT NULL AND expires_at < strftime('%s', 'now')
      `);
      
      // Remove old sync queue entries
      this.db.run(`
        DELETE FROM sync_queue 
        WHERE status IN ('completed', 'failed') 
        AND created_at < strftime('%s', 'now', '-7 days')
      `);
      
      this.saveDatabase();
    } catch (error) {
      console.error('Cache cleanup failed:', error);
    }
  }

  /**
   * Add event listener for database changes
   */
  addEventListener(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);
  }

  /**
   * Emit event to listeners
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

  /**
   * Sync events from blockchain
   */
  async syncEventsFromBlockchain(options = {}) {
    try {
      // This would integrate with your Web3 provider
      const provider = new ethers.JsonRpcProvider(import.meta.env.VITE_RPC_URL);
      const factoryAddress = import.meta.env.VITE_EVENT_FACTORY_ADDRESS;

      // Import ABI (you'd need to import this)
      const factoryABI = await import('../abi/EventFactory.json');
      const factory = new ethers.Contract(factoryAddress, factoryABI.abi, provider);

      // Get events from blockchain (using available functions)
      const totalEvents = await factory.getTotalEvents();
      const events = [];
      
      // Get individual events (limited to prevent gas issues)
      const maxEvents = Math.min(Number(totalEvents), 10);
      for (let i = 0; i < maxEvents; i++) {
        try {
          const eventData = await factory.getEvent(i);
          if (eventData.isActive) {
            events.push({
              eventId: i,
              eventContract: eventData.eventContract,
              organizer: eventData.organizer,
              isActive: eventData.isActive
            });
          }
        } catch (error) {
          console.warn(`Failed to fetch event ${i}:`, error.message);
        }
      }

      // Update local database
      for (const event of events) {
        await this.upsertEvent(event);
      }

      this.emit('events_synced', { count: events.length });
    } catch (error) {
      console.error('Failed to sync events from blockchain:', error);
    }
  }

  /**
   * Sync single event from blockchain
   */
  async syncEventFromBlockchain(eventId) {
    try {
      const provider = new ethers.JsonRpcProvider(import.meta.env.VITE_RPC_URL);
      const factoryAddress = import.meta.env.VITE_EVENT_FACTORY_ADDRESS;

      const factoryABI = await import('../abi/EventFactory.json');
      const factory = new ethers.Contract(factoryAddress, factoryABI.abi, provider);

      const event = await factory.getEvent(eventId);
      await this.upsertEvent(event);

      this.emit('event_synced', { eventId });
    } catch (error) {
      console.error(`Failed to sync event ${eventId}:`, error);
    }
  }

  /**
   * Sync user tickets from blockchain
   */
  async syncUserTicketsFromBlockchain(walletAddress) {
    try {
      // This would query all ticket contracts for user's tickets
      // Implementation depends on your indexing strategy

      this.emit('user_tickets_synced', { walletAddress });
    } catch (error) {
      console.error(`Failed to sync tickets for ${walletAddress}:`, error);
    }
  }

  /**
   * Upsert event in local database
   */
  async upsertEvent(eventData) {
    console.log('Upserting event:', eventData);
    
    const {
      eventId,
      eventContract,
      organizer,
      title,
      description,
      location,
      metadataURI,
      eventDate,
      ticketPrice,
      maxTickets,
      isActive,
      createdAt,
      coverImage,
      category,
      hostName,
      hostEmail
    } = eventData;

    try {
      this.db.run(`
        INSERT OR REPLACE INTO events
        (event_id, contract_address, organizer_address, title, description, location,
         metadata_uri, event_date, ticket_price, max_tickets, is_active, created_at, 
         last_synced, cover_image, category, host_name, host_email)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, strftime('%s', 'now'), ?, ?, ?, ?)
      `, [
        eventId,
        eventContract || '',
        organizer || '',
        title || '',
        description || '',
        location || '',
        metadataURI || '',
        eventDate || Math.floor(Date.now() / 1000),
        ticketPrice ? ticketPrice.toString() : '0',
        maxTickets || 0,
        isActive ? 1 : 0,
        createdAt || Math.floor(Date.now() / 1000),
        coverImage || null,
        category || 'Technology',
        hostName || '',
        hostEmail || ''
      ]);

      this.saveDatabase();
      console.log('✅ Event upserted and saved:', eventId);
    } catch (error) {
      console.error('Failed to upsert event:', error);
      throw error;
    }
  }

  /**
   * Get database statistics
   */
  getStats() {
    const stats = {};

    // Count records in each table
    ['events', 'tickets', 'marketplace_listings', 'users', 'ipfs_cache'].forEach(table => {
      const stmt = this.db.prepare(`SELECT COUNT(*) as count FROM ${table}`);
      const result = stmt.getAsObject();
      stmt.free();
      stats[table] = result[0].count;
    });

    // Cache hit rate
    const cacheStmt = this.db.prepare(`
      SELECT
        SUM(access_count) as total_accesses,
        COUNT(*) as cached_items,
        AVG(access_count) as avg_accesses
      FROM ipfs_cache
    `);
    const cacheStats = cacheStmt.getAsObject();
    cacheStmt.free();

    stats.cache = cacheStats[0];

    return stats;
  }
}

// Create singleton instance
const hybridDB = new HybridDB();

export default hybridDB;
