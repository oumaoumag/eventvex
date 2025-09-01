const { ethers, network } = require("hardhat");
const { saveDeployment, loadDeployment } = require("../utils/deployment");
const { verify } = require("../utils/verify");

async function main() {
  console.log("🚀 Deploying EventVex Paymaster Contract");
  console.log("========================================");
  
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)));
  console.log("🌐 Network:", network.name);
  
  // Load existing deployment to get EventFactory address
  const existingDeployment = await loadDeployment(network.name);
  if (!existingDeployment || !existingDeployment.contracts.EventFactory) {
    throw new Error("EventFactory not found. Please deploy core contracts first.");
  }
  
  const eventFactoryAddress = existingDeployment.contracts.EventFactory.address;
  console.log("🏭 Using EventFactory at:", eventFactoryAddress);
  
  try {
    // Deploy EventVexPaymaster only
    console.log("\n📦 Deploying EventVexPaymaster...");
    const Paymaster = await ethers.getContractFactory("EventVexPaymaster");
    const paymaster = await Paymaster.deploy(eventFactoryAddress);
    await paymaster.waitForDeployment();
    
    const paymasterAddress = await paymaster.getAddress();
    console.log("✅ EventVexPaymaster deployed to:", paymasterAddress);
    
    // Update deployment data
    const deploymentData = {
      ...existingDeployment,
      timestamp: new Date().toISOString(),
      contracts: {
        ...existingDeployment.contracts,
        EventVexPaymaster: {
          address: paymasterAddress,
          constructorArgs: [eventFactoryAddress],
          verified: false
        }
      }
    };
    
    // Calculate gas usage
    const paymasterReceipt = await paymaster.deploymentTransaction().wait();
    deploymentData.gasUsed = {
      ...existingDeployment.gasUsed,
      EventVexPaymaster: paymasterReceipt.gasUsed.toString()
    };
    
    // Setup initial configuration
    console.log("\n⚙️ Setting up Paymaster configuration...");
    
    // Fund paymaster with initial ETH for gas sponsorship
    if (network.chainId === 84532n) { // Base Sepolia
      console.log("💰 Funding Paymaster with initial ETH...");
      const fundingAmount = ethers.parseEther("0.001"); // 0.001 ETH for testing
      await paymaster.depositFunds({ value: fundingAmount });
      console.log(`✅ Paymaster funded with ${ethers.formatEther(fundingAmount)} ETH`);
    }
    
    // Save deployment data
    await saveDeployment(network.name, deploymentData);
    console.log("💾 Deployment data saved");
    
    // Verify contract on block explorer (if not local network)
    if (network.chainId !== 31337n && process.env.ETHERSCAN_API_KEY) {
      console.log("\n🔍 Verifying Paymaster on block explorer...");
      
      try {
        await verify(paymasterAddress, [eventFactoryAddress]);
        deploymentData.contracts.EventVexPaymaster.verified = true;
        await saveDeployment(network.name, deploymentData);
        console.log("✅ EventVexPaymaster verified");
      } catch (error) {
        console.log("❌ Paymaster verification failed:", error.message);
      }
    }
    
    // Display deployment summary
    console.log("\n🎉 Paymaster Deployment Complete!");
    console.log("=================================");
    console.log("📋 Contract Address:");
    console.log(`   EventVexPaymaster: ${paymasterAddress}`);
    console.log("\n⛽ Gas Usage:");
    console.log(`   Paymaster: ${deploymentData.gasUsed.EventVexPaymaster} gas`);
    console.log("\n🔗 Block Explorer:");
    console.log(`   https://sepolia.basescan.org/address/${paymasterAddress}`);
    
    console.log("\n✅ ALL EVENTVEX CONTRACTS NOW DEPLOYED!");
    console.log("======================================");
    console.log("🎯 Complete Contract Suite:");
    console.log(`   EventFactory:        ${existingDeployment.contracts.EventFactory.address}`);
    console.log(`   AccessControl:       ${existingDeployment.contracts.EventVexAccessControl?.address || 'N/A'}`);
    console.log(`   TicketMarketplace:   ${existingDeployment.contracts.TicketMarketplace?.address || 'N/A'}`);
    console.log(`   EventVexPaymaster:   ${paymasterAddress}`);
    
    console.log("\n🚀 Ready for:");
    console.log("   ✅ Gasless transactions");
    console.log("   ✅ Mobile-friendly UX");
    console.log("   ✅ Advanced marketplace");
    console.log("   ✅ Role-based access control");
    
    return paymasterAddress;
    
  } catch (error) {
    console.error("❌ Paymaster deployment failed:", error);
    throw error;
  }
}

// Execute deployment
if (require.main === module) {
  main()
    .then((address) => {
      console.log("\n🎉 Paymaster deployment successful!");
      console.log("Address:", address);
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Deployment error:", error);
      process.exit(1);
    });
}

module.exports = main;
