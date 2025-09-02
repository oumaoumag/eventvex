const { ethers, network } = require("hardhat");
const { saveDeployment, loadDeployment } = require("../utils/deployment");

async function deployContract(contractName, args = []) {
  console.log(`\n📦 Deploying ${contractName}...`);
  
  const [deployer] = await ethers.getSigners();
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log(`💰 Current balance: ${ethers.formatEther(balance)} ETH`);
  
  // Check minimum balance for mainnet
  const minBalance = ethers.parseEther("0.01"); // 0.01 ETH minimum
  if (balance < minBalance) {
    throw new Error(`Insufficient balance. Need at least ${ethers.formatEther(minBalance)} ETH, have ${ethers.formatEther(balance)} ETH`);
  }
  
  const ContractFactory = await ethers.getContractFactory(contractName);
  
  // Estimate gas first
  const deployTx = await ContractFactory.getDeployTransaction(...args);
  const gasEstimate = await deployer.estimateGas(deployTx);
  console.log(`⛽ Estimated gas: ${gasEstimate.toString()}`);
  
  // Get current gas price
  const feeData = await deployer.provider.getFeeData();
  const gasPrice = feeData.gasPrice;
  console.log(`💸 Gas price: ${ethers.formatUnits(gasPrice, "gwei")} gwei`);
  
  const estimatedCost = gasEstimate * gasPrice;
  console.log(`💰 Estimated cost: ${ethers.formatEther(estimatedCost)} ETH`);
  
  if (balance < estimatedCost * 120n / 100n) { // 20% buffer
    throw new Error(`Insufficient balance for deployment. Need ~${ethers.formatEther(estimatedCost * 120n / 100n)} ETH`);
  }
  
  const contract = await ContractFactory.deploy(...args, {
    gasLimit: gasEstimate * 120n / 100n, // 20% buffer
    gasPrice: gasPrice
  });
  await contract.waitForDeployment();
  
  const address = await contract.getAddress();
  console.log(`✅ ${contractName} deployed to: ${address}`);
  
  return { contract, address };
}

async function main() {
  // Get contract name from hardhat task args or process.argv
  const contractName = process.env.CONTRACT_NAME || process.argv[2];
  
  if (!contractName) {
    console.log("❌ Please specify contract name:");
    console.log("Usage: node 07-individual-deploy.js <ContractName> [args...]");
    console.log("\nAvailable contracts:");
    console.log("- EventFactory");
    console.log("- EventVexAccessControl");
    console.log("- TicketMarketplace");
    console.log("- EventVexPaymaster");
    process.exit(1);
  }
  
  console.log(`🚀 Individual Contract Deployment: ${contractName}`);
  console.log("=".repeat(50));
  
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);
  console.log("🌐 Network:", network.name);
  
  // Load existing deployment
  let deployment;
  try {
    deployment = await loadDeployment(network.name);
  } catch (error) {
    deployment = {
      network: network.name,
      chainId: network.chainId ? network.chainId.toString() : "8453",
      deployer: deployer.address,
      timestamp: new Date().toISOString(),
      contracts: {},
      gasUsed: {}
    };
  }
  
  try {
    let result;
    
    switch (contractName) {
      case "EventFactory":
        result = await deployContract("EventFactory", [deployer.address]);
        deployment.contracts.EventFactory = {
          address: result.address,
          constructorArgs: [deployer.address],
          verified: false
        };
        break;
        
      case "EventVexAccessControl":
        result = await deployContract("EventVexAccessControl", []);
        deployment.contracts.EventVexAccessControl = {
          address: result.address,
          constructorArgs: [],
          verified: false
        };
        break;
        
      case "TicketMarketplace":
        // Check if EventFactory exists
        if (!deployment.contracts.EventFactory?.address) {
          throw new Error("EventFactory must be deployed first");
        }
        
        result = await deployContract("TicketMarketplace", [
          deployer.address,
          deployment.contracts.EventFactory.address
        ]);
        deployment.contracts.TicketMarketplace = {
          address: result.address,
          constructorArgs: [deployer.address, deployment.contracts.EventFactory.address],
          verified: false
        };
        break;
        
      case "EventVexPaymaster":
        // Check if EventFactory exists
        if (!deployment.contracts.EventFactory?.address) {
          throw new Error("EventFactory must be deployed first");
        }
        
        result = await deployContract("EventVexPaymaster", [
          deployment.contracts.EventFactory.address
        ]);
        deployment.contracts.EventVexPaymaster = {
          address: result.address,
          constructorArgs: [deployment.contracts.EventFactory.address],
          verified: false
        };
        break;
        
      default:
        throw new Error(`Unknown contract: ${contractName}`);
    }
    
    // Save gas usage
    const receipt = await result.contract.deploymentTransaction().wait();
    deployment.gasUsed[contractName] = receipt.gasUsed.toString();
    
    // Update deployment data
    deployment.lastUpdated = new Date().toISOString();
    await saveDeployment(network.name, deployment);
    
    console.log(`\n✅ ${contractName} deployment complete!`);
    console.log(`📍 Address: ${result.address}`);
    console.log(`⛽ Gas used: ${receipt.gasUsed.toString()}`);
    console.log(`💾 Deployment data saved`);
    
    // Show next steps
    console.log(`\n🔧 Next steps:`);
    console.log(`1. Update environment: npm run update:env:mainnet`);
    console.log(`2. Verify contract: hardhat verify --network baseMainnet ${result.address}`);
    console.log(`3. Configure if needed: npm run configure:mainnet`);
    
    return result;
    
  } catch (error) {
    console.error(`❌ ${contractName} deployment failed:`, error.message);
    throw error;
  }
}

if (require.main === module) {
  main()
    .then(() => {
      console.log("\n✅ Individual deployment successful!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Individual deployment error:", error);
      process.exit(1);
    });
}

module.exports = main;