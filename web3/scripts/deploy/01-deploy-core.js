const { ethers } = require("hardhat");
const { verify } = require("../utils/verify");
const { saveDeployment, loadDeployment } = require("../utils/deployment");

async function main() {
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  
  console.log("🚀 Deploying EventVex Core Contracts");
  console.log("📍 Network:", network.name, `(Chain ID: ${network.chainId})`);
  console.log("👤 Deployer:", deployer.address);
  console.log("💰 Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");
  console.log("=" * 50);

  // Platform fee recipient (deployer for now, should be multisig in production)
  const platformFeeRecipient = deployer.address;
  
  try {
    // Deploy EventFactory
    console.log("📦 Deploying EventFactory...");
    const EventFactory = await ethers.getContractFactory("EventFactory");
    const eventFactory = await EventFactory.deploy(platformFeeRecipient);
    await eventFactory.waitForDeployment();
    
    const factoryAddress = await eventFactory.getAddress();
    console.log("✅ EventFactory deployed to:", factoryAddress);

    // Save deployment info
    const deploymentData = {
      network: network.name,
      chainId: network.chainId.toString(),
      deployer: deployer.address,
      timestamp: new Date().toISOString(),
      contracts: {
        EventFactory: {
          address: factoryAddress,
          constructorArgs: [platformFeeRecipient],
          verified: false
        }
      },
      gasUsed: {
        EventFactory: "Calculating..."
      }
    };

    // Get deployment transaction receipt for gas calculation
    const deployTx = eventFactory.deploymentTransaction();
    if (deployTx) {
      const receipt = await deployTx.wait();
      deploymentData.gasUsed.EventFactory = receipt.gasUsed.toString();
      console.log("⛽ Gas used for EventFactory:", receipt.gasUsed.toString());
    }

    // Save deployment data
    await saveDeployment(network.name, deploymentData);
    console.log("💾 Deployment data saved");

    // Verify contracts on block explorer (if not local network)
    if (network.chainId !== 31337n && process.env.ETHERSCAN_API_KEY) {
      console.log("\n🔍 Verifying contracts on block explorer...");
      
      try {
        await verify(factoryAddress, [platformFeeRecipient]);
        deploymentData.contracts.EventFactory.verified = true;
        await saveDeployment(network.name, deploymentData);
        console.log("✅ EventFactory verified");
      } catch (error) {
        console.log("❌ Verification failed:", error.message);
      }
    }

    // Test deployment by creating a sample event (only on testnet)
    if (network.chainId === 84532n) { // Base Sepolia
      console.log("\n🧪 Testing deployment with sample event...");
      
      try {
        const sampleEventTx = await eventFactory.createEvent(
          "EventVex Test Event",
          "A test event to verify deployment",
          "Virtual Location",
          "ipfs://test-metadata",
          Math.floor(Date.now() / 1000) + 86400, // 24 hours from now
          ethers.parseEther("0.01"), // 0.01 ETH
          100, // 100 tickets
          ethers.parseEther("0.03") // Max resale 0.03 ETH
        );
        
        const receipt = await sampleEventTx.wait();
        console.log("✅ Sample event created successfully");
        console.log("📄 Transaction hash:", receipt.hash);
        
        // Get the created event details
        const totalEvents = await eventFactory.getTotalEvents();
        console.log("📊 Total events in factory:", totalEvents.toString());
        
      } catch (error) {
        console.log("❌ Sample event creation failed:", error.message);
      }
    }

    console.log("\n" + "=" * 50);
    console.log("🎉 Deployment Summary");
    console.log("=" * 50);
    console.log("📍 Network:", network.name);
    console.log("🏭 EventFactory:", factoryAddress);
    console.log("👤 Platform Fee Recipient:", platformFeeRecipient);
    console.log("💰 Total Gas Used:", deploymentData.gasUsed.EventFactory);
    
    if (network.chainId !== 31337n) {
      console.log("🔍 Block Explorer:");
      if (network.chainId === 84532n) {
        console.log(`   https://sepolia.basescan.org/address/${factoryAddress}`);
      } else if (network.chainId === 8453n) {
        console.log(`   https://basescan.org/address/${factoryAddress}`);
      }
    }
    
    console.log("\n📋 Next Steps:");
    console.log("1. Update frontend contract addresses");
    console.log("2. Test event creation and ticket minting");
    console.log("3. Configure platform fee recipient (use multisig for mainnet)");
    console.log("4. Set up monitoring and alerts");
    
    return {
      eventFactory: factoryAddress,
      network: network.name,
      chainId: network.chainId.toString()
    };

  } catch (error) {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  }
}

// Execute deployment
if (require.main === module) {
  main()
    .then((result) => {
      console.log("\n✅ Deployment completed successfully!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Deployment failed:", error);
      process.exit(1);
    });
}

module.exports = main;
