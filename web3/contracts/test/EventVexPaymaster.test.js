const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("EventVexPaymaster", function () {
  let EventVexPaymaster, paymaster;
  let EventFactory, eventFactory;
  let owner, user1, user2, eventFactoryAddress;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    // Deploy EventFactory first
    EventFactory = await ethers.getContractFactory("EventFactory");
    eventFactory = await EventFactory.deploy(owner.address);
    await eventFactory.waitForDeployment();
    eventFactoryAddress = await eventFactory.getAddress();

    // Deploy EventVexPaymaster
    EventVexPaymaster = await ethers.getContractFactory("EventVexPaymaster");
    paymaster = await EventVexPaymaster.deploy(eventFactoryAddress);
    await paymaster.waitForDeployment();

    // Fund the paymaster
    await owner.sendTransaction({
      to: await paymaster.getAddress(),
      value: ethers.parseEther("10")
    });
  });

  describe("Deployment", function () {
    it("Should set correct event factory address", async function () {
      expect(await paymaster.eventFactoryAddress()).to.equal(eventFactoryAddress);
    });

    it("Should set correct owner", async function () {
      expect(await paymaster.owner()).to.equal(owner.address);
    });

    it("Should have correct initial limits", async function () {
      expect(await paymaster.maxGasSponsorshipPerTx()).to.equal(ethers.parseEther("0.01"));
      expect(await paymaster.maxGasSponsorshipPerUser()).to.equal(ethers.parseEther("0.1"));
      expect(await paymaster.dailyGasLimit()).to.equal(ethers.parseEther("1"));
    });
  });

  describe("Fund Management", function () {
    it("Should accept ETH deposits", async function () {
      const depositAmount = ethers.parseEther("1");
      
      await expect(
        user1.sendTransaction({
          to: await paymaster.getAddress(),
          value: depositAmount
        })
      ).to.emit(paymaster, "FundsDeposited")
        .withArgs(user1.address, depositAmount);
    });

    it("Should allow explicit fund deposits", async function () {
      const depositAmount = ethers.parseEther("0.5");
      
      await expect(
        paymaster.connect(user1).depositFunds({ value: depositAmount })
      ).to.emit(paymaster, "FundsDeposited")
        .withArgs(user1.address, depositAmount);
    });

    it("Should allow owner to withdraw funds", async function () {
      const withdrawAmount = ethers.parseEther("1");
      
      await expect(
        paymaster.connect(owner).withdrawFunds(withdrawAmount)
      ).to.emit(paymaster, "FundsWithdrawn")
        .withArgs(owner.address, withdrawAmount);
    });

    it("Should prevent non-owner from withdrawing", async function () {
      await expect(
        paymaster.connect(user1).withdrawFunds(ethers.parseEther("1"))
      ).to.be.reverted;
    });

    it("Should prevent withdrawing more than balance", async function () {
      const balance = await paymaster.getBalance();
      
      await expect(
        paymaster.connect(owner).withdrawFunds(balance + ethers.parseEther("1"))
      ).to.be.revertedWith("Insufficient balance");
    });
  });

  describe("Sponsorship Eligibility", function () {
    it("Should check eligibility correctly", async function () {
      const gasAmount = 21000;
      const gasPrice = ethers.parseUnits("20", "gwei");
      
      expect(
        await paymaster.isEligibleForSponsorship(user1.address, gasAmount, gasPrice)
      ).to.be.true;
    });

    it("Should reject if transaction cost exceeds limit", async function () {
      const gasAmount = 1000000; // Very high gas
      const gasPrice = ethers.parseUnits("100", "gwei");
      
      expect(
        await paymaster.isEligibleForSponsorship(user1.address, gasAmount, gasPrice)
      ).to.be.false;
    });

    it("Should reject if user daily limit exceeded", async function () {
      // First, use up most of the daily limit
      const gasAmount = 21000;
      const gasPrice = ethers.parseUnits("20", "gwei");
      
      // Authorize event factory to call sponsorGas
      await paymaster.connect(owner).addAuthorizedContract(eventFactoryAddress);
      
      // Sponsor gas multiple times to approach limit
      for (let i = 0; i < 10; i++) {
        await paymaster.connect(eventFactory.runner).sponsorGas(
          user1.address,
          gasAmount,
          gasPrice
        );
      }
      
      // Now should be ineligible
      expect(
        await paymaster.isEligibleForSponsorship(user1.address, gasAmount, gasPrice)
      ).to.be.false;
    });

    it("Should reject when paused", async function () {
      await paymaster.connect(owner).pauseSponsorship();
      
      const gasAmount = 21000;
      const gasPrice = ethers.parseUnits("20", "gwei");
      
      expect(
        await paymaster.isEligibleForSponsorship(user1.address, gasAmount, gasPrice)
      ).to.be.false;
    });
  });

  describe("Gas Sponsorship", function () {
    beforeEach(async function () {
      await paymaster.connect(owner).addAuthorizedContract(eventFactoryAddress);
    });

    it("Should sponsor gas for authorized contract", async function () {
      const gasAmount = 21000;
      const gasPrice = ethers.parseUnits("20", "gwei");
      
      await expect(
        paymaster.connect(eventFactory.runner).sponsorGas(
          user1.address,
          gasAmount,
          gasPrice
        )
      ).to.emit(paymaster, "GasSponsored")
        .withArgs(user1.address, gasAmount, gasAmount * gasPrice);
    });

    it("Should reject unauthorized contract", async function () {
      const gasAmount = 21000;
      const gasPrice = ethers.parseUnits("20", "gwei");
      
      await expect(
        paymaster.connect(user1).sponsorGas(user2.address, gasAmount, gasPrice)
      ).to.be.revertedWith("Unauthorized contract");
    });

    it("Should track user gas usage", async function () {
      const gasAmount = 21000;
      const gasPrice = ethers.parseUnits("20", "gwei");
      const gasCost = gasAmount * gasPrice;
      
      await paymaster.connect(eventFactory.runner).sponsorGas(
        user1.address,
        gasAmount,
        gasPrice
      );
      
      expect(await paymaster.userGasUsedToday(user1.address)).to.equal(gasCost);
    });

    it("Should reset daily counters", async function () {
      const gasAmount = 21000;
      const gasPrice = ethers.parseUnits("20", "gwei");
      
      await paymaster.connect(eventFactory.runner).sponsorGas(
        user1.address,
        gasAmount,
        gasPrice
      );
      
      // Fast forward 1 day
      await time.increase(86400);
      
      // Should reset and allow sponsorship again
      expect(
        await paymaster.isEligibleForSponsorship(user1.address, gasAmount, gasPrice)
      ).to.be.true;
    });
  });

  describe("Contract Management", function () {
    it("Should add authorized contract", async function () {
      const mockContract = ethers.Wallet.createRandom().address;
      
      await paymaster.connect(owner).addAuthorizedContract(mockContract);
      expect(await paymaster.authorizedContracts(mockContract)).to.be.true;
    });

    it("Should remove authorized contract", async function () {
      const mockContract = ethers.Wallet.createRandom().address;
      
      await paymaster.connect(owner).addAuthorizedContract(mockContract);
      await paymaster.connect(owner).removeAuthorizedContract(mockContract);
      
      expect(await paymaster.authorizedContracts(mockContract)).to.be.false;
    });

    it("Should allow event factory to add ticket contracts", async function () {
      const mockTicketContract = ethers.Wallet.createRandom().address;
      
      await paymaster.connect(eventFactory.runner).addEventTicketContract(mockTicketContract);
      expect(await paymaster.eventTicketContracts(mockTicketContract)).to.be.true;
    });

    it("Should prevent non-factory from adding ticket contracts", async function () {
      const mockTicketContract = ethers.Wallet.createRandom().address;
      
      await expect(
        paymaster.connect(user1).addEventTicketContract(mockTicketContract)
      ).to.be.revertedWith("Only factory can add ticket contracts");
    });
  });

  describe("Limit Management", function () {
    it("Should update sponsorship limits", async function () {
      const newMaxPerTx = ethers.parseEther("0.02");
      const newMaxPerUser = ethers.parseEther("0.2");
      const newDailyLimit = ethers.parseEther("2");
      
      await expect(
        paymaster.connect(owner).updateSponsorshipLimits(
          newMaxPerTx,
          newMaxPerUser,
          newDailyLimit
        )
      ).to.emit(paymaster, "SponsorshipLimitUpdated")
        .withArgs(newMaxPerTx);
      
      expect(await paymaster.maxGasSponsorshipPerTx()).to.equal(newMaxPerTx);
      expect(await paymaster.maxGasSponsorshipPerUser()).to.equal(newMaxPerUser);
      expect(await paymaster.dailyGasLimit()).to.equal(newDailyLimit);
    });
  });

  describe("User Queries", function () {
    it("Should get user remaining sponsorship", async function () {
      const maxPerUser = await paymaster.maxGasSponsorshipPerUser();
      
      expect(
        await paymaster.getUserRemainingSponsorship(user1.address)
      ).to.equal(maxPerUser);
    });

    it("Should get global remaining sponsorship", async function () {
      const dailyLimit = await paymaster.dailyGasLimit();
      
      expect(
        await paymaster.getGlobalRemainingSponsorship()
      ).to.equal(dailyLimit);
    });

    it("Should return contract balance", async function () {
      const balance = await ethers.provider.getBalance(await paymaster.getAddress());
      expect(await paymaster.getBalance()).to.equal(balance);
    });
  });

  describe("Pause Functionality", function () {
    it("Should pause and resume sponsorship", async function () {
      await paymaster.connect(owner).pauseSponsorship();
      
      const gasAmount = 21000;
      const gasPrice = ethers.parseUnits("20", "gwei");
      
      expect(
        await paymaster.isEligibleForSponsorship(user1.address, gasAmount, gasPrice)
      ).to.be.false;
      
      await paymaster.connect(owner).resumeSponsorship();
      
      expect(
        await paymaster.isEligibleForSponsorship(user1.address, gasAmount, gasPrice)
      ).to.be.true;
    });
  });
});