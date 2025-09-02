const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("EventTicket", function () {
  let EventTicket, eventTicket;
  let owner, organizer, buyer1, buyer2, platformFeeRecipient;
  let eventInfo;

  beforeEach(async function () {
    [owner, organizer, buyer1, buyer2, platformFeeRecipient] = await ethers.getSigners();

    EventTicket = await ethers.getContractFactory("EventTicket");
    
    const futureTimestamp = (await time.latest()) + 86400; // 24 hours from now
    
    eventInfo = {
      title: "Test Concert",
      description: "A test concert event",
      location: "Test Venue",
      metadataURI: "ipfs://test-metadata",
      eventDate: futureTimestamp,
      ticketPrice: ethers.parseEther("0.1"),
      maxTickets: 100,
      maxResalePrice: ethers.parseEther("0.3"),
      organizer: organizer.address,
      isActive: true,
      isCancelled: false
    };

    eventTicket = await EventTicket.deploy(
      eventInfo,
      organizer.address,
      platformFeeRecipient.address
    );
    await eventTicket.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set correct event info", async function () {
      const storedEventInfo = await eventTicket.eventInfo();
      expect(storedEventInfo.title).to.equal(eventInfo.title);
      expect(storedEventInfo.organizer).to.equal(organizer.address);
      expect(storedEventInfo.isActive).to.be.true;
    });

    it("Should grant correct roles", async function () {
      const organizerRole = await eventTicket.ORGANIZER_ROLE();
      expect(await eventTicket.hasRole(organizerRole, organizer.address)).to.be.true;
    });
  });

  describe("Ticket Minting", function () {
    it("Should mint ticket successfully", async function () {
      await expect(
        eventTicket.connect(buyer1).mintTicket(0, "ipfs://ticket-0", {
          value: eventInfo.ticketPrice
        })
      ).to.emit(eventTicket, "TicketMinted")
        .withArgs(0, buyer1.address, 0, eventInfo.ticketPrice);

      expect(await eventTicket.ownerOf(0)).to.equal(buyer1.address);
    });

    it("Should prevent duplicate seat minting", async function () {
      await eventTicket.connect(buyer1).mintTicket(0, "ipfs://ticket-0", {
        value: eventInfo.ticketPrice
      });

      await expect(
        eventTicket.connect(buyer2).mintTicket(0, "ipfs://ticket-0", {
          value: eventInfo.ticketPrice
        })
      ).to.be.revertedWith("Seat already taken");
    });

    it("Should reject insufficient payment", async function () {
      await expect(
        eventTicket.connect(buyer1).mintTicket(0, "ipfs://ticket-0", {
          value: ethers.parseEther("0.05")
        })
      ).to.be.revertedWith("Insufficient payment");
    });
  });

  describe("Resale Functionality", function () {
    beforeEach(async function () {
      await eventTicket.connect(buyer1).mintTicket(0, "ipfs://ticket-0", {
        value: eventInfo.ticketPrice
      });
    });

    it("Should list ticket for resale", async function () {
      const resalePrice = ethers.parseEther("0.2");
      
      await expect(
        eventTicket.connect(buyer1).listForResale(0, resalePrice)
      ).to.emit(eventTicket, "TicketListedForResale")
        .withArgs(0, resalePrice);

      const ticketInfo = await eventTicket.getTicketInfo(0);
      expect(ticketInfo.isForResale).to.be.true;
      expect(ticketInfo.resalePrice).to.equal(resalePrice);
    });

    it("Should allow buying resale ticket", async function () {
      const resalePrice = ethers.parseEther("0.2");
      await eventTicket.connect(buyer1).listForResale(0, resalePrice);

      await expect(
        eventTicket.connect(buyer2).buyResaleTicket(0, {
          value: resalePrice
        })
      ).to.emit(eventTicket, "TicketSold")
        .withArgs(0, buyer1.address, buyer2.address, resalePrice);

      expect(await eventTicket.ownerOf(0)).to.equal(buyer2.address);
    });
  });

  describe("Event Management", function () {
    it("Should allow organizer to cancel event", async function () {
      await expect(
        eventTicket.connect(organizer).cancelEvent()
      ).to.emit(eventTicket, "EventCancelled");

      const storedEventInfo = await eventTicket.eventInfo();
      expect(storedEventInfo.isCancelled).to.be.true;
    });

    it("Should allow refunds for cancelled events", async function () {
      await eventTicket.connect(buyer1).mintTicket(0, "ipfs://ticket-0", {
        value: eventInfo.ticketPrice
      });

      await eventTicket.connect(organizer).cancelEvent();

      await expect(
        eventTicket.connect(buyer1).requestRefund(0)
      ).to.emit(eventTicket, "RefundIssued")
        .withArgs(0, buyer1.address, eventInfo.ticketPrice);
    });
  });

  describe("Access Control", function () {
    it("Should prevent non-organizer from cancelling event", async function () {
      await expect(
        eventTicket.connect(buyer1).cancelEvent()
      ).to.be.reverted;
    });

    it("Should allow pausing by pauser role", async function () {
      await eventTicket.connect(owner).pause();
      
      await expect(
        eventTicket.connect(buyer1).mintTicket(0, "ipfs://ticket-0", {
          value: eventInfo.ticketPrice
        })
      ).to.be.revertedWith("Pausable: paused");
    });
  });
});