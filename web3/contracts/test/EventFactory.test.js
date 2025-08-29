const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("EventFactory", function () {
  let EventFactory, eventFactory;
  let EventTicket;
  let owner, organizer, user1, user2, platformFeeRecipient;
  let futureTimestamp;

  beforeEach(async function () {
    [owner, organizer, user1, user2, platformFeeRecipient] = await ethers.getSigners();

    // Deploy EventFactory
    EventFactory = await ethers.getContractFactory("EventFactory");
    eventFactory = await EventFactory.deploy(platformFeeRecipient.address);
    await eventFactory.waitForDeployment();

    // Get EventTicket contract factory for testing
    EventTicket = await ethers.getContractFactory("EventTicket");

    // Set future timestamp for events
    futureTimestamp = (await time.latest()) + 86400; // 24 hours from now
  });

  describe("Deployment", function () {
    it("Should set the correct platform fee recipient", async function () {
      expect(await eventFactory.platformFeeRecipient()).to.equal(platformFeeRecipient.address);
    });

    it("Should set default platform fee to 2.5%", async function () {
      expect(await eventFactory.platformFee()).to.equal(250);
    });

    it("Should set default organizer royalty to 5%", async function () {
      expect(await eventFactory.organizerRoyalty()).to.equal(500);
    });

    it("Should grant admin role to deployer", async function () {
      const adminRole = await eventFactory.DEFAULT_ADMIN_ROLE();
      expect(await eventFactory.hasRole(adminRole, owner.address)).to.be.true;
    });
  });

  describe("Event Creation", function () {
    const eventData = {
      title: "Test Event",
      description: "A test event",
      location: "Test Location",
      ticketPrice: ethers.parseEther("0.1"),
      maxTickets: 100,
      maxResalePrice: ethers.parseEther("0.3")
    };

    it("Should create a new event successfully", async function () {
      const tx = await eventFactory.connect(organizer).createEvent(
        eventData.title,
        eventData.description,
        eventData.location,
        futureTimestamp,
        eventData.ticketPrice,
        eventData.maxTickets,
        eventData.maxResalePrice
      );

      await expect(tx)
        .to.emit(eventFactory, "EventCreated")
        .withArgs(
          0, // eventId
          organizer.address,
          await ethers.getAddress(await eventFactory.getEvent(0).then(e => e.eventContract)),
          eventData.title,
          futureTimestamp,
          eventData.ticketPrice,
          eventData.maxTickets
        );

      const totalEvents = await eventFactory.getTotalEvents();
      expect(totalEvents).to.equal(1);
    });

    it("Should grant organizer role to event creator", async function () {
      await eventFactory.connect(organizer).createEvent(
        eventData.title,
        eventData.description,
        eventData.location,
        futureTimestamp,
        eventData.ticketPrice,
        eventData.maxTickets,
        eventData.maxResalePrice
      );

      const organizerRole = await eventFactory.ORGANIZER_ROLE();
      expect(await eventFactory.hasRole(organizerRole, organizer.address)).to.be.true;
    });

    it("Should revert if event date is in the past", async function () {
      const pastTimestamp = (await time.latest()) - 3600; // 1 hour ago

      await expect(
        eventFactory.connect(organizer).createEvent(
          eventData.title,
          eventData.description,
          eventData.location,
          pastTimestamp,
          eventData.ticketPrice,
          eventData.maxTickets,
          eventData.maxResalePrice
        )
      ).to.be.revertedWith("Event date must be in future");
    });

    it("Should revert if title is empty", async function () {
      await expect(
        eventFactory.connect(organizer).createEvent(
          "",
          eventData.description,
          eventData.location,
          futureTimestamp,
          eventData.ticketPrice,
          eventData.maxTickets,
          eventData.maxResalePrice
        )
      ).to.be.revertedWith("Title cannot be empty");
    });

    it("Should revert if ticket price is zero", async function () {
      await expect(
        eventFactory.connect(organizer).createEvent(
          eventData.title,
          eventData.description,
          eventData.location,
          futureTimestamp,
          0,
          eventData.maxTickets,
          eventData.maxResalePrice
        )
      ).to.be.revertedWith("Ticket price must be greater than 0");
    });

    it("Should revert if max tickets is zero or too high", async function () {
      await expect(
        eventFactory.connect(organizer).createEvent(
          eventData.title,
          eventData.description,
          eventData.location,
          futureTimestamp,
          eventData.ticketPrice,
          0,
          eventData.maxResalePrice
        )
      ).to.be.revertedWith("Invalid max tickets");

      await expect(
        eventFactory.connect(organizer).createEvent(
          eventData.title,
          eventData.description,
          eventData.location,
          futureTimestamp,
          eventData.ticketPrice,
          10001,
          eventData.maxResalePrice
        )
      ).to.be.revertedWith("Invalid max tickets");
    });
  });

  describe("Event Management", function () {
    beforeEach(async function () {
      await eventFactory.connect(organizer).createEvent(
        "Test Event",
        "A test event",
        "Test Location",
        futureTimestamp,
        ethers.parseEther("0.1"),
        100,
        ethers.parseEther("0.3")
      );
    });

    it("Should allow organizer to deactivate their event", async function () {
      await expect(eventFactory.connect(organizer).deactivateEvent(0))
        .to.emit(eventFactory, "EventDeactivated")
        .withArgs(0, organizer.address);

      const event = await eventFactory.getEvent(0);
      expect(event.isActive).to.be.false;
    });

    it("Should allow admin to deactivate any event", async function () {
      await expect(eventFactory.connect(owner).deactivateEvent(0))
        .to.emit(eventFactory, "EventDeactivated")
        .withArgs(0, organizer.address);

      const event = await eventFactory.getEvent(0);
      expect(event.isActive).to.be.false;
    });

    it("Should revert if unauthorized user tries to deactivate event", async function () {
      await expect(
        eventFactory.connect(user1).deactivateEvent(0)
      ).to.be.revertedWith("Not authorized");
    });
  });

  describe("Event Queries", function () {
    beforeEach(async function () {
      // Create multiple events
      await eventFactory.connect(organizer).createEvent(
        "Event 1",
        "Description 1",
        "Location 1",
        futureTimestamp,
        ethers.parseEther("0.1"),
        100,
        ethers.parseEther("0.3")
      );

      await eventFactory.connect(user1).createEvent(
        "Event 2",
        "Description 2",
        "Location 2",
        futureTimestamp + 3600,
        ethers.parseEther("0.2"),
        50,
        ethers.parseEther("0.6")
      );
    });

    it("Should return correct event details", async function () {
      const event = await eventFactory.getEvent(0);
      expect(event.title).to.equal("Event 1");
      expect(event.organizer).to.equal(organizer.address);
      expect(event.isActive).to.be.true;
    });

    it("Should return organizer's events", async function () {
      const organizerEvents = await eventFactory.getOrganizerEvents(organizer.address);
      expect(organizerEvents.length).to.equal(1);
      expect(organizerEvents[0]).to.equal(0);

      const user1Events = await eventFactory.getOrganizerEvents(user1.address);
      expect(user1Events.length).to.equal(1);
      expect(user1Events[0]).to.equal(1);
    });

    it("Should return all active events", async function () {
      const activeEvents = await eventFactory.getActiveEvents();
      expect(activeEvents.length).to.equal(2);
    });

    it("Should return upcoming events only", async function () {
      const upcomingEvents = await eventFactory.getUpcomingEvents();
      expect(upcomingEvents.length).to.equal(2);
    });
  });

  describe("Platform Configuration", function () {
    it("Should allow admin to update platform fee", async function () {
      await expect(eventFactory.connect(owner).updatePlatformFee(300))
        .to.emit(eventFactory, "PlatformFeeUpdated")
        .withArgs(250, 300);

      expect(await eventFactory.platformFee()).to.equal(300);
    });

    it("Should revert if platform fee exceeds 10%", async function () {
      await expect(
        eventFactory.connect(owner).updatePlatformFee(1001)
      ).to.be.revertedWith("Fee cannot exceed 10%");
    });

    it("Should allow admin to update organizer royalty", async function () {
      await expect(eventFactory.connect(owner).updateOrganizerRoyalty(600))
        .to.emit(eventFactory, "OrganizerRoyaltyUpdated")
        .withArgs(500, 600);

      expect(await eventFactory.organizerRoyalty()).to.equal(600);
    });

    it("Should revert if organizer royalty exceeds 10%", async function () {
      await expect(
        eventFactory.connect(owner).updateOrganizerRoyalty(1001)
      ).to.be.revertedWith("Royalty cannot exceed 10%");
    });
  });
});
