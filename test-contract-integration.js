#!/usr/bin/env node

/**
 * Test script to verify contract integration
 * Tests the deployed EventFactory contract on Base Sepolia
 */

const { ethers } = require('ethers');
require('dotenv').config();

// Configuration
const FACTORY_ADDRESS = '0x1f170eC9E2536cc718A78A62B9905B5d8133B28f';
const RPC_URL = 'https://sepolia.base.org';
const CHAIN_ID = 84532;

// Simple ABI for testing
const FACTORY_ABI = [
  "function getTotalEvents() external view returns (uint256)",
  "function getActiveEvents() external view returns (tuple(uint256 eventId, address eventContract, address organizer, string title, uint256 eventDate, uint256 ticketPrice, uint256 maxTickets, bool isActive, uint256 createdAt)[])",
  "function getEvent(uint256 _eventId) external view returns (tuple(uint256 eventId, address eventContract, address organizer, string title, uint256 eventDate, uint256 ticketPrice, uint256 maxTickets, bool isActive, uint256 createdAt))"
];

async function testContractIntegration() {
  console.log('🧪 Testing EventVex Contract Integration');
  console.log('=====================================');
  
  try {
    // Create provider
    console.log('📡 Connecting to Base Sepolia...');
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    
    // Verify network
    const network = await provider.getNetwork();
    console.log(`✅ Connected to network: ${network.name} (Chain ID: ${network.chainId})`);
    
    if (Number(network.chainId) !== CHAIN_ID) {
      throw new Error(`Wrong network! Expected ${CHAIN_ID}, got ${network.chainId}`);
    }
    
    // Create contract instance
    console.log('📄 Creating contract instance...');
    const factory = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, provider);
    
    // Test 1: Get total events
    console.log('\n🔍 Test 1: Getting total events...');
    const totalEvents = await factory.getTotalEvents();
    console.log(`✅ Total events created: ${totalEvents}`);
    
    // Test 2: Get active events
    console.log('\n🔍 Test 2: Getting active events...');
    const activeEvents = await factory.getActiveEvents();
    console.log(`✅ Active events found: ${activeEvents.length}`);
    
    if (activeEvents.length > 0) {
      console.log('\n📋 Event Details:');
      for (let i = 0; i < activeEvents.length; i++) {
        const event = activeEvents[i];
        console.log(`  Event ${i + 1}:`);
        console.log(`    ID: ${event.eventId}`);
        console.log(`    Title: ${event.title}`);
        console.log(`    Organizer: ${event.organizer}`);
        console.log(`    Contract: ${event.eventContract}`);
        console.log(`    Price: ${ethers.formatEther(event.ticketPrice)} ETH`);
        console.log(`    Max Tickets: ${event.maxTickets}`);
        console.log(`    Date: ${new Date(Number(event.eventDate) * 1000).toLocaleString()}`);
        console.log(`    Active: ${event.isActive}`);
        console.log('');
      }
    }
    
    // Test 3: Verify contract is accessible
    console.log('🔍 Test 3: Verifying contract accessibility...');
    const contractCode = await provider.getCode(FACTORY_ADDRESS);
    if (contractCode === '0x') {
      throw new Error('Contract not found at the specified address!');
    }
    console.log('✅ Contract code verified - contract exists and is deployed');
    
    console.log('\n🎉 All tests passed! Contract integration is working correctly.');
    console.log('\n📋 Summary:');
    console.log(`   • Factory Address: ${FACTORY_ADDRESS}`);
    console.log(`   • Network: Base Sepolia (${CHAIN_ID})`);
    console.log(`   • Total Events: ${totalEvents}`);
    console.log(`   • Active Events: ${activeEvents.length}`);
    console.log(`   • Contract Status: ✅ Deployed and functional`);
    
    return true;
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('\n🔧 Troubleshooting:');
    console.error('   1. Check if the contract address is correct');
    console.error('   2. Verify network connectivity');
    console.error('   3. Ensure the contract is deployed on Base Sepolia');
    return false;
  }
}

// Run the test
if (require.main === module) {
  testContractIntegration()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('Unexpected error:', error);
      process.exit(1);
    });
}

module.exports = { testContractIntegration };
