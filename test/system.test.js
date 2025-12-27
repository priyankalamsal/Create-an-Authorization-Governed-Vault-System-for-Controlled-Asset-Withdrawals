const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Secure Vault System", function () {
  async function deployContracts() {
    const [owner, recipient, other] = await ethers.getSigners();
    
    const AuthFactory = await ethers.getContractFactory("AuthorizationManager");
    const auth = await AuthFactory.deploy();
    
    const VaultFactory = await ethers.getContractFactory("SecureVault");
    const vault = await VaultFactory.deploy();
    
    await auth.initialize(owner.address);
    await vault.initialize(await auth.getAddress());
    
    // Deposit ETH to vault
    await owner.sendTransaction({
      to: await vault.getAddress(),
      value: ethers.parseEther("10")
    });
    
    return { auth, vault, owner, recipient, other };
  }
  
  it("Should deploy and initialize contracts", async function () {
    const { auth, vault, owner } = await loadFixture(deployContracts);
    
    expect(await auth.signer()).to.equal(owner.address);
    expect(await auth.initialized()).to.be.true;
    expect(await vault.authManager()).to.equal(await auth.getAddress());
    expect(await vault.initialized()).to.be.true;
  });
  
  it("Should accept deposits", async function () {
    const { vault } = await loadFixture(deployContracts);
    expect(await vault.getBalance()).to.equal(ethers.parseEther("10"));
  });
  
  it("Should withdraw with valid authorization", async function () {
    const { auth, vault, owner, recipient } = await loadFixture(deployContracts);
    
    const amount = ethers.parseEther("1");
    const nonce = ethers.id("test-nonce");
    const chainId = (await ethers.provider.getNetwork()).chainId;
    
    const messageHash = ethers.solidityPackedKeccak256(
      ["address", "address", "uint256", "uint256", "bytes32"],
      [await vault.getAddress(), recipient.address, amount, chainId, nonce]
    );
    
    const signature = await owner.signMessage(ethers.getBytes(messageHash));
    
    await expect(vault.withdraw(recipient.address, amount, nonce, signature))
      .to.emit(vault, "Withdrawal")
      .withArgs(recipient.address, amount, nonce);
    
    expect(await vault.getBalance()).to.equal(ethers.parseEther("9"));
  });
  
  it("Should prevent replay attacks", async function () {
    const { auth, vault, owner, recipient } = await loadFixture(deployContracts);
    
    const amount = ethers.parseEther("1");
    const nonce = ethers.id("unique-nonce");
    const chainId = (await ethers.provider.getNetwork()).chainId;
    
    const messageHash = ethers.solidityPackedKeccak256(
      ["address", "address", "uint256", "uint256", "bytes32"],
      [await vault.getAddress(), recipient.address, amount, chainId, nonce]
    );
    
    const signature = await owner.signMessage(ethers.getBytes(messageHash));
    
    // First withdrawal should succeed
    await vault.withdraw(recipient.address, amount, nonce, signature);
    
    // Second withdrawal with same nonce should fail
    await expect(
      vault.withdraw(recipient.address, amount, nonce, signature)
    ).to.be.revertedWithCustomError(auth, "AlreadyUsed");
  });
  
  it("Should reject invalid signature", async function () {
    const { auth, vault, recipient, other } = await loadFixture(deployContracts);
    
    const amount = ethers.parseEther("1");
    const nonce = ethers.id("test-nonce");
    const chainId = (await ethers.provider.getNetwork()).chainId;
    
    const messageHash = ethers.solidityPackedKeccak256(
      ["address", "address", "uint256", "uint256", "bytes32"],
      [await vault.getAddress(), recipient.address, amount, chainId, nonce]
    );
    
    // Wrong signer
    const signature = await other.signMessage(ethers.getBytes(messageHash));
    
    await expect(
      vault.withdraw(recipient.address, amount, nonce, signature)
    ).to.be.revertedWithCustomError(auth, "InvalidSignature");
  });
});