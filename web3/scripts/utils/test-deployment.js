const { ethers } = require("hardhat");
const { loadDeployment } = require("./deployment");

/**
 * Test deployed contracts functionality
 */
async function testDeployment() {
  const [deployer, testUser] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  const networkName = network.name;
  
  console.log("🧪 Testing EventVex deployment on", networkName);
  console.log("👤 Test user:", testUser.address);
  console.log("=" * 50);

  // Load deployment
  const deployment = loadDeployment(networkName);
  if (!deployment) {
    throw new Error(`No deployment found for network: ${networkName}`);
  }

  const factoryAddress = deployment.contracts.EventFactory.address;
  console.log("🏭 EventFactory address:", factoryAddress);

  // Get contract instances
  const EventFactory = await ethers.getContractFactory("EventFactory");
  const eventFactory = EventFactory.attach(factoryAddress);

  try {
    // Test 1: Check factory configuration
    console.log("\n📋 Test 1: Factory Configuration");
    const platformFee = await eventFactory.platformFee();
    const organizerRoyalty = await eventFactory.organizerRoyalty();
    const platformFeeRecipient = await eventFactory.platformFeeRecipient();
    
    console.log("✅ Platform fee:", platformFee.toString(), "basis points");
    console.log("✅ Organizer royalty:", organizerRoyalty.toString(), "basis points");
    console.log("✅ Platform fee recipient:", platformFeeRecipient);

    // Test 2: Create a test event
    console.log("\n📋 Test 2: Event Creation");
    const eventData = {
      title: "EventVex Test Event",
      description: "A test event for deployment verification",
      location: "Virtual Test Location",
      eventDate: Math.floor(Date.now() / 1000) + 86400, // 24 hours from now
      ticketPrice: ethers.parseEther("0.01"), // 0.01 ETH
      maxTickets: 10,
      maxResalePrice: ethers.parseEther("0.03") // 0.03 ETH
    };

    const createTx = await eventFactory.connect(testUser).createEvent(
      eventData.title,
      eventData.description,
      eventData.location,
      eventData.eventDate,
      eventData.ticketPrice,
      eventData.maxTickets,
      eventData.maxResalePrice
    );

    const receipt = await createTx.wait();
    console.log("✅ Event created successfully");
    console.log("📄 Transaction hash:", receipt.hash);
    console.log("⛽ Gas used:", receipt.gasUsed.toString());

    // Get event details
    const totalEvents = await eventFactory.getTotalEvents();
    const eventId = totalEvents - 1n; // Latest event
    const eventDetails = await eventFactory.getEvent(eventId);
    
    console.log("✅ Event ID:", eventId.toString());
    console.log("✅ Event contract:", eventDetails.eventContract);
    console.log("✅ Event organizer:", eventDetails.organizer);

    // Test 3: Test event contract functionality
    console.log("\n📋 Test 3: Event Contract Functionality");
    const EventTicket = await ethers.getContractFactory("EventTicket");
    const eventTicket = EventTicket.attach(eventDetails.eventContract);

    // Check event info
    const eventInfo = await eventTicket.eventInfo();
    console.log("✅ Event title:", eventInfo.title);
    console.log("✅ Event date:", new Date(Number(eventInfo.eventDate) * 1000).toISOString());
    console.log("✅ Ticket price:", ethers.formatEther(eventInfo.ticketPrice), "ETH");

    // Get available seats
    const availableSeats = await eventTicket.getAvailableSeats();
    console.log("✅ Available seats:", availableSeats.length);

    // Test 4: Mint a test ticket
    console.log("\n📋 Test 4: Ticket Minting");
    const seatNumber = 0;
    const mintTx = await eventTicket.connect(testUser).mintTicket(seatNumber, {
      value: eventData.ticketPrice
    });

    const mintReceipt = await mintTx.wait();
    console.log("✅ Ticket minted successfully");
    console.log("📄 Transaction hash:", mintReceipt.hash);
    console.log("⛽ Gas used:", mintReceipt.gasUsed.toString());

    // Check ticket details
    const tokenId = 0; // First ticket
    const ticketInfo = await eventTicket.getTicketInfo(tokenId);
    console.log("✅ Ticket seat number:", ticketInfo.seatNumber.toString());
    console.log("✅ Ticket purchase price:", ethers.formatEther(ticketInfo.purchasePrice), "ETH");
    console.log("✅ Ticket owner:", await eventTicket.ownerOf(tokenId));

    // Test 5: Query functions
    console.log("\n📋 Test 5: Query Functions");
    const activeEvents = await eventFactory.getActiveEvents();
    console.log("✅ Active events count:", activeEvents.length);

    const upcomingEvents = await eventFactory.getUpcomingEvents();
    console.log("✅ Upcoming events count:", upcomingEvents.length);

    const organizerEvents = await eventFactory.getOrganizerEvents(testUser.address);
    console.log("✅ Test user's events:", organizerEvents.length);

    // Test summary
    console.log("\n" + "=" * 50);
    console.log("🎉 All tests passed successfully!");
    console.log("=" * 50);
    console.log("📊 Test Summary:");
    console.log("✅ Factory configuration verified");
    console.log("✅ Event creation working");
    console.log("✅ Event contract deployed correctly");
    console.log("✅ Ticket minting functional");
    console.log("✅ Query functions operational");
    
    return {
      success: true,
      eventId: eventId.toString(),
      eventContract: eventDetails.eventContract,
      ticketId: tokenId.toString(),
      gasUsed: {
        eventCreation: receipt.gasUsed.toString(),
        ticketMinting: mintReceipt.gasUsed.toString()
      }
    };

  } catch (error) {
    console.error("❌ Test failed:", error.message);
    throw error;
  }
}

/**
 * Run deployment tests
 */
async function main() {
  try {
    const result = await testDeployment();
    console.log("\n✅ Deployment test completed successfully");
    return result;
  } catch (error) {
    console.error("❌ Deployment test failed:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { testDeployment, main };
