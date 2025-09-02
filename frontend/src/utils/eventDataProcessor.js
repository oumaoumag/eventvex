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
  return {
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
    
    // Price handling
    price: event.ticketPrice ? `${event.ticketPrice} ETH` : 
           event.ticket_price ? `${ethers.formatEther(event.ticket_price)} ETH` : '0 ETH',
    priceValue: parseFloat(event.ticketPrice || ethers.formatEther(event.ticket_price || '0')),
    
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
    imageUrl: event.image_uri ? getIPFSUrl(event.image_uri) : null,
    
    // Status
    isActive: event.isActive !== undefined ? event.isActive : event.is_active !== undefined ? event.is_active : true,
    isCancelled: event.is_cancelled || false,
    
    // Blockchain metadata
    blockNumber: event.block_number,
    transactionHash: event.transaction_hash,
    
    // Generate coordinates if not provided (for map display)
    coordinates: event.coordinates || generateCoordinatesFromLocation(event.location || 'Virtual Event')
  };
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
  const required = ['name', 'date', 'location'];
  const missing = required.filter(field => !event[field] && !event[field.replace(/([A-Z])/g, '_$1').toLowerCase()]);
  
  if (missing.length > 0) {
    console.warn('Event missing required fields:', missing, event);
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