const fs = require("fs");
const path = require("path");

const DEPLOYMENTS_DIR = path.join(__dirname, "../../deployments");

/**
 * Ensure deployments directory exists
 */
function ensureDeploymentsDir() {
  if (!fs.existsSync(DEPLOYMENTS_DIR)) {
    fs.mkdirSync(DEPLOYMENTS_DIR, { recursive: true });
  }
}

/**
 * Save deployment data to file
 * @param {string} networkName - Name of the network
 * @param {object} deploymentData - Deployment information
 */
async function saveDeployment(networkName, deploymentData) {
  ensureDeploymentsDir();
  
  const filename = `${networkName}.json`;
  const filepath = path.join(DEPLOYMENTS_DIR, filename);
  
  try {
    fs.writeFileSync(filepath, JSON.stringify(deploymentData, null, 2));
    console.log(`💾 Deployment data saved to ${filepath}`);
  } catch (error) {
    console.error(`❌ Failed to save deployment data: ${error.message}`);
    throw error;
  }
}

/**
 * Load deployment data from file
 * @param {string} networkName - Name of the network
 * @returns {object|null} Deployment data or null if not found
 */
function loadDeployment(networkName) {
  const filename = `${networkName}.json`;
  const filepath = path.join(DEPLOYMENTS_DIR, filename);
  
  try {
    if (fs.existsSync(filepath)) {
      const data = fs.readFileSync(filepath, "utf8");
      return JSON.parse(data);
    }
    return null;
  } catch (error) {
    console.error(`❌ Failed to load deployment data: ${error.message}`);
    return null;
  }
}

/**
 * Get contract address from deployment
 * @param {string} networkName - Name of the network
 * @param {string} contractName - Name of the contract
 * @returns {string|null} Contract address or null if not found
 */
function getContractAddress(networkName, contractName) {
  const deployment = loadDeployment(networkName);
  
  if (deployment && deployment.contracts && deployment.contracts[contractName]) {
    return deployment.contracts[contractName].address;
  }
  
  return null;
}

/**
 * Update contract verification status
 * @param {string} networkName - Name of the network
 * @param {string} contractName - Name of the contract
 * @param {boolean} verified - Verification status
 */
async function updateVerificationStatus(networkName, contractName, verified) {
  const deployment = loadDeployment(networkName);
  
  if (deployment && deployment.contracts && deployment.contracts[contractName]) {
    deployment.contracts[contractName].verified = verified;
    await saveDeployment(networkName, deployment);
  }
}

/**
 * List all deployments
 * @returns {Array} Array of deployment information
 */
function listDeployments() {
  ensureDeploymentsDir();
  
  const deployments = [];
  const files = fs.readdirSync(DEPLOYMENTS_DIR);
  
  for (const file of files) {
    if (file.endsWith(".json")) {
      const networkName = file.replace(".json", "");
      const deployment = loadDeployment(networkName);
      
      if (deployment) {
        deployments.push({
          network: networkName,
          ...deployment
        });
      }
    }
  }
  
  return deployments;
}

/**
 * Generate deployment summary
 * @param {string} networkName - Name of the network (optional)
 * @returns {string} Formatted deployment summary
 */
function generateDeploymentSummary(networkName = null) {
  const deployments = networkName ? [loadDeployment(networkName)] : listDeployments();
  
  let summary = "📋 EventVex Deployment Summary\n";
  summary += "=" * 50 + "\n\n";
  
  for (const deployment of deployments) {
    if (!deployment) continue;
    
    summary += `🌐 Network: ${deployment.network || networkName}\n`;
    summary += `🆔 Chain ID: ${deployment.chainId}\n`;
    summary += `👤 Deployer: ${deployment.deployer}\n`;
    summary += `📅 Deployed: ${deployment.timestamp}\n\n`;
    
    summary += "📦 Contracts:\n";
    for (const [contractName, contractInfo] of Object.entries(deployment.contracts || {})) {
      summary += `  • ${contractName}: ${contractInfo.address}\n`;
      summary += `    ✅ Verified: ${contractInfo.verified ? "Yes" : "No"}\n`;
      if (deployment.gasUsed && deployment.gasUsed[contractName]) {
        summary += `    ⛽ Gas Used: ${deployment.gasUsed[contractName]}\n`;
      }
    }
    
    summary += "\n" + "-" * 30 + "\n\n";
  }
  
  return summary;
}

/**
 * Export deployment data for frontend
 * @param {string} networkName - Name of the network
 * @returns {object} Frontend-compatible deployment data
 */
function exportForFrontend(networkName) {
  const deployment = loadDeployment(networkName);
  
  if (!deployment) {
    return null;
  }
  
  const frontendData = {
    network: deployment.network,
    chainId: parseInt(deployment.chainId),
    contracts: {},
    timestamp: deployment.timestamp
  };
  
  // Extract contract addresses and ABIs
  for (const [contractName, contractInfo] of Object.entries(deployment.contracts || {})) {
    frontendData.contracts[contractName] = {
      address: contractInfo.address,
      verified: contractInfo.verified
    };
  }
  
  return frontendData;
}

module.exports = {
  saveDeployment,
  loadDeployment,
  getContractAddress,
  updateVerificationStatus,
  listDeployments,
  generateDeploymentSummary,
  exportForFrontend,
};
