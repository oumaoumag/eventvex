const { ethers, network } = require("hardhat");
const { saveDeployment, loadDeployment } = require("../utils/deployment");

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
  console.log("🔧 EventVex Recovery Deployment");
  console.log("===============================");
  
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);
  console.log("🌐 Network:", network.name);
  
  // Load existing deployment
  let deployment;
  try {
    deployment = await loadDeployment(network.name);
    console.log("📋 Found existing deployment data");
  } catch (error) {
    console.log("📋 No existing deployment found, creating new");
    deployment = {
      network: network.name,
      chainId: network.chainId ? network.chainId.toString() : "8453",
      deployer: deployer.address,
      timestamp: new Date().toISOString(),
      contracts: {},
      gasUsed: {}
    };
  }
  
  const contracts = deployment.contracts || {};
  
  try {
    // Check and deploy EventFactory if missing
    if (!contracts.EventFactory?.address) {
      console.log("\n📦 Deploying missing EventFactory...");
      const EventFactory = await ethers.getContractFactory("EventFactory");
      const eventFactory = await deployWithRetry(EventFactory, [deployer.address]);
      
      const factoryAddress = await eventFactory.getAddress();
      console.log("✅ EventFactory deployed to:", factoryAddress);
      
      contracts.EventFactory = {
        address: factoryAddress,
        constructorArgs: [deployer.address],
        verified: false
      };
      
      const receipt = await eventFactory.deploymentTransaction().wait();
      deployment.gasUsed.EventFactory = receipt.gasUsed.toString();
    } else {
      console.log("✅ EventFactory already deployed:", contracts.EventFactory.address);
    }
    
    // Check and deploy EventVexAccessControl if missing
    if (!contracts.EventVexAccessControl?.address) {
      console.log("\n📦 Deploying missing EventVexAccessControl...");
      const AccessControl = await ethers.getContractFactory("EventVexAccessControl");
      const accessControl = await deployWithRetry(AccessControl, []);
      
      const accessControlAddress = await accessControl.getAddress();
      console.log("✅ EventVexAccessControl deployed to:", accessControlAddress);
      
      contracts.EventVexAccessControl = {
        address: accessControlAddress,
        constructorArgs: [],
        verified: false
      };
      
      const receipt = await accessControl.deploymentTransaction().wait();
      deployment.gasUsed.EventVexAccessControl = receipt.gasUsed.toString();
    } else {
      console.log("✅ EventVexAccessControl already deployed:", contracts.EventVexAccessControl.address);
    }
    
    // Check and deploy TicketMarketplace if missing
    if (!contracts.TicketMarketplace?.address) {
      if (!contracts.EventFactory?.address) {
        throw new Error("EventFactory must be deployed before TicketMarketplace");
      }
      
      console.log("\n📦 Deploying missing TicketMarketplace...");
      const Marketplace = await ethers.getContractFactory("TicketMarketplace");
      const marketplace = await deployWithRetry(Marketplace, [
        deployer.address, 
        contracts.EventFactory.address
      ]);
      
      const marketplaceAddress = await marketplace.getAddress();
      console.log("✅ TicketMarketplace deployed to:", marketplaceAddress);
      
      contracts.TicketMarketplace = {
        address: marketplaceAddress,
        constructorArgs: [deployer.address, contracts.EventFactory.address],
        verified: false
      };
      
      const receipt = await marketplace.deploymentTransaction().wait();
      deployment.gasUsed.TicketMarketplace = receipt.gasUsed.toString();
    } else {
      console.log("✅ TicketMarketplace already deployed:", contracts.TicketMarketplace.address);
    }
    
    // Check and deploy EventVexPaymaster if missing
    if (!contracts.EventVexPaymaster?.address) {
      if (!contracts.EventFactory?.address) {
        throw new Error("EventFactory must be deployed before EventVexPaymaster");
      }
      
      console.log("\n📦 Deploying missing EventVexPaymaster...");
      const Paymaster = await ethers.getContractFactory("EventVexPaymaster");
      const paymaster = await deployWithRetry(Paymaster, [contracts.EventFactory.address]);
      
      const paymasterAddress = await paymaster.getAddress();
      console.log("✅ EventVexPaymaster deployed to:", paymasterAddress);
      
      contracts.EventVexPaymaster = {
        address: paymasterAddress,
        constructorArgs: [contracts.EventFactory.address],
        verified: false
      };
      
      const receipt = await paymaster.deploymentTransaction().wait();
      deployment.gasUsed.EventVexPaymaster = receipt.gasUsed.toString();
    } else {
      console.log("✅ EventVexPaymaster already deployed:", contracts.EventVexPaymaster.address);
    }
    
    // Update deployment data
    deployment.contracts = contracts;
    deployment.lastUpdated = new Date().toISOString();
    
    // Save deployment data
    await saveDeployment(network.name, deployment);
    console.log("💾 Deployment data saved");
    
    // Display summary
    console.log("\n📋 Recovery Deployment Summary:");
    console.log("===============================");
    console.log(`EventFactory:          ${contracts.EventFactory?.address || 'NOT_DEPLOYED'}`);
    console.log(`EventVexAccessControl: ${contracts.EventVexAccessControl?.address || 'NOT_DEPLOYED'}`);
    console.log(`TicketMarketplace:     ${contracts.TicketMarketplace?.address || 'NOT_DEPLOYED'}`);
    console.log(`EventVexPaymaster:     ${contracts.EventVexPaymaster?.address || 'NOT_DEPLOYED'}`);
    
    // Check if all contracts are deployed
    const allDeployed = Object.values(contracts).every(contract => contract?.address);
    
    if (allDeployed) {
      console.log("\n✅ All contracts are now deployed!");
      console.log("🔧 Run configuration script next: npm run configure:mainnet");
    } else {
      console.log("\n⚠️ Some contracts are still missing. Check the logs above.");
    }
    
    return contracts;
    
  } catch (error) {
    console.error("❌ Recovery deployment failed:", error);
    throw error;
  }
}

if (require.main === module) {
  main()
    .then((contracts) => {
      console.log("\n✅ Recovery deployment completed!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Recovery deployment error:", error);
      process.exit(1);
    });
}

module.exports = main;