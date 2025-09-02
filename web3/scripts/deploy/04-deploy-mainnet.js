const { ethers, network } = require("hardhat");
const { saveDeployment } = require("../utils/deployment");

// Retry utility function
async function deployWithRetry(contractFactory, args = [], retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`   Attempt ${i + 1}/${retries}...`);
      const contract = await contractFactory.deploy(...args);
      await contract.waitForDeployment();
      return contract;
    } catch (error) {
      console.log(`   ❌ Attempt ${i + 1} failed:`, error.message);
      if (i === retries - 1) throw error;
      console.log(`   ⏳ Waiting 10 seconds before retry...`);
      await new Promise(resolve => setTimeout(resolve, 10000));
    }
  }
}

async function main() {
  console.log("🚀 Deploying EventVex to Base Mainnet");
  console.log("=====================================");
  
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);
  
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "ETH");
  console.log("🌐 Network:", network.name);
  console.log("🔗 Chain ID:", network.chainId);
  
  // Minimum balance check for mainnet
  const minBalance = ethers.parseEther("0.02"); // 0.02 ETH minimum
  if (balance < minBalance) {
    throw new Error(`Insufficient balance. Need at least ${ethers.formatEther(minBalance)} ETH for mainnet deployment`);
  }
  
  const deploymentData = {
    network: network.name,
    chainId: network.chainId ? network.chainId.toString() : "8453",
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {},
    gasUsed: {}
  };
  
  try {
    // 1. Deploy EventFactory
    console.log("\n📦 Deploying EventFactory...");
    const EventFactory = await ethers.getContractFactory("EventFactory");
    const eventFactory = await deployWithRetry(EventFactory, [deployer.address]);
    
    const factoryAddress = await eventFactory.getAddress();
    console.log("✅ EventFactory deployed to:", factoryAddress);
    
    deploymentData.contracts.EventFactory = {
      address: factoryAddress,
      constructorArgs: [deployer.address],
      verified: false
    };
    
    // 2. Deploy EventVexAccessControl
    console.log("\n📦 Deploying EventVexAccessControl...");
    const AccessControl = await ethers.getContractFactory("EventVexAccessControl");
    const accessControl = await deployWithRetry(AccessControl, []);
    
    const accessControlAddress = await accessControl.getAddress();
    console.log("✅ EventVexAccessControl deployed to:", accessControlAddress);
    
    deploymentData.contracts.EventVexAccessControl = {
      address: accessControlAddress,
      constructorArgs: [],
      verified: false
    };
    
    // 3. Deploy TicketMarketplace
    console.log("\n📦 Deploying TicketMarketplace...");
    const Marketplace = await ethers.getContractFactory("TicketMarketplace");
    const marketplace = await deployWithRetry(Marketplace, [deployer.address, factoryAddress]);
    
    const marketplaceAddress = await marketplace.getAddress();
    console.log("✅ TicketMarketplace deployed to:", marketplaceAddress);
    
    deploymentData.contracts.TicketMarketplace = {
      address: marketplaceAddress,
      constructorArgs: [deployer.address, factoryAddress],
      verified: false
    };
    
    // 4. Deploy EventVexPaymaster
    console.log("\n📦 Deploying EventVexPaymaster...");
    const Paymaster = await ethers.getContractFactory("EventVexPaymaster");
    const paymaster = await deployWithRetry(Paymaster, [factoryAddress]);
    
    const paymasterAddress = await paymaster.getAddress();
    console.log("✅ EventVexPaymaster deployed to:", paymasterAddress);
    
    deploymentData.contracts.EventVexPaymaster = {
      address: paymasterAddress,
      constructorArgs: [factoryAddress],
      verified: false
    };
    
    // 5. Configuration
    console.log("\n⚙️ Configuring contracts...");
    
    // Grant CONTRACT_MANAGER_ROLE to deployer
    console.log("   Granting CONTRACT_MANAGER_ROLE...");
    const CONTRACT_MANAGER_ROLE = await accessControl.CONTRACT_MANAGER_ROLE();
    await accessControl.grantRole(CONTRACT_MANAGER_ROLE, deployer.address);
    
    // Authorize contracts
    console.log("   Authorizing contracts...");
    await accessControl.authorizeContract(factoryAddress, true);
    await accessControl.authorizeContract(marketplaceAddress, true);
    await accessControl.authorizeContract(paymasterAddress, true);
    
    // Configure paymaster
    console.log("   Configuring paymaster...");
    await paymaster.addAuthorizedContract(marketplaceAddress);
    
    // Fund paymaster with initial amount
    const fundingAmount = ethers.parseEther("0.01"); // 0.01 ETH for mainnet
    console.log(`   Funding paymaster with ${ethers.formatEther(fundingAmount)} ETH...`);
    await paymaster.depositFunds({ value: fundingAmount });
    
    console.log("✅ Configuration complete!");
    
    // Calculate gas usage
    const factoryReceipt = await eventFactory.deploymentTransaction().wait();
    const accessControlReceipt = await accessControl.deploymentTransaction().wait();
    const marketplaceReceipt = await marketplace.deploymentTransaction().wait();
    const paymasterReceipt = await paymaster.deploymentTransaction().wait();
    
    deploymentData.gasUsed.EventFactory = factoryReceipt.gasUsed.toString();
    deploymentData.gasUsed.EventVexAccessControl = accessControlReceipt.gasUsed.toString();
    deploymentData.gasUsed.TicketMarketplace = marketplaceReceipt.gasUsed.toString();
    deploymentData.gasUsed.EventVexPaymaster = paymasterReceipt.gasUsed.toString();
    
    // Save deployment data
    await saveDeployment(network.name, deploymentData);
    console.log("💾 Deployment data saved");
    
    // Display deployment summary
    console.log("\n🎉 Base Mainnet Deployment Complete!");
    console.log("====================================");
    console.log("📋 Contract Addresses:");
    console.log(`   EventFactory:          ${factoryAddress}`);
    console.log(`   EventVexAccessControl: ${accessControlAddress}`);
    console.log(`   TicketMarketplace:     ${marketplaceAddress}`);
    console.log(`   EventVexPaymaster:     ${paymasterAddress}`);
    
    console.log("\n⛽ Gas Usage:");
    console.log(`   EventFactory:     ${deploymentData.gasUsed.EventFactory} gas`);
    console.log(`   AccessControl:    ${deploymentData.gasUsed.EventVexAccessControl} gas`);
    console.log(`   Marketplace:      ${deploymentData.gasUsed.TicketMarketplace} gas`);
    console.log(`   Paymaster:        ${deploymentData.gasUsed.EventVexPaymaster} gas`);
    
    const totalGas = BigInt(deploymentData.gasUsed.EventFactory) + 
                     BigInt(deploymentData.gasUsed.EventVexAccessControl) + 
                     BigInt(deploymentData.gasUsed.TicketMarketplace) + 
                     BigInt(deploymentData.gasUsed.EventVexPaymaster);
    console.log(`   Total:            ${totalGas.toString()} gas`);
    
    const finalBalance = await deployer.provider.getBalance(deployer.address);
    const totalCost = balance - finalBalance;
    console.log(`\n💰 Total deployment cost: ${ethers.formatEther(totalCost)} ETH`);
    console.log(`💰 Remaining balance: ${ethers.formatEther(finalBalance)} ETH`);
    
    console.log("\n🔗 Next Steps:");
    console.log("1. Update frontend .env with new contract addresses");
    console.log("2. Update web3 .env with new contract addresses");
    console.log("3. Verify contracts on BaseScan");
    console.log("4. Test all functionality on mainnet");
    console.log("5. Update documentation with mainnet addresses");
    
    console.log("\n📝 Environment Variables to Update:");
    console.log(`EVENT_FACTORY_ADDRESS=${factoryAddress}`);
    console.log(`ACCESS_CONTROL_ADDRESS=${accessControlAddress}`);
    console.log(`MARKETPLACE_ADDRESS=${marketplaceAddress}`);
    console.log(`PAYMASTER_ADDRESS=${paymasterAddress}`);
    
    return {
      eventFactory: factoryAddress,
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
      console.log("\n✅ Mainnet deployment successful!");
      console.log("Contract addresses:", addresses);
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Deployment error:", error);
      process.exit(1);
    });
}

module.exports = main;