const { ethers, network } = require("hardhat");
const { saveDeployment, loadDeployment } = require("../utils/deployment");
const { verify } = require("../utils/verify");

async function main() {
  console.log("🚀 Deploying Additional EventVex Contracts");
  console.log("==========================================");
  
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
  const platformFeeRecipient = existingDeployment.contracts.EventFactory.constructorArgs[0];
  
  console.log("🏭 Using EventFactory at:", eventFactoryAddress);
  console.log("💳 Platform fee recipient:", platformFeeRecipient);
  
  const deploymentData = {
    network: network.name,
    chainId: network.chainId.toString(),
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      ...existingDeployment.contracts // Keep existing contracts
    },
    gasUsed: {
      ...existingDeployment.gasUsed // Keep existing gas usage
    }
  };
  
  try {
    // 1. Deploy EventVexAccessControl
    console.log("\n📦 Deploying EventVexAccessControl...");
    const AccessControl = await ethers.getContractFactory("EventVexAccessControl");
    const accessControl = await AccessControl.deploy();
    await accessControl.waitForDeployment();
    
    const accessControlAddress = await accessControl.getAddress();
    console.log("✅ EventVexAccessControl deployed to:", accessControlAddress);
    
    deploymentData.contracts.EventVexAccessControl = {
      address: accessControlAddress,
      constructorArgs: [],
      verified: false
    };
    
    // 2. Deploy TicketMarketplace
    console.log("\n📦 Deploying TicketMarketplace...");
    const Marketplace = await ethers.getContractFactory("TicketMarketplace");
    const marketplace = await Marketplace.deploy(platformFeeRecipient, eventFactoryAddress);
    await marketplace.waitForDeployment();
    
    const marketplaceAddress = await marketplace.getAddress();
    console.log("✅ TicketMarketplace deployed to:", marketplaceAddress);
    
    deploymentData.contracts.TicketMarketplace = {
      address: marketplaceAddress,
      constructorArgs: [platformFeeRecipient, eventFactoryAddress],
      verified: false
    };
    
    // 3. Deploy EventVexPaymaster
    console.log("\n📦 Deploying EventVexPaymaster...");
    const Paymaster = await ethers.getContractFactory("EventVexPaymaster");
    const paymaster = await Paymaster.deploy(eventFactoryAddress);
    await paymaster.waitForDeployment();
    
    const paymasterAddress = await paymaster.getAddress();
    console.log("✅ EventVexPaymaster deployed to:", paymasterAddress);
    
    deploymentData.contracts.EventVexPaymaster = {
      address: paymasterAddress,
      constructorArgs: [eventFactoryAddress],
      verified: false
    };
    
    // 4. Setup initial configuration
    console.log("\n⚙️ Setting up initial configuration...");
    
    // Authorize contracts in AccessControl
    console.log("🔐 Authorizing contracts in AccessControl...");
    await accessControl.authorizeContract(eventFactoryAddress, true);
    await accessControl.authorizeContract(marketplaceAddress, true);
    await accessControl.authorizeContract(paymasterAddress, true);
    console.log("✅ Contracts authorized in AccessControl");
    
    // Add marketplace as authorized contract in paymaster
    console.log("💳 Authorizing marketplace in Paymaster...");
    await paymaster.addAuthorizedContract(marketplaceAddress);
    console.log("✅ Marketplace authorized in Paymaster");
    
    // Fund paymaster with initial ETH for gas sponsorship
    if (network.chainId === 84532n) { // Base Sepolia
      console.log("💰 Funding Paymaster with initial ETH...");
      const fundingAmount = ethers.parseEther("0.005"); // 0.005 ETH for testing
      await paymaster.depositFunds({ value: fundingAmount });
      console.log(`✅ Paymaster funded with ${ethers.formatEther(fundingAmount)} ETH`);
    }
    
    // Calculate gas usage
    const accessControlReceipt = await accessControl.deploymentTransaction().wait();
    const marketplaceReceipt = await marketplace.deploymentTransaction().wait();
    const paymasterReceipt = await paymaster.deploymentTransaction().wait();
    
    deploymentData.gasUsed.EventVexAccessControl = accessControlReceipt.gasUsed.toString();
    deploymentData.gasUsed.TicketMarketplace = marketplaceReceipt.gasUsed.toString();
    deploymentData.gasUsed.EventVexPaymaster = paymasterReceipt.gasUsed.toString();
    
    // Save deployment data
    await saveDeployment(network.name, deploymentData);
    console.log("💾 Deployment data saved");
    
    // Verify contracts on block explorer (if not local network)
    if (network.chainId !== 31337n && process.env.ETHERSCAN_API_KEY) {
      console.log("\n🔍 Verifying contracts on block explorer...");
      
      // Verify AccessControl
      try {
        await verify(accessControlAddress, []);
        deploymentData.contracts.EventVexAccessControl.verified = true;
        console.log("✅ EventVexAccessControl verified");
      } catch (error) {
        console.log("❌ AccessControl verification failed:", error.message);
      }
      
      // Verify Marketplace
      try {
        await verify(marketplaceAddress, [platformFeeRecipient, eventFactoryAddress]);
        deploymentData.contracts.TicketMarketplace.verified = true;
        console.log("✅ TicketMarketplace verified");
      } catch (error) {
        console.log("❌ Marketplace verification failed:", error.message);
      }
      
      // Verify Paymaster
      try {
        await verify(paymasterAddress, [eventFactoryAddress]);
        deploymentData.contracts.EventVexPaymaster.verified = true;
        console.log("✅ EventVexPaymaster verified");
      } catch (error) {
        console.log("❌ Paymaster verification failed:", error.message);
      }
      
      // Save updated verification status
      await saveDeployment(network.name, deploymentData);
    }
    
    // Display deployment summary
    console.log("\n🎉 Additional Contracts Deployment Complete!");
    console.log("============================================");
    console.log("📋 Contract Addresses:");
    console.log(`   EventVexAccessControl: ${accessControlAddress}`);
    console.log(`   TicketMarketplace:     ${marketplaceAddress}`);
    console.log(`   EventVexPaymaster:     ${paymasterAddress}`);
    console.log("\n⛽ Gas Usage:");
    console.log(`   AccessControl: ${deploymentData.gasUsed.EventVexAccessControl} gas`);
    console.log(`   Marketplace:   ${deploymentData.gasUsed.TicketMarketplace} gas`);
    console.log(`   Paymaster:     ${deploymentData.gasUsed.EventVexPaymaster} gas`);
    
    const totalGas = BigInt(deploymentData.gasUsed.EventVexAccessControl) + 
                     BigInt(deploymentData.gasUsed.TicketMarketplace) + 
                     BigInt(deploymentData.gasUsed.EventVexPaymaster);
    console.log(`   Total:         ${totalGas.toString()} gas`);
    
    console.log("\n🔗 Next Steps:");
    console.log("1. Update frontend environment variables");
    console.log("2. Copy ABI files to frontend");
    console.log("3. Test contract integrations");
    console.log("4. Fund paymaster for production use");
    
    return {
      accessControl: accessControlAddress,
      marketplace: marketplaceAddress,
      paymaster: paymasterAddress
    };
    
  } catch (error) {
    console.error("❌ Deployment failed:", error);
    throw error;
  }
}

// Execute deployment
if (require.main === module) {
  main()
    .then((addresses) => {
      console.log("\n✅ Deployment successful!");
      console.log("Contract addresses:", addresses);
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Deployment error:", error);
      process.exit(1);
    });
}

module.exports = main;
