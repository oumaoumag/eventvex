/**
 * Network configuration for EventVex smart contracts
 */

const networks = {
  // Local development
  hardhat: {
    chainId: 31337,
    name: "Hardhat Local",
    rpc: "http://127.0.0.1:8545",
    blockExplorer: null,
    nativeCurrency: {
      name: "Ethereum",
      symbol: "ETH",
      decimals: 18,
    },
  },

  localhost: {
    chainId: 31337,
    name: "Localhost",
    rpc: "http://127.0.0.1:8545",
    blockExplorer: null,
    nativeCurrency: {
      name: "Ethereum",
      symbol: "ETH",
      decimals: 18,
    },
  },

  // Base Sepolia Testnet
  baseSepolia: {
    chainId: 84532,
    name: "Base Sepolia",
    rpc: "https://sepolia.base.org",
    blockExplorer: "https://sepolia.basescan.org",
    nativeCurrency: {
      name: "Ethereum",
      symbol: "ETH",
      decimals: 18,
    },
    faucet: "https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet",
    testnet: true,
  },

  // Base Mainnet
  baseMainnet: {
    chainId: 8453,
    name: "Base",
    rpc: "https://mainnet.base.org",
    blockExplorer: "https://basescan.org",
    nativeCurrency: {
      name: "Ethereum",
      symbol: "ETH",
      decimals: 18,
    },
    testnet: false,
  },
};

/**
 * Get network configuration by chain ID
 * @param {number} chainId - The chain ID
 * @returns {object|null} Network configuration or null if not found
 */
function getNetworkByChainId(chainId) {
  return Object.values(networks).find(network => network.chainId === chainId) || null;
}

/**
 * Get network configuration by name
 * @param {string} name - The network name
 * @returns {object|null} Network configuration or null if not found
 */
function getNetworkByName(name) {
  return networks[name] || null;
}

/**
 * Check if network is a testnet
 * @param {string} networkName - The network name
 * @returns {boolean} True if testnet, false otherwise
 */
function isTestnet(networkName) {
  const network = getNetworkByName(networkName);
  return network ? network.testnet === true : false;
}

/**
 * Get all available networks
 * @returns {object} All network configurations
 */
function getAllNetworks() {
  return networks;
}

/**
 * Get testnet networks only
 * @returns {object} Testnet network configurations
 */
function getTestnetNetworks() {
  return Object.fromEntries(
    Object.entries(networks).filter(([, config]) => config.testnet === true)
  );
}

/**
 * Get mainnet networks only
 * @returns {object} Mainnet network configurations
 */
function getMainnetNetworks() {
  return Object.fromEntries(
    Object.entries(networks).filter(([, config]) => config.testnet !== true)
  );
}

module.exports = {
  networks,
  getNetworkByChainId,
  getNetworkByName,
  isTestnet,
  getAllNetworks,
  getTestnetNetworks,
  getMainnetNetworks,
};
