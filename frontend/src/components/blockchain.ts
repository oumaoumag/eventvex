/**
 * Legacy blockchain utilities - DEPRECATED
 * Use contractIntegration.js for all new smart contract interactions
 * This file is maintained for backward compatibility only
 */

import { ethers } from "ethers";

export interface Ticket {
  id: string;
  event: string;
  originalPrice: string;
  currentPrice: string;
  owner: string;
  isForSale: boolean;
}

export interface Transaction {
  id: string;
  ticketId: string;
  from: string;
  to: string;
  price: number;
  timestamp: number;
}

/**
 * @deprecated Use contractIntegration.js functions instead
 * Legacy function for backward compatibility
 */
export const listTicketForResale = async (contract: ethers.Contract, tokenId: number, price: number): Promise<void> => {
  console.warn('DEPRECATED: Use contractIntegration.js listTicketForResale instead');
  const priceInWei = ethers.parseEther(price.toString());
  const tx = await contract.listTicketForSale(tokenId, priceInWei);
  await tx.wait();
};

/**
 * @deprecated Use contractIntegration.js functions instead
 * Legacy function for backward compatibility
 */
export const buyResaleTicket = async (contract: ethers.Contract, tokenId: number, price: bigint): Promise<void> => {
  console.warn('DEPRECATED: Use contractIntegration.js purchaseTicket instead');
  const tx = await contract.buyResaleTicket(tokenId, { value: price });
  await tx.wait();
};

/**
 * @deprecated Use contractIntegration.js functions instead
 * Legacy function for backward compatibility
 */
export const cancelResaleListing = async (contract: ethers.Contract, tokenId: number): Promise<void> => {
  console.warn('DEPRECATED: Use contractIntegration.js functions instead');
  const tx = await contract.cancelResaleListing(tokenId);
  await tx.wait();
};

/**
 * @deprecated Use contractIntegration.js functions instead
 * Legacy function for backward compatibility
 */
export const getTicketDetails = async (contract: ethers.Contract, tokenId: number): Promise<Ticket> => {
  console.warn('DEPRECATED: Use contractIntegration.js getUserTickets instead');
  const details = await contract.getTicketDetails(tokenId);
  return {
    id: tokenId.toString(),
    event: "Legacy Event",
    originalPrice: ethers.formatEther(details.price || 0),
    currentPrice: ethers.formatEther(details.price || 0),
    owner: details.owner || '',
    isForSale: details.isForSale || false,
  };
};
