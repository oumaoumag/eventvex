import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Wallet, ImageIcon, Sparkles, ChevronRight, Plus, MinusCircle, Loader, AlertCircle } from 'lucide-react';
import { 
  BASE_MAINNET_PARAMS, 
  BASE_SEPOLIA_PARAMS, 
  switchNetwork,
  getCurrentNetwork
} from '../utils/walletUtils';

// Choose the appropriate network (Base Mainnet as default)
const NETWORK_PARAMS = BASE_MAINNET_PARAMS;

// Replace with your actual contract address and ABI
const CONTRACT_ADDRESS = "0x256ff3b9d3df415a05ba42beb5f186c28e103b2a";
const CONTRACT_ABI = [
  "function mint(uint256 quantity) public payable",
  "function totalSupply() public view returns (uint256)",
  "function maxSupply() public view returns (uint256)",
  "function balanceOf(address owner) public view returns (uint256)"
];

const Ticket = () => {
  // UI States
  const [isVisible, setIsVisible] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [selectedPreview, setSelectedPreview] = useState(0);

  // Wallet & Contract States
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [mintCount, setMintCount] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // NFT States
  const [totalMinted, setTotalMinted] = useState(0);
  const [maxSupply, setMaxSupply] = useState(10000);
  const [userBalance, setUserBalance] = useState(0);

  const PRICE_PER_NFT = 0.005; // ETH for Base network

  const previewImages = [
    "/src/assets/summit.png",
    "/src/assets/chairstables.jpg",
    "/src/assets/rb.png",
    "/src/assets/rb2.png",
    "/src/assets/ast.png",
    "/src/assets/rb1.png",
    "/src/assets/im.png"
  ];

  useEffect(() => {
    setIsVisible(true);
    checkWalletConnection();
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', () => window.location.reload());
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      }
    };
  }, []);

  useEffect(() => {
    if (isWalletConnected) {
      updateContractInfo();
    }
  }, [isWalletConnected]);

  const handleAccountsChanged = (accounts) => {
    if (accounts.length === 0) {
      // User disconnected wallet
      setIsWalletConnected(false);
      setWalletAddress('');
    } else {
      // User switched accounts
      setWalletAddress(accounts[0]);
    }
  };

  const checkWalletConnection = async () => {
    if (typeof window.ethereum !== "undefined") {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
          setIsWalletConnected(true);
        }
      } catch (error) {
        console.error("Error checking wallet connection:", error);
      }
    }
  };

  const updateContractInfo = async () => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

      console.log("Fetching contract info...");

      const supply = await contract.totalSupply().catch(e => {
        console.error("Error fetching totalSupply:", e);
        return "N/A";
      });
      const max = await contract.maxSupply().catch(e => {
        console.error("Error fetching maxSupply:", e);
        return "N/A";
      });
      const balance = await contract.balanceOf(walletAddress).catch(e => {
        console.error("Error fetching balanceOf:", e);
        return "N/A";
      });

      console.log("Contract info fetched:", { supply, max, balance });

      setTotalMinted(supply === "N/A" ? 0 : Number(supply));
      setMaxSupply(max === "N/A" ? 10000 : Number(max));
      setUserBalance(balance === "N/A" ? 0 : Number(balance));
    } catch (error) {
      console.error("Error updating contract info:", error);
      setError("Failed to fetch contract information. Please check your connection and try again.");
    }
  };

  const connectWallet = async () => {
    if (typeof window.ethereum === "undefined") {
      setError("Please install MetaMask to connect your wallet!");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Request account access and switch to desired network using the imported function
      try {
        await switchNetwork(NETWORK_PARAMS);
      } catch (switchError) {
        console.warn("Network switch error:", switchError);
        // Continue connecting even if network switch fails
      }

      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      if (accounts.length > 0) {
        setWalletAddress(accounts[0]);
        setIsWalletConnected(true);
      }
    } catch (error) {
      console.error("Error connecting wallet:", error);
      setError("Failed to connect wallet. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const checkBalance = async (requiredAmount) => {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const balance = await provider.getBalance(walletAddress);
    return balance >= requiredAmount;
  };

  const handleMint = async () => {
    if (!isWalletConnected) {
      await connectWallet();
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      // Calculate price in wei
      const priceInEth = (PRICE_PER_NFT * mintCount).toString();
      const priceInWei = ethers.parseEther(priceInEth);

      // Check user's balance
      const hasEnoughBalance = await checkBalance(priceInWei);
      if (!hasEnoughBalance) {
        throw new Error("Insufficient funds to complete the transaction.");
      }

      // Estimate gas to check if transaction will fail
      const estimatedGas = await contract.mint.estimateGas(mintCount, { value: priceInWei });

      // Add 10% buffer to estimated gas
      const gasLimit = estimatedGas * BigInt(110) / BigInt(100);

      // Execute transaction
      const tx = await contract.mint(mintCount, {
        value: priceInWei,
        gasLimit: gasLimit
      });

      // Wait for confirmation
      await tx.wait();

      // Update contract info
      await updateContractInfo();

      // Show success message
      alert(`Successfully minted ${mintCount} NFT${mintCount > 1 ? 's' : ''}!`);
    } catch (error) {
      console.error("Error minting NFT:", error);
      setError(error.message || "Failed to mint NFT. Please check your balance and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const formatAddress = (address) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 opacity-20">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-pulse"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              width: `${Math.random() * 300}px`,
              height: `${Math.random() * 300}px`,
              background: 'radial-gradient(circle, rgba(147,51,234,0.3) 0%, rgba(0,0,0,0) 70%)',
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${5 + Math.random() * 5}s`
            }}
          />
        ))}
      </div>

      {/* Main Content */}
      <main className="relative pt-12 sm:pt-16 md:pt-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          {/* Title Section */}
          <div className={`text-center mb-8 sm:mb-12 md:mb-16 transition-all duration-1000
            ${isVisible ? 'translate-y-0 opacity-100' : '-translate-y-20 opacity-0'}`}>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6">
              <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                Quantum Realm of Ticket Collection
              </span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-gray-400 max-w-xs sm:max-w-lg md:max-w-2xl mx-auto">
              Enter the quantum realm with an exclusive ticket to our unique experience. Each ticket grants you access to a one-of-a-kind event, digitally stored and verified on the blockchain.
            </p>
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-center">
            {/* Left Side - Preview */}
            <div className={`transition-all duration-1000 delay-300
              ${isVisible ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'}`}>
              <div className="relative group">
                {/* Main Preview */}
                <div className="relative aspect-square rounded-xl sm:rounded-2xl overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-blue-500/20
                    group-hover:opacity-70 transition-opacity duration-300" />
                  <img
                    src={previewImages[selectedPreview] || "/placeholder.svg"}
                    alt="NFT Preview"
                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                  />
                </div>

                {/* Preview Selector */}
                <div className="flex space-x-2 sm:space-x-4 mt-4 overflow-x-auto pb-2">
                  {previewImages.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedPreview(index)}
                      className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden flex-shrink-0
                        ${selectedPreview === index ? 'ring-2 ring-purple-500' : ''}
                        transition-all duration-300 transform hover:scale-105`}
                    >
                      <img
                        src={previewImages[index] || "/placeholder.svg"}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Side - Minting Interface */}
            <div className={`mt-8 lg:mt-0 transition-all duration-1000 delay-500
              ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}>
              <div className="bg-gray-900/50 backdrop-blur-xl rounded-xl sm:rounded-2xl border border-purple-500/30 p-4 sm:p-6 md:p-8">
                {/* Price Info */}
                <div className="mb-6 sm:mb-8">
                  <h2 className="text-xl sm:text-2xl font-bold mb-2">Purchase Your Ticket</h2>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-400 to-blue-400
                      bg-clip-text text-transparent">{PRICE_PER_NFT} ETH</span>
                    <span className="text-sm sm:text-base text-gray-400">per ticket</span>
                  </div>
                </div>

                {/* Wallet Connection */}
                {!isWalletConnected ? (
                  <button
                    onClick={connectWallet}
                    disabled={isLoading}
                    className="w-full group relative px-4 sm:px-6 py-3 sm:py-4 rounded-xl overflow-hidden mb-4 sm:mb-6 text-sm sm:text-base"
                    onMouseEnter={() => setIsHovering(true)}
                    onMouseLeave={() => setIsHovering(false)}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600
                      group-hover:from-purple-500 group-hover:to-blue-500 transition-colors duration-300" />
                    <div className="relative z-10 flex items-center justify-center space-x-2">
                      {isLoading ? (
                        <Loader className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                      ) : (
                        <Wallet className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-300
                          ${isHovering ? 'rotate-12' : ''}`} />
                      )}
                      <span>{isLoading ? 'Connecting...' : 'Connect Wallet'}</span>
                    </div>
                  </button>
                ) : (
                  <div className="mb-4 sm:mb-6">
                    <div className="flex items-center justify-between p-3 sm:p-4 rounded-lg sm:rounded-xl bg-purple-500/10
                      border border-purple-500/30">
                      <div className="flex items-center space-x-2">
                        <Wallet className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
                        <span className="text-xs sm:text-sm">{formatAddress(walletAddress)}</span>
                      </div>
                      <button
                        className="text-xs sm:text-sm text-purple-400 hover:text-purple-300 transition-colors"
                        onClick={() => setIsWalletConnected(false)}
                      >
                        Disconnect
                      </button>
                    </div>
                  </div>
                )}

                {/* Mint Amount Selector */}
                <div className="mb-6 sm:mb-8">
                  <label className="block text-xs sm:text-sm text-gray-400 mb-2">Quantity</label>
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    <button
                      onClick={() => setMintCount(Math.max(1, mintCount - 1))}
                      className="p-1.5 sm:p-2 rounded-lg bg-purple-500/10 hover:bg-purple-500/20
                        transition-colors duration-300"
                      disabled={isLoading}
                    >
                      <MinusCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                    </button>
                    <span className="text-xl sm:text-2xl font-bold w-12 sm:w-16 text-center">{mintCount}</span>
                    <button
                      onClick={() => setMintCount(Math.min(10, mintCount + 1))}
                      className="p-1.5 sm:p-2 rounded-lg bg-purple-500/10 hover:bg-purple-500/20
                        transition-colors duration-300"
                      disabled={isLoading}
                    >
                      <Plus className="w-5 h-5 sm:w-6 sm:h-6" />
                    </button>
                  </div>
                </div>

                {/* Total Price */}
                <div className="flex justify-between items-center mb-6 sm:mb-8 p-3 sm:p-4 rounded-lg sm:rounded-xl bg-purple-500/10">
                  <span className="text-sm sm:text-base text-gray-400">Total Price:</span>
                  <span className="text-xl sm:text-2xl font-bold">
                    {(0.08 * mintCount).toFixed(2)} ETH
                  </span>
                </div>

                {/* Mint Button */}
                <button
                  onClick={handleMint}
                  disabled={!isWalletConnected || isLoading}
                  className={`w-full group relative px-4 sm:px-6 py-3 sm:py-4 rounded-xl overflow-hidden text-sm sm:text-base
                    ${!isWalletConnected || isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600" />
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 opacity-0
                    group-hover:opacity-50 transition-opacity duration-300" />
                  <div className="relative z-10 flex items-center justify-center space-x-2">
                    {isLoading ? (
                      <Loader className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                    )}
                    <span>{isLoading ? 'Purchasing...' : 'Buy Now'}</span>
                  </div>
                </button>

                {/* Error Display */}
                {error && (
                  <div className="mt-4 text-red-500 text-center text-xs sm:text-sm">
                    <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 inline-block mr-1 sm:mr-2" />
                    <span className="align-middle">{error}</span>
                  </div>
                )}

                {/* Minting Progress */}
                <div className="mt-4 sm:mt-6 text-center text-xs sm:text-sm text-gray-400">
                  <div className="mb-2 flex justify-between">
                    <span>Purchased</span>
                    <span className="font-bold">2,431 / 10,000</span>
                  </div>
                  <div className="w-full h-1.5 sm:h-2 rounded-full bg-purple-500/20 overflow-hidden">
                    <div className="w-[24.31%] h-full bg-gradient-to-r from-purple-500 to-blue-500
                      animate-pulse" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Collection Stats */}
      <section className="mt-12 sm:mt-16 md:mt-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {[
            { label: "Total Items", value: "10,000" },
            { label: "Owners", value: "1,823" },
            { label: "Floor Price", value: "0.08 ETH" },
            { label: "Volume Traded", value: "1,205 ETH" }
          ].map((stat, index) => (
            <div
              key={index}
              className={`bg-gray-900/50 backdrop-blur-xl rounded-xl border border-purple-500/30 p-4 sm:p-6
                transform hover:scale-105 transition-all duration-300 cursor-pointer
                ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}
              style={{ transitionDelay: `${800 + index * 100}ms` }}
            >
              <div className="text-sm sm:text-base text-gray-400 mb-1 sm:mb-2">{stat.label}</div>
              <div className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400
                bg-clip-text text-transparent">
                {stat.value}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>


  );
};

export default Ticket;

