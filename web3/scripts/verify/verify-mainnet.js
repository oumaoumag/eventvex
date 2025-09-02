const { run, network } = require("hardhat");
const { loadDeployment } = require("../utils/deployment");

async function verifyContract(address, constructorArgs = [], contractName = "") {
  console.log(`🔍 Verifying ${contractName} at ${address}...`);
  
  try {
    await run("verify:verify", {
      address: address,
      constructorArguments: constructorArgs,
    });
    console.log(`✅ ${contractName} verified successfully`);
    return true;
  } catch (error) {
    if (error.message.toLowerCase().includes("already verified")) {
      console.log(`✅ ${contractName} already verified`);
      return true;
    } else {
      console.error(`❌ ${contractName} verification failed:`, error.message);
      return false;
    }
  }
}

async function main() {
  console.log("🔍 Verifying EventVex Contracts on Base Mainnet");
  console.log("===============================================");
  console.log("🌐 Network:", network.name);
  console.log("🔗 Chain ID:", network.chainId);
  
  try {
    // Load deployment data
    const deployment = await loadDeployment(network.name);
    if (!deployment || !deployment.contracts) {
      throw new Error(`No deployment found for network: ${network.name}`);
    }
    
    const contracts = deployment.contracts;
    const results = {};
    
    // Verify EventFactory
    if (contracts.EventFactory) {
      results.EventFactory = await verifyContract(
        contracts.EventFactory.address,
        contracts.EventFactory.constructorArgs,
        "EventFactory"
      );
      
      // Wait between verifications to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
    // Verify EventVexAccessControl
    if (contracts.EventVexAccessControl) {
      results.EventVexAccessControl = await verifyContract(
        contracts.EventVexAccessControl.address,
        contracts.EventVexAccessControl.constructorArgs,
        "EventVexAccessControl"
      );
      
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
    // Verify TicketMarketplace
    if (contracts.TicketMarketplace) {
      results.TicketMarketplace = await verifyContract(
        contracts.TicketMarketplace.address,
        contracts.TicketMarketplace.constructorArgs,
        "TicketMarketplace"
      );
      
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
    // Verify EventVexPaymaster
    if (contracts.EventVexPaymaster) {
      results.EventVexPaymaster = await verifyContract(
        contracts.EventVexPaymaster.address,
        contracts.EventVexPaymaster.constructorArgs,
        "EventVexPaymaster"
      );
    }
    
    // Summary
    console.log("\n📊 Verification Summary:");
    console.log("========================");
    
    const totalContracts = Object.keys(results).length;
    const verifiedContracts = Object.values(results).filter(Boolean).length;
    
    Object.entries(results).forEach(([name, verified]) => {
      const status = verified ? "✅ Verified" : "❌ Failed";
      const address = contracts[name]?.address || "Unknown";
      console.log(`${name}: ${status} (${address})`);
    });
    
    console.log(`\n📈 Success Rate: ${verifiedContracts}/${totalContracts} contracts verified`);
    
    if (verifiedContracts === totalContracts) {
      console.log("🎉 All contracts verified successfully!");
    } else {
      console.log("⚠️ Some contracts failed verification. Check the logs above.");
    }
    
    // Update deployment data with verification status
    Object.entries(results).forEach(([name, verified]) => {
      if (contracts[name]) {
        contracts[name].verified = verified;
      }
    });
    
    // Save updated deployment data
    const { saveDeployment } = require("../utils/deployment");
    await saveDeployment(network.name, deployment);
    console.log("💾 Verification status saved to deployment data");
    
    return results;
    
  } catch (error) {
    console.error("❌ Verification process failed:", error);
    throw error;
  }
}

// Execute verification
if (require.main === module) {
  main()
    .then((results) => {
      const allVerified = Object.values(results).every(Boolean);
      if (allVerified) {
        console.log("\n✅ Verification process completed successfully!");
        process.exit(0);
      } else {
        console.log("\n⚠️ Verification process completed with some failures.");
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error("💥 Verification error:", error);
      process.exit(1);
    });
}

module.exports = main;