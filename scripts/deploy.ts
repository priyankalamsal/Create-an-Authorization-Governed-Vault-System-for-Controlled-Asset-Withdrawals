const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const network = await hre.ethers.provider.getNetwork();
  
  console.log("Deployer:", deployer.address);
  console.log("Chain ID:", network.chainId);
  
  // Deploy AuthorizationManager
  const AuthFactory = await hre.ethers.getContractFactory("AuthorizationManager");
  const auth = await AuthFactory.deploy();
  await auth.waitForDeployment();
  
  await auth.initialize(deployer.address);
  
  // Deploy SecureVault
  const VaultFactory = await hre.ethers.getContractFactory("SecureVault");
  const vault = await VaultFactory.deploy();
  await vault.waitForDeployment();
  
  await vault.initialize(await auth.getAddress());
  
  console.log("AuthorizationManager:", await auth.getAddress());
  console.log("SecureVault:", await vault.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});