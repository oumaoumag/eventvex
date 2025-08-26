import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';

import contractABI from "../abi/Ticket.json";
const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS || "0x256ff3b9d3df415a05ba42beb5f186c28e103b2a"; //<---add address here

const CreateEvent = () => {
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState('');
  const [eventData, setEventData] = useState({
    name: '',
    date: '',
    venue: '',
    ticketPrice: '',
    totalTickets: '',
  });

  useEffect(() => {
    const init = async () => {
      if (window.ethereum) {
        try {
          // Request access to MetaMask
          await window.ethereum.request({ method: 'eth_requestAccounts' });

          // Create a provider and signer
          const web3Provider = new ethers.BrowserProvider(window.ethereum);
          const signer = await web3Provider.getSigner();

          const ticketContract = new ethers.Contract(contractAddress, contractABI, signer);

          setContract(ticketContract);

          // Get connected account
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          setAccount(accounts[0]);

          // Listen for account changes
          window.ethereum.on('accountsChanged', (accounts) => {
            setAccount(accounts[0]);
          });
        } catch (error) {
          console.error('Error initializing contract:', error);
        }
      }
    };
    init();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEventData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!contract || !account) {
      alert("Please connect your wallet first!");
      return
    }

    try {
      // Convert price to wei
      const priceInWei = ethers.parseEther(eventData.ticketPrice);

      // Connect to the provider and signer
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      // Connect to the contract
      const contract = new ethers.Contract(contractAddress, contractABI, signer);

      // Send the transaction to the blockchain
      const tx = await contract.createEvent(
        eventData.name,
        eventData.date,
        eventData.venue,
        priceInWei,
        eventData.totalTickets
      );

      console.log('Transaction submitted:', tx.hash);

      // Wait for the transaction to be mined
      const receipt = await tx.wait();
      console.log('Transaction mined:', receipt);

      contract.on("EventCreated", (eventId, name, creator) => {
        alert('Event created successfully on the blockchain!');
        console.log('Event ID:', eventId.toString());
        console.log('Event Name:', name);
        console.log('Event Creator:', creator);
      });

    } catch (error) {
      console.error('Error creating event:', error);
      alert('Failed to create the event. See console for details.');
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white pt-24 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto p-6 bg-gray-800/50 backdrop-blur-lg rounded-xl border border-gray-700/50 shadow-2xl">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent text-center mb-8">
          Create New Event
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 font-semibold mb-2" htmlFor="name">Event Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={eventData.name}
              onChange={handleChange}
              className="w-full p-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Enter event name"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 font-semibold mb-2" htmlFor="date">Event Date</label>
            <input
              type="date"
              id="date"
              name="date"
              value={eventData.date}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-md"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 font-semibold mb-2" htmlFor="description">Event Venue</label>
            <textarea
              id="venue"
              name="venue"
              value={eventData.venue}
              onChange={handleChange}
              className="w-full p-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent min-h-[100px]"
              placeholder="Enter event venue"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-gray-700 font-semibold mb-2" htmlFor="ticketPrice">Ticket Price (ETH)</label>
              <div className="relative">
                <input
                  type="number"
                  id="ticketPrice"
                  name="ticketPrice"
                  value={eventData.ticketPrice}
                  onChange={handleChange}
                  className="w-full p-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent pr-10"
                  placeholder="0.001"
                  inputMode="decimal"
                  min="0"
                  step="0.001"
                  required
                />
                <span className="absolute right-3 top-3.5 text-gray-500">ETH</span>
              </div>
            </div>
            <div>
              <label className="block text-gray-700 font-semibold mb-2" htmlFor="totalTickets">Total Tickets</label>
              <input
                type="number"
                id="totalTickets"
                name="totalTickets"
                value={eventData.totalTickets}
                onChange={handleChange}
                className="w-full p-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="100"
                inputMode="numeric"
                min="1"
                required
              />
            </div>
          </div>

          <div className="text-center">
            <button
              type="submit"
              className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-8 rounded-lg font-medium hover:opacity-90 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-purple-500/20"
              style={{ backgroundSize: '200% auto' }}
            >
              Create Event
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateEvent;