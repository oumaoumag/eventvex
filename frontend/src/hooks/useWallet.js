import { useState, useEffect, useCallback } from 'react';
import {
  connectWallet,
  checkWalletConnection,
  setupWalletListeners,
  switchNetwork,
  BASE_SEPOLIA_PARAMS,
  isWalletAvailable
} from '../utils/walletUtils';

const EXPECTED_CHAIN_ID = 84532; // Base Sepolia

export const useWallet = () => {
  const [walletAddress, setWalletAddress] = useState(null);
  const [networkId, setNetworkId] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const connect = useCallback(async () => {
    if (!isWalletAvailable()) {
      setError('Please install MetaMask or another Web3 wallet');
      return false;
    }

    try {
      setIsLoading(true);
      setError('');

      const { address, provider } = await connectWallet();
      const network = await provider.getNetwork();

      if (network.chainId !== EXPECTED_CHAIN_ID) {
        await switchNetwork(BASE_SEPOLIA_PARAMS);
      }

      setWalletAddress(address);
      setNetworkId(network.chainId);
      setIsConnected(true);
      localStorage.setItem('wallet_connected', 'true');
      
      return true;
    } catch (error) {
      if (error.code === 4001) {
        setError('Connection cancelled by user');
      } else {
        setError('Connection failed. Please try again');
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setWalletAddress(null);
    setNetworkId(null);
    setIsConnected(false);
    setError('');
    localStorage.removeItem('wallet_connected');
  }, []);

  useEffect(() => {
    const autoReconnect = async () => {
      const lastConnected = localStorage.getItem('wallet_connected');
      if (lastConnected && isWalletAvailable()) {
        const address = await checkWalletConnection();
        if (address) {
          setWalletAddress(address);
          setIsConnected(true);
        }
      }
    };

    autoReconnect();

    const cleanup = setupWalletListeners({
      onAccountsChanged: (accounts) => {
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
          setIsConnected(true);
        } else {
          disconnect();
        }
      },
      onChainChanged: (chainId) => {
        const numericChainId = parseInt(chainId, 16);
        setNetworkId(numericChainId);
        if (numericChainId !== EXPECTED_CHAIN_ID) {
          setError('Wrong network. Please switch to Base Sepolia.');
        } else {
          setError('');
        }
      }
    });

    return cleanup;
  }, [disconnect]);

  return {
    walletAddress,
    networkId,
    isConnected,
    isLoading,
    error,
    isCorrectNetwork: networkId === EXPECTED_CHAIN_ID,
    connect,
    disconnect,
    clearError: () => setError('')
  };
};