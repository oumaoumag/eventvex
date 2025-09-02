const { ethers, network } = require("hardhat");

async function main() {
  console.log("🔧 Configuring EventVex Contracts");
  console.log("=================================");
  
  const [deployer] = await ethers.getSigners();
  console.log("📝 Configuring with account:", deployer.address);
  
  // Contract addresses
  const addresses = {
    eventFactory: "0x4f0fcF4af03569d543d1988d80d358DC40aBd56c",
    accessControl: "0x869A778E55fC67A930C2fc71D72f06EEacD9B4Ae", 
    marketplace: "0xC1CD48117533a0E9cb77d4713f940CeE215D564C",
    paymaster: "0x03fd90a13AF3032c3414fd01a9Aa619B2fa8BeF9"
  };
  
  try {
    // Get contract instances
    const accessControl = await ethers.getContractAt("EventVexAccessControl", addresses.accessControl);
    const paymaster = await ethers.getContractAt("EventVexPaymaster", addresses.paymaster);
    
    console.log("\n🔐 Configuring AccessControl...");
    
    // Check if deployer has admin role
    const DEFAULT_ADMIN_ROLE = "0x0000000000000000000000000000000000000000000000000000000000000000";
    const hasAdminRole = await accessControl.hasRole(DEFAULT_ADMIN_ROLE, deployer.address);
    console.log("   Deployer has admin role:", hasAdminRole);
    
    if (hasAdminRole) {
      // First grant CONTRACT_MANAGER_ROLE to deployer
      console.log("   Granting CONTRACT_MANAGER_ROLE to deployer...");
      const CONTRACT_MANAGER_ROLE = await accessControl.CONTRACT_MANAGER_ROLE();
      await accessControl.grantRole(CONTRACT_MANAGER_ROLE, deployer.address);
      
      // Now authorize contracts
      console.log("   Authorizing EventFactory...");
      await accessControl.authorizeContract(addresses.eventFactory, true);
      
      console.log("   Authorizing Marketplace...");
      await accessControl.authorizeContract(addresses.marketplace, true);
      
      console.log("   Authorizing Paymaster...");
      await accessControl.authorizeContract(addresses.paymaster, true);
      
      console.log("✅ AccessControl configured successfully");
    } else {
      console.log("❌ Deployer doesn't have admin role - skipping AccessControl setup");
    }
    
    console.log("\n💳 Configuring Paymaster...");
    
    // Check if deployer is owner of paymaster
    const paymasterOwner = await paymaster.owner();
    console.log("   Paymaster owner:", paymasterOwner);
    console.log("   Deployer address:", deployer.address);
    
    if (paymasterOwner.toLowerCase() === deployer.address.toLowerCase()) {
      console.log("   Adding marketplace as authorized contract...");
      await paymaster.addAuthorizedContract(addresses.marketplace);
      
      // Fund paymaster with small amount for testing
      console.log("   Funding paymaster with 0.0005 ETH...");
      await paymaster.depositFunds({ value: ethers.parseEther("0.0005") });
      
      console.log("✅ Paymaster configured successfully");
    } else {
      console.log("❌ Deployer is not paymaster owner - skipping Paymaster setup");
    }
    
    console.log("\n🎉 Configuration Complete!");
    console.log("========================");
    console.log("✅ All contracts are ready for use");
    
  } catch (error) {
    console.error("❌ Configuration failed:", error.message);
    throw error;
  }
}

if (require.main === module) {
  main()
    .then(() => {
      console.log("\n✅ Configuration successful!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Configuration error:", error);
      process.exit(1);
    });
}

module.exports = main;