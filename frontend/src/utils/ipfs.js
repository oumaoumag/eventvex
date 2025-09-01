/**
 * IPFS Integration for EventVex
 * Handles decentralized storage of event metadata, images, and NFT data
 */

// IPFS Configuration
const IPFS_GATEWAY = import.meta.env.VITE_IPFS_GATEWAY || 'https://gateway.pinata.cloud/ipfs/';
const PINATA_API_KEY = import.meta.env.VITE_PINATA_API_KEY;
const PINATA_SECRET_KEY = import.meta.env.VITE_PINATA_SECRET_KEY;
const PINATA_JWT = import.meta.env.VITE_PINATA_JWT;

// Alternative IPFS gateways for redundancy
const IPFS_GATEWAYS = [
  'https://gateway.pinata.cloud/ipfs/',
  'https://ipfs.io/ipfs/',
  'https://cloudflare-ipfs.com/ipfs/',
  'https://dweb.link/ipfs/'
];

/**
 * Upload file to IPFS via Pinata
 * @param {File} file - File to upload
 * @param {Object} metadata - Additional metadata for pinning
 * @returns {Promise<{hash: string, url: string}>}
 */
export const uploadFileToIPFS = async (file, metadata = {}) => {
  if (!PINATA_JWT && !PINATA_API_KEY) {
    throw new Error('IPFS configuration missing. Please set Pinata credentials.');
  }

  const formData = new FormData();
  formData.append('file', file);

  // Add metadata for better organization
  const pinataMetadata = {
    name: metadata.name || file.name,
    keyvalues: {
      type: metadata.type || 'file',
      eventId: metadata.eventId || '',
      uploadedAt: new Date().toISOString(),
      ...metadata.keyvalues
    }
  };

  formData.append('pinataMetadata', JSON.stringify(pinataMetadata));

  const pinataOptions = {
    cidVersion: 1,
    customPinPolicy: {
      regions: [
        { id: 'FRA1', desiredReplicationCount: 1 },
        { id: 'NYC1', desiredReplicationCount: 1 }
      ]
    }
  };

  formData.append('pinataOptions', JSON.stringify(pinataOptions));

  try {
    const headers = PINATA_JWT 
      ? { 'Authorization': `Bearer ${PINATA_JWT}` }
      : { 
          'pinata_api_key': PINATA_API_KEY,
          'pinata_secret_api_key': PINATA_SECRET_KEY
        };

    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers,
      body: formData
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`IPFS upload failed: ${error.error || response.statusText}`);
    }

    const result = await response.json();
    
    return {
      hash: result.IpfsHash,
      url: `${IPFS_GATEWAY}${result.IpfsHash}`,
      size: result.PinSize,
      timestamp: result.Timestamp
    };
  } catch (error) {
    console.error('IPFS upload error:', error);
    throw new Error(`Failed to upload to IPFS: ${error.message}`);
  }
};

/**
 * Upload JSON metadata to IPFS
 * @param {Object} jsonData - JSON object to upload
 * @param {Object} metadata - Additional metadata for pinning
 * @returns {Promise<{hash: string, url: string}>}
 */
export const uploadJSONToIPFS = async (jsonData, metadata = {}) => {
  if (!PINATA_JWT && !PINATA_API_KEY) {
    throw new Error('IPFS configuration missing. Please set Pinata credentials.');
  }

  const pinataMetadata = {
    name: metadata.name || 'metadata.json',
    keyvalues: {
      type: 'metadata',
      contentType: 'application/json',
      uploadedAt: new Date().toISOString(),
      ...metadata.keyvalues
    }
  };

  const pinataOptions = {
    cidVersion: 1,
    customPinPolicy: {
      regions: [
        { id: 'FRA1', desiredReplicationCount: 1 },
        { id: 'NYC1', desiredReplicationCount: 1 }
      ]
    }
  };

  const requestBody = {
    pinataContent: jsonData,
    pinataMetadata,
    pinataOptions
  };

  try {
    const headers = {
      'Content-Type': 'application/json',
      ...(PINATA_JWT 
        ? { 'Authorization': `Bearer ${PINATA_JWT}` }
        : { 
            'pinata_api_key': PINATA_API_KEY,
            'pinata_secret_api_key': PINATA_SECRET_KEY
          })
    };

    const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`IPFS JSON upload failed: ${error.error || response.statusText}`);
    }

    const result = await response.json();
    
    return {
      hash: result.IpfsHash,
      url: `${IPFS_GATEWAY}${result.IpfsHash}`,
      size: result.PinSize,
      timestamp: result.Timestamp
    };
  } catch (error) {
    console.error('IPFS JSON upload error:', error);
    throw new Error(`Failed to upload JSON to IPFS: ${error.message}`);
  }
};

/**
 * Retrieve data from IPFS with fallback gateways
 * @param {string} hash - IPFS hash
 * @param {boolean} isJSON - Whether to parse as JSON
 * @returns {Promise<any>}
 */
export const retrieveFromIPFS = async (hash, isJSON = false) => {
  if (!hash) {
    throw new Error('IPFS hash is required');
  }

  // Clean hash (remove ipfs:// prefix if present)
  const cleanHash = hash.replace(/^ipfs:\/\//, '');

  for (const gateway of IPFS_GATEWAYS) {
    try {
      const response = await fetch(`${gateway}${cleanHash}`, {
        timeout: 10000 // 10 second timeout
      });

      if (response.ok) {
        if (isJSON) {
          return await response.json();
        } else {
          return await response.blob();
        }
      }
    } catch (error) {
      console.warn(`Failed to retrieve from gateway ${gateway}:`, error.message);
      continue;
    }
  }

  throw new Error(`Failed to retrieve data from IPFS hash: ${cleanHash}`);
};

/**
 * Create event metadata for IPFS storage
 * @param {Object} eventData - Event information
 * @param {string} imageHash - IPFS hash of event image
 * @returns {Object} Formatted metadata
 */
export const createEventMetadata = (eventData, imageHash = null) => {
  return {
    name: eventData.title,
    description: eventData.description,
    image: imageHash ? `ipfs://${imageHash}` : null,
    external_url: eventData.externalUrl || '',
    attributes: [
      {
        trait_type: "Event Type",
        value: eventData.eventType || "General"
      },
      {
        trait_type: "Location",
        value: eventData.location
      },
      {
        trait_type: "Date",
        value: new Date(eventData.eventDate).toISOString()
      },
      {
        trait_type: "Max Tickets",
        value: eventData.maxTickets
      },
      {
        trait_type: "Ticket Price",
        value: `${eventData.ticketPrice} ETH`
      },
      {
        trait_type: "Organizer",
        value: eventData.organizer
      }
    ],
    properties: {
      category: "Event",
      created_at: new Date().toISOString(),
      version: "1.0"
    }
  };
};

/**
 * Create ticket metadata for IPFS storage
 * @param {Object} ticketData - Ticket information
 * @param {Object} eventMetadata - Event metadata
 * @returns {Object} Formatted ticket metadata
 */
export const createTicketMetadata = (ticketData, eventMetadata) => {
  return {
    name: `${eventMetadata.name} - Ticket #${ticketData.tokenId}`,
    description: `Ticket for ${eventMetadata.name}`,
    image: eventMetadata.image,
    external_url: eventMetadata.external_url,
    attributes: [
      ...eventMetadata.attributes,
      {
        trait_type: "Ticket ID",
        value: ticketData.tokenId
      },
      {
        trait_type: "Seat Number",
        value: ticketData.seatNumber
      },
      {
        trait_type: "Purchase Date",
        value: new Date().toISOString()
      },
      {
        trait_type: "Owner",
        value: ticketData.owner
      }
    ],
    properties: {
      category: "Ticket",
      event_id: ticketData.eventId,
      token_id: ticketData.tokenId,
      seat_number: ticketData.seatNumber,
      created_at: new Date().toISOString(),
      version: "1.0"
    }
  };
};

/**
 * Get IPFS URL from hash
 * @param {string} hash - IPFS hash
 * @returns {string} Full IPFS URL
 */
export const getIPFSUrl = (hash) => {
  if (!hash) return '';
  const cleanHash = hash.replace(/^ipfs:\/\//, '');
  return `${IPFS_GATEWAY}${cleanHash}`;
};

/**
 * Validate IPFS hash format
 * @param {string} hash - IPFS hash to validate
 * @returns {boolean} Whether hash is valid
 */
export const isValidIPFSHash = (hash) => {
  if (!hash) return false;
  const cleanHash = hash.replace(/^ipfs:\/\//, '');
  
  // Basic validation for CIDv0 (Qm...) and CIDv1 (b...)
  return /^(Qm[1-9A-HJ-NP-Za-km-z]{44}|b[A-Za-z2-7]{58})$/.test(cleanHash);
};

/**
 * Pin existing IPFS content
 * @param {string} hash - IPFS hash to pin
 * @param {Object} metadata - Metadata for the pin
 * @returns {Promise<Object>} Pin result
 */
export const pinToIPFS = async (hash, metadata = {}) => {
  if (!PINATA_JWT && !PINATA_API_KEY) {
    throw new Error('IPFS configuration missing. Please set Pinata credentials.');
  }

  const requestBody = {
    hashToPin: hash,
    pinataMetadata: {
      name: metadata.name || `Pin-${hash}`,
      keyvalues: {
        type: 'pin',
        pinnedAt: new Date().toISOString(),
        ...metadata.keyvalues
      }
    }
  };

  try {
    const headers = {
      'Content-Type': 'application/json',
      ...(PINATA_JWT 
        ? { 'Authorization': `Bearer ${PINATA_JWT}` }
        : { 
            'pinata_api_key': PINATA_API_KEY,
            'pinata_secret_api_key': PINATA_SECRET_KEY
          })
    };

    const response = await fetch('https://api.pinata.cloud/pinning/pinByHash', {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`IPFS pin failed: ${error.error || response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('IPFS pin error:', error);
    throw new Error(`Failed to pin to IPFS: ${error.message}`);
  }
};
