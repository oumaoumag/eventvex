/**
 * Test script to verify automatic ticket creation functionality
 */

export const testTicketCreation = async () => {
  try {
    console.log('🧪 Testing automatic ticket creation...');
    
    // Import the database
    const { default: hybridDB } = await import('../database/HybridDB.js');
    
    // Initialize if not already done
    if (!hybridDB.isInitialized) {
      await hybridDB.initialize();
    }
    
    // Create a test event
    const testEventData = {
      eventId: 999,
      eventContract: '0xTestContract123',
      organizer: '0xTestOrganizer456',
      title: 'Test Event - Blockchain Summit',
      description: 'A test event to verify automatic ticket creation',
      location: 'Virtual Event',
      eventDate: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // 7 days from now
      ticketPrice: '0.001',
      maxTickets: 100,
      isActive: true,
      createdAt: Math.floor(Date.now() / 1000),
      coverImage: '/src/assets/tig.png',
      category: 'Technology',
      hostName: 'Test Host',
      hostEmail: 'test@example.com'
    };
    
    // Upsert the event
    await hybridDB.upsertEvent(testEventData);
    console.log('✅ Test event created');
    
    // Create ticket for the event
    await hybridDB.createTicketForEvent({
      eventId: testEventData.eventId,
      eventContract: testEventData.eventContract,
      eventTitle: testEventData.title,
      eventDescription: testEventData.description,
      eventLocation: testEventData.location,
      eventDate: testEventData.eventDate,
      ticketPrice: testEventData.ticketPrice,
      maxTickets: testEventData.maxTickets,
      coverImage: testEventData.coverImage,
      category: testEventData.category,
      organizer: testEventData.organizer
    });
    console.log('✅ Test ticket created');
    
    // Verify tickets can be retrieved
    const tickets = await hybridDB.getAllTickets({ limit: 10 });
    console.log('✅ Retrieved tickets:', tickets.length);
    
    // Find our test ticket
    const testTicket = tickets.find(t => t.event_id === testEventData.eventId);
    if (testTicket) {
      console.log('✅ Test ticket found:', testTicket.event_title);
    } else {
      console.log('❌ Test ticket not found');
    }
    
    console.log('🎉 Test completed successfully!');
    return true;
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
};

// Auto-run test in development
if (import.meta.env.DEV) {
  // Run test after a short delay to ensure everything is loaded
  setTimeout(() => {
    testTicketCreation();
  }, 2000);
}