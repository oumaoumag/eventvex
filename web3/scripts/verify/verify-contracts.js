const { verify } = require("../utils/verify");
const { loadDeployment, updateVerificationStatus } = require("../utils/deployment");

async function main() {
  const network = await ethers.provider.getNetwork();
  const networkName = network.name;
  
  console.log("🔍 Verifying EventVex contracts on", networkName);
  console.log("=" * 50);

  // Load deployment data
  const deployment = loadDeployment(networkName);
  
  if (!deployment) {
    console.error("❌ No deployment found for network:", networkName);
    process.exit(1);
  }

  const contracts = deployment.contracts;
  const verificationResults = [];

  // Verify EventFactory
  if (contracts.EventFactory) {
    console.log("🔍 Verifying EventFactory...");
    try {
      await verify(
        contracts.EventFactory.address,
        contracts.EventFactory.constructorArgs
      );
      
      await updateVerificationStatus(networkName, "EventFactory", true);
      verificationResults.push({ contract: "EventFactory", status: "verified" });
      console.log("✅ EventFactory verified successfully");
      
    } catch (error) {
      console.log("❌ EventFactory verification failed:", error.message);
      verificationResults.push({ contract: "EventFactory", status: "failed", error: error.message });
    }
  }

  // Summary
  console.log("\n" + "=" * 50);
  console.log("🔍 Verification Summary");
  console.log("=" * 50);
  
  for (const result of verificationResults) {
    const status = result.status === "verified" ? "✅" : "❌";
    console.log(`${status} ${result.contract}: ${result.status}`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  }

  const successCount = verificationResults.filter(r => r.status === "verified").length;
  const totalCount = verificationResults.length;
  
  console.log(`\n📊 Results: ${successCount}/${totalCount} contracts verified`);
  
  if (successCount === totalCount) {
    console.log("🎉 All contracts verified successfully!");
  } else {
    console.log("⚠️  Some contracts failed verification. Check the errors above.");
  }
}

if (require.main === module) {
  main()
    .then(() => {
      console.log("\n✅ Verification process completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Verification process failed:", error);
      process.exit(1);
    });
}

module.exports = main;
