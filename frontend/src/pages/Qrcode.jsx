import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import QRCode from 'react-qr-code';
import { ethers } from 'ethers';
import { Shield, CheckCircle, XCircle, RefreshCw, Ticket, Lock, Scan, Globe, AlertTriangle, ArrowLeft } from 'lucide-react';

// Minimal ABI for ticket verification contract
const MINIMAL_ABI = [
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "ticketId",
        "type": "string"
      }
    ],
    "name": "verifyTicket",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

// Use environment variable for contract address
const CONTRACT_ADDRESS = import.meta.env.VITE_EVENT_FACTORY_ADDRESS || '0x4f0fcF4af03569d543d1988d80d358DC40aBd56c';

const QRVerificationSystem = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Get the selected ticket from navigation state
  const ticketFromCollection = location.state?.selectedTicket;

  // State Management
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [qrData, setQrData] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(ticketFromCollection || null);
  const [contract, setContract] = useState(null);
  const [error, setError] = useState(null);
  const [connected, setConnected] = useState(false);
  const [provider, setProvider] = useState(null);
  const [isInitializing, setIsInitializing] = useState(false);

  // Auto-generate QR code if ticket is passed from collection
  useEffect(() => {
    if (ticketFromCollection) {
      generateQRCode(ticketFromCollection);
    }
  }, [ticketFromCollection]);

  // Network Switching Utility
  const switchToBaseNetwork = async () => {
    if (!window.ethereum) {
      throw new Error('MetaMask is not installed');
    }

    const baseChainId = '0x2105';
    const baseParams = {
      chainId: baseChainId,
      chainName: 'Base Network',
      nativeCurrency: {
        name: 'ETH',
        symbol: 'ETH',
        decimals: 18
      },
      rpcUrls: ['https://mainnet.base.org'],
      blockExplorerUrls: ['https://basescan.org/']
    };

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: baseChainId }]
      });
    } catch (switchError) {
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [baseParams]
          });
        } catch (addError) {
          console.error('Error adding Base network', addError);
          throw addError;
        }
      } else {
        throw switchError;
      }
    }
  };

  // Initialize Connection and Event Listeners
  useEffect(() => {
    let mounted = true;

    const checkConnection = async () => {
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({
            method: 'eth_accounts'
          });
          
          if (accounts && accounts.length > 0 && mounted) {
            await initializeContract();
          }
        } catch (err) {
          console.error('Connection check error:', err);
        }
      }
    };

    checkConnection();

    return () => {
      mounted = false;
    };
  }, []);

  // Metamask Event Listeners
  useEffect(() => {
    if (window.ethereum) {
      const handleChainChanged = () => window.location.reload();

      const handleAccountsChanged = async (accounts) => {
        if (accounts.length === 0) {
          setConnected(false);
          setContract(null);
          setProvider(null);
        } else {
          await initializeContract();
        }
      };

      window.ethereum.on('chainChanged', handleChainChanged);
      window.ethereum.on('accountsChanged', handleAccountsChanged);

      return () => {
        window.ethereum.removeListener('chainChanged', handleChainChanged);
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      };
    }
  }, []);

  // Contract Initialization
  const initializeContract = async () => {
    if (isInitializing) return;
    
    try {
      setIsInitializing(true);
      
      if (!window.ethereum) {
        throw new Error('MetaMask is not installed');
      }

      await switchToBaseNetwork();

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      const network = await provider.getNetwork();
      if (network.chainId !== 8453n) {
        throw new Error('Not connected to Base network');
      }

      const ticketContract = new ethers.Contract(
        CONTRACT_ADDRESS,
        MINIMAL_ABI,
        signer
      );

      setProvider(provider);
      setContract(ticketContract);
      setConnected(true);
      setError(null);
    } catch (err) {
      console.error('Contract initialization error:', err);
      setError(err.message);
      setConnected(false);
    } finally {
      setIsInitializing(false);
    }
  };

  // Wallet Connection
  const connectWallet = async () => {
    if (isInitializing) return;
    
    try {
      setIsInitializing(true);
      await window.ethereum.request({
        method: 'eth_requestAccounts'
      });
      await initializeContract();
    } catch (err) {
      console.error('Wallet connection error:', err);
      setError(err.message);
    } finally {
      setIsInitializing(false);
    }
  };

  // QR Code Generation
  const generateQRCode = (ticketData) => {
    setSelectedTicket(ticketData);
    const qrString = JSON.stringify({
      ticketId: ticketData.id,
      txHash: ticketData.txHash,
      timestamp: Date.now()
    });
    setQrData(qrString);
  };

  // Ticket Verification
  const verifyTicketOnBlockchain = async () => {
    if (!selectedTicket) {
      setError('Please select a ticket to verify');
      return;
    }

    if (!connected || !contract) {
      setError('Please connect your wallet first');
      return;
    }

    try {
      setIsVerifying(true);
      setError(null);

      await switchToBaseNetwork();

      const tx = await contract.verifyTicket(selectedTicket.id);
      const receipt = await tx.wait();
      
      if (receipt.status === 1) {
        setVerificationStatus('success');
      } else {
        setVerificationStatus('error ');
        throw new Error('Transaction failed');
      }
    } catch (err) {
      console.error('Verification error:', err);
      if (err.code === 4001) {
        // User rejected the transaction, reset the verification status without showing an error
        setVerificationStatus(null);
      } else if (err.code === -32602) {
        setError('Invalid request. Please check your MetaMask connection.');
        setVerificationStatus('error');
      } else {
        setError(err.message || 'Verification failed');
        setVerificationStatus('error');
      }
    } finally {
      setIsVerifying(false);
    }
  };

  // If no ticket is provided and user accessed directly, show message
  if (!ticketFromCollection && !selectedTicket) {
    return (
      <div className="min-h-screen bg-black text-white p-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-purple-900/20 backdrop-blur-xl rounded-xl p-12 border border-purple-500/20">
            <Ticket className="w-16 h-16 mx-auto mb-6 text-purple-400 opacity-50" />
            <h1 className="text-3xl font-bold mb-4 text-white">No Ticket Selected</h1>
            <p className="text-gray-400 mb-8 max-w-md mx-auto">
              To verify a ticket, please go to your collection and select the ticket you want to verify.
            </p>
            <button
              onClick={() => navigate('/collection')}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 rounded-lg text-white font-medium transition-all duration-300 transform hover:scale-105"
            >
              Go to Collection
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-7xl mx-auto relative">
        {/* Connection Status */}
        <div className="mb-4 text-center">
          {!connected ? (
            <button
              onClick={connectWallet}
              disabled={isInitializing}
              className={`px-4 py-2 bg-purple-600 rounded-lg transition-colors ${
                isInitializing ? 'opacity-50 cursor-not-allowed' : 'hover:bg-purple-500'
              }`}
            >
              {isInitializing ? 'Connecting...' : 'Connect Wallet'}
            </button>
          ) : (
            <span className="text-green-400 flex items-center justify-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Wallet Connected
            </span>
          )}
        </div>


        {/* Back Button */}
        {ticketFromCollection && (
          <div className="mb-6">
            <button
              onClick={() => navigate('/collection')}
              className="flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Collection
            </button>
          </div>
        )}

        {/* Main Content */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-blue-400
            bg-clip-text text-transparent">
            Ticket Verification
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Secure ticket verification powered by Base blockchain technology.
            Verify your ticket authenticity with QR code scanning.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Ticket Information */}
          <div className="space-y-6">
            <div className="bg-purple-900/20 backdrop-blur-xl rounded-xl p-6 border border-purple-500/20">
              <h2 className="text-xl font-semibold mb-6 flex items-center">
                <Ticket className="w-5 h-5 mr-2 text-purple-400" />
                Ticket Details
              </h2>

              {selectedTicket ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-lg border border-purple-500/20 bg-purple-900/40">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="font-semibold text-purple-300 text-lg">{selectedTicket.event}</h3>
                      <span className="text-sm text-gray-400 bg-gray-800 px-2 py-1 rounded">{selectedTicket.id}</span>
                    </div>
                    <div className="grid grid-cols-1 gap-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Date:</span>
                        <span className="text-white">{selectedTicket.date}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Venue:</span>
                        <span className="text-white">{selectedTicket.venue}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Price:</span>
                        <span className="text-white font-semibold">{selectedTicket.price}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Transaction:</span>
                        <span className="text-white font-mono text-xs truncate max-w-32">{selectedTicket.txHash}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-400 py-8">
                  <Ticket className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  No ticket selected for verification
                </div>
              )}
            </div>
          </div>

          {/* QR Code and Verification */}
          <div className="space-y-6">
            <div className="bg-purple-900/20 backdrop-blur-xl rounded-xl p-6 border border-purple-500/20">
              <h2 className="text-xl font-semibold mb-6 flex items-center">
                <Scan className="w-5 h-5 mr-2 text-purple-400" />
                Verification QR Code
              </h2>

              <div className="flex justify-center p-8">
                {qrData ? (
                  <div className="text-center">
                    <div className="bg-white p-4 rounded-xl mb-4 inline-block">
                      <QRCode value={qrData} size={200} />
                    </div>
                    <p className="text-sm text-gray-400">
                      Scan this QR code to verify ticket authenticity
                    </p>
                  </div>
                ) : (
                   <div className="text-gray-400 text-center">
                    <Globe className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    {selectedTicket ? 'Generating QR code...' : 'No ticket available for verification'}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-purple-900/20 backdrop-blur-xl rounded-xl p-6 border border-purple-500/20">
              <h2 className="text-xl font-semibold mb-6 flex items-center">
                <Shield className="w-5 h-5 mr-2 text-purple-400" />
                Verification Status
              </h2>
              
              <div className="text-center">
                {isVerifying ? (
                  <div className="animate-pulse">
                    <RefreshCw className="w-16 h-16 mx-auto mb-4 text-purple-400 animate-spin" />
                    <p>Verifying on Base Network...</p>
                  </div>
                ) : verificationStatus === 'success' ? (
                  <div className="text-green-400">
                    <CheckCircle className="w-16 h-16 mx-auto mb-4" />
                    <p>Ticket Verified Successfully!</p>
                  </div>
                ) : verificationStatus === 'error' ? (
                  <div className="text-red-400">
                    <XCircle className="w-16 h-16 mx-auto mb-4" />
                    <p>Verification Failed</p>
                  </div>
                ) : (
                  <div className="text-gray-400">
                    <Lock className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>Ready to verify ticket</p>
                  </div>
                )}

                {qrData && !isVerifying && (
                  <button
                    onClick={verifyTicketOnBlockchain}
                    disabled={!connected}
                    className={`mt-6 px-8 py-3 rounded-lg flex items-center justify-center space-x-2 mx-auto
                      ${connected 
                        ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 cursor-pointer'
                        : 'bg-gray-600 cursor-not-allowed'}`}
                  >
                    <Shield className="w-5 h-5" />
                    <span>Verify on Base</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRVerificationSystem;

