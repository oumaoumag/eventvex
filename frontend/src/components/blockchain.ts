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
 * List a ticket for resale
 * @param contract The ticket contract
 * @param tokenId The token ID to list
 * @param price The price in ETH
 */
export const listTicketForResale = async (contract: ethers.Contract, tokenId: number, price: number): Promise<void> => {
  const priceInWei = ethers.parseEther(price.toString());
  const tx = await contract.listTicketForSale(tokenId, priceInWei);
  await tx.wait();
};

/**
 * Buy a resale ticket
 * @param contract The ticket contract
 * @param tokenId The token ID to buy
 * @param price The price in wei
 */
export const buyResaleTicket = async (contract: ethers.Contract, tokenId: number, price: bigint): Promise<void> => {
  const tx = await contract.buyResaleTicket(tokenId, { value: price });
  await tx.wait();
};

/**
 * Cancel a resale listing
 * @param contract The ticket contract
 * @param tokenId The token ID to cancel
 */
export const cancelResaleListing = async (contract: ethers.Contract, tokenId: number): Promise<void> => {
  const tx = await contract.cancelResaleListing(tokenId);
  await tx.wait();
};

/**
 * Get ticket details
 * @param contract The ticket contract
 * @param tokenId The token ID to get details for
 * @returns Ticket details
 */
export const getTicketDetails = async (contract: ethers.Contract, tokenId: number): Promise<Ticket> => {
  const details = await contract.getTicketDetails(tokenId);
  return {
    id: tokenId.toString(),
    event: "Quantum Realm Experience",
    originalPrice: ethers.formatEther(details.price),
    currentPrice: ethers.formatEther(details.price),
    owner: details.owner,
    isForSale: details.isForSale,
  };
};
