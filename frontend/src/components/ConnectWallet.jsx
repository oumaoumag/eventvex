import { useState, useEffect } from 'react';
import toast from 'react-toastify'; // Install react-toastify for notifications
import {
  connectWallet,
  checkWalletConnection,
  setupWalletListeners,
  formatWalletAddress,
  switchNetwork,
  BASE_MAINNET_PARAMS
} from '../utils/walletUtils';

export default function ConnectWalletButton() {
  const [walletAddress, setWalletAddress] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [networkId, setNetworkId] = useState(null);
  const EXPECTED_CHAIN_ID = 8453; // Base Mainnet

  // Function to connect the wallet
  const handleConnectWallet = async () => {
    try {
      setIsConnecting(true);

      // Connect wallet
      const { address, provider } = await connectWallet();

      // Validate the network
      const network = await provider.getNetwork();
      if (network.chainId !== EXPECTED_CHAIN_ID) {
        toast.warn('Switching to Base Mainnet...');
        await switchNetwork(BASE_MAINNET_PARAMS);
      }

      // Set wallet address and network state
      setWalletAddress(address);
      setNetworkId(network.chainId);
      toast.success('Wallet connected successfully!');
    } catch (error) {
      if (error.code === 4001) {
        toast.error('Connection request was rejected.');
      } else {
        toast.error('An unexpected error occurred while connecting the wallet.');
      }
    } finally {
      setIsConnecting(false);
    }
  };

  // Function to disconnect the wallet
  const disconnectWallet = () => {
    setWalletAddress(null);
    setNetworkId(null);
    toast.info('Wallet disconnected.');
  };

  // Handle account and network changes
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
          disconnectWallet();
        }
      },
      onChainChanged: (chainId) => {
        const numericChainId = parseInt(chainId, 16); // Convert hex chainId to decimal
        setNetworkId(numericChainId);

        if (numericChainId !== EXPECTED_CHAIN_ID) {
          toast.warn('You are on the wrong network. Please switch to the Base Mainnet.');
        }
      }
    });

    return cleanup;
  }, []);

  return (
    <div className="text-center">
      {/** Connect Wallet Button */}
      <button
        onClick={handleConnectWallet}
        disabled={isConnecting || walletAddress}
        className={`rounded-md px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm focus:outline-none focus:ring-2 ${
          walletAddress ? 'bg-gray-400' : 'bg-indigo-600 hover:bg-indigo-500 focus:ring-indigo-600'
        }`}
      >
        {isConnecting
          ? 'Connecting...'
          : walletAddress
          ? `Connected: ${formatWalletAddress(walletAddress)}`
          : 'Connect Wallet'}
      </button>

      {/** Display wallet info and disconnect button if connected */}
      {walletAddress && (
        <div className="mt-4">
          <p className="text-lg font-medium text-gray-500">
            Wallet Address: {walletAddress}
          </p>
          <p className="text-lg font-medium text-gray-500">
            Network ID: {networkId}
          </p>
          <button
            onClick={disconnectWallet}
            className="mt-2 rounded-md bg-red-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-600"
          >
            Disconnect Wallet
          </button>
        </div>
      )}
    </div>
  );
}



