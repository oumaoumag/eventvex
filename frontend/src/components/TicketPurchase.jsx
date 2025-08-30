import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import {
  connectWallet,
  checkWalletConnection,
  setupWalletListeners,
  formatWalletAddress
} from '../utils/walletUtils';
import { purchaseTicket, getAvailableSeats } from '../utils/contractIntegration';

export default function TicketPurchase({
  eventContractAddress,
  ticketPrice = 1,
  eventId,
  onPurchaseSuccess
}) {
  const [quantity, setQuantity] = useState(1);
  const [pricePerTicket, setPricePerTicket] = useState(ticketPrice);
  const [walletAddress, setWalletAddress] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [availableSeats, setAvailableSeats] = useState([]);
  const [selectedSeat, setSelectedSeat] = useState(null);

  // Check wallet connection and load available seats
  useEffect(() => {
    const init = async () => {
      // Check wallet connection
      const address = await checkWalletConnection();
      if (address) {
        setWalletAddress(address);
        setIsConnected(true);
      }

      // Load available seats if event contract address is provided
      if (eventContractAddress) {
        try {
          const seats = await getAvailableSeats(eventContractAddress);
          setAvailableSeats(seats);
          if (seats.length > 0) {
            setSelectedSeat(seats[0]); // Auto-select first available seat
          }
        } catch (error) {
          console.error('Error loading available seats:', error);
          setError('Failed to load available seats');
        }
      }
    };

    init();

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
  }, [eventContractAddress]);

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

    if (!eventContractAddress) {
      setError("Event contract address not provided.");
      return;
    }

    if (selectedSeat === null) {
      setError("Please select a seat.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Purchase ticket using the new smart contract integration
      const result = await purchaseTicket(
        eventContractAddress,
        selectedSeat,
        pricePerTicket.toString()
      );

      console.log('Ticket purchased successfully:', result);
      alert(`Successfully purchased ticket! Seat: ${selectedSeat}, Token ID: ${result.tokenId}, Transaction: ${result.txHash}`);

      // Refresh available seats
      const updatedSeats = await getAvailableSeats(eventContractAddress);
      setAvailableSeats(updatedSeats);

      // Auto-select next available seat
      if (updatedSeats.length > 0) {
        setSelectedSeat(updatedSeats[0]);
      } else {
        setSelectedSeat(null);
      }

      // Call success callback if provided
      if (onPurchaseSuccess) {
        onPurchaseSuccess(result);
      }

    } catch (err) {
      console.error('Purchase failed:', err);
      setError(`Transaction failed: ${err.message}`);
    } finally {
      setIsLoading(false);
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





