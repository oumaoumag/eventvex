const fs = require('fs');
const path = require('path');
const { loadDeployment } = require('../utils/deployment');

async function updateEnvironmentFiles(network = 'baseMainnet') {
  console.log(`🔧 Updating environment files for ${network}`);
  console.log("=======================================");
  
  try {
    // Load deployment data
    const deployment = await loadDeployment(network);
    if (!deployment || !deployment.contracts) {
      throw new Error(`No deployment found for network: ${network}`);
    }
    
    const contracts = deployment.contracts;
    
    // Update web3/.env
    const web3EnvPath = path.join(__dirname, '../../.env');
    console.log("📝 Updating web3/.env...");
    
    let web3EnvContent = fs.readFileSync(web3EnvPath, 'utf8');
    
    // Update contract addresses
    web3EnvContent = web3EnvContent.replace(
      /EVENT_FACTORY_ADDRESS=.*/,
      `EVENT_FACTORY_ADDRESS=${contracts.EventFactory?.address || ''}`
    );
    web3EnvContent = web3EnvContent.replace(
      /ACCESS_CONTROL_ADDRESS=.*/,
      `ACCESS_CONTROL_ADDRESS=${contracts.EventVexAccessControl?.address || ''}`
    );
    web3EnvContent = web3EnvContent.replace(
      /MARKETPLACE_ADDRESS=.*/,
      `MARKETPLACE_ADDRESS=${contracts.TicketMarketplace?.address || ''}`
    );
    web3EnvContent = web3EnvContent.replace(
      /PAYMASTER_ADDRESS=.*/,
      `PAYMASTER_ADDRESS=${contracts.EventVexPaymaster?.address || ''}`
    );
    
    fs.writeFileSync(web3EnvPath, web3EnvContent);
    console.log("✅ web3/.env updated");
    
    // Update frontend/.env
    const frontendEnvPath = path.join(__dirname, '../../../frontend/.env');
    console.log("📝 Updating frontend/.env...");
    
    let frontendEnvContent = fs.readFileSync(frontendEnvPath, 'utf8');
    
    // Update contract addresses
    frontendEnvContent = frontendEnvContent.replace(
      /VITE_EVENT_FACTORY_ADDRESS=.*/,
      `VITE_EVENT_FACTORY_ADDRESS=${contracts.EventFactory?.address || ''}`
    );
    frontendEnvContent = frontendEnvContent.replace(
      /VITE_ACCESS_CONTROL_ADDRESS=.*/,
      `VITE_ACCESS_CONTROL_ADDRESS=${contracts.EventVexAccessControl?.address || ''}`
    );
    frontendEnvContent = frontendEnvContent.replace(
      /VITE_MARKETPLACE_ADDRESS=.*/,
      `VITE_MARKETPLACE_ADDRESS=${contracts.TicketMarketplace?.address || ''}`
    );
    frontendEnvContent = frontendEnvContent.replace(
      /VITE_PAYMASTER_ADDRESS=.*/,
      `VITE_PAYMASTER_ADDRESS=${contracts.EventVexPaymaster?.address || ''}`
    );
    
    fs.writeFileSync(frontendEnvPath, frontendEnvContent);
    console.log("✅ frontend/.env updated");
    
    // Display updated addresses
    console.log("\n📋 Updated Contract Addresses:");
    console.log(`   EventFactory:          ${contracts.EventFactory?.address || 'NOT_DEPLOYED'}`);
    console.log(`   EventVexAccessControl: ${contracts.EventVexAccessControl?.address || 'NOT_DEPLOYED'}`);
    console.log(`   TicketMarketplace:     ${contracts.TicketMarketplace?.address || 'NOT_DEPLOYED'}`);
    console.log(`   EventVexPaymaster:     ${contracts.EventVexPaymaster?.address || 'NOT_DEPLOYED'}`);
    
    console.log("\n✅ Environment files updated successfully!");
    
  } catch (error) {
    console.error("❌ Failed to update environment files:", error.message);
    throw error;
  }
}

// Execute if run directly
if (require.main === module) {
  const network = process.argv[2] || 'baseMainnet';
  updateEnvironmentFiles(network)
    .then(() => {
      console.log("🎉 Environment update complete!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Environment update failed:", error);
      process.exit(1);
    });
}

module.exports = updateEnvironmentFiles;