/**
 * Database Seeder - Populate SQLite with initial events
 */

export const seedInitialEvents = async (hybridDB) => {
  const initialEvents = [
    {
      eventId: 1,
      eventContract: '0x1234567890123456789012345678901234567890',
      organizer: '0xOrganizer1234567890123456789012345678901234',
      title: 'Blockchain Summit 2025',
      description: 'The premier blockchain conference featuring industry leaders',
      location: 'San Francisco, CA',
      eventDate: Math.floor(new Date('2025-03-15').getTime() / 1000),
      ticketPrice: '500000000000000000', // 0.5 ETH in wei
      maxTickets: 500,
      isActive: true,
      createdAt: Math.floor(Date.now() / 1000),
      metadataURI: 'QmBlockchainSummit2025Metadata',
      imageURI: 'QmBlockchainSummit2025Image'
    },
    {
      eventId: 2,
      eventContract: '0x2345678901234567890123456789012345678901',
      organizer: '0xOrganizer2345678901234567890123456789012345',
      title: 'Web3 Music Festival',
      description: 'Revolutionary music festival powered by Web3 technology',
      location: 'Austin, TX',
      eventDate: Math.floor(new Date('2025-04-20').getTime() / 1000),
      ticketPrice: '1200000000000000000', // 1.2 ETH in wei
      maxTickets: 1000,
      isActive: true,
      createdAt: Math.floor(Date.now() / 1000),
      metadataURI: 'QmWeb3MusicFestival2025Metadata',
      imageURI: 'QmWeb3MusicFestival2025Image'
    },
    {
      eventId: 3,
      eventContract: '0x3456789012345678901234567890123456789012',
      organizer: '0xOrganizer3456789012345678901234567890123456',
      title: 'NFT Art Exhibition',
      description: 'Exclusive showcase of digital art and NFT collections',
      location: 'New York, NY',
      eventDate: Math.floor(new Date('2025-05-05').getTime() / 1000),
      ticketPrice: '800000000000000000', // 0.8 ETH in wei
      maxTickets: 300,
      isActive: true,
      createdAt: Math.floor(Date.now() / 1000),
      metadataURI: 'QmNFTArtExhibition2025Metadata',
      imageURI: 'QmNFTArtExhibition2025Image'
    },
    {
      eventId: 7,
      eventContract: '0x7890123456789012345678901234567890123456',
      organizer: '0xOrganizerKenya1234567890123456789012345678',
      title: 'Nairobi Tech Summit 2025',
      description: 'East Africa\'s premier technology conference featuring blockchain and AI innovations',
      location: 'Nairobi, Kenya',
      eventDate: Math.floor(new Date('2025-03-20').getTime() / 1000),
      ticketPrice: '200000000000000000', // 0.2 ETH in wei
      maxTickets: 400,
      isActive: true,
      createdAt: Math.floor(Date.now() / 1000),
      metadataURI: 'QmNairobiTechSummit2025Metadata',
      imageURI: 'QmNairobiTechSummit2025Image'
    },
    {
      eventId: 8,
      eventContract: '0x8901234567890123456789012345678901234567',
      organizer: '0xOrganizerKenya2345678901234567890123456789',
      title: 'Sauti Sol Live Concert',
      description: 'Exclusive live performance by Kenya\'s award-winning band Sauti Sol',
      location: 'Mombasa, Kenya',
      eventDate: Math.floor(new Date('2025-04-12').getTime() / 1000),
      ticketPrice: '150000000000000000', // 0.15 ETH in wei
      maxTickets: 500,
      isActive: true,
      createdAt: Math.floor(Date.now() / 1000),
      metadataURI: 'QmSautiSolConcert2025Metadata',
      imageURI: 'QmSautiSolConcert2025Image'
    }
  ];

  for (const event of initialEvents) {
    try {
      await hybridDB.upsertEvent(event);
      console.log(`Seeded event: ${event.title}`);
    } catch (error) {
      console.error(`Failed to seed event ${event.title}:`, error);
    }
  }
};