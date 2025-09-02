#!/usr/bin/env node

/**
 * Test script to verify contract integration
 * Tests the deployed EventFactory contract on Base Sepolia
 */

const { ethers } = require('ethers');
require('dotenv').config();

// Configuration
const FACTORY_ADDRESS = '0x4f0fcF4af03569d543d1988d80d358DC40aBd56c';
const RPC_URL = 'https://sepolia.base.org';
const CHAIN_ID = 84532;

// Correct ABI for deployed contract
const FACTORY_ABI = [
  "function getTotalEvents() external view returns (uint256)",
  "function getEvent(uint256 _eventId) external view returns (tuple(address eventContract, address organizer, bool isActive))",
  "function getOrganizerEvents(address _organizer) external view returns (uint256[])",
  "function platformFee() external view returns (uint16)",
  "function organizerRoyalty() external view returns (uint16)"
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
    
    // Test 2: Get platform configuration
    console.log('\n🔍 Test 2: Getting platform configuration...');
    const platformFee = await factory.platformFee();
    const organizerRoyalty = await factory.organizerRoyalty();
    console.log(`✅ Platform fee: ${platformFee / 100}%`);
    console.log(`✅ Organizer royalty: ${organizerRoyalty / 100}%`);
    
    // Test 3: Get individual events if any exist
    if (totalEvents > 0) {
      console.log('\n🔍 Test 3: Getting event details...');
      const eventData = await factory.getEvent(0);
      console.log(`✅ Event 0 details:`);
      console.log(`    Contract: ${eventData.eventContract}`);
      console.log(`    Organizer: ${eventData.organizer}`);
      console.log(`    Active: ${eventData.isActive}`);
    }
    
    // Test 4: Verify contract is accessible
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
    console.log(`   • Platform Fee: ${platformFee / 100}%`);
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
