import { ethers } from 'ethers';

// Base Network Configuration
export const BASE_MAINNET_PARAMS = {
  chainId: '0x2105', // 8453 in decimal
  chainName: 'Base Mainnet',
  nativeCurrency: {
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18
  },
  rpcUrls: ['https://mainnet.base.org'],
  blockExplorerUrls: ['https://basescan.org']
};

export const BASE_SEPOLIA_PARAMS = {
  chainId: '0x14A34', // 84532 in decimal
  chainName: 'Base Sepolia Testnet',
  nativeCurrency: {
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18
  },
  rpcUrls: ['https://sepolia.base.org'],
  blockExplorerUrls: ['https://sepolia.basescan.org']
};

// Default network to use
export const DEFAULT_NETWORK_PARAMS = BASE_SEPOLIA_PARAMS;

/**
 * Check if MetaMask or other Ethereum provider is installed
 * @returns {boolean} True if provider is available
 */
export const isWalletAvailable = () => {
  return typeof window.ethereum !== "undefined";
};

/**
 * Check if wallet is already connected
 * @returns {Promise<string|null>} Connected wallet address or null
 */
export const checkWalletConnection = async () => {
  if (!isWalletAvailable()) {
    return null;
  }
  
  try {
    const accounts = await window.ethereum.request({ method: 'eth_accounts' });
    if (accounts.length > 0) {
      return accounts[0];
    }
    return null;
  } catch (error) {
    console.error("Error checking wallet connection:", error);
    return null;
  }
};

/**
 * Connect to wallet
 * @param {Object} networkParams - Network parameters to use (optional)
 * @returns {Promise<{address: string, provider: ethers.BrowserProvider, signer: ethers.Signer}|null>} Wallet info or null if failed
 */
export const connectWallet = async (networkParams = DEFAULT_NETWORK_PARAMS) => {
  if (!isWalletAvailable()) {
    throw new Error("Please install MetaMask or another Ethereum-compatible wallet to connect.");
  }
  
  try {
    // Request account access from MetaMask
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    
    // Try to switch to the desired network
    try {
      await switchNetwork(networkParams);
    } catch (error) {
      console.warn("Failed to switch network during connect:", error);
      // Continue with connection even if network switch fails
    }
    
    // Create an ethers provider
    const provider = new ethers.BrowserProvider(window.ethereum);
    
    // Get the signer
    const signer = await provider.getSigner();
    
    // Get the wallet address
    const address = await signer.getAddress();
    
    return { address, provider, signer };
  } catch (error) {
    console.error("Error connecting wallet:", error);
    throw error;
  }
};

/**
 * Setup event listeners for wallet events
 * @param {Object} handlers - Event handlers
 * @param {Function} handlers.onAccountsChanged - Called when accounts change
 * @param {Function} handlers.onChainChanged - Called when chain changes
 * @param {Function} handlers.onDisconnect - Called on disconnect
 * @returns {Function} Cleanup function to remove listeners
 */
export const setupWalletListeners = ({ onAccountsChanged, onChainChanged, onDisconnect }) => {
  if (!isWalletAvailable()) {
    return () => {};
  }
  
  if (onAccountsChanged) {
    window.ethereum.on('accountsChanged', onAccountsChanged);
  }
  
  if (onChainChanged) {
    window.ethereum.on('chainChanged', onChainChanged);
  }
  
  if (onDisconnect) {
    window.ethereum.on('disconnect', onDisconnect);
  }
  
  // Return cleanup function
  return () => {
    if (onAccountsChanged) {
      window.ethereum.removeListener('accountsChanged', onAccountsChanged);
    }
    if (onChainChanged) {
      window.ethereum.removeListener('chainChanged', onChainChanged);
    }
    if (onDisconnect) {
      window.ethereum.removeListener('disconnect', onDisconnect);
    }
  };
};

/**
 * Format wallet address for display
 * @param {string} address - Full wallet address
 * @param {number} prefixLength - Number of characters to show at start
 * @param {number} suffixLength - Number of characters to show at end
 * @returns {string} Formatted address
 */
export const formatWalletAddress = (address, prefixLength = 6, suffixLength = 4) => {
  if (!address) return '';
  return `${address.slice(0, prefixLength)}...${address.slice(-suffixLength)}`;
};

/**
 * Get the current network the wallet is connected to
 * @returns {Promise<{chainId: string, name: string}>} Current network info
 */
export const getCurrentNetwork = async () => {
  if (!isWalletAvailable()) {
    throw new Error("Please install MetaMask or another Ethereum-compatible wallet.");
  }
  
  try {
    const chainId = await window.ethereum.request({ method: 'eth_chainId' });
    
    // Check if it's one of our known networks
    if (chainId === BASE_MAINNET_PARAMS.chainId) {
      return { chainId, name: BASE_MAINNET_PARAMS.chainName };
    } else if (chainId === BASE_SEPOLIA_PARAMS.chainId) {
      return { chainId, name: BASE_SEPOLIA_PARAMS.chainName };
    } else {
      return { chainId, name: 'Unknown Network' };
    }
  } catch (error) {
    console.error("Error getting current network:", error);
    throw error;
  }
};

/**
 * Switch to Base Mainnet
 * @returns {Promise<boolean>} Success status
 */
export const switchToBase = async () => {
  return switchNetwork(BASE_MAINNET_PARAMS);
};

/**
 * Switch to Base Sepolia Testnet
 * @returns {Promise<boolean>} Success status
 */
export const switchToBaseSepolia = async () => {
  return switchNetwork(BASE_SEPOLIA_PARAMS);
};



/**
 * Switch to a specific network
 * @param {Object} networkParams - Network parameters
 * @returns {Promise<boolean>} Success status
 */
export const switchNetwork = async (networkParams = DEFAULT_NETWORK_PARAMS) => {
  if (!isWalletAvailable()) {
    throw new Error("Please install MetaMask or another Ethereum-compatible wallet.");
  }
  
  try {
    // Try to switch to the network
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: networkParams.chainId }],
    });
    return true;
  } catch (switchError) {
    // This error code indicates that the chain has not been added to MetaMask
    if (switchError.code === 4902) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [networkParams],
        });
        return true;
      } catch (addError) {
        console.error("Error adding network:", addError);
        throw addError;
      }
    }
    console.error("Error switching network:", switchError);
    throw switchError;
  }
};
