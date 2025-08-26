import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import {
  connectWallet,
  checkWalletConnection,
  setupWalletListeners,
  formatWalletAddress
} from '../utils/walletUtils';

export default function TicketPurchase() {
  const [quantity, setQuantity] = useState(1);
  const [pricePerTicket, setPricePerTicket] = useState(1); // Replace with actual price
  const [walletAddress, setWalletAddress] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState("");

  // Check wallet connection on component mount
  useEffect(() => {
    const checkConnection = async () => {
      const address = await checkWalletConnection();
      if (address) {
        setWalletAddress(address);
        setIsConnected(true);
      }
    };

    checkConnection();

    // Setup wallet event listeners
    const cleanup = setupWalletListeners({
      onAccountsChanged: (accounts) => {
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
          setIsConnected(true);
        } else {
          setWalletAddress("");
          setIsConnected(false);
        }
      }
    });

    return cleanup;
  }, []);

  // Connect wallet
  const handleConnectWallet = async () => {
    try {
      const { address } = await connectWallet();
      setWalletAddress(address);
      setIsConnected(true);
      setError("");
    } catch (err) {
      setError("Failed to connect wallet: " + err.message);
    }
  };

  // Handle ticket quantity change
  const handleQuantityChange = (event) => {
    setQuantity(Number(event.target.value));
  };

  // Handle purchase
  const handlePurchase = async () => {
    if (!isConnected) {
      setError("Please connect your wallet before purchasing.");
      return;
    }

    const totalCost = ethers.parseEther((quantity * pricePerTicket).toString());

    try {
      // Get wallet connection
      const { signer } = await connectWallet();

      const tx = await signer.sendTransaction({
        to: "0x256ff3b9d3df415a05ba42beb5f186c28e103b2a", // Replace with your smart contract address
        value: totalCost,
      });

      await tx.wait(); // Wait for the transaction to be mined
      alert(`Successfully purchased ${quantity} tickets! Transaction Hash: ${tx.hash}`);
      setError("");
    } catch (err) {
      setError("Transaction failed: " + err.message);
    }
  };

  return (
    <div className="ticket-purchase">
      <h1>Ticket Purchase</h1>

      {!isConnected ? (
        <button onClick={handleConnectWallet}>Connect Wallet</button>
      ) : (
        <p>Connected Wallet: {formatWalletAddress(walletAddress)}</p>
      )}

      <label>
        Quantity:
        <input
          type="number"
          value={quantity}
          onChange={handleQuantityChange}
          min="1"
        />
      </label>

      <p>Price per Ticket: {pricePerTicket} ETH</p>
      <p>Total Cost: {quantity * pricePerTicket} ETH</p>

      <button onClick={handlePurchase}>Complete Purchase</button>

      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}





