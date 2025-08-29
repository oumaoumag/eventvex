# 📜 EventVex Smart Contracts API Reference

> **Complete API documentation for EventVex smart contracts including functions, events, and integration examples**

## 📋 Table of Contents

- [Contract Overview](#contract-overview)
- [EventFactory Contract](#eventfactory-contract)
- [EventTicket Contract](#eventticket-contract)
- [Integration Examples](#integration-examples)
- [Error Handling](#error-handling)
- [Gas Optimization](#gas-optimization)

## 🎯 Contract Overview

EventVex uses a factory pattern with two main contracts:

| Contract | Purpose | Deployment | Gas Cost |
|----------|---------|------------|----------|
| **EventFactory** | Creates and manages events | One-time | ~2.5M gas |
| **EventTicket** | Individual event tickets | Per event | ~3.5M gas |

### Contract Addresses

#### Base Sepolia Testnet
```
EventFactory: 0x... (TBD after deployment)
```

#### Base Mainnet
```
EventFactory: 0x... (TBD after deployment)
```

## 🏭 EventFactory Contract

### Contract Interface

```solidity
interface IEventFactory {
    // Events
    event EventCreated(
        uint256 indexed eventId,
        address indexed organizer,
        address indexed eventContract,
        string title,
        uint256 eventDate,
        uint256 ticketPrice,
        uint256 maxTickets
    );
    
    event EventDeactivated(uint256 indexed eventId, address indexed organizer);
    event PlatformFeeUpdated(uint256 oldFee, uint256 newFee);
    event OrganizerRoyaltyUpdated(uint256 oldRoyalty, uint256 newRoyalty);
    
    // Core Functions
    function createEvent(
        string memory _title,
        string memory _description,
        string memory _location,
        uint256 _eventDate,
        uint256 _ticketPrice,
        uint256 _maxTickets,
        uint256 _maxResalePrice
    ) external returns (uint256 eventId, address eventContract);
    
    function deactivateEvent(uint256 _eventId) external;
    
    // Query Functions
    function getEvent(uint256 _eventId) external view returns (EventData memory);
    function getActiveEvents() external view returns (EventData[] memory);
    function getUpcomingEvents() external view returns (EventData[] memory);
    function getOrganizerEvents(address _organizer) external view returns (uint256[] memory);
    function getTotalEvents() external view returns (uint256);
    
    // Admin Functions
    function updatePlatformFee(uint256 _newFee) external;
    function updateOrganizerRoyalty(uint256 _newRoyalty) external;
    function updatePlatformFeeRecipient(address _newRecipient) external;
}
```

### Core Functions

#### `createEvent()`
Creates a new event and deploys an EventTicket contract.

```solidity
function createEvent(
    string memory _title,           // Event title (max 100 chars)
    string memory _description,     // Event description (max 1000 chars)
    string memory _location,        // Event location (max 200 chars)
    uint256 _eventDate,            // Event timestamp (must be future)
    uint256 _ticketPrice,          // Price per ticket in wei
    uint256 _maxTickets,           // Maximum tickets (1-10000)
    uint256 _maxResalePrice        // Maximum resale price in wei
) external returns (uint256 eventId, address eventContract)
```

**Requirements:**
- Title cannot be empty
- Event date must be in the future
- Ticket price must be greater than 0
- Max tickets between 1 and 10,000
- Max resale price >= ticket price

**Returns:**
- `eventId`: Unique identifier for the event
- `eventContract`: Address of the deployed EventTicket contract

**Gas Cost:** ~500K gas

#### `getActiveEvents()`
Returns all active events.

```solidity
function getActiveEvents() external view returns (EventData[] memory)
```

**Returns:** Array of EventData structs for active events

#### `getUpcomingEvents()`
Returns events that haven't started yet.

```solidity
function getUpcomingEvents() external view returns (EventData[] memory)
```

**Returns:** Array of EventData structs for upcoming events

### Data Structures

```solidity
struct EventData {
    uint256 eventId;           // Unique event identifier
    address eventContract;     // EventTicket contract address
    address organizer;         // Event organizer address
    string title;             // Event title
    uint256 eventDate;        // Event timestamp
    uint256 ticketPrice;      // Ticket price in wei
    uint256 maxTickets;       // Maximum number of tickets
    bool isActive;            // Event active status
    uint256 createdAt;        // Creation timestamp
}
```

### Integration Example

```typescript
import { ethers } from 'ethers';
import EventFactoryABI from './abi/EventFactory.json';

// Connect to contract
const factory = new ethers.Contract(
    FACTORY_ADDRESS,
    EventFactoryABI,
    signer
);

// Create new event
const tx = await factory.createEvent(
    "My Concert",                    // title
    "Amazing live performance",      // description
    "Madison Square Garden",         // location
    Math.floor(Date.now() / 1000) + 86400, // eventDate (24h from now)
    ethers.parseEther("0.1"),       // ticketPrice (0.1 ETH)
    1000,                           // maxTickets
    ethers.parseEther("0.3")        // maxResalePrice (0.3 ETH)
);

const receipt = await tx.wait();
console.log('Event created:', receipt.hash);

// Get event details
const events = await factory.getActiveEvents();
console.log('Active events:', events);
```

## 🎫 EventTicket Contract

### Contract Interface

```solidity
interface IEventTicket {
    // Events
    event TicketMinted(uint256 indexed tokenId, address indexed buyer, uint256 seatNumber, uint256 price);
    event TicketListedForResale(uint256 indexed tokenId, uint256 price);
    event TicketSold(uint256 indexed tokenId, address indexed from, address indexed to, uint256 price);
    event TicketUnlisted(uint256 indexed tokenId);
    event TicketUsed(uint256 indexed tokenId, address indexed attendee);
    event EventCancelled();
    event RefundIssued(uint256 indexed tokenId, address indexed recipient, uint256 amount);
    
    // Core Functions
    function mintTicket(uint256 _seatNumber) external payable;
    function listForResale(uint256 _tokenId, uint256 _price) external;
    function unlistFromResale(uint256 _tokenId) external;
    function buyResaleTicket(uint256 _tokenId) external payable;
    function useTicket(uint256 _tokenId) external; // VERIFIER_ROLE only
    function cancelEvent() external; // ORGANIZER_ROLE only
    function requestRefund(uint256 _tokenId) external;
    
    // Query Functions
    function getTicketInfo(uint256 _tokenId) external view returns (TicketInfo memory);
    function getAvailableSeats() external view returns (uint256[] memory);
    function eventInfo() external view returns (EventInfo memory);
}
```

### Core Functions

#### `mintTicket()`
Mints a new ticket NFT for a specific seat.

```solidity
function mintTicket(uint256 _seatNumber) external payable
```

**Parameters:**
- `_seatNumber`: Seat number to assign (0 to maxTickets-1)

**Requirements:**
- Event must be active and not cancelled
- Seat must be available
- Sufficient ETH payment (msg.value >= ticketPrice)
- Event must not have started

**Gas Cost:** ~200K gas

#### `listForResale()`
Lists a ticket for resale on the marketplace.

```solidity
function listForResale(uint256 _tokenId, uint256 _price) external
```

**Parameters:**
- `_tokenId`: Token ID to list for sale
- `_price`: Resale price in wei

**Requirements:**
- Caller must own the ticket
- Ticket not already listed
- Ticket not used
- Price <= maxResalePrice
- Event not started

#### `buyResaleTicket()`
Purchases a ticket from the resale marketplace.

```solidity
function buyResaleTicket(uint256 _tokenId) external payable
```

**Parameters:**
- `_tokenId`: Token ID to purchase

**Requirements:**
- Ticket must be listed for sale
- Sufficient payment (msg.value >= resalePrice)
- Event not started
- Buyer cannot be the seller

**Payment Distribution:**
- Platform fee (2.5% default)
- Organizer royalty (5% default)
- Remaining amount to seller

### Data Structures

```solidity
struct EventInfo {
    string title;              // Event title
    string description;        // Event description
    string location;          // Event location
    uint256 eventDate;        // Event timestamp
    uint256 ticketPrice;      // Original ticket price
    uint256 maxTickets;       // Maximum number of tickets
    uint256 maxResalePrice;   // Maximum resale price
    address organizer;        // Event organizer
    bool isActive;           // Event active status
    bool isCancelled;        // Event cancellation status
}

struct TicketInfo {
    uint256 seatNumber;       // Assigned seat number
    uint256 purchasePrice;    // Original purchase price
    uint256 purchaseTime;     // Purchase timestamp
    bool isUsed;             // Ticket usage status
    bool isForResale;        // Resale listing status
    uint256 resalePrice;     // Current resale price
    address originalOwner;    // Original purchaser
}
```

### Integration Example

```typescript
import { ethers } from 'ethers';
import EventTicketABI from './abi/EventTicket.json';

// Connect to event contract
const eventTicket = new ethers.Contract(
    EVENT_CONTRACT_ADDRESS,
    EventTicketABI,
    signer
);

// Mint a ticket
const seatNumber = 42;
const ticketPrice = await eventTicket.eventInfo().then(info => info.ticketPrice);

const mintTx = await eventTicket.mintTicket(seatNumber, {
    value: ticketPrice
});
await mintTx.wait();

// List ticket for resale
const tokenId = 0; // First ticket
const resalePrice = ethers.parseEther("0.15");

const listTx = await eventTicket.listForResale(tokenId, resalePrice);
await listTx.wait();

// Buy resale ticket
const buyTx = await eventTicket.buyResaleTicket(tokenId, {
    value: resalePrice
});
await buyTx.wait();

// Get ticket information
const ticketInfo = await eventTicket.getTicketInfo(tokenId);
console.log('Ticket info:', ticketInfo);
```

## 🔧 Integration Examples

### Complete Event Lifecycle

```typescript
// 1. Create Event
const { eventId, eventContract } = await createEvent(factory, {
    title: "Tech Conference 2024",
    description: "Annual technology conference",
    location: "Convention Center",
    eventDate: futureTimestamp,
    ticketPrice: "0.05",
    maxTickets: 500,
    maxResalePrice: "0.15"
});

// 2. Mint Tickets
const eventTicketContract = new ethers.Contract(
    eventContract,
    EventTicketABI,
    signer
);

for (let seat = 0; seat < 10; seat++) {
    await eventTicketContract.mintTicket(seat, {
        value: ethers.parseEther("0.05")
    });
}

// 3. List for Resale
await eventTicketContract.listForResale(0, ethers.parseEther("0.1"));

// 4. Event Day - Use Tickets
await eventTicketContract.useTicket(0); // Requires VERIFIER_ROLE

// 5. Emergency - Cancel Event
await eventTicketContract.cancelEvent(); // Requires ORGANIZER_ROLE

// 6. Process Refunds
await eventTicketContract.requestRefund(1);
```

### Event Listening

```typescript
// Listen for all ticket events
eventTicketContract.on('TicketMinted', (tokenId, buyer, seatNumber, price) => {
    console.log(`Ticket ${tokenId} minted for seat ${seatNumber}`);
});

eventTicketContract.on('TicketListedForResale', (tokenId, price) => {
    console.log(`Ticket ${tokenId} listed for ${ethers.formatEther(price)} ETH`);
});

eventTicketContract.on('TicketSold', (tokenId, from, to, price) => {
    console.log(`Ticket ${tokenId} sold from ${from} to ${to}`);
});
```

## ❌ Error Handling

### Common Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| `"Title cannot be empty"` | Empty event title | Provide non-empty title |
| `"Event date must be in future"` | Past event date | Use future timestamp |
| `"Insufficient payment"` | Low payment amount | Send correct ETH amount |
| `"Seat already taken"` | Seat unavailable | Choose different seat |
| `"Not ticket owner"` | Wrong owner | Use correct wallet |
| `"Price exceeds maximum"` | High resale price | Reduce price |
| `"Event has started"` | Late transaction | Transaction before event |
| `"Ticket already used"` | Used ticket | Cannot reuse tickets |

### Error Handling Example

```typescript
try {
    await eventTicket.mintTicket(seatNumber, { value: ticketPrice });
} catch (error) {
    if (error.message.includes('Seat already taken')) {
        // Show seat selection UI
        showSeatSelection();
    } else if (error.message.includes('Insufficient payment')) {
        // Show payment error
        showPaymentError(ticketPrice);
    } else {
        // Generic error handling
        showGenericError(error.message);
    }
}
```

## ⚡ Gas Optimization

### Gas Costs by Operation

| Operation | Gas Cost | Optimization Tips |
|-----------|----------|-------------------|
| **Event Creation** | ~500K | Use factory pattern |
| **Ticket Minting** | ~200K | Batch operations |
| **Resale Listing** | ~150K | Efficient storage |
| **Resale Purchase** | ~250K | Direct transfers |
| **Ticket Usage** | ~100K | Minimal state changes |

### Optimization Strategies

1. **Batch Operations**
   ```typescript
   // Instead of multiple single mints
   for (let i = 0; i < 10; i++) {
       await mintTicket(i); // 10 transactions
   }
   
   // Use batch minting (if implemented)
   await batchMintTickets([0,1,2,3,4,5,6,7,8,9]); // 1 transaction
   ```

2. **Gas Estimation**
   ```typescript
   const gasEstimate = await eventTicket.mintTicket.estimateGas(seatNumber, {
       value: ticketPrice
   });
   
   const gasLimit = gasEstimate * 120n / 100n; // 20% buffer
   
   await eventTicket.mintTicket(seatNumber, {
       value: ticketPrice,
       gasLimit
   });
   ```

3. **Dynamic Gas Pricing**
   ```typescript
   const feeData = await provider.getFeeData();
   const gasPrice = feeData.gasPrice;
   
   await eventTicket.mintTicket(seatNumber, {
       value: ticketPrice,
       gasPrice
   });
   ```

## 🔗 Related Documentation

- [Web3 Integration Overview](./README.md)
- [Deployment Guide](./deployment.md)
- [Testing Guide](./testing.md)
- [Frontend Integration](../frontend/wallet-integration.md)

---

**Next**: [Deployment Guide](./deployment.md) →
