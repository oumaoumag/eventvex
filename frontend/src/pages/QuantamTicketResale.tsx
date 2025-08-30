"use client"

import React, { useState, useEffect } from "react"
import { ethers } from "ethers"
import { Wallet, Loader2, AlertCircle, Tag } from "lucide-react"
import { listTicketForResale, buyResaleTicket, getUserTickets } from '../utils/contractIntegration'
import { connectWallet, checkWalletConnection } from '../utils/walletUtils'

declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean
      request: (request: { method: string; params?: any[] }) => Promise<any>
      on: (event: string, callback: (...args: any[]) => void) => void
      removeListener: (event: string, callback: (...args: any[]) => void) => void
    }
  }
}

interface Ticket {
  tokenId: string
  owner: string
  isForSale: boolean
  price: bigint
}

interface ResaleListing {
  tokenId: string
  owner: string
  isForSale: boolean
  price: bigint
}

// Contract integration will be handled by contractIntegration.js

const QuantumTicketResale = () => {
  const [isVisible, setIsVisible] = useState(false)
  const [isWalletConnected, setIsWalletConnected] = useState(false)
  const [walletAddress, setWalletAddress] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userTickets, setUserTickets] = useState<Ticket[]>([])
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [resalePrice, setResalePrice] = useState("")

  useEffect(() => {
    setIsVisible(true)
    initWallet()
    if (typeof window.ethereum !== "undefined") {
      window.ethereum.on("accountsChanged", handleAccountsChanged)
      window.ethereum.on("chainChanged", () => window.location.reload())
    }

    return () => {
      if (typeof window.ethereum !== "undefined") {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged)
      }
    }
  }, [])

  const initWallet = async () => {
    try {
      const address = await checkWalletConnection()
      if (address) {
        setWalletAddress(address)
        setIsWalletConnected(true)
      }
    } catch (error) {
      console.error("Error checking wallet connection:", error)
    }
  }

  useEffect(() => {
    if (isWalletConnected) {
      updateUserTickets()
    }
  }, [isWalletConnected])

  const handleAccountsChanged = (accounts: string[]) => {
    if (accounts.length === 0) {
      setIsWalletConnected(false)
      setWalletAddress("")
    } else {
      setWalletAddress(accounts[0])
    }
  }

  const checkWalletConnection = async () => {
    if (typeof window.ethereum !== "undefined") {
      try {
        const accounts = await window.ethereum.request({ method: "eth_accounts" })
        if (accounts.length > 0) {
          setWalletAddress(accounts[0])
          setIsWalletConnected(true)
        }
      } catch (error) {
        console.error("Error checking wallet connection:", error)
      }
    }
  }

  const handleConnectWallet = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const { address } = await connectWallet()
      setWalletAddress(address)
      setIsWalletConnected(true)
    } catch (error: any) {
      setError("Failed to connect wallet: " + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const updateUserTickets = async () => {
    if (!isWalletConnected) return

    try {
      const provider = new ethers.BrowserProvider(window.ethereum!)
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider)

      const balance = await contract.balanceOf(walletAddress)
      const tickets: Ticket[] = []

      for (let i = 0; i < balance; i++) {
        const tokenId = await contract.tokenOfOwnerByIndex(walletAddress, i)
        const details = await contract.getTicketDetails(tokenId)
        tickets.push({
          tokenId: tokenId.toString(),
          owner: details.owner,
          isForSale: details.isForSale,
          price: details.price,
        })
      }

      setUserTickets(tickets)
    } catch (error) {
      console.error("Error fetching user tickets:", error)
    }
  }

  // Removed updateResaleListings function - buy functionality moved to event listings page

  const handleListForResale = async () => {
    if (!selectedTicket || !resalePrice) return

    try {
      setIsLoading(true)
      setError(null)

      const provider = new ethers.BrowserProvider(window.ethereum!)
      const signer = await provider.getSigner()
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer)

      const priceInWei = ethers.parseEther(resalePrice)
      const tx = await contract.listTicketForSale(selectedTicket.tokenId, priceInWei)
      await tx.wait()

      await updateUserTickets()

      alert("Ticket listed for resale successfully!")
    } catch (error) {
      console.error("Error listing ticket for resale:", error)
      setError((error as Error).message || "Failed to list ticket for resale. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  // Removed handleBuyResaleTicket function - buy functionality moved to event listings page

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
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
              background: "radial-gradient(circle, rgba(147,51,234,0.3) 0%, rgba(0,0,0,0) 70%)",
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${5 + Math.random() * 5}s`,
            }}
          />
        ))}
      </div>

      <main className="relative pt-10 sm:pt-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div
            className={`text-center mb-16 transition-all duration-1000 
              ${isVisible ? "translate-y-0 opacity-100" : "-translate-y-20 opacity-0"}`}
          >
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 sm:mb-6">
              <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                Quantum Realm of Ticket Collection
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto px-4 sm:px-0">
              Enter the quantum realm with an exclusive ticket to our unique experience. Each ticket grants you access
              to a one-of-a-kind event, digitally stored and verified on the blockchain.
            </p>
          </div>

          {/* Header - Resell Only */}
          <div className="text-center mb-8">
            <div className="bg-gray-900/50 backdrop-blur-xl rounded-xl border border-purple-500/30 p-6">
              <div className="flex items-center justify-center gap-3 mb-2">
                <Tag className="w-6 h-6 text-purple-400" />
                <h2 className="text-2xl font-bold text-white">Resell Your Tickets</h2>
              </div>
              <p className="text-gray-400">List your tickets for resale on the marketplace</p>
              <div className="mt-4 text-sm text-blue-400">
                💡 Looking to buy tickets? Visit our <span className="underline cursor-pointer">Event Listings</span> page
              </div>
            </div>
          </div>

          {!isWalletConnected ? (
            <button
              onClick={connectWallet}
              disabled={isLoading}
              className="w-full group relative px-4 sm:px-6 py-3 sm:py-4 rounded-xl overflow-hidden mb-4 sm:mb-6"
            >
              <div
                className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 
                  group-hover:from-purple-500 group-hover:to-blue-500 transition-colors duration-300"
              />
              <div className="relative z-10 flex items-center justify-center space-x-2">
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wallet className="w-5 h-5" />}
                <span>{isLoading ? "Connecting..." : "Connect Wallet"}</span>
              </div>
            </button>
          ) : (
            <div className="mb-6">
              <div
                className="flex items-center justify-between p-4 rounded-xl bg-purple-500/10 
                  border border-purple-500/30"
              >
                <div className="flex items-center space-x-2">
                  <Wallet className="w-5 h-5 text-purple-400" />
                  <span className="text-sm">{formatAddress(walletAddress)}</span>
                </div>
                <button
                  className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
                  onClick={() => setIsWalletConnected(false)}
                >
                  Disconnect
                </button>
              </div>
            </div>
          )}

          <div className="bg-gray-900/50 backdrop-blur-xl rounded-2xl border border-purple-500/30 p-8">
            <h2 className="text-2xl font-bold mb-4">Resell Your Ticket</h2>
            <p className="text-gray-400 mb-6">List your ticket for resale on the marketplace</p>
              <div className="grid gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {userTickets.map((ticket) => (
                    <button
                      key={ticket.tokenId}
                      onClick={() => setSelectedTicket(ticket)}
                      className={`px-4 py-2 rounded-lg ${
                        selectedTicket?.tokenId === ticket.tokenId
                          ? "bg-purple-600 text-white"
                          : "bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white"
                      }`}
                    >
                      Ticket #{ticket.tokenId}
                    </button>
                  ))}
                </div>
                {selectedTicket && (
                  <div className="grid gap-2">
                    <label htmlFor="resalePrice" className="text-sm text-gray-400">
                      Resale Price (ETH)
                    </label>
                    <input
                      id="resalePrice"
                      type="number"
                      placeholder="Enter resale price"
                      value={resalePrice}
                      onChange={(e) => setResalePrice(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm sm:text-base"
                    />
                  </div>
                )}
              </div>
              <button
                onClick={handleListForResale}
                disabled={!selectedTicket || !resalePrice || isLoading}
                className={`mt-6 w-full px-6 py-3 rounded-xl ${
                  !selectedTicket || !resalePrice || isLoading
                    ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                    : "bg-purple-600 hover:bg-purple-700 text-white"
                } transition-colors duration-300`}
              >
                {isLoading ? (
                  <Loader2 className="inline-block w-5 h-5 mr-2 animate-spin" />
                ) : (
                  <Tag className="inline-block w-5 h-5 mr-2" />
                )}
                List for Resale
              </button>
            </div>

          {error && (
            <div className="mt-4 text-red-500 text-center">
              <AlertCircle className="w-6 h-6 inline-block mr-2" />
              <span className="align-middle">{error}</span>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default QuantumTicketResale


