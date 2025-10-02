import { useState, useEffect } from 'react';
import {
  connectWallet,
  checkWalletConnection,
  setupWalletListeners,
  formatWalletAddress,
  switchNetwork,
  BASE_SEPOLIA_PARAMS,
  isWalletAvailable
} from '../utils/walletUtils';

const WalletErrorStates = {
  WALLET_NOT_FOUND: 'Please install MetaMask or another Web3 wallet',
  USER_REJECTED: 'Connection cancelled by user',
  NETWORK_ERROR: 'Please switch to Base Sepolia network',
  UNKNOWN_ERROR: 'Connection failed. Please try again'
};

const isMobile = () => /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

export default function ConnectWalletButton() {
  const [walletAddress, setWalletAddress] = useState(null);
  const [connectionState, setConnectionState] = useState({
    isConnecting: false,
    isSwitchingNetwork: false,
    isValidating: false
  });
  const [networkId, setNetworkId] = useState(null);
  const [error, setError] = useState('');
  const EXPECTED_CHAIN_ID = 84532; // Base Sepolia

  const handleConnectWallet = async () => {
    if (!isWalletAvailable()) {
      if (isMobile()) {
        window.open(`https://metamask.app.link/dapp/${window.location.href}`, '_blank');
        return;
      }
      setError(WalletErrorStates.WALLET_NOT_FOUND);
      return;
    }

    try {
      setConnectionState({ isConnecting: true, isSwitchingNetwork: false, isValidating: false });
      setError('');

      const { address, provider } = await connectWallet();
      
      setConnectionState({ isConnecting: false, isSwitchingNetwork: true, isValidating: false });
      const network = await provider.getNetwork();
      
      if (network.chainId !== EXPECTED_CHAIN_ID) {
        await switchNetwork(BASE_SEPOLIA_PARAMS);
      }

      setConnectionState({ isConnecting: false, isSwitchingNetwork: false, isValidating: true });
      setWalletAddress(address);
      setNetworkId(network.chainId);
      localStorage.setItem('wallet_connected', 'true');
      
    } catch (error) {
      if (error.code === 4001) {
        setError(WalletErrorStates.USER_REJECTED);
      } else if (error.message.includes('network')) {
        setError(WalletErrorStates.NETWORK_ERROR);
      } else {
        setError(WalletErrorStates.UNKNOWN_ERROR);
      }
    } finally {
      setConnectionState({ isConnecting: false, isSwitchingNetwork: false, isValidating: false });
    }
  };

  const disconnectWallet = () => {
    setWalletAddress(null);
    setNetworkId(null);
    setError('');
    localStorage.removeItem('wallet_connected');
  };

  useEffect(() => {
    const autoReconnect = async () => {
      const lastConnected = localStorage.getItem('wallet_connected');
      if (lastConnected && isWalletAvailable()) {
        const address = await checkWalletConnection();
        if (address) {
          setWalletAddress(address);
        }
      }
    };

    autoReconnect();

    const cleanup = setupWalletListeners({
      onAccountsChanged: (accounts) => {
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
        } else {
          disconnectWallet();
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
  }, []);

  const { isConnecting, isSwitchingNetwork, isValidating } = connectionState;
  const isLoading = isConnecting || isSwitchingNetwork || isValidating;
  const isCorrectNetwork = networkId === EXPECTED_CHAIN_ID;

  const getButtonText = () => {
    if (isConnecting) return 'Connecting...';
    if (isSwitchingNetwork) return 'Switching Network...';
    if (isValidating) return 'Validating...';
    if (walletAddress) return `${formatWalletAddress(walletAddress)}`;
    return 'Connect Wallet';
  };

  return (
    <div className="text-center">
      <button
        onClick={handleConnectWallet}
        disabled={isLoading || walletAddress}
        className={`min-h-[44px] w-full sm:w-auto rounded-md px-4 py-2.5 text-sm font-semibold text-white shadow-sm focus:outline-none focus:ring-2 transition-colors ${
          walletAddress ? 'bg-green-600' : 'bg-indigo-600 hover:bg-indigo-500 focus:ring-indigo-600'
        } ${isLoading ? 'opacity-75 cursor-not-allowed' : ''}`}
      >
        {walletAddress && isCorrectNetwork && (
          <span className="inline-block w-2 h-2 bg-green-400 rounded-full mr-2"></span>
        )}
        {getButtonText()}
      </button>

      {error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
          <button
            onClick={() => setError('')}
            className="mt-2 text-xs text-red-500 hover:text-red-700"
          >
            Dismiss
          </button>
        </div>
      )}

      {walletAddress && !isCorrectNetwork && (
        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-sm text-yellow-800">⚠️ Wrong Network</p>
          <button
            onClick={() => switchNetwork(BASE_SEPOLIA_PARAMS)}
            className="mt-2 px-3 py-1 bg-yellow-600 text-white rounded text-xs hover:bg-yellow-700"
          >
            Switch to Base Sepolia
          </button>
        </div>
      )}

      {walletAddress && isCorrectNetwork && (
        <div className="mt-3">
          <p className="text-xs text-green-600">✅ Connected to Base Sepolia</p>
          <button
            onClick={disconnectWallet}
            className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
          >
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
}



