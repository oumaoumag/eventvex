/**
 * EventVex Smart Contract Integration
 * Connects frontend to EventFactory and EventTicket contracts
 */

import { ethers } from 'ethers';
import { connectWallet, switchToBaseSepolia, getCurrentNetwork } from './walletUtils.js';

// Contract ABIs - Import from generated artifacts
import EventFactoryArtifact from '../abi/EventFactory.json';
import EventTicketArtifact from '../abi/EventTicket.json';

// Extract ABIs from artifacts
const EventFactoryABI = EventFactoryArtifact.abi;
const EventTicketABI = EventTicketArtifact.abi;

// Environment configuration
const CHAIN_ID = parseInt(import.meta.env.VITE_CHAIN_ID || '84532');
const FACTORY_ADDRESS = import.meta.env.VITE_EVENT_FACTORY_ADDRESS;
const RPC_URL = import.meta.env.VITE_RPC_URL || 'https://sepolia.base.org';

// Create read-only provider for queries
const provider = new ethers.JsonRpcProvider(RPC_URL);

/**
 * Get EventFactory contract instance
 * @param {boolean} needsSigner - Whether the contract needs a signer for transactions
 * @returns {Promise<ethers.Contract>} EventFactory contract instance
 */
export const getEventFactoryContract = async (needsSigner = false) => {
  console.log('🏢 Getting EventFactory contract...');
  console.log('  - Factory address:', FACTORY_ADDRESS);
  console.log('  - Needs signer:', needsSigner);
  console.log('  - RPC URL:', RPC_URL);
  
  if (!FACTORY_ADDRESS) {
    throw new Error('EventFactory address not configured. Please set VITE_EVENT_FACTORY_ADDRESS in environment.');
  }

  if (needsSigner) {
    console.log('  🔗 Connecting wallet for signer...');
    const { provider: walletProvider } = await connectWallet();
    const signer = await walletProvider.getSigner();
    const contract = new ethers.Contract(FACTORY_ADDRESS, EventFactoryABI, signer);
    console.log('  ✅ Factory contract created with signer');
    return contract;
  }

  console.log('  📶 Using read-only provider...');
  const contract = new ethers.Contract(FACTORY_ADDRESS, EventFactoryABI, provider);
  console.log('  ✅ Factory contract created with provider');
  return contract;
};

/**
 * Get EventTicket contract instance
 * @param {string} eventContractAddress - Address of the EventTicket contract
 * @param {boolean} needsSigner - Whether the contract needs a signer for transactions
 * @returns {Promise<ethers.Contract>} EventTicket contract instance
 */
export const getEventTicketContract = async (eventContractAddress, needsSigner = false) => {
  if (!eventContractAddress) {
    throw new Error('Event contract address is required');
  }

  if (needsSigner) {
    const { provider: walletProvider } = await connectWallet();
    const signer = await walletProvider.getSigner();
    return new ethers.Contract(eventContractAddress, EventTicketABI, signer);
  }

  return new ethers.Contract(eventContractAddress, EventTicketABI, provider);
};

/**
 * Create a new event
 * @param {Object} eventData - Event creation data
 * @returns {Promise<{eventId: number, eventContract: string, txHash: string}>}
 */
export const createEvent = async (eventData) => {
  try {
    // Connect wallet once
    const { provider: walletProvider, signer } = await connectWallet();
    
    // Check if we're on the correct network, switch if needed
    const currentNetwork = await getCurrentNetwork();
    if (currentNetwork.chainId !== '0x14A34') { // Base Sepolia
      await switchToBaseSepolia();
    }

    // Get factory contract using existing signer
    const factory = new ethers.Contract(FACTORY_ADDRESS, EventFactoryABI, signer);

    // Convert data to contract format
    const eventDate = Math.floor(new Date(eventData.date).getTime() / 1000);
    const ticketPriceWei = ethers.parseEther(eventData.ticketPrice.toString());
    const maxResalePriceWei = ethers.parseEther((eventData.ticketPrice * 3).toString()); // Default 3x

    // Validate required parameters
    const title = eventData.name || eventData.title || '';
    const description = eventData.description || '';
    const location = eventData.venue || eventData.location || '';
    const metadataURI = eventData.metadataURI || '';
    const maxTickets = parseInt(eventData.totalTickets || eventData.maxTickets || 100);
    
    if (!title || title.length === 0) {
      throw new Error('Event title is required');
    }
    if (maxTickets <= 0 || maxTickets > 10000) {
      throw new Error('Max tickets must be between 1 and 10000');
    }
    if (eventDate <= Math.floor(Date.now() / 1000)) {
      throw new Error('Event date must be in the future');
    }

    // Create event transaction
    const tx = await factory.createEvent(
      title,
      description,
      location,
      metadataURI,
      eventDate,
      ticketPriceWei,
      maxTickets,
      maxResalePriceWei
    );

    console.log('Event creation transaction sent:', tx.hash);
    const receipt = await tx.wait();
    console.log('Event creation confirmed:', receipt);

    // Parse the EventCreated event to get event ID and contract address
    const eventCreatedEvent = receipt.logs.find(log => {
      try {
        const parsed = factory.interface.parseLog(log);
        return parsed.name === 'EventCreated';
      } catch {
        return false;
      }
    });

    if (!eventCreatedEvent) {
      throw new Error('EventCreated event not found in transaction receipt');
    }

    const parsedEvent = factory.interface.parseLog(eventCreatedEvent);
    const eventId = Number(parsedEvent.args.eventId);
    const eventContract = parsedEvent.args.eventContract;

    return {
      eventId,
      eventContract,
      txHash: tx.hash
    };

  } catch (error) {
    console.error('Error creating event:', error);
    throw new Error(`Failed to create event: ${error.message}`);
  }
};

/**
 * Get all events using hybrid database for fast loading
 * @returns {Promise<Array>} Array of events with full details
 */
export const getActiveEvents = async () => {
  try {
    // Import hybrid database
    const { default: hybridDB } = await import('../database/HybridDB.js');
    
    // Initialize if not already done
    if (!hybridDB.isInitialized) {
      await hybridDB.initialize();
      
      // Seed initial events if database is empty
      const { seedInitialEvents } = await import('./databaseSeeder.js');
      await seedInitialEvents(hybridDB);
    }
    
    // Get events from hybrid database (fast local cache + blockchain sync)
    const events = await hybridDB.getEvents({
      active: true,
      limit: 50,
      forceSync: false // Use cache first, sync in background
    });
    
    console.log(`Loaded ${events?.length || 0} events from hybrid database`);
    
    // Ensure events is an array
    const eventsArray = Array.isArray(events) ? events : [];
    
    // Always check blockchain for new events (not just when database is empty)
    console.log('🔗 Checking blockchain for events...');
    try {
      const factory = await getEventFactoryContract(false);
      const totalEvents = await factory.getTotalEvents();
      console.log(`📊 Total events on blockchain: ${totalEvents}`);
      
      if (Number(totalEvents) > 0) {
        const blockchainEvents = [];
        const maxEvents = Math.min(Number(totalEvents), 20); // Increased limit
        
        for (let i = 0; i < maxEvents; i++) {
          try {
            const eventData = await factory.getEvent(i);
            if (eventData.isActive) {
              let eventDetails = {
                eventId: i,
                eventContract: eventData.eventContract,
                organizer: eventData.organizer,
                isActive: eventData.isActive,
                title: `Blockchain Event ${i}`,
                eventDate: Math.floor(Date.now() / 1000),
                ticketPrice: '1000000000000000',
                maxTickets: 100,
                category: 'Blockchain',
                coverImage: '/src/assets/tig.png'
              };
              
              try {
                const eventContract = await getEventTicketContract(eventData.eventContract, false);
                const eventInfo = await eventContract.eventInfo();
                
                eventDetails = {
                  ...eventDetails,
                  title: eventInfo.title || `Blockchain Event ${i}`,
                  description: eventInfo.description || 'Event created on blockchain',
                  location: eventInfo.location || 'Virtual Event',
                  eventDate: Number(eventInfo.eventDate) || Math.floor(Date.now() / 1000),
                  ticketPrice: eventInfo.ticketPrice ? eventInfo.ticketPrice.toString() : '1000000000000000',
                  maxTickets: Number(eventInfo.maxTickets) || 100
                };
                
                console.log(`✅ Found blockchain event: ${eventDetails.title}`);
              } catch (detailError) {
                console.warn(`Could not fetch details for event ${i}:`, detailError.message);
              }
              
              // Store in database
              await hybridDB.upsertEvent(eventDetails);
              blockchainEvents.push(eventDetails);
            }
          } catch (error) {
            console.warn(`Failed to fetch event ${i}:`, error.message);
          }
        }
        
        console.log(`🎉 Found ${blockchainEvents.length} blockchain events`);
        
        // Merge blockchain events with existing events
        const allEvents = [...eventsArray, ...blockchainEvents];
        return allEvents;
      }
    } catch (blockchainError) {
      console.warn('Blockchain query failed:', blockchainError.message);
    }
    
    // Fallback to seeded events if blockchain fails
    if (eventsArray.length === 0) {
      console.log('No events found, this should not happen after seeding...');

    
    return eventsArray;
  } catch (error) {
    console.error('Error in getActiveEvents:', error);
    return [];
  }
};

/**
 * Get event details by ID
 * @param {number} eventId - Event ID
 * @returns {Promise<Object>} Event details
 */
export const getEventDetails = async (eventId) => {
  console.log(`🔍 Getting event details for ID: ${eventId}`);
  
  try {
    // Validate eventId
    if (eventId === undefined || eventId === null || isNaN(eventId)) {
      throw new Error(`Invalid event ID: ${eventId}`);
    }
    
    console.log('  🏢 Getting factory contract...');
    const factory = await getEventFactoryContract(false);
    
    console.log('  📊 Checking total events...');
    const totalEvents = await factory.getTotalEvents();
    console.log(`  📊 Total events in factory: ${totalEvents}`);
    
    if (eventId >= Number(totalEvents)) {
      throw new Error(`Event ID ${eventId} does not exist. Total events: ${totalEvents}`);
    }
    
    console.log(`  🔍 Fetching event data for ID ${eventId}...`);
    // The getEvent function returns a struct with: eventContract, organizer, isActive
    const eventData = await factory.getEvent(eventId);
    console.log('  ✅ Event data fetched:', {
      eventContract: eventData.eventContract,
      organizer: eventData.organizer,
      isActive: eventData.isActive
    });
    
    // Get additional details from the event contract if needed
    let eventInfo = null;
    if (eventData.eventContract && eventData.eventContract !== '0x0000000000000000000000000000000000000000') {
      try {
        console.log('  🎫 Getting event contract details...');
        const eventContract = await getEventTicketContract(eventData.eventContract, false);
        
        // Try to get event info - this might not exist in all contracts
        try {
          eventInfo = await eventContract.eventInfo();
          console.log('  ✅ Event info fetched:', eventInfo);
        } catch (infoError) {
          console.log('  ⚠️ eventInfo() method not available, using defaults');
          // Create default event info
          eventInfo = {
            title: `Event ${eventId}`,
            description: 'Blockchain event',
            location: 'Virtual Event',
            eventDate: Math.floor(Date.now() / 1000),
            ticketPrice: ethers.parseEther('0.001'),
            maxTickets: 100
          };
        }
      } catch (error) {
        console.warn('  ⚠️ Could not fetch event contract details:', error.message);
      }
    }
    
    const result = {
      id: eventId,
      contractAddress: eventData.eventContract,
      organizer: eventData.organizer,
      isActive: eventData.isActive,
      // Add event info if available
      ...(eventInfo && {
        title: eventInfo.title || `Event ${eventId}`,
        description: eventInfo.description || 'Blockchain event',
        location: eventInfo.location || 'Virtual Event',
        eventDate: eventInfo.eventDate ? new Date(Number(eventInfo.eventDate) * 1000) : new Date(),
        ticketPrice: eventInfo.ticketPrice ? ethers.formatEther(eventInfo.ticketPrice) : '0.001',
        maxTickets: eventInfo.maxTickets ? Number(eventInfo.maxTickets) : 100
      })
    };
    
    console.log('  ✅ Final event details:', result);
    return result;
    
  } catch (error) {
    console.error('❌ Error fetching event details:', error);
    console.error('Error stack:', error.stack);
    
    throw new Error(`Failed to fetch event details: ${error.message}`);
  }
};

/**
 * Purchase a ticket for an event
 * @param {string} eventContractAddress - Event contract address
 * @param {number} seatNumber - Seat number to purchase
 * @param {string} ticketPrice - Ticket price in ETH
 * @returns {Promise<{tokenId: number, txHash: string}>}
 */
export const purchaseTicket = async (eventContractAddress, seatNumber, ticketPrice) => {
  try {
    // Connect wallet once
    const { signer } = await connectWallet();
    
    // Check network and switch if needed
    const currentNetwork = await getCurrentNetwork();
    if (currentNetwork.chainId !== '0x14A34') {
      await switchToBaseSepolia();
    }

    const eventContract = new ethers.Contract(eventContractAddress, EventTicketABI, signer);
    const priceWei = ethers.parseEther(ticketPrice.toString());

    // Purchase ticket
    const tx = await eventContract.mintTicket(seatNumber, {
      value: priceWei
    });

    console.log('Ticket purchase transaction sent:', tx.hash);
    const receipt = await tx.wait();
    console.log('Ticket purchase confirmed:', receipt);

    // Parse the TicketMinted event to get token ID
    const ticketMintedEvent = receipt.logs.find(log => {
      try {
        const parsed = eventContract.interface.parseLog(log);
        return parsed.name === 'TicketMinted';
      } catch {
        return false;
      }
    });

    if (!ticketMintedEvent) {
      throw new Error('TicketMinted event not found in transaction receipt');
    }

    const parsedEvent = eventContract.interface.parseLog(ticketMintedEvent);
    const tokenId = Number(parsedEvent.args.tokenId);

    return {
      tokenId,
      txHash: tx.hash
    };

  } catch (error) {
    console.error('Error purchasing ticket:', error);
    throw new Error(`Failed to purchase ticket: ${error.message}`);
  }
};

/**
 * Get available seats for an event
 * @param {string} eventContractAddress - Event contract address
 * @returns {Promise<number[]>} Array of available seat numbers
 */
export const getAvailableSeats = async (eventContractAddress) => {
  try {
    const eventContract = await getEventTicketContract(eventContractAddress, false);
    const availableSeats = await eventContract.getAvailableSeats();
    return availableSeats.map(seat => Number(seat));
  } catch (error) {
    console.error('Error fetching available seats:', error);
    throw new Error(`Failed to fetch available seats: ${error.message}`);
  }
};

/**
 * List a ticket for resale
 * @param {string} eventContractAddress - Event contract address
 * @param {number} tokenId - Token ID to list
 * @param {string} price - Resale price in ETH
 * @returns {Promise<string>} Transaction hash
 */
export const listTicketForResale = async (eventContractAddress, tokenId, price) => {
  try {
    const { signer } = await connectWallet();
    
    const currentNetwork = await getCurrentNetwork();
    if (currentNetwork.chainId !== '0x14A34') {
      await switchToBaseSepolia();
    }

    const eventContract = new ethers.Contract(eventContractAddress, EventTicketABI, signer);
    const priceWei = ethers.parseEther(price.toString());

    const tx = await eventContract.listForResale(tokenId, priceWei);
    console.log('Ticket listing transaction sent:', tx.hash);
    
    await tx.wait();
    console.log('Ticket listing confirmed');

    return tx.hash;
  } catch (error) {
    console.error('Error listing ticket for resale:', error);
    throw new Error(`Failed to list ticket: ${error.message}`);
  }
};

/**
 * Buy a resale ticket
 * @param {string} eventContractAddress - Event contract address
 * @param {number} tokenId - Token ID to buy
 * @param {string} price - Resale price in ETH
 * @returns {Promise<string>} Transaction hash
 */
export const buyResaleTicket = async (eventContractAddress, tokenId, price) => {
  try {
    const { signer } = await connectWallet();
    
    const currentNetwork = await getCurrentNetwork();
    if (currentNetwork.chainId !== '0x14A34') {
      await switchToBaseSepolia();
    }

    const eventContract = new ethers.Contract(eventContractAddress, EventTicketABI, signer);
    const priceWei = ethers.parseEther(price.toString());

    const tx = await eventContract.buyResaleTicket(tokenId, {
      value: priceWei
    });
    
    console.log('Resale purchase transaction sent:', tx.hash);
    await tx.wait();
    console.log('Resale purchase confirmed');

    return tx.hash;
  } catch (error) {
    console.error('Error buying resale ticket:', error);
    throw new Error(`Failed to buy resale ticket: ${error.message}`);
  }
};

/**
 * Get ticket information
 * @param {string} eventContractAddress - Event contract address
 * @param {number} tokenId - Token ID
 * @returns {Promise<Object>} Ticket information
 */
export const getTicketInfo = async (eventContractAddress, tokenId) => {
  try {
    const eventContract = await getEventTicketContract(eventContractAddress, false);
    const ticketInfo = await eventContract.getTicketInfo(tokenId);
    const owner = await eventContract.ownerOf(tokenId);

    return {
      tokenId,
      seatNumber: Number(ticketInfo.seatNumber),
      purchasePrice: ethers.formatEther(ticketInfo.purchasePrice),
      purchaseTime: new Date(Number(ticketInfo.purchaseTime) * 1000),
      isUsed: ticketInfo.isUsed,
      isForResale: ticketInfo.isForResale,
      resalePrice: ticketInfo.isForResale ? ethers.formatEther(ticketInfo.resalePrice) : null,
      originalOwner: ticketInfo.originalOwner,
      currentOwner: owner
    };
  } catch (error) {
    console.error('Error fetching ticket info:', error);
    throw new Error(`Failed to fetch ticket info: ${error.message}`);
  }
};

/**
 * Get user's tickets for a specific event
 * @param {string} eventContractAddress - Event contract address
 * @param {string} userAddress - User's wallet address
 * @returns {Promise<Array>} Array of user's tickets
 */
export const getUserTickets = async (eventContractAddress, userAddress) => {
  try {
    const eventContract = await getEventTicketContract(eventContractAddress, false);
    const balance = await eventContract.balanceOf(userAddress);
    const tickets = [];

    for (let i = 0; i < balance; i++) {
      const tokenId = await eventContract.tokenOfOwnerByIndex(userAddress, i);
      const ticketInfo = await getTicketInfo(eventContractAddress, Number(tokenId));
      tickets.push(ticketInfo);
    }

    return tickets;
  } catch (error) {
    console.error('Error fetching user tickets:', error);
    throw new Error(`Failed to fetch user tickets: ${error.message}`);
  }
};

/**
 * Validate contract configuration
 * @returns {Promise<boolean>} True if configuration is valid
 */
export const validateContractConfig = async () => {
  try {
    if (!FACTORY_ADDRESS) {
      console.warn('EventFactory address not configured');
      return false;
    }

    const factory = await getEventFactoryContract(false);
    const totalEvents = await factory.getTotalEvents();
    console.log(`EventFactory connected successfully. Total events: ${totalEvents}`);
    
    return true;
  } catch (error) {
    console.error('Contract configuration validation failed:', error);
    return false;
  }
};

// Export contract addresses for reference
export const CONTRACT_ADDRESSES = {
  FACTORY: FACTORY_ADDRESS,
  CHAIN_ID,
  RPC_URL
};
