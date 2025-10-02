/**
 * Event Data Processor
 * Handles data transformation between blockchain, IPFS, and database formats
 */

import { ethers } from 'ethers';
import { getIPFSUrl } from './ipfs.js';

/**
 * Transform blockchain event data to standardized format
 */
export const transformBlockchainEvent = (event, index) => {
  const transformed = {
    id: event.id || event.event_id || index,
    name: event.title || event.name || `Event ${event.id || index}`,
    title: event.title || event.name || `Event ${event.id || index}`,
    description: event.description || '',
    location: event.location || 'Virtual Event',
    
    // Date handling
    date: event.eventDate ? new Date(event.eventDate).toLocaleDateString() : 
          event.event_date ? new Date(event.event_date * 1000).toLocaleDateString() : 'TBD',
    dateObj: event.eventDate ? new Date(event.eventDate) : 
             event.event_date ? new Date(event.event_date * 1000) : new Date(),
    
    // Price handling - handle both string and BigInt formats with debug logs
    price: (() => {
      console.log(`💰 Processing price for ${event.title || event.name}:`);
      console.log('  - ticketPrice:', event.ticketPrice, typeof event.ticketPrice);
      console.log('  - ticket_price:', event.ticket_price, typeof event.ticket_price);
      
      if (event.ticketPrice) {
        if (typeof event.ticketPrice === 'string' && event.ticketPrice.includes('ETH')) {
          return event.ticketPrice;
        }
        return `${event.ticketPrice} ETH`;
      }
      
      if (event.ticket_price) {
        try {
          // Handle string numbers that can't be converted to BigInt
          if (typeof event.ticket_price === 'string' && event.ticket_price.includes('.')) {
            console.log('  ⚠️ Converting decimal string to ETH directly:', event.ticket_price);
            return `${event.ticket_price} ETH`;
          }
          const formatted = ethers.formatEther(event.ticket_price);
          console.log('  ✅ Formatted with ethers:', formatted);
          return `${formatted} ETH`;
        } catch (error) {
          console.log('  ❌ Error formatting price:', error.message);
          console.log('  🔄 Using raw value:', event.ticket_price);
          return `${event.ticket_price} ETH`;
        }
      }
      
      return '0 ETH';
    })(),
    priceValue: (() => {
      try {
        if (event.ticketPrice) {
          const value = typeof event.ticketPrice === 'string' ? 
            event.ticketPrice.replace(' ETH', '') : event.ticketPrice;
          return parseFloat(value) || 0;
        }
        
        if (event.ticket_price) {
          // Handle string decimals that can't be converted to BigInt
          if (typeof event.ticket_price === 'string' && event.ticket_price.includes('.')) {
            return parseFloat(event.ticket_price) || 0;
          }
          return parseFloat(ethers.formatEther(event.ticket_price)) || 0;
        }
        
        return 0;
      } catch (error) {
        console.log('  ❌ Error parsing price value:', error.message);
        return 0;
      }
    })(),
    
    // Ticket availability
    available: event.maxTickets || event.max_tickets || 0,
    total: event.maxTickets || event.max_tickets || 0,
    ticketsSold: event.tickets_sold || 0,
    
    // Metadata
    category: event.category || 'Blockchain',
    contractAddress: event.contractAddress || event.contract_address,
    organizer: event.organizer || event.organizer_address,
    
    // IPFS data
    metadataUri: event.metadata_uri || event.metadataURI,
    imageUri: event.image_uri || event.imageURI,
    
    // Image handling - prioritize image_url from database enhancement with fallback
    image: event.image_url || 
           (event.image_uri ? getIPFSUrl(event.image_uri) : null) ||
           (event.cover_image) ||
           'src/assets/tig.png', // Default fallback image
    
    // Status
    isActive: event.isActive !== undefined ? event.isActive : event.is_active !== undefined ? event.is_active : true,
    isCancelled: event.is_cancelled || false,
    
    // Blockchain metadata
    blockNumber: event.block_number,
    transactionHash: event.transaction_hash,
    
    // Generate coordinates if not provided (for map display)
    coordinates: (() => {
      console.log(`🗺️ Processing coordinates for ${event.title || event.name}:`);
      console.log('  - existing coordinates:', event.coordinates);
      console.log('  - location:', event.location);
      
      if (event.coordinates && Array.isArray(event.coordinates) && event.coordinates.length === 2) {
        console.log('  ✅ Using existing coordinates:', event.coordinates);
        return event.coordinates;
      }
      
      const generated = generateCoordinatesFromLocation(event.location || event.title || 'Virtual Event');
      console.log('  🔄 Generated coordinates:', generated);
      return generated;
    })()
  };
  
  console.log(`🔄 Transformed event ${transformed.name}:`);
  console.log('  - Original image_url:', event.image_url);
  console.log('  - Final image:', transformed.image);
  console.log('  - Final coordinates:', transformed.coordinates);
  console.log('  - Final price:', transformed.price);
  console.log('  - Final priceValue:', transformed.priceValue);
  
  return transformed;
};

/**
 * Generate approximate coordinates based on location string
 */
const generateCoordinatesFromLocation = (location) => {
  const locationMap = {
    'nairobi': [-1.2921, 36.8219],
    'mombasa': [-4.0435, 39.6682],
    'kisumu': [-0.0917, 34.7680],
    'nakuru': [-0.3031, 36.0800],
    'eldoret': [0.5143, 35.2698],
    'kenya': [-1.2921, 36.8219],
    'san francisco': [37.7749, -122.4194],
    'new york': [40.7128, -74.0060],
    'london': [51.5074, -0.1278],
    'tokyo': [35.6762, 139.6503],
    'austin': [30.2672, -97.7431],
    'miami': [25.7617, -80.1918],
    'virtual': [0, 0]
  };
  
  const locationKey = location.toLowerCase();
  for (const [key, coords] of Object.entries(locationMap)) {
    if (locationKey.includes(key)) {
      return coords;
    }
  }
  
  // Default to random coordinates near Kenya if no match
  return [-1.2921 + (Math.random() - 0.5) * 0.1, 36.8219 + (Math.random() - 0.5) * 0.1];
};

/**
 * Transform ticket data from blockchain/database
 */
export const transformTicketData = (ticket) => {
  return {
    id: ticket.token_id || ticket.tokenId,
    tokenId: ticket.token_id || ticket.tokenId,
    eventId: ticket.event_id || ticket.eventId,
    contractAddress: ticket.contract_address || ticket.contractAddress,
    owner: ticket.owner_address || ticket.owner,
    originalOwner: ticket.original_owner || ticket.originalOwner,
    seatNumber: ticket.seat_number || ticket.seatNumber,
    
    // Price data
    purchasePrice: ticket.purchase_price ? ethers.formatEther(ticket.purchase_price) : 
                   ticket.purchasePrice || '0',
    purchaseTime: ticket.purchase_time ? new Date(ticket.purchase_time * 1000) : 
                  ticket.purchaseTime ? new Date(ticket.purchaseTime) : new Date(),
    
    // Status
    isUsed: ticket.is_used || ticket.isUsed || false,
    isForResale: ticket.is_for_resale || ticket.isForResale || false,
    resalePrice: ticket.resale_price ? ethers.formatEther(ticket.resale_price) : 
                 ticket.resalePrice || null,
    
    // Metadata
    metadataUri: ticket.metadata_uri || ticket.metadataURI,
    
    // Blockchain data
    blockNumber: ticket.block_number || ticket.blockNumber,
    transactionHash: ticket.transaction_hash || ticket.transactionHash
  };
};

/**
 * Validate event data before processing
 */
export const validateEventData = (event) => {
  // Check for title/name
  const hasTitle = event.title || event.name;
  // Check for location (allow empty string, just not undefined/null)
  const hasLocation = event.location !== undefined && event.location !== null;
  // Check for date
  const hasDate = event.event_date || event.eventDate || event.date;
  
  if (!hasTitle || !hasLocation || !hasDate) {
    console.warn('Event missing required fields:', { hasTitle, hasLocation, hasDate }, event);
    return false;
  }
  
  return true;
};

/**
 * Merge event data from multiple sources (blockchain + IPFS + database)
 */
export const mergeEventData = (blockchainData, ipfsData = {}, dbData = {}) => {
  return {
    ...transformBlockchainEvent(blockchainData),
    ...ipfsData,
    // Database data takes precedence for cached fields
    ...(dbData.last_synced && { lastSynced: dbData.last_synced }),
    ...(dbData.sync_status && { syncStatus: dbData.sync_status })
  };
};