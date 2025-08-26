'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

export default function WalletConnection() {
  const [walletAddress, setWalletAddress] = useState(null);

  // Function to connect the wallet
  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        // Request account access from MetaMask or other wallet
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });

        // Create a new provider and signer
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();

        // Get wallet address
        const address = await signer.getAddress();
        setWalletAddress(address); // Save wallet address in the state
        console.log('Connected wallet address:', address);
      } catch (error) {
        console.error('Error connecting wallet:', error);
        alert('Failed to connect wallet.');
      }
    } else {
      alert('Please install MetaMask or another Ethereum-compatible wallet to connect.');
    }
  };

  // Function to disconnect the wallet
  const disconnectWallet = () => {
    setWalletAddress(null); // Reset wallet address state
    console.log('Disconnected wallet');
  };

  // Handle account and network changes
  useEffect(() => {
    const handleAccountsChanged = (accounts) => {
      if (accounts.length > 0) {
        setWalletAddress(accounts[0]); // Set the first account address
      } else {
        setWalletAddress(null);
      }
    };

    const handleChainChanged = () => {
      window.location.reload(); // Reload to reflect network changes
    };

    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
    }

    // Cleanup listeners when the component is unmounted
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, []);

  return (
    <div className="flex justify-end p-4">
      <button
        onClick={walletAddress ? disconnectWallet : connectWallet}
        className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm 
          hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 
          focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
      >
        {walletAddress ? `Disconnect (${walletAddress.slice(0, 6)}...)` : 'Connect Wallet'}
      </button>
    </div>
  );
}
