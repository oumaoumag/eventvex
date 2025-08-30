import { ethers } from "ethers";

export interface Ticket {
  id: string;
  event: string;
  originalPrice: string;
  currentPrice: string;
  owner: string;
  isForSale: boolean;
  seatNumber: number;
  eventDate: number;
  isUsed: boolean;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  location: string;
  eventDate: number;
  ticketPrice: string;
  maxTickets: number;
  organizer: string;
  isActive: boolean;
  contractAddress: string;
}

export interface Transaction {
  id: string;
  ticketId: string;
  from: string;
  to: string;
  price: number;
  timestamp: number;
  type: 'mint' | 'resale' | 'transfer';
}

/**
 * Enhanced blockchain utilities for EventVex Web3 integration
 */

/**
 * Create a new event using the EventFactory
 * @param factoryContract The EventFactory contract instance
 * @param eventData Event creation parameters
 */
export const createEvent = async (
  factoryContract: ethers.Contract,
  eventData: {
    title: string;
    description: string;
    location: string;
    eventDate: number;
    ticketPrice: string;
    maxTickets: number;
    maxResalePrice: string;
  }
): Promise<{ eventId: number; eventContract: string; tx: ethers.ContractTransaction }> => {
  const ticketPriceWei = ethers.parseEther(eventData.ticketPrice);
  const maxResalePriceWei = ethers.parseEther(eventData.maxResalePrice);

  const tx = await factoryContract.createEvent(
    eventData.title,
    eventData.description,
    eventData.location,
    eventData.eventDate,
    ticketPriceWei,
    eventData.maxTickets,
    maxResalePriceWei
  );

  const receipt = await tx.wait();
  
  // Parse the EventCreated event to get the event ID and contract address
  const eventCreatedLog = receipt.logs.find((log: any) => 
    log.topics[0] === ethers.id("EventCreated(uint256,address,address,string,uint256,uint256,uint256)")
  );

  if (!eventCreatedLog) {
    throw new Error("EventCreated event not found in transaction receipt");
  }

  const eventId = parseInt(eventCreatedLog.topics[1], 16);
  const eventContract = ethers.getAddress("0x" + eventCreatedLog.topics[3].slice(26));

  return { eventId, eventContract, tx };
};

/**
 * Mint a ticket for a specific event
 * @param eventContract The EventTicket contract instance
 * @param seatNumber The seat number to mint
 * @param ticketPrice The ticket price in ETH
 */
export const mintTicket = async (
  eventContract: ethers.Contract,
  seatNumber: number,
  ticketPrice: string
): Promise<ethers.ContractTransaction> => {
  const priceWei = ethers.parseEther(ticketPrice);
  
  const tx = await eventContract.mintTicket(seatNumber, {
    value: priceWei
  });
  
  return tx;
};

/**
 * List a ticket for resale
 * @param eventContract The EventTicket contract instance
 * @param tokenId The token ID to list
 * @param price The resale price in ETH
 */
export const listTicketForResale = async (
  eventContract: ethers.Contract,
  tokenId: number,
  price: string
): Promise<ethers.ContractTransaction> => {
  const priceWei = ethers.parseEther(price);
  
  const tx = await eventContract.listForResale(tokenId, priceWei);
  return tx;
};

/**
 * Buy a resale ticket
 * @param eventContract The EventTicket contract instance
 * @param tokenId The token ID to buy
 * @param price The resale price in ETH
 */
export const buyResaleTicket = async (
  eventContract: ethers.Contract,
  tokenId: number,
  price: string
): Promise<ethers.ContractTransaction> => {
  const priceWei = ethers.parseEther(price);
  
  const tx = await eventContract.buyResaleTicket(tokenId, {
    value: priceWei
  });
  
  return tx;
};

/**
 * Cancel a resale listing
 * @param eventContract The EventTicket contract instance
 * @param tokenId The token ID to unlist
 */
export const cancelResaleListing = async (
  eventContract: ethers.Contract,
  tokenId: number
): Promise<ethers.ContractTransaction> => {
  const tx = await eventContract.unlistFromResale(tokenId);
  return tx;
};

/**
 * Get ticket details
 * @param eventContract The EventTicket contract instance
 * @param tokenId The token ID to get details for
 */
export const getTicketDetails = async (
  eventContract: ethers.Contract,
  tokenId: number
): Promise<Ticket> => {
  const ticketInfo = await eventContract.getTicketInfo(tokenId);
  const eventInfo = await eventContract.eventInfo();
  const owner = await eventContract.ownerOf(tokenId);

  return {
    id: tokenId.toString(),
    event: eventInfo.title,
    originalPrice: ethers.formatEther(ticketInfo.purchasePrice),
    currentPrice: ticketInfo.isForResale ? ethers.formatEther(ticketInfo.resalePrice) : ethers.formatEther(ticketInfo.purchasePrice),
    owner: owner,
    isForSale: ticketInfo.isForResale,
    seatNumber: Number(ticketInfo.seatNumber),
    eventDate: Number(eventInfo.eventDate),
    isUsed: ticketInfo.isUsed,
  };
};

/**
 * Get event details from factory
 * @param factoryContract The EventFactory contract instance
 * @param eventId The event ID
 */
export const getEventDetails = async (
  factoryContract: ethers.Contract,
  eventId: number
): Promise<Event> => {
  const eventData = await factoryContract.getEvent(eventId);

  return {
    id: eventId.toString(),
    title: eventData.title,
    description: "", // Will need to get from event contract
    location: "", // Will need to get from event contract
    eventDate: Number(eventData.eventDate),
    ticketPrice: ethers.formatEther(eventData.ticketPrice),
    maxTickets: Number(eventData.maxTickets),
    organizer: eventData.organizer,
    isActive: eventData.isActive,
    contractAddress: eventData.eventContract,
  };
};

/**
 * Get all active events
 * @param factoryContract The EventFactory contract instance
 */
export const getActiveEvents = async (
  factoryContract: ethers.Contract
): Promise<Event[]> => {
  const activeEvents = await factoryContract.getActiveEvents();
  
  return activeEvents.map((eventData: any, index: number) => ({
    id: eventData.eventId.toString(),
    title: eventData.title,
    description: "",
    location: "",
    eventDate: Number(eventData.eventDate),
    ticketPrice: ethers.formatEther(eventData.ticketPrice),
    maxTickets: Number(eventData.maxTickets),
    organizer: eventData.organizer,
    isActive: eventData.isActive,
    contractAddress: eventData.eventContract,
  }));
};

/**
 * Get available seats for an event
 * @param eventContract The EventTicket contract instance
 */
export const getAvailableSeats = async (
  eventContract: ethers.Contract
): Promise<number[]> => {
  const availableSeats = await eventContract.getAvailableSeats();
  return availableSeats.map((seat: any) => Number(seat));
};

/**
 * Use a ticket (mark as used for event entry)
 * @param eventContract The EventTicket contract instance
 * @param tokenId The token ID to mark as used
 */
export const useTicket = async (
  eventContract: ethers.Contract,
  tokenId: number
): Promise<ethers.ContractTransaction> => {
  const tx = await eventContract.useTicket(tokenId);
  return tx;
};

/**
 * Cancel an event
 * @param eventContract The EventTicket contract instance
 */
export const cancelEvent = async (
  eventContract: ethers.Contract
): Promise<ethers.ContractTransaction> => {
  const tx = await eventContract.cancelEvent();
  return tx;
};

/**
 * Request refund for cancelled event
 * @param eventContract The EventTicket contract instance
 * @param tokenId The token ID to refund
 */
export const requestRefund = async (
  eventContract: ethers.Contract,
  tokenId: number
): Promise<ethers.ContractTransaction> => {
  const tx = await eventContract.requestRefund(tokenId);
  return tx;
};

/**
 * Get user's tickets for a specific event
 * @param eventContract The EventTicket contract instance
 * @param userAddress The user's wallet address
 */
export const getUserTickets = async (
  eventContract: ethers.Contract,
  userAddress: string
): Promise<Ticket[]> => {
  const balance = await eventContract.balanceOf(userAddress);
  const tickets: Ticket[] = [];

  for (let i = 0; i < balance; i++) {
    const tokenId = await eventContract.tokenOfOwnerByIndex(userAddress, i);
    const ticket = await getTicketDetails(eventContract, Number(tokenId));
    tickets.push(ticket);
  }

  return tickets;
};

/**
 * Format wallet address for display
 * @param address Full wallet address
 * @param prefixLength Number of characters to show at start
 * @param suffixLength Number of characters to show at end
 */
export const formatWalletAddress = (
  address: string,
  prefixLength: number = 6,
  suffixLength: number = 4
): string => {
  if (!address) return '';
  return `${address.slice(0, prefixLength)}...${address.slice(-suffixLength)}`;
};

/**
 * Validate Ethereum address
 * @param address Address to validate
 */
export const isValidAddress = (address: string): boolean => {
  try {
    ethers.getAddress(address);
    return true;
  } catch {
    return false;
  }
};
