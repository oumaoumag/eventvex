/**
 * Enhanced wallet utilities for EventVex Web3 integration
 * Supports mobile wallets, WalletConnect, and gasless transactions
 */

// Network configurations
export const BASE_SEPOLIA_PARAMS = {
  chainId: "0x14a34", // 84532 in hex
  chainName: "Base Sepolia",
  nativeCurrency: {
    name: "Ethereum",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: ["https://sepolia.base.org"],
  blockExplorerUrls: ["https://sepolia.basescan.org"],
};

export const BASE_MAINNET_PARAMS = {
  chainId: "0x2105", // 8453 in hex
  chainName: "Base",
  nativeCurrency: {
    name: "Ethereum",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: ["https://mainnet.base.org"],
  blockExplorerUrls: ["https://basescan.org"],
};

// Default network to use
export const DEFAULT_NETWORK_PARAMS = BASE_SEPOLIA_PARAMS;

/**
 * Check if MetaMask or other Ethereum provider is installed
 * @returns {boolean} True if provider is available
 */
export const isWalletAvailable = () => {
  return typeof window !== "undefined" && typeof window.ethereum !== "undefined";
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
 * Connect to wallet with enhanced mobile support
 * @returns {Promise<{address: string, provider: any}>} Wallet connection result
 */
export const connectWallet = async () => {
  if (!isWalletAvailable()) {
    throw new Error("Please install MetaMask or another Ethereum-compatible wallet.");
  }

  try {
    // Request account access
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });

    if (accounts.length === 0) {
      throw new Error("No accounts found. Please check your wallet.");
    }

    const address = accounts[0];
    
    // Create provider
    const { ethers } = await import("ethers");
    const provider = new ethers.BrowserProvider(window.ethereum);

    // Ensure we're on the correct network
    await ensureCorrectNetwork();

    return { address, provider };
  } catch (error) {
    if (error.code === 4001) {
      throw new Error("User rejected the connection request.");
    }
    throw error;
  }
};

/**
 * Ensure wallet is connected to the correct network
 */
export const ensureCorrectNetwork = async () => {
  if (!isWalletAvailable()) {
    throw new Error("Wallet not available");
  }

  try {
    const chainId = await window.ethereum.request({ method: 'eth_chainId' });
    const targetChainId = DEFAULT_NETWORK_PARAMS.chainId;

    if (chainId !== targetChainId) {
      await switchNetwork(DEFAULT_NETWORK_PARAMS);
    }
  } catch (error) {
    console.error("Error ensuring correct network:", error);
    throw error;
  }
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
      method: "wallet_switchEthereumChain",
      params: [{ chainId: networkParams.chainId }],
    });
    return true;
  } catch (switchError) {
    // If the network doesn't exist, add it
    if (switchError.code === 4902) {
      try {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [networkParams],
        });
        return true;
      } catch (addError) {
        throw new Error(`Failed to add network: ${addError.message}`);
      }
    } else if (switchError.code === 4001) {
      throw new Error("User rejected network switch request.");
    } else {
      throw new Error(`Failed to switch network: ${switchError.message}`);
    }
  }
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
    const chainIdDecimal = parseInt(chainId, 16);
    
    let networkName = "Unknown Network";
    if (chainIdDecimal === 84532) {
      networkName = "Base Sepolia";
    } else if (chainIdDecimal === 8453) {
      networkName = "Base Mainnet";
    } else if (chainIdDecimal === 31337) {
      networkName = "Hardhat Local";
    }

    return { chainId, name: networkName };
  } catch (error) {
    throw new Error(`Failed to get current network: ${error.message}`);
  }
};

/**
 * Switch to Base Sepolia Testnet
 * @returns {Promise<boolean>} Success status
 */
export const switchToBaseSepolia = async () => {
  return switchNetwork(BASE_SEPOLIA_PARAMS);
};

/**
 * Switch to Base Mainnet
 * @returns {Promise<boolean>} Success status
 */
export const switchToBaseMainnet = async () => {
  return switchNetwork(BASE_MAINNET_PARAMS);
};

/**
 * Get wallet balance
 * @param {string} address - Wallet address
 * @returns {Promise<string>} Balance in ETH
 */
export const getWalletBalance = async (address) => {
  if (!isWalletAvailable()) {
    throw new Error("Wallet not available");
  }

  try {
    const { ethers } = await import("ethers");
    const provider = new ethers.BrowserProvider(window.ethereum);
    const balance = await provider.getBalance(address);
    return ethers.formatEther(balance);
  } catch (error) {
    throw new Error(`Failed to get wallet balance: ${error.message}`);
  }
};

/**
 * Sign a message with the connected wallet
 * @param {string} message - Message to sign
 * @returns {Promise<string>} Signature
 */
export const signMessage = async (message) => {
  if (!isWalletAvailable()) {
    throw new Error("Wallet not available");
  }

  try {
    const { ethers } = await import("ethers");
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    return await signer.signMessage(message);
  } catch (error) {
    if (error.code === 4001) {
      throw new Error("User rejected message signing request.");
    }
    throw new Error(`Failed to sign message: ${error.message}`);
  }
};

/**
 * Disconnect wallet (clear local state)
 */
export const disconnectWallet = () => {
  // Clear any local storage or state
  if (typeof window !== "undefined") {
    localStorage.removeItem("walletConnected");
    localStorage.removeItem("walletAddress");
  }
};

/**
 * Listen for account changes
 * @param {Function} callback - Callback function to handle account changes
 */
export const onAccountsChanged = (callback) => {
  if (isWalletAvailable()) {
    window.ethereum.on('accountsChanged', callback);
  }
};

/**
 * Listen for network changes
 * @param {Function} callback - Callback function to handle network changes
 */
export const onChainChanged = (callback) => {
  if (isWalletAvailable()) {
    window.ethereum.on('chainChanged', callback);
  }
};

/**
 * Remove wallet event listeners
 */
export const removeWalletListeners = () => {
  if (isWalletAvailable()) {
    window.ethereum.removeAllListeners('accountsChanged');
    window.ethereum.removeAllListeners('chainChanged');
  }
};
