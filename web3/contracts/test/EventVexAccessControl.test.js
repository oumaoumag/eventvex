const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("EventVexAccessControl", function () {
  let EventVexAccessControl, accessControl;
  let owner, organizer, user1, user2, moderator;

  beforeEach(async function () {
    [owner, organizer, user1, user2, moderator] = await ethers.getSigners();

    EventVexAccessControl = await ethers.getContractFactory("EventVexAccessControl");
    accessControl = await EventVexAccessControl.deploy();
    await accessControl.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should grant admin role to deployer", async function () {
      const adminRole = await accessControl.DEFAULT_ADMIN_ROLE();
      expect(await accessControl.hasRole(adminRole, owner.address)).to.be.true;
    });

    it("Should set up role hierarchy", async function () {
      const platformAdminRole = await accessControl.PLATFORM_ADMIN_ROLE();
      const organizerRole = await accessControl.ORGANIZER_ROLE();
      
      expect(await accessControl.getRoleAdmin(organizerRole)).to.equal(platformAdminRole);
    });
  });

  describe("User Registration", function () {
    it("Should register new user", async function () {
      await expect(
        accessControl.connect(user1).registerUser()
      ).to.emit(accessControl, "UserRegistered")
        .withArgs(user1.address, await ethers.provider.getBlock('latest').then(b => b.timestamp + 1));

      const profile = await accessControl.userProfiles(user1.address);
      expect(profile.status).to.equal(0); // ACTIVE
      expect(profile.createdAt).to.be.gt(0);
    });

    it("Should prevent duplicate registration", async function () {
      await accessControl.connect(user1).registerUser();
      
      await expect(
        accessControl.connect(user1).registerUser()
      ).to.be.revertedWith("User already registered");
    });
  });

  describe("Organizer Management", function () {
    it("Should grant organizer role", async function () {
      await accessControl.connect(owner).grantOrganizerRole(
        organizer.address,
        "ipfs://organizer-metadata"
      );

      const organizerRole = await accessControl.ORGANIZER_ROLE();
      expect(await accessControl.hasRole(organizerRole, organizer.address)).to.be.true;
      
      const metadata = await accessControl.organizerMetadata(organizer.address);
      expect(metadata).to.equal("ipfs://organizer-metadata");
    });

    it("Should verify organizer", async function () {
      await accessControl.connect(owner).grantOrganizerRole(
        organizer.address,
        "ipfs://organizer-metadata"
      );

      await expect(
        accessControl.connect(owner).verifyOrganizer(organizer.address, "premium")
      ).to.emit(accessControl, "OrganizerVerified")
        .withArgs(organizer.address, "premium");

      const verifiedRole = await accessControl.VERIFIED_ORGANIZER_ROLE();
      expect(await accessControl.hasRole(verifiedRole, organizer.address)).to.be.true;
      
      expect(await accessControl.isVerifiedOrganizer(organizer.address)).to.be.true;
    });

    it("Should check event creation permissions", async function () {
      // User without organizer role
      expect(await accessControl.canCreateEvents(user1.address)).to.be.false;

      // Grant organizer role
      await accessControl.connect(owner).grantOrganizerRole(
        organizer.address,
        "ipfs://organizer-metadata"
      );

      expect(await accessControl.canCreateEvents(organizer.address)).to.be.true;
    });
  });

  describe("User Status Management", function () {
    beforeEach(async function () {
      await accessControl.connect(user1).registerUser();
      
      // Grant moderator role
      const moderatorRole = await accessControl.MODERATOR_ROLE();
      await accessControl.connect(owner).grantRole(moderatorRole, moderator.address);
    });

    it("Should change user status", async function () {
      await expect(
        accessControl.connect(moderator).changeUserStatus(user1.address, 1) // SUSPENDED
      ).to.emit(accessControl, "UserStatusChanged")
        .withArgs(user1.address, 0, 1); // ACTIVE to SUSPENDED

      const profile = await accessControl.userProfiles(user1.address);
      expect(profile.status).to.equal(1); // SUSPENDED
    });

    it("Should affect permissions based on status", async function () {
      // Initially can purchase tickets
      expect(await accessControl.canPurchaseTickets(user1.address)).to.be.true;

      // Suspend user
      await accessControl.connect(moderator).changeUserStatus(user1.address, 1);

      // Now cannot purchase tickets
      expect(await accessControl.canPurchaseTickets(user1.address)).to.be.false;
    });
  });

  describe("Contract Authorization", function () {
    it("Should authorize contracts", async function () {
      const contractManagerRole = await accessControl.CONTRACT_MANAGER_ROLE();
      await accessControl.connect(owner).grantRole(contractManagerRole, owner.address);

      const mockContract = ethers.Wallet.createRandom().address;

      await expect(
        accessControl.connect(owner).authorizeContract(mockContract, true)
      ).to.emit(accessControl, "ContractAuthorized")
        .withArgs(mockContract, true);

      expect(await accessControl.isAuthorizedContract(mockContract)).to.be.true;
    });
  });

  describe("Activity Tracking", function () {
    let mockContract;

    beforeEach(async function () {
      await accessControl.connect(user1).registerUser();
      
      // Setup mock authorized contract
      mockContract = user2; // Using user2 as mock contract
      const contractManagerRole = await accessControl.CONTRACT_MANAGER_ROLE();
      await accessControl.connect(owner).grantRole(contractManagerRole, owner.address);
      await accessControl.connect(owner).authorizeContract(mockContract.address, true);
    });

    it("Should update user activity", async function () {
      await accessControl.connect(mockContract).updateUserActivity(user1.address);
      
      const profile = await accessControl.userProfiles(user1.address);
      expect(profile.lastActivity).to.be.gt(profile.createdAt);
    });

    it("Should increment event count", async function () {
      await accessControl.connect(mockContract).incrementUserEvents(user1.address);
      
      const profile = await accessControl.userProfiles(user1.address);
      expect(profile.eventsCreated).to.equal(1);
    });

    it("Should increment ticket count", async function () {
      await accessControl.connect(mockContract).incrementUserTickets(user1.address);
      
      const profile = await accessControl.userProfiles(user1.address);
      expect(profile.ticketsPurchased).to.equal(1);
    });

    it("Should get user statistics", async function () {
      await accessControl.connect(mockContract).incrementUserEvents(user1.address);
      await accessControl.connect(mockContract).incrementUserTickets(user1.address);

      const stats = await accessControl.getUserStats(user1.address);
      expect(stats.eventsCreated).to.equal(1);
      expect(stats.ticketsPurchased).to.equal(1);
      expect(stats.accountAge).to.be.gt(0);
    });
  });

  describe("Batch Operations", function () {
    it("Should batch grant roles", async function () {
      const organizerRole = await accessControl.ORGANIZER_ROLE();
      const users = [user1.address, user2.address];

      await accessControl.connect(owner).batchGrantRole(organizerRole, users);

      expect(await accessControl.hasRole(organizerRole, user1.address)).to.be.true;
      expect(await accessControl.hasRole(organizerRole, user2.address)).to.be.true;
    });

    it("Should batch revoke roles", async function () {
      const organizerRole = await accessControl.ORGANIZER_ROLE();
      const users = [user1.address, user2.address];

      await accessControl.connect(owner).batchGrantRole(organizerRole, users);
      await accessControl.connect(owner).batchRevokeRole(organizerRole, users);

      expect(await accessControl.hasRole(organizerRole, user1.address)).to.be.false;
      expect(await accessControl.hasRole(organizerRole, user2.address)).to.be.false;
    });
  });

  describe("Emergency Functions", function () {
    it("Should pause and affect role checks", async function () {
      const organizerRole = await accessControl.ORGANIZER_ROLE();
      await accessControl.connect(owner).grantRole(organizerRole, organizer.address);

      // Initially has role
      expect(await accessControl.hasRole(organizerRole, organizer.address)).to.be.true;

      // Pause
      await accessControl.connect(owner).emergencyPause();

      // Role check should return false when paused (except for admin roles)
      expect(await accessControl.hasRole(organizerRole, organizer.address)).to.be.false;

      // Admin roles should still work
      const adminRole = await accessControl.DEFAULT_ADMIN_ROLE();
      expect(await accessControl.hasRole(adminRole, owner.address)).to.be.true;
    });

    it("Should unpause and restore role checks", async function () {
      const organizerRole = await accessControl.ORGANIZER_ROLE();
      await accessControl.connect(owner).grantRole(organizerRole, organizer.address);

      await accessControl.connect(owner).emergencyPause();
      await accessControl.connect(owner).unpause();

      // Role should work again after unpause
      expect(await accessControl.hasRole(organizerRole, organizer.address)).to.be.true;
    });
  });
});