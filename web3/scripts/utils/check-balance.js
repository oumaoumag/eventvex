const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  const balance = await ethers.provider.getBalance(deployer.address);
  
  console.log("🔍 Account Balance Check");
  console.log("========================");
  console.log("Address:", deployer.address);
  console.log("Balance:", ethers.formatEther(balance), "ETH");
  console.log("Network:", network.name);
  console.log("Chain ID:", network.chainId);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
