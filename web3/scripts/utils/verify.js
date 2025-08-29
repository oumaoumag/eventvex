const { run } = require("hardhat");

/**
 * Verify a contract on the block explorer
 * @param {string} contractAddress - The deployed contract address
 * @param {Array} constructorArgs - Constructor arguments used during deployment
 * @param {string} contractPath - Optional contract path for verification
 */
async function verify(contractAddress, constructorArgs = [], contractPath = "") {
  console.log(`🔍 Verifying contract at ${contractAddress}...`);
  
  try {
    const verifyArgs = {
      address: contractAddress,
      constructorArguments: constructorArgs,
    };

    // Add contract path if specified
    if (contractPath) {
      verifyArgs.contract = contractPath;
    }

    await run("verify:verify", verifyArgs);
    console.log(`✅ Contract verified successfully!`);
    
  } catch (error) {
    if (error.message.toLowerCase().includes("already verified")) {
      console.log("✅ Contract already verified!");
    } else {
      console.log(`❌ Verification failed: ${error.message}`);
      throw error;
    }
  }
}

/**
 * Verify multiple contracts
 * @param {Array} contracts - Array of contract objects with address, args, and optional path
 */
async function verifyMultiple(contracts) {
  console.log(`🔍 Verifying ${contracts.length} contracts...`);
  
  const results = [];
  
  for (const contract of contracts) {
    try {
      await verify(contract.address, contract.args || [], contract.path || "");
      results.push({ address: contract.address, status: "verified" });
    } catch (error) {
      console.log(`❌ Failed to verify ${contract.address}: ${error.message}`);
      results.push({ address: contract.address, status: "failed", error: error.message });
    }
  }
  
  return results;
}

module.exports = {
  verify,
  verifyMultiple,
};
