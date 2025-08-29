import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import { ArrowLeft, Calendar, MapPin, User, CreditCard, Shield, CheckCircle } from 'lucide-react';
import {
  connectWallet,
  checkWalletConnection,
  setupWalletListeners,
  formatWalletAddress
} from '../utils/walletUtils';
import { purchaseTicket, buyResaleTicket } from '../utils/contractIntegration';

const TicketPurchasePage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { event, ticket } = location.state || {};
  
  const [walletAddress, setWalletAddress] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [purchaseStep, setPurchaseStep] = useState('review'); // review, processing, success

  useEffect(() => {
    // Redirect if no ticket data
    if (!event || !ticket) {
      navigate('/browse');
      return;
    }

    // Check wallet connection
    const checkConnection = async () => {
      const address = await checkWalletConnection();
      if (address) {
        setWalletAddress(address);
        setIsConnected(true);
      }
    };

    checkConnection();

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
  }, [event, ticket, navigate]);

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

  const handlePurchase = async () => {
    if (!isConnected) {
      setError("Please connect your wallet before purchasing.");
      return;
    }

    setIsLoading(true);
    setPurchaseStep('processing');
    setError("");

    try {
      let result;

      if (ticket.isResale) {
        // Purchase resale ticket using smart contract
        result = await buyResaleTicket(
          event.contractAddress || ticket.contractAddress,
          ticket.tokenId,
          ticket.finalPrice.toString()
        );
      } else {
        // Purchase original ticket using smart contract
        result = await purchaseTicket(
          event.contractAddress,
          ticket.seatNumber || 0, // Use seat number or default to 0
          ticket.finalPrice.toString()
        );
      }

      console.log('Purchase successful:', result);
      setPurchaseStep('success');
      setError("");
    } catch (err) {
      setError("Transaction failed: " + err.message);
      setPurchaseStep('review');
    } finally {
      setIsLoading(false);
    }
  };

  if (!event || !ticket) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Invalid ticket data</div>
      </div>
    );
  }

  if (purchaseStep === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="max-w-md mx-auto bg-black/40 backdrop-blur-xl rounded-2xl border border-green-500/30 p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-4">Purchase Successful!</h2>
          <p className="text-gray-300 mb-6">
            Your ticket for {event.name} has been purchased successfully.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/qrcode')}
              className="w-full py-3 px-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:shadow-lg transition-all"
            >
              View My Tickets
            </button>
            <button
              onClick={() => navigate('/browse')}
              className="w-full py-3 px-4 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all"
            >
              Browse More Events
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Tickets
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Event & Ticket Details */}
          <div className="bg-black/40 backdrop-blur-xl rounded-2xl border border-purple-500/30 p-8">
            <h1 className="text-2xl font-bold text-white mb-6">Purchase Ticket</h1>
            
            {/* Event Info */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-white mb-3">{event.name}</h2>
              <div className="space-y-2 text-sm text-gray-300">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {event.date}
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  {event.location}
                </div>
              </div>
            </div>

            {/* Ticket Details */}
            <div className="border-t border-purple-500/20 pt-6">
              <h3 className="text-lg font-semibold text-white mb-4">Ticket Details</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-300">Type:</span>
                  <span className="text-white">{ticket.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Seat:</span>
                  <span className="text-white">{ticket.seatNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Price:</span>
                  <span className="text-purple-400 font-semibold">{ticket.finalPrice} ETH</span>
                </div>
                {ticket.isResale && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Original Price:</span>
                      <span className="text-gray-400">{ticket.originalPrice} ETH</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Seller:</span>
                      <span className="text-orange-300 text-sm">{ticket.seller}</span>
                    </div>
                    <div className="p-3 bg-orange-500/10 rounded-lg">
                      <p className="text-orange-300 text-sm">
                        This is a resale ticket from another user.
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Payment Section */}
          <div className="bg-black/40 backdrop-blur-xl rounded-2xl border border-purple-500/30 p-8">
            <h2 className="text-xl font-semibold text-white mb-6">Payment</h2>
            
            {/* Wallet Connection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-3">
                <CreditCard className="w-4 h-4 inline mr-2" />
                Wallet Connection
              </label>
              
              {!isConnected ? (
                <button
                  onClick={handleConnectWallet}
                  className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:shadow-lg transition-all"
                >
                  Connect Wallet
                </button>
              ) : (
                <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                  <div className="flex items-center gap-2 text-green-300">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm">Connected: {formatWalletAddress(walletAddress)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Security Notice */}
            <div className="mb-6 p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <div className="flex items-start gap-2">
                <Shield className="w-5 h-5 text-blue-300 mt-0.5" />
                <div>
                  <h4 className="text-blue-300 font-medium mb-1">Secure Transaction</h4>
                  <p className="text-blue-200 text-sm">
                    Your purchase is secured by blockchain technology. All transactions are immutable and verifiable.
                  </p>
                </div>
              </div>
            </div>

            {/* Purchase Summary */}
            <div className="border-t border-purple-500/20 pt-6 mb-6">
              <h3 className="text-lg font-semibold text-white mb-4">Purchase Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">Ticket Price:</span>
                  <span className="text-white">{ticket.finalPrice} ETH</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">Gas Fee:</span>
                  <span className="text-white">~0.001 ETH</span>
                </div>
                <div className="border-t border-purple-500/20 pt-2 mt-3">
                  <div className="flex justify-between font-semibold">
                    <span className="text-white">Total:</span>
                    <span className="text-purple-400">{(ticket.finalPrice + 0.001).toFixed(3)} ETH</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}

            {/* Purchase Button */}
            <button
              onClick={handlePurchase}
              disabled={!isConnected || isLoading || purchaseStep === 'processing'}
              className="w-full py-4 px-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg
                hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed
                transition-all duration-300 font-semibold"
            >
              {purchaseStep === 'processing' ? 'Processing...' : `Purchase Ticket for ${ticket.finalPrice} ETH`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketPurchasePage;
