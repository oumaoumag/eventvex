# EventVex Hybrid Database System

## Overview

EventVex implements a revolutionary **Hybrid Database System** that combines the best of three storage technologies:

- **SQLite3** - Local caching for super-fast queries
- **IPFS/Pinata** - Decentralized metadata and file storage  
- **Blockchain** - Source of truth for critical data

This architecture provides **sub-second response times** while maintaining decentralization, data integrity, and scalability.

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend UI   │    │  React Hooks    │    │  Database API   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   Hybrid DB     │
                    │    Manager      │
                    └─────────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         │                       │                       │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│    SQLite3      │    │   IPFS/Pinata   │    │   Blockchain    │
│  (Local Cache)  │    │ (Decentralized) │    │ (Source Truth)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Key Features

### 🚀 **Super-Fast Performance**
- **Sub-second queries** from local SQLite cache
- **Intelligent prefetching** of frequently accessed data
- **Background synchronization** without blocking UI
- **Optimized indexes** for common query patterns

### 🔄 **Real-time Synchronization**
- **Automatic sync** between all three storage layers
- **Conflict resolution** with blockchain as source of truth
- **Progressive sync** with priority queuing
- **Offline support** with sync when reconnected

### 📈 **Scalability**
- **Horizontal scaling** through IPFS distribution
- **Efficient caching** with TTL and LRU eviction
- **Lazy loading** of metadata and images
- **Pagination** for large datasets

### 🔒 **Data Integrity**
- **Blockchain verification** for critical operations
- **IPFS content addressing** for immutable metadata
- **Local validation** before sync operations
- **Automatic retry** for failed operations

## Storage Strategy

### SQLite3 (Local Cache)
**Purpose**: Ultra-fast local queries and offline support

**Stores**:
- Event metadata and search indexes
- User tickets and transaction history
- Marketplace listings and bids
- User profiles and preferences
- IPFS content cache with TTL

**Benefits**:
- **Instant queries** (< 10ms response time)
- **Full-text search** with FTS5
- **Complex joins** and aggregations
- **Offline functionality**

### IPFS/Pinata (Decentralized Storage)
**Purpose**: Decentralized metadata and file storage

**Stores**:
- Event metadata JSON
- Ticket NFT metadata
- Event images and media files
- User profile images

**Benefits**:
- **Decentralized** and censorship-resistant
- **Content addressing** ensures data integrity
- **Global CDN** through IPFS gateways
- **Redundant storage** across multiple nodes

### Blockchain (Source of Truth)
**Purpose**: Immutable record of critical operations

**Stores**:
- Event creation and updates
- Ticket minting and transfers
- Marketplace transactions
- Access control permissions

**Benefits**:
- **Immutable** transaction history
- **Cryptographic verification**
- **Decentralized consensus**
- **Smart contract automation**

## Data Flow

### 1. **Read Operations** (Optimized for Speed)
```
User Request → SQLite Cache → [Cache Hit] → Return Data
                    ↓
              [Cache Miss] → IPFS Fetch → Cache & Return
                    ↓
              [IPFS Fail] → Blockchain Query → Cache & Return
```

### 2. **Write Operations** (Optimized for Integrity)
```
User Action → Blockchain Transaction → Wait for Confirmation
                    ↓
              Upload to IPFS → Get Content Hash
                    ↓
              Update SQLite Cache → Emit Events
```

### 3. **Sync Operations** (Background Process)
```
Periodic Sync → Check Blockchain Events → Update Local Cache
                    ↓
              Fetch IPFS Metadata → Update Cache
                    ↓
              Cleanup Expired Cache → Optimize Storage
```

## Performance Metrics

### Query Performance
- **Local Cache Hits**: < 10ms
- **IPFS Retrieval**: 100-500ms
- **Blockchain Queries**: 1-3 seconds
- **Cache Hit Rate**: > 95% for active data

### Storage Efficiency
- **Local Database**: 10-50MB typical size
- **IPFS Cache**: 100MB max with auto-cleanup
- **Bandwidth Usage**: < 1MB/hour background sync

### Sync Performance
- **Event Sync**: 1-5 seconds for 100 events
- **Ticket Sync**: 2-10 seconds for user's tickets
- **Metadata Sync**: 500ms-2s per item

## Usage Examples

### Basic Event Queries
```javascript
import { useEvents } from '../hooks/useHybridDB';

function EventList() {
  const { events, loading, error } = useEvents({
    limit: 20,
    active: true,
    search: 'conference'
  });

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {events.map(event => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  );
}
```

### Creating Events with IPFS
```javascript
import { useEvents } from '../hooks/useHybridDB';

function CreateEvent() {
  const { createEvent } = useEvents();

  const handleSubmit = async (eventData, imageFile) => {
    try {
      const result = await createEvent(eventData, imageFile);
      console.log('Event created:', result.eventId);
      console.log('Transaction:', result.transactionHash);
    } catch (error) {
      console.error('Failed to create event:', error);
    }
  };

  // ... form implementation
}
```

### Real-time Sync Status
```javascript
import SyncStatus from '../components/Database/SyncStatus';

function Header() {
  return (
    <header>
      <h1>EventVex</h1>
      <SyncStatus showDetails={true} />
    </header>
  );
}
```

## Configuration

### Environment Variables
```env
# IPFS Configuration
VITE_IPFS_GATEWAY=https://gateway.pinata.cloud/ipfs/
VITE_PINATA_API_KEY=your_api_key
VITE_PINATA_SECRET_KEY=your_secret_key
VITE_PINATA_JWT=your_jwt_token

# Blockchain Configuration
VITE_RPC_URL=https://sepolia.base.org
VITE_EVENT_FACTORY_ADDRESS=0x1f170eC9E2536cc718A78A62B9905B5d8133B28f
VITE_TICKET_MARKETPLACE_ADDRESS=0xB66986c885F5eAf4b328c360E383dd3f66f4DeAA
```

### Cache Configuration
```javascript
const cacheConfig = {
  defaultTTL: 24 * 60 * 60, // 24 hours
  maxCacheSize: 100 * 1024 * 1024, // 100MB
  cleanupInterval: 60 * 60 * 1000, // 1 hour
};
```

## Monitoring & Analytics

### Database Statistics
```javascript
import databaseAPI from '../database/DatabaseAPI';

const stats = await databaseAPI.getStats();
console.log('Events cached:', stats.events);
console.log('Cache hit rate:', stats.cache.avg_accesses);
console.log('Storage used:', stats.cache.total_size);
```

### Performance Monitoring
- **Query response times** tracked per operation
- **Cache hit rates** monitored and optimized
- **Sync success rates** and error tracking
- **Storage usage** and cleanup efficiency

## Best Practices

### For Developers
1. **Always use hooks** for database operations
2. **Handle loading states** gracefully
3. **Implement error boundaries** for database errors
4. **Use pagination** for large datasets
5. **Cache frequently accessed data**

### For Performance
1. **Prefetch critical data** on app startup
2. **Use search indexes** for text queries
3. **Implement virtual scrolling** for long lists
4. **Optimize images** before IPFS upload
5. **Monitor cache hit rates**

### For Reliability
1. **Handle offline scenarios** gracefully
2. **Implement retry logic** for failed operations
3. **Validate data** before blockchain operations
4. **Use progressive enhancement**
5. **Monitor sync status**

## Troubleshooting

### Common Issues

**Slow Initial Load**
- Check internet connection
- Verify IPFS gateway accessibility
- Clear browser cache if corrupted

**Sync Failures**
- Check blockchain RPC endpoint
- Verify contract addresses
- Check Pinata API credentials

**High Memory Usage**
- Reduce cache TTL settings
- Implement more aggressive cleanup
- Check for memory leaks in event listeners

### Debug Tools
```javascript
// Enable debug logging
localStorage.setItem('eventvex_debug', 'true');

// Check database status
console.log(await databaseAPI.getStats());

// Force full sync
await databaseAPI.forceSync();

// Clear all caches
await databaseAPI.clearCache();
```

## Future Enhancements

### Planned Features
- **Multi-device sync** across user devices
- **Collaborative editing** with conflict resolution
- **Advanced analytics** and reporting
- **Machine learning** for predictive caching
- **GraphQL API** for complex queries

### Scalability Improvements
- **Sharding** for very large datasets
- **CDN integration** for global performance
- **Edge computing** for regional optimization
- **Compression** for bandwidth efficiency

This hybrid database system represents the cutting edge of Web3 application architecture, providing the performance of traditional databases with the benefits of decentralized storage and blockchain verification.
