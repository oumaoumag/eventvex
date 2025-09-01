-- EventVex Hybrid Database Schema
-- SQLite3 local database for fast caching and queries
-- Syncs with IPFS and Blockchain for decentralized storage

-- Enable foreign keys and WAL mode for better performance
PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
PRAGMA cache_size = 10000;
PRAGMA temp_store = memory;

-- Events table (local cache of blockchain events)
CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER UNIQUE NOT NULL, -- Blockchain event ID
    contract_address TEXT NOT NULL,
    organizer_address TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    location TEXT,
    event_date INTEGER NOT NULL, -- Unix timestamp
    ticket_price TEXT NOT NULL, -- ETH amount as string
    max_tickets INTEGER NOT NULL,
    tickets_sold INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT 1,
    is_cancelled BOOLEAN DEFAULT 0,
    
    -- IPFS metadata
    metadata_uri TEXT, -- IPFS hash for event metadata
    image_uri TEXT, -- IPFS hash for event image
    
    -- Blockchain data
    block_number INTEGER,
    transaction_hash TEXT,
    
    -- Cache metadata
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER DEFAULT (strftime('%s', 'now')),
    last_synced INTEGER DEFAULT (strftime('%s', 'now')),
    sync_status TEXT DEFAULT 'synced', -- 'synced', 'pending', 'error'
    
    -- Search optimization
    search_text TEXT GENERATED ALWAYS AS (
        title || ' ' || COALESCE(description, '') || ' ' || COALESCE(location, '')
    ) STORED
);

-- Tickets table (local cache of NFT tickets)
CREATE TABLE IF NOT EXISTS tickets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    token_id INTEGER NOT NULL,
    event_id INTEGER NOT NULL,
    contract_address TEXT NOT NULL,
    owner_address TEXT NOT NULL,
    original_owner TEXT NOT NULL,
    seat_number INTEGER,
    purchase_price TEXT NOT NULL,
    purchase_time INTEGER NOT NULL,
    
    -- Ticket status
    is_used BOOLEAN DEFAULT 0,
    is_for_resale BOOLEAN DEFAULT 0,
    resale_price TEXT,
    
    -- IPFS metadata
    metadata_uri TEXT, -- IPFS hash for ticket metadata
    
    -- Blockchain data
    block_number INTEGER,
    transaction_hash TEXT,
    
    -- Cache metadata
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER DEFAULT (strftime('%s', 'now')),
    last_synced INTEGER DEFAULT (strftime('%s', 'now')),
    sync_status TEXT DEFAULT 'synced',
    
    FOREIGN KEY (event_id) REFERENCES events(event_id),
    UNIQUE(token_id, contract_address)
);

-- Marketplace listings table
CREATE TABLE IF NOT EXISTS marketplace_listings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    listing_id TEXT UNIQUE NOT NULL, -- Blockchain listing ID
    seller_address TEXT NOT NULL,
    ticket_token_id INTEGER NOT NULL,
    ticket_contract TEXT NOT NULL,
    price TEXT NOT NULL,
    listing_time INTEGER NOT NULL,
    expiration_time INTEGER,
    is_active BOOLEAN DEFAULT 1,
    is_auction BOOLEAN DEFAULT 0,
    min_bid TEXT,
    highest_bid TEXT,
    highest_bidder TEXT,
    
    -- Blockchain data
    block_number INTEGER,
    transaction_hash TEXT,
    
    -- Cache metadata
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER DEFAULT (strftime('%s', 'now')),
    last_synced INTEGER DEFAULT (strftime('%s', 'now')),
    sync_status TEXT DEFAULT 'synced'
);

-- User profiles and access control cache
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    wallet_address TEXT UNIQUE NOT NULL,
    username TEXT,
    email TEXT,
    profile_image_uri TEXT, -- IPFS hash
    bio TEXT,
    
    -- Role information (cached from AccessControl contract)
    is_organizer BOOLEAN DEFAULT 0,
    is_verified_organizer BOOLEAN DEFAULT 0,
    verification_level TEXT DEFAULT 'basic',
    
    -- Statistics
    events_created INTEGER DEFAULT 0,
    tickets_purchased INTEGER DEFAULT 0,
    last_activity INTEGER,
    
    -- Cache metadata
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER DEFAULT (strftime('%s', 'now')),
    last_synced INTEGER DEFAULT (strftime('%s', 'now')),
    sync_status TEXT DEFAULT 'synced'
);

-- IPFS content cache for fast loading
CREATE TABLE IF NOT EXISTS ipfs_cache (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ipfs_hash TEXT UNIQUE NOT NULL,
    content_type TEXT NOT NULL, -- 'metadata', 'image', 'file'
    content BLOB, -- Cached content
    content_text TEXT, -- For searchable text content
    file_size INTEGER,
    mime_type TEXT,
    
    -- Cache management
    access_count INTEGER DEFAULT 0,
    last_accessed INTEGER DEFAULT (strftime('%s', 'now')),
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    expires_at INTEGER, -- TTL for cache invalidation
    
    -- Pinning status
    is_pinned BOOLEAN DEFAULT 0,
    pin_status TEXT DEFAULT 'unpinned' -- 'pinned', 'unpinned', 'pending'
);

-- Sync queue for managing data synchronization
CREATE TABLE IF NOT EXISTS sync_queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    operation_type TEXT NOT NULL, -- 'create', 'update', 'delete'
    table_name TEXT NOT NULL,
    record_id TEXT NOT NULL,
    data TEXT, -- JSON data for the operation
    priority INTEGER DEFAULT 5, -- 1 (highest) to 10 (lowest)
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    
    -- Status tracking
    status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
    error_message TEXT,
    
    -- Timing
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    scheduled_at INTEGER DEFAULT (strftime('%s', 'now')),
    processed_at INTEGER,
    
    -- Blockchain/IPFS references
    transaction_hash TEXT,
    ipfs_hash TEXT,
    block_number INTEGER
);

-- Search index for full-text search
CREATE VIRTUAL TABLE IF NOT EXISTS search_index USING fts5(
    content,
    type, -- 'event', 'user', 'ticket'
    record_id,
    tokenize = 'porter'
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_events_organizer ON events(organizer_address);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_active ON events(is_active, is_cancelled);
CREATE INDEX IF NOT EXISTS idx_events_sync ON events(sync_status, last_synced);
CREATE INDEX IF NOT EXISTS idx_events_search ON events(search_text);

CREATE INDEX IF NOT EXISTS idx_tickets_owner ON tickets(owner_address);
CREATE INDEX IF NOT EXISTS idx_tickets_event ON tickets(event_id);
CREATE INDEX IF NOT EXISTS idx_tickets_resale ON tickets(is_for_resale);
CREATE INDEX IF NOT EXISTS idx_tickets_sync ON tickets(sync_status, last_synced);

CREATE INDEX IF NOT EXISTS idx_listings_seller ON marketplace_listings(seller_address);
CREATE INDEX IF NOT EXISTS idx_listings_active ON marketplace_listings(is_active);
CREATE INDEX IF NOT EXISTS idx_listings_expiration ON marketplace_listings(expiration_time);

CREATE INDEX IF NOT EXISTS idx_users_wallet ON users(wallet_address);
CREATE INDEX IF NOT EXISTS idx_users_organizer ON users(is_organizer);
CREATE INDEX IF NOT EXISTS idx_users_sync ON users(sync_status, last_synced);

CREATE INDEX IF NOT EXISTS idx_ipfs_hash ON ipfs_cache(ipfs_hash);
CREATE INDEX IF NOT EXISTS idx_ipfs_type ON ipfs_cache(content_type);
CREATE INDEX IF NOT EXISTS idx_ipfs_expires ON ipfs_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_ipfs_accessed ON ipfs_cache(last_accessed);

CREATE INDEX IF NOT EXISTS idx_sync_status ON sync_queue(status, priority);
CREATE INDEX IF NOT EXISTS idx_sync_scheduled ON sync_queue(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_sync_table ON sync_queue(table_name, record_id);

-- Triggers for automatic timestamp updates
CREATE TRIGGER IF NOT EXISTS update_events_timestamp 
    AFTER UPDATE ON events
    BEGIN
        UPDATE events SET updated_at = strftime('%s', 'now') WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS update_tickets_timestamp 
    AFTER UPDATE ON tickets
    BEGIN
        UPDATE tickets SET updated_at = strftime('%s', 'now') WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS update_users_timestamp 
    AFTER UPDATE ON users
    BEGIN
        UPDATE users SET updated_at = strftime('%s', 'now') WHERE id = NEW.id;
    END;

-- Trigger for search index updates
CREATE TRIGGER IF NOT EXISTS update_search_index_events
    AFTER INSERT ON events
    BEGIN
        INSERT INTO search_index(content, type, record_id) 
        VALUES (NEW.search_text, 'event', NEW.event_id);
    END;

CREATE TRIGGER IF NOT EXISTS update_search_index_events_update
    AFTER UPDATE ON events
    BEGIN
        DELETE FROM search_index WHERE type = 'event' AND record_id = OLD.event_id;
        INSERT INTO search_index(content, type, record_id) 
        VALUES (NEW.search_text, 'event', NEW.event_id);
    END;

-- Views for common queries
CREATE VIEW IF NOT EXISTS active_events AS
SELECT * FROM events 
WHERE is_active = 1 AND is_cancelled = 0 AND event_date > strftime('%s', 'now');

CREATE VIEW IF NOT EXISTS user_tickets AS
SELECT t.*, e.title as event_title, e.event_date, e.location
FROM tickets t
JOIN events e ON t.event_id = e.event_id;

CREATE VIEW IF NOT EXISTS marketplace_active AS
SELECT ml.*, t.seat_number, e.title as event_title, e.event_date
FROM marketplace_listings ml
JOIN tickets t ON ml.ticket_token_id = t.token_id AND ml.ticket_contract = t.contract_address
JOIN events e ON t.event_id = e.event_id
WHERE ml.is_active = 1 AND (ml.expiration_time IS NULL OR ml.expiration_time > strftime('%s', 'now'));

-- Cache cleanup procedures (to be called periodically)
-- Clean expired IPFS cache
CREATE VIEW IF NOT EXISTS expired_cache AS
SELECT * FROM ipfs_cache 
WHERE expires_at IS NOT NULL AND expires_at < strftime('%s', 'now');

-- Clean old sync queue entries
CREATE VIEW IF NOT EXISTS old_sync_entries AS
SELECT * FROM sync_queue 
WHERE status IN ('completed', 'failed') 
AND created_at < strftime('%s', 'now', '-7 days');
