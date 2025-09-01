# EventVex IPFS Metadata Standards

## Overview

EventVex uses IPFS (InterPlanetary File System) for decentralized storage of event metadata, images, and NFT data. This document defines the metadata standards and schemas used across the platform.

## Event Metadata Schema

### Event Metadata Structure
```json
{
  "name": "Event Name",
  "description": "Detailed event description",
  "image": "ipfs://QmEventImageHash",
  "external_url": "https://eventvex.com/events/123",
  "attributes": [
    {
      "trait_type": "Event Type",
      "value": "Conference"
    },
    {
      "trait_type": "Location",
      "value": "San Francisco, CA"
    },
    {
      "trait_type": "Date",
      "value": "2025-09-15T18:00:00.000Z"
    },
    {
      "trait_type": "Max Tickets",
      "value": 500
    },
    {
      "trait_type": "Ticket Price",
      "value": "0.01 ETH"
    },
    {
      "trait_type": "Organizer",
      "value": "0x1234...5678"
    }
  ],
  "properties": {
    "category": "Event",
    "created_at": "2025-09-01T12:00:00.000Z",
    "version": "1.0"
  }
}
```

### Required Fields
- `name`: Event title (string, max 100 characters)
- `description`: Event description (string, max 1000 characters)
- `image`: IPFS hash of event image (string, ipfs:// format)
- `attributes`: Array of event properties

### Optional Fields
- `external_url`: Link to event page
- `properties`: Additional metadata

## Ticket NFT Metadata Schema

### Ticket Metadata Structure
```json
{
  "name": "EventName - Ticket #123",
  "description": "Ticket for EventName",
  "image": "ipfs://QmEventImageHash",
  "external_url": "https://eventvex.com/tickets/123",
  "attributes": [
    {
      "trait_type": "Event Type",
      "value": "Conference"
    },
    {
      "trait_type": "Location",
      "value": "San Francisco, CA"
    },
    {
      "trait_type": "Date",
      "value": "2025-09-15T18:00:00.000Z"
    },
    {
      "trait_type": "Ticket ID",
      "value": 123
    },
    {
      "trait_type": "Seat Number",
      "value": "A-15"
    },
    {
      "trait_type": "Purchase Date",
      "value": "2025-09-01T12:00:00.000Z"
    },
    {
      "trait_type": "Owner",
      "value": "0xabcd...efgh"
    }
  ],
  "properties": {
    "category": "Ticket",
    "event_id": 1,
    "token_id": 123,
    "seat_number": "A-15",
    "created_at": "2025-09-01T12:00:00.000Z",
    "version": "1.0"
  }
}
```

### Required Fields
- `name`: Ticket identifier (string)
- `description`: Ticket description (string)
- `image`: Event image IPFS hash (string)
- `attributes`: Array including ticket-specific properties

## Image Storage Standards

### Supported Formats
- **Images**: JPEG, PNG, WebP, SVG
- **Maximum Size**: 10MB per file
- **Recommended Dimensions**: 
  - Event images: 1200x630px (social media optimized)
  - Profile images: 400x400px (square)

### Image Metadata
```json
{
  "name": "event-image.jpg",
  "keyvalues": {
    "type": "image",
    "eventId": "123",
    "category": "event-banner",
    "uploadedAt": "2025-09-01T12:00:00.000Z"
  }
}
```

## IPFS Pinning Strategy

### Pinata Configuration
- **Regions**: FRA1 (Frankfurt), NYC1 (New York)
- **Replication**: 2 copies minimum
- **CID Version**: v1 (preferred)

### Pin Metadata Structure
```json
{
  "name": "descriptive-name",
  "keyvalues": {
    "type": "metadata|image|file",
    "eventId": "event-identifier",
    "category": "event|ticket|profile",
    "uploadedAt": "ISO-8601-timestamp",
    "version": "1.0"
  }
}
```

## Gateway Configuration

### Primary Gateways
1. **Pinata**: `https://gateway.pinata.cloud/ipfs/`
2. **IPFS.io**: `https://ipfs.io/ipfs/`
3. **Cloudflare**: `https://cloudflare-ipfs.com/ipfs/`
4. **Dweb**: `https://dweb.link/ipfs/`

### Fallback Strategy
- Try gateways in order
- 10-second timeout per gateway
- Automatic failover to next gateway

## Content Addressing

### IPFS Hash Formats
- **CIDv0**: `Qm...` (legacy, 46 characters)
- **CIDv1**: `b...` (preferred, 59 characters)

### URI Schemes
- **IPFS Protocol**: `ipfs://QmHash`
- **HTTP Gateway**: `https://gateway.com/ipfs/QmHash`

## Data Validation

### Hash Validation
```javascript
// CIDv0 and CIDv1 validation regex
const isValidIPFSHash = (hash) => {
  const cleanHash = hash.replace(/^ipfs:\/\//, '');
  return /^(Qm[1-9A-HJ-NP-Za-km-z]{44}|b[A-Za-z2-7]{58})$/.test(cleanHash);
};
```

### Metadata Validation
- JSON schema validation
- Required field checks
- Data type validation
- Size limits enforcement

## Security Considerations

### Content Verification
- Hash integrity checks
- Metadata schema validation
- File type verification
- Size limit enforcement

### Privacy
- No personal data in metadata
- Wallet addresses only when necessary
- Optional external URLs

## Usage Examples

### Upload Event Image
```javascript
import { uploadFileToIPFS } from '../utils/ipfs';

const imageFile = document.getElementById('eventImage').files[0];
const result = await uploadFileToIPFS(imageFile, {
  name: 'event-banner.jpg',
  type: 'image',
  eventId: '123'
});

console.log('Image IPFS hash:', result.hash);
```

### Create and Upload Event Metadata
```javascript
import { createEventMetadata, uploadJSONToIPFS } from '../utils/ipfs';

const eventData = {
  title: 'Web3 Conference 2025',
  description: 'The premier Web3 conference',
  location: 'San Francisco, CA',
  eventDate: '2025-09-15T18:00:00.000Z',
  maxTickets: 500,
  ticketPrice: '0.01',
  organizer: '0x1234...5678'
};

const metadata = createEventMetadata(eventData, 'QmImageHash');
const result = await uploadJSONToIPFS(metadata, {
  name: 'event-metadata.json',
  eventId: '123'
});

console.log('Metadata IPFS hash:', result.hash);
```

### Retrieve Metadata
```javascript
import { retrieveFromIPFS } from '../utils/ipfs';

const metadata = await retrieveFromIPFS('QmMetadataHash', true);
console.log('Event metadata:', metadata);
```

## Best Practices

### Performance
- Use CIDv1 for new content
- Implement gateway fallbacks
- Cache frequently accessed content
- Optimize image sizes

### Reliability
- Pin important content
- Use multiple gateways
- Implement retry logic
- Monitor pin status

### Cost Optimization
- Compress images before upload
- Deduplicate content
- Use appropriate pin policies
- Monitor storage usage

## Migration Strategy

### From Centralized Storage
1. Upload existing content to IPFS
2. Update database with IPFS hashes
3. Implement dual-read (IPFS + fallback)
4. Gradually migrate all content
5. Remove centralized storage

### Version Management
- Include version in metadata
- Maintain backward compatibility
- Document schema changes
- Provide migration tools
