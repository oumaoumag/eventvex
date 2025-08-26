
import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import contractABI from "../abi/Ticket.json";
import { Loader2 } from 'lucide-react';
import {
  connectWallet,
  checkWalletConnection,
  setupWalletListeners,
  formatWalletAddress
} from '../utils/walletUtils';
import Chatbit from './Chatbit';

const contractAddress = '0x256ff3b9d3df415a05ba42beb5f186c28e103b2a'; // Replace with your NFT contract address

const MintNFT = () => {
  const [walletAddress, setWalletAddress] = useState(null);
  const [mintingStatus, setMintingStatus] = useState(null);
  const [tokenURI, setTokenURI] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if wallet is already connected
    const checkConnection = async () => {
      const address = await checkWalletConnection();
      if (address) {
        setWalletAddress(address);
      }
    };

    checkConnection();

    // Setup wallet event listeners
    const cleanup = setupWalletListeners({
      onAccountsChanged: (accounts) => {
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
        } else {
          setWalletAddress(null);
        }
      },
      onChainChanged: () => window.location.reload()
    });

    return cleanup;
  }, []);

  const handleConnectWallet = async () => {
    setError(null);
    setIsLoading(true);

    try {
      const { address } = await connectWallet();
      setWalletAddress(address);
    } catch (error) {
      setError(error.message || 'Error connecting wallet');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMintNFT = async () => {
    if (!walletAddress) {
      setError('Please connect your wallet first');
      return;
    }

    if (!tokenURI.trim()) {
      setError('Please provide a valid token URI');
      return;
    }

    setError(null);
    setIsLoading(true);
    setMintingStatus('Initializing minting process...');

    try {
      // Get wallet connection
      const { signer } = await connectWallet();
      const contract = new ethers.Contract(contractAddress, contractABI, signer);

      setMintingStatus('Please confirm the transaction in your wallet...');
      const transaction = await contract.mintNFT(tokenURI);

      setMintingStatus('Transaction submitted. Waiting for confirmation...');
      await transaction.wait();

      setMintingStatus('NFT Minted Successfully! 🎉');
      setTokenURI('');
    } catch (error) {
      console.error('Error minting NFT:', error);
      setError(error.message || 'Error minting NFT. Please try again.');
      setMintingStatus(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-2xl bg-gray-800/50 backdrop-blur-xl p-4 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl shadow-xl border border-gray-700">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-6 sm:mb-8 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            Mint Your NFT
          </h2>

          {!walletAddress ? (
            <div className="text-center mb-6 sm:mb-8">
              <button
                onClick={handleConnectWallet}
                disabled={isLoading}
                className="relative bg-gradient-to-r from-purple-600 to-blue-600 py-2 sm:py-3 px-6 sm:px-8 rounded-lg sm:rounded-xl
                  hover:opacity-90 transition-all duration-300 disabled:opacity-50 text-sm sm:text-base"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin inline" />
                ) : (
                  'Connect Wallet'
                )}
              </button>
            </div>
          ) : (
            <div className="mb-4 sm:mb-6 text-center">
              <div className="inline-block px-3 sm:px-4 py-1 sm:py-2 rounded-lg bg-gray-700/50 border border-gray-600">
                <p className="text-xs sm:text-sm text-gray-300">Connected Wallet</p>
                <p className="text-sm sm:text-md font-mono">{formatWalletAddress(walletAddress)}</p>
              </div>
            </div>
          )}

          <div className="mb-4 sm:mb-6">
            <label className="block text-gray-300 text-sm sm:text-base font-medium mb-1 sm:mb-2" htmlFor="tokenURI">
              Token URI
            </label>
            <input
              type="text"
              id="tokenURI"
              className="w-full p-2 sm:p-3 bg-gray-700/50 border border-gray-600 rounded-lg sm:rounded-xl text-white text-sm sm:text-base
                placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-colors"
              placeholder="Enter token URI (e.g., ipfs://...)"
              value={tokenURI}
              onChange={(e) => setTokenURI(e.target.value)}
            />
          </div>

          <div className="text-center">
            <button
              onClick={handleMintNFT}
              disabled={isLoading || !walletAddress}
              className="relative bg-gradient-to-r from-purple-600 to-blue-600 py-2 sm:py-3 px-6 sm:px-8 rounded-lg sm:rounded-xl
                hover:opacity-90 transition-all duration-300 disabled:opacity-50 text-sm sm:text-base"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin inline" />
              ) : (
                'Mint NFT'
              )}
            </button>
          </div>

          {error && (
            <div className="mt-4 sm:mt-6 text-center">
              <p className="text-red-400 bg-red-400/10 px-3 sm:px-4 py-1 sm:py-2 rounded-lg text-sm sm:text-base">{error}</p>
            </div>
          )}

          {mintingStatus && (
            <div className="mt-4 sm:mt-6 text-center">
              <p className="text-green-400 bg-green-400/10 px-3 sm:px-4 py-1 sm:py-2 rounded-lg text-sm sm:text-base">{mintingStatus}</p>
            </div>
          )}
        </div>
      </div>
      <section>
          <div>
            <Chatbit />
          </div>
        </section>
    </div>
  );
};

export default MintNFT;
