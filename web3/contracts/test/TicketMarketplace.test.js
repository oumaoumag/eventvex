const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("TicketMarketplace", function () {
  let TicketMarketplace, marketplace;
  let EventFactory, eventFactory;
  let EventTicket, eventTicket;
  let owner, seller, buyer, feeRecipient;
  let eventInfo;

  beforeEach(async function () {
    [owner, seller, buyer, feeRecipient] = await ethers.getSigners();

    // Deploy EventFactory first
    EventFactory = await ethers.getContractFactory("EventFactory");
    eventFactory = await EventFactory.deploy(feeRecipient.address);
    await eventFactory.waitForDeployment();

    // Deploy TicketMarketplace
    TicketMarketplace = await ethers.getContractFactory("TicketMarketplace");
    marketplace = await TicketMarketplace.deploy(
      feeRecipient.address,
      await eventFactory.getAddress()
    );
    await marketplace.waitForDeployment();

    // Create an event and mint a ticket
    const futureTimestamp = (await time.latest()) + 86400;
    
    const tx = await eventFactory.connect(seller).createEvent(
      "Test Event",
      "Test Description",
      "Test Location",
      "ipfs://test-metadata",
      futureTimestamp,
      ethers.parseEther("0.1"),
      100,
      ethers.parseEther("0.3")
    );
    
    const receipt = await tx.wait();
    const event = await eventFactory.getEvent(0);
    
    EventTicket = await ethers.getContractFactory("EventTicket");
    eventTicket = EventTicket.attach(event.eventContract);

    // Mint a ticket
    await eventTicket.connect(seller).mintTicket(0, "ipfs://ticket-0", {
      value: ethers.parseEther("0.1")
    });

    // Approve marketplace
    await eventTicket.connect(seller).setApprovalForAll(await marketplace.getAddress(), true);
  });

  describe("Deployment", function () {
    it("Should set correct fee recipient", async function () {
      expect(await marketplace.feeRecipient()).to.equal(feeRecipient.address);
    });

    it("Should set correct marketplace fee", async function () {
      expect(await marketplace.marketplaceFee()).to.equal(250); // 2.5%
    });
  });

  describe("Fixed Price Listings", function () {
    it("Should create fixed price listing", async function () {
      const price = ethers.parseEther("0.15");
      const duration = 86400; // 1 day

      await expect(
        marketplace.connect(seller).listTicket(
          await eventTicket.getAddress(),
          0,
          price,
          duration
        )
      ).to.emit(marketplace, "TicketListed");

      const activeListings = await marketplace.getActiveListings();
      expect(activeListings.length).to.equal(1);
    });

    it("Should allow buying fixed price listing", async function () {
      const price = ethers.parseEther("0.15");
      const duration = 86400;

      const tx = await marketplace.connect(seller).listTicket(
        await eventTicket.getAddress(),
        0,
        price,
        duration
      );
      const receipt = await tx.wait();
      
      const activeListings = await marketplace.getActiveListings();
      const listingId = activeListings[0];

      await expect(
        marketplace.connect(buyer).buyTicket(listingId, {
          value: price
        })
      ).to.emit(marketplace, "TicketSold");

      expect(await eventTicket.ownerOf(0)).to.equal(buyer.address);
    });

    it("Should prevent buying own listing", async function () {
      const price = ethers.parseEther("0.15");
      const duration = 86400;

      await marketplace.connect(seller).listTicket(
        await eventTicket.getAddress(),
        0,
        price,
        duration
      );

      const activeListings = await marketplace.getActiveListings();
      const listingId = activeListings[0];

      await expect(
        marketplace.connect(seller).buyTicket(listingId, {
          value: price
        })
      ).to.be.revertedWith("Cannot buy own listing");
    });
  });

  describe("Auction Listings", function () {
    it("Should create auction listing", async function () {
      const minBid = ethers.parseEther("0.12");
      const duration = 86400;

      await expect(
        marketplace.connect(seller).listTicketForAuction(
          await eventTicket.getAddress(),
          0,
          minBid,
          duration
        )
      ).to.emit(marketplace, "TicketListed");
    });

    it("Should allow placing bids", async function () {
      const minBid = ethers.parseEther("0.12");
      const duration = 86400;

      await marketplace.connect(seller).listTicketForAuction(
        await eventTicket.getAddress(),
        0,
        minBid,
        duration
      );

      const activeListings = await marketplace.getActiveListings();
      const listingId = activeListings[0];

      await expect(
        marketplace.connect(buyer).placeBid(listingId, {
          value: ethers.parseEther("0.13")
        })
      ).to.emit(marketplace, "BidPlaced");
    });

    it("Should end auction after expiration", async function () {
      const minBid = ethers.parseEther("0.12");
      const duration = 3600; // 1 hour

      await marketplace.connect(seller).listTicketForAuction(
        await eventTicket.getAddress(),
        0,
        minBid,
        duration
      );

      const activeListings = await marketplace.getActiveListings();
      const listingId = activeListings[0];

      // Place bid
      await marketplace.connect(buyer).placeBid(listingId, {
        value: ethers.parseEther("0.13")
      });

      // Fast forward time
      await time.increase(3601);

      await expect(
        marketplace.connect(seller).endAuction(listingId)
      ).to.emit(marketplace, "AuctionEnded");

      expect(await eventTicket.ownerOf(0)).to.equal(buyer.address);
    });
  });

  describe("Listing Management", function () {
    it("Should allow cancelling listing", async function () {
      const price = ethers.parseEther("0.15");
      const duration = 86400;

      await marketplace.connect(seller).listTicket(
        await eventTicket.getAddress(),
        0,
        price,
        duration
      );

      const activeListings = await marketplace.getActiveListings();
      const listingId = activeListings[0];

      await expect(
        marketplace.connect(seller).cancelListing(listingId)
      ).to.emit(marketplace, "ListingCancelled");

      expect(await eventTicket.ownerOf(0)).to.equal(seller.address);
    });
  });

  describe("Access Control", function () {
    it("Should allow admin to update marketplace fee", async function () {
      await marketplace.connect(owner).updateMarketplaceFee(300);
      expect(await marketplace.marketplaceFee()).to.equal(300);
    });

    it("Should prevent setting fee too high", async function () {
      await expect(
        marketplace.connect(owner).updateMarketplaceFee(1001)
      ).to.be.revertedWith("Fee too high");
    });

    it("Should allow pausing marketplace", async function () {
      await marketplace.connect(owner).pause();
      
      await expect(
        marketplace.connect(seller).listTicket(
          await eventTicket.getAddress(),
          0,
          ethers.parseEther("0.15"),
          86400
        )
      ).to.be.revertedWith("Pausable: paused");
    });
  });
});