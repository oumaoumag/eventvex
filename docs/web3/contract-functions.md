# 📋 EventVex Smart Contract Functions Reference

> **Detailed documentation of all smart contract functions, their purposes, parameters, and usage examples**

## 📋 Table of Contents

- [EventFactory Contract](#eventfactory-contract)
- [EventTicket Contract](#eventticket-contract)
- [EventVexAccessControl Contract](#eventvexaccesscontrol-contract)
- [TicketMarketplace Contract](#ticketmarketplace-contract)
- [EventVexPaymaster Contract](#eventvexpaymaster-contract)
- [Integration Examples](#integration-examples)
- [Error Reference](#error-reference)

## 🏭 EventFactory Contract

**Address**: `0x4f0fcF4af03569d543d1988d80d358DC40aBd56c`  
**Purpose**: Central hub for event creation and management

### Core Functions

#### `createEvent()`
Creates a new event and deploys an EventTicket contract.

```solidity
function createEvent(
    address _platformFeeRecipient,
    string memory _title,
    string memory _description,
    string memory _location,
    uint256 _eventDate,
    uint256 _ticketPrice,
    uint256 _maxTickets,
    uint256 _maxResalePrice,
    string memory _metadataURI
) external returns (uint256 eventId, address eventContract)
```

**Parameters:**
- `_platformFeeRecipient`: Address to receive platform fees
- `_title`: Event title (max 100 characters)
- `_description`: Event description (max 1000 characters)
- `_location`: Event location (max 200 characters)
- `_eventDate`: Event timestamp (must be future)
- `_ticketPrice`: Price per ticket in wei
- `_maxTickets`: Maximum number of tickets (1-10,000)
- `_maxResalePrice`: Maximum resale price in wei
- `_metadataURI`: IPFS URI for event metadata

**Returns:**
- `eventId`: Unique identifier for the event
- `eventContract`: Address of deployed EventTicket contract

**Requirements:**
- Caller must have ORGANIZER_ROLE
- Title cannot be empty
- Event date must be in future
- Ticket price > 0
- Max tickets between 1 and 10,000
- Max resale price >= ticket price

**Gas Cost**: ~500,000 gas

**Example Usage:**
```typescript
const tx = await eventFactory.createEvent(
    "0x742d35Cc6634C0532925a3b8D4C9db96590c6C87", // platformFeeRecipient
    "Summer Music Festival",                          // title
    "Three days of amazing music",                    // description
    "Central Park, NYC",                             // location
    Math.floor(Date.now() / 1000) + 86400 * 30,    // eventDate (30 days)
    ethers.parseEther("0.1"),                       // ticketPrice (0.1 ETH)
    1000,                                           // maxTickets
    ethers.parseEther("0.3"),                       // maxResalePrice (0.3 ETH)
    "ipfs://QmHash/metadata.json"                   // metadataURI
);
```

#### `deactivateEvent()`
Deactivates an event, preventing further ticket sales.

```solidity
function deactivateEvent(uint256 _eventId) external
```

**Parameters:**
- `_eventId`: ID of event to deactivate

**Requirements:**
- Caller must be event organizer or have PLATFORM_ADMIN_ROLE
- Event must exist and be active

**Gas Cost**: ~50,000 gas

#### `getEvent()`
Retrieves event information by ID.

```solidity
function getEvent(uint256 _eventId) external view returns (EventData memory)
```

**Parameters:**
- `_eventId`: Event ID to query

**Returns:**
- `EventData`: Struct containing event information

**Gas Cost**: ~10,000 gas (view function)

#### `getTotalEvents()`
Returns the total number of events created.

```solidity
function getTotalEvents() external view returns (uint256)
```

**Returns:**
- `uint256`: Total number of events

**Gas Cost**: ~2,000 gas (view function)

#### `getOrganizerEvents()`
Returns array of event IDs created by a specific organizer.

```solidity
function getOrganizerEvents(address _organizer) external view returns (uint256[] memory)
```

**Parameters:**
- `_organizer`: Address of the organizer

**Returns:**
- `uint256[]`: Array of event IDs

**Gas Cost**: ~5,000 gas per event (view function)

### Administrative Functions

#### `updatePlatformFee()`
Updates the platform fee percentage.

```solidity
function updatePlatformFee(uint256 _newFee) external
```

**Parameters:**
- `_newFee`: New fee in basis points (e.g., 250 = 2.5%)

**Requirements:**
- Caller must have FEE_MANAGER_ROLE
- Fee must be <= 1000 (10%)

**Gas Cost**: ~30,000 gas

#### `updateOrganizerRoyalty()`
Updates the organizer royalty percentage for resales.

```solidity
function updateOrganizerRoyalty(uint256 _newRoyalty) external
```

**Parameters:**
- `_newRoyalty`: New royalty in basis points

**Requirements:**
- Caller must have FEE_MANAGER_ROLE
- Royalty must be <= 1000 (10%)

**Gas Cost**: ~30,000 gas

### Data Structures

```solidity
struct EventData {
    uint256 eventId;           // Unique event identifier
    address eventContract;     // EventTicket contract address
    address organizer;         // Event organizer address
    string title;             // Event title
    string description;       // Event description
    string location;          // Event location
    uint256 eventDate;        // Event timestamp
    uint256 ticketPrice;      // Ticket price in wei
    uint256 maxTickets;       // Maximum number of tickets
    uint256 maxResalePrice;   // Maximum resale price
    bool isActive;            // Event active status
    uint256 createdAt;        // Creation timestamp
    string metadataURI;       // IPFS metadata URI
}
```

### Events

```solidity
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
```

## 🎫 EventTicket Contract

**Purpose**: ERC721 NFT tickets for individual events

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
- Caller must pass access control checks

**Gas Cost**: ~200,000 gas

**Example Usage:**
```typescript
const seatNumber = 42;
const ticketPrice = await eventTicket.ticketPrice();

const tx = await eventTicket.mintTicket(seatNumber, {
    value: ticketPrice
});
await tx.wait();
```

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

**Gas Cost**: ~150,000 gas

#### `unlistFromResale()`
Removes a ticket from resale listings.

```solidity
function unlistFromResale(uint256 _tokenId) external
```

**Parameters:**
- `_tokenId`: Token ID to unlist

**Requirements:**
- Caller must own the ticket
- Ticket must be listed for sale

**Gas Cost**: ~100,000 gas

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

**Gas Cost**: ~250,000 gas

#### `useTicket()`
Marks a ticket as used (for event entry).

```solidity
function useTicket(uint256 _tokenId) external
```

**Parameters:**
- `_tokenId`: Token ID to mark as used

**Requirements:**
- Caller must have VERIFIER_ROLE
- Ticket must exist and not be used
- Event must have started

**Gas Cost**: ~100,000 gas

#### `cancelEvent()`
Cancels the event and enables refunds.

```solidity
function cancelEvent() external
```

**Requirements:**
- Caller must be organizer or have PLATFORM_ADMIN_ROLE
- Event must not be cancelled already

**Gas Cost**: ~80,000 gas

#### `requestRefund()`
Requests a refund for a ticket (only if event cancelled).

```solidity
function requestRefund(uint256 _tokenId) external
```

**Parameters:**
- `_tokenId`: Token ID to refund

**Requirements:**
- Event must be cancelled
- Caller must own the ticket
- Ticket not already refunded

**Gas Cost**: ~120,000 gas

### Query Functions

#### `getTicketInfo()`
Returns detailed information about a ticket.

```solidity
function getTicketInfo(uint256 _tokenId) external view returns (TicketInfo memory)
```

**Parameters:**
- `_tokenId`: Token ID to query

**Returns:**
- `TicketInfo`: Struct containing ticket details

#### `getAvailableSeats()`
Returns array of available seat numbers.

```solidity
function getAvailableSeats() external view returns (uint256[] memory)
```

**Returns:**
- `uint256[]`: Array of available seat numbers

#### `eventInfo()`
Returns event information.

```solidity
function eventInfo() external view returns (EventInfo memory)
```

**Returns:**
- `EventInfo`: Struct containing event details

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

struct ResaleListing {
    address seller;           // Seller address
    uint256 price;           // Listing price
    uint256 listedAt;        // Listing timestamp
    bool isActive;           // Listing status
}
```

### Events

```solidity
event TicketMinted(uint256 indexed tokenId, address indexed buyer, uint256 seatNumber, uint256 price);
event TicketListedForResale(uint256 indexed tokenId, uint256 price);
event TicketSold(uint256 indexed tokenId, address indexed from, address indexed to, uint256 price);
event TicketUnlisted(uint256 indexed tokenId);
event TicketUsed(uint256 indexed tokenId, address indexed attendee);
event EventCancelled();
event RefundIssued(uint256 indexed tokenId, address indexed recipient, uint256 amount);
```

## 🔐 EventVexAccessControl Contract

**Address**: `0x869A778E55fC67A930C2fc71D72f06EEacD9B4Ae`  
**Purpose**: Centralized role and permission management

### User Management Functions

#### `registerUser()`
Registers a new user in the system.

```solidity
function registerUser() external
```

**Requirements:**
- User not already registered

**Gas Cost**: ~100,000 gas

#### `updateUserActivity()`
Updates user's last activity timestamp.

```solidity
function updateUserActivity(address user) external
```

**Parameters:**
- `user`: User address to update

**Requirements:**
- Caller must be authorized contract
- User must be registered

**Gas Cost**: ~50,000 gas

#### `incrementUserEvents()`
Increments user's event creation count.

```solidity
function incrementUserEvents(address user) external
```

**Parameters:**
- `user`: User address to update

**Requirements:**
- Caller must be authorized contract
- User must be registered

**Gas Cost**: ~50,000 gas

#### `incrementUserTickets()`
Increments user's ticket purchase count.

```solidity
function incrementUserTickets(address user) external
```

**Parameters:**
- `user`: User address to update

**Requirements:**
- Caller must be authorized contract
- User must be registered

**Gas Cost**: ~50,000 gas

### Role Management Functions

#### `grantOrganizerRole()`
Grants organizer role with automatic user registration.

```solidity
function grantOrganizerRole(address organizer, string calldata metadata) external
```

**Parameters:**
- `organizer`: Address to grant role to
- `metadata`: IPFS hash for organizer information

**Requirements:**
- Caller must have PLATFORM_ADMIN_ROLE

**Gas Cost**: ~150,000 gas

#### `verifyOrganizer()`
Verifies an organizer and upgrades to verified status.

```solidity
function verifyOrganizer(
    address organizer, 
    string calldata verificationLevel
) external
```

**Parameters:**
- `organizer`: Organizer address to verify
- `verificationLevel`: Verification level ("basic", "premium", "enterprise")

**Requirements:**
- Caller must have PLATFORM_ADMIN_ROLE
- Organizer must have ORGANIZER_ROLE

**Gas Cost**: ~120,000 gas

#### `changeUserStatus()`
Changes user's status (active, suspended, banned).

```solidity
function changeUserStatus(
    address user, 
    UserStatus newStatus
) external
```

**Parameters:**
- `user`: User address to modify
- `newStatus`: New status (0=ACTIVE, 1=SUSPENDED, 2=BANNED, 3=PENDING_VERIFICATION)

**Requirements:**
- Caller must have MODERATOR_ROLE
- User must be registered

**Gas Cost**: ~80,000 gas

### Contract Management Functions

#### `authorizeContract()`
Authorizes a contract to interact with access control.

```solidity
function authorizeContract(
    address contractAddress, 
    bool authorized
) external
```

**Parameters:**
- `contractAddress`: Contract address to authorize/deauthorize
- `authorized`: Authorization status

**Requirements:**
- Caller must have CONTRACT_MANAGER_ROLE

**Gas Cost**: ~60,000 gas

### Query Functions

#### `canCreateEvents()`
Checks if user can create events.

```solidity
function canCreateEvents(address user) external view returns (bool)
```

**Parameters:**
- `user`: User address to check

**Returns:**
- `bool`: True if user can create events

#### `canPurchaseTickets()`
Checks if user can purchase tickets.

```solidity
function canPurchaseTickets(address user) external view returns (bool)
```

**Parameters:**
- `user`: User address to check

**Returns:**
- `bool`: True if user can purchase tickets

#### `canResaleTickets()`
Checks if user can list tickets for resale.

```solidity
function canResaleTickets(address user) external view returns (bool)
```

**Parameters:**
- `user`: User address to check

**Returns:**
- `bool`: True if user can resale tickets

#### `getUserVerificationLevel()`
Gets user's verification level.

```solidity
function getUserVerificationLevel(address user) external view returns (string memory)
```

**Parameters:**
- `user`: User address to query

**Returns:**
- `string`: Verification level

#### `isVerifiedOrganizer()`
Checks if user is a verified organizer.

```solidity
function isVerifiedOrganizer(address user) external view returns (bool)
```

**Parameters:**
- `user`: User address to check

**Returns:**
- `bool`: True if user is verified organizer

#### `getUserStats()`
Gets user statistics.

```solidity
function getUserStats(address user) external view returns (
    uint256 eventsCreated,
    uint256 ticketsPurchased,
    uint256 accountAge,
    uint256 lastActivity
)
```

**Parameters:**
- `user`: User address to query

**Returns:**
- `eventsCreated`: Number of events created
- `ticketsPurchased`: Number of tickets purchased
- `accountAge`: Account age in seconds
- `lastActivity`: Last activity timestamp

### Batch Operations

#### `batchGrantRole()`
Grants role to multiple accounts.

```solidity
function batchGrantRole(
    bytes32 role, 
    address[] calldata accounts
) external
```

**Parameters:**
- `role`: Role to grant
- `accounts`: Array of addresses to grant role to

**Requirements:**
- Caller must have role admin privileges

**Gas Cost**: ~50,000 gas per account

#### `batchRevokeRole()`
Revokes role from multiple accounts.

```solidity
function batchRevokeRole(
    bytes32 role, 
    address[] calldata accounts
) external
```

**Parameters:**
- `role`: Role to revoke
- `accounts`: Array of addresses to revoke role from

**Requirements:**
- Caller must have role admin privileges

**Gas Cost**: ~40,000 gas per account

### Emergency Functions

#### `emergencyPause()`
Pauses all role-based operations.

```solidity
function emergencyPause() external
```

**Requirements:**
- Caller must have PAUSER_ROLE

**Gas Cost**: ~50,000 gas

#### `unpause()`
Resumes operations after pause.

```solidity
function unpause() external
```

**Requirements:**
- Caller must have PAUSER_ROLE

**Gas Cost**: ~30,000 gas

### Data Structures

```solidity
enum UserStatus {
    ACTIVE,
    SUSPENDED,
    BANNED,
    PENDING_VERIFICATION
}

struct UserProfile {
    UserStatus status;
    uint256 createdAt;
    uint256 lastActivity;
    uint256 eventsCreated;
    uint256 ticketsPurchased;
    bool isVerified;
    string verificationLevel;
}
```

### Role Constants

```solidity
bytes32 public constant PLATFORM_ADMIN_ROLE = keccak256("PLATFORM_ADMIN_ROLE");
bytes32 public constant ORGANIZER_ROLE = keccak256("ORGANIZER_ROLE");
bytes32 public constant VERIFIED_ORGANIZER_ROLE = keccak256("VERIFIED_ORGANIZER_ROLE");
bytes32 public constant MODERATOR_ROLE = keccak256("MODERATOR_ROLE");
bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
bytes32 public constant FEE_MANAGER_ROLE = keccak256("FEE_MANAGER_ROLE");
bytes32 public constant CONTRACT_MANAGER_ROLE = keccak256("CONTRACT_MANAGER_ROLE");
```

## 🏪 TicketMarketplace Contract

**Address**: `0xC1CD48117533a0E9cb77d4713f940CeE215D564C`  
**Purpose**: Decentralized secondary ticket marketplace

### Core Functions

#### `listTicket()`
Lists a ticket for sale on the marketplace.

```solidity
function listTicket(
    address _eventContract, 
    uint256 _tokenId, 
    uint256 _price
) external
```

**Parameters:**
- `_eventContract`: EventTicket contract address
- `_tokenId`: Token ID to list
- `_price`: Listing price in wei

**Requirements:**
- Caller must own the ticket
- Ticket not already listed
- Price within allowed limits

**Gas Cost**: ~120,000 gas

#### `buyTicket()`
Purchases a listed ticket.

```solidity
function buyTicket(
    address _eventContract, 
    uint256 _tokenId
) external payable
```

**Parameters:**
- `_eventContract`: EventTicket contract address
- `_tokenId`: Token ID to purchase

**Requirements:**
- Ticket must be listed
- Sufficient payment
- Buyer cannot be seller

**Gas Cost**: ~200,000 gas

#### `cancelListing()`
Cancels a ticket listing.

```solidity
function cancelListing(
    address _eventContract, 
    uint256 _tokenId
) external
```

**Parameters:**
- `_eventContract`: EventTicket contract address
- `_tokenId`: Token ID to cancel

**Requirements:**
- Caller must be the seller

**Gas Cost**: ~80,000 gas

#### `updateListing()`
Updates the price of a listed ticket.

```solidity
function updateListing(
    address _eventContract, 
    uint256 _tokenId, 
    uint256 _newPrice
) external
```

**Parameters:**
- `_eventContract`: EventTicket contract address
- `_tokenId`: Token ID to update
- `_newPrice`: New listing price

**Requirements:**
- Caller must be the seller
- New price within limits

**Gas Cost**: ~60,000 gas

### Query Functions

#### `getListing()`
Gets listing information for a ticket.

```solidity
function getListing(
    address _eventContract, 
    uint256 _tokenId
) external view returns (Listing memory)
```

**Parameters:**
- `_eventContract`: EventTicket contract address
- `_tokenId`: Token ID to query

**Returns:**
- `Listing`: Struct containing listing details

#### `getActiveListings()`
Gets all active listings for an event.

```solidity
function getActiveListings(
    address _eventContract
) external view returns (uint256[] memory)
```

**Parameters:**
- `_eventContract`: EventTicket contract address

**Returns:**
- `uint256[]`: Array of listed token IDs

#### `getMarketplaceStats()`
Gets marketplace statistics.

```solidity
function getMarketplaceStats() external view returns (
    uint256 totalListings,
    uint256 totalSales,
    uint256 totalVolume
)
```

**Returns:**
- `totalListings`: Total number of listings created
- `totalSales`: Total number of sales completed
- `totalVolume`: Total volume traded in wei

### Data Structures

```solidity
struct Listing {
    address seller;           // Seller address
    uint256 price;           // Listing price
    uint256 listedAt;        // Listing timestamp
    bool isActive;           // Listing status
}
```

## 💳 EventVexPaymaster Contract

**Address**: `0x03fd90a13AF3032c3414fd01a9Aa619B2fa8BeF9`  
**Purpose**: Gas fee sponsorship for improved user experience

### Core Functions

#### `depositFunds()`
Deposits ETH to fund gas sponsorship.

```solidity
function depositFunds() external payable
```

**Requirements:**
- Only owner can deposit funds

**Gas Cost**: ~50,000 gas

#### `withdrawFunds()`
Withdraws ETH from the paymaster.

```solidity
function withdrawFunds(uint256 _amount) external
```

**Parameters:**
- `_amount`: Amount to withdraw in wei

**Requirements:**
- Only owner can withdraw
- Sufficient balance

**Gas Cost**: ~60,000 gas

#### `addAuthorizedContract()`
Authorizes a contract to request gas sponsorship.

```solidity
function addAuthorizedContract(address _contract) external
```

**Parameters:**
- `_contract`: Contract address to authorize

**Requirements:**
- Only owner can authorize contracts

**Gas Cost**: ~50,000 gas

#### `removeAuthorizedContract()`
Removes authorization from a contract.

```solidity
function removeAuthorizedContract(address _contract) external
```

**Parameters:**
- `_contract`: Contract address to deauthorize

**Requirements:**
- Only owner can remove authorization

**Gas Cost**: ~40,000 gas

#### `sponsorTransaction()`
Sponsors gas for an authorized transaction.

```solidity
function sponsorTransaction(
    address _user,
    address _contract,
    bytes calldata _data
) external payable
```

**Parameters:**
- `_user`: User address requesting sponsorship
- `_contract`: Contract to call
- `_data`: Transaction data

**Requirements:**
- Contract must be authorized
- Sufficient funds for gas
- User meets sponsorship criteria

**Gas Cost**: Variable (depends on sponsored transaction)

### Query Functions

#### `getBalance()`
Gets the current ETH balance.

```solidity
function getBalance() external view returns (uint256)
```

**Returns:**
- `uint256`: Current balance in wei

#### `isAuthorizedContract()`
Checks if a contract is authorized for sponsorship.

```solidity
function isAuthorizedContract(address _contract) external view returns (bool)
```

**Parameters:**
- `_contract`: Contract address to check

**Returns:**
- `bool`: True if contract is authorized

#### `getSponsorshipStats()`
Gets sponsorship statistics.

```solidity
function getSponsorshipStats() external view returns (
    uint256 totalSponsored,
    uint256 totalGasUsed,
    uint256 totalUsers
)
```

**Returns:**
- `totalSponsored`: Total amount sponsored in wei
- `totalGasUsed`: Total gas units sponsored
- `totalUsers`: Total unique users sponsored

## 🔧 Integration Examples

### Complete Event Lifecycle

```typescript
import { ethers } from 'ethers';

// Contract instances
const eventFactory = new ethers.Contract(FACTORY_ADDRESS, FactoryABI, signer);
const accessControl = new ethers.Contract(ACCESS_CONTROL_ADDRESS, AccessControlABI, signer);

// 1. Register as organizer
await accessControl.registerUser();
await accessControl.grantOrganizerRole(
    await signer.getAddress(),
    "ipfs://QmHash/organizer-profile.json"
);

// 2. Create event
const { eventId, eventContract } = await eventFactory.createEvent(
    PLATFORM_FEE_RECIPIENT,
    "Tech Conference 2024",
    "Annual technology conference with industry leaders",
    "Convention Center, San Francisco",
    Math.floor(Date.now() / 1000) + 86400 * 30, // 30 days from now
    ethers.parseEther("0.1"), // 0.1 ETH per ticket
    500, // 500 tickets max
    ethers.parseEther("0.3"), // 0.3 ETH max resale
    "ipfs://QmHash/event-metadata.json"
);

// 3. Get event ticket contract
const eventTicket = new ethers.Contract(eventContract, EventTicketABI, signer);

// 4. Mint tickets
for (let seat = 0; seat < 10; seat++) {
    await eventTicket.mintTicket(seat, {
        value: ethers.parseEther("0.1")
    });
}

// 5. List ticket for resale
await eventTicket.listForResale(0, ethers.parseEther("0.15"));

// 6. Buy resale ticket (different user)
const buyerSigner = new ethers.Wallet(BUYER_PRIVATE_KEY, provider);
const eventTicketBuyer = eventTicket.connect(buyerSigner);
await eventTicketBuyer.buyResaleTicket(0, {
    value: ethers.parseEther("0.15")
});

// 7. Use ticket at event (verifier)
const verifierSigner = new ethers.Wallet(VERIFIER_PRIVATE_KEY, provider);
const eventTicketVerifier = eventTicket.connect(verifierSigner);
await eventTicketVerifier.useTicket(0);
```

### Event Monitoring

```typescript
// Listen for all event-related activities
eventFactory.on('EventCreated', (eventId, organizer, eventContract, title) => {
    console.log(`New event created: ${title} (ID: ${eventId})`);
    
    // Set up listeners for the new event contract
    const eventTicket = new ethers.Contract(eventContract, EventTicketABI, provider);
    
    eventTicket.on('TicketMinted', (tokenId, buyer, seatNumber, price) => {
        console.log(`Ticket ${tokenId} minted for seat ${seatNumber}`);
    });
    
    eventTicket.on('TicketListedForResale', (tokenId, price) => {
        console.log(`Ticket ${tokenId} listed for ${ethers.formatEther(price)} ETH`);
    });
    
    eventTicket.on('TicketSold', (tokenId, from, to, price) => {
        console.log(`Ticket ${tokenId} sold for ${ethers.formatEther(price)} ETH`);
    });
});
```

### Batch Operations

```typescript
// Batch mint tickets
async function batchMintTickets(eventTicket, seats, ticketPrice) {
    const promises = seats.map(seat => 
        eventTicket.mintTicket(seat, { value: ticketPrice })
    );
    
    const results = await Promise.allSettled(promises);
    
    results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
            console.log(`Seat ${seats[index]}: Success`);
        } else {
            console.log(`Seat ${seats[index]}: Failed - ${result.reason}`);
        }
    });
}

// Usage
await batchMintTickets(
    eventTicket,
    [1, 2, 3, 4, 5],
    ethers.parseEther("0.1")
);
```

## ❌ Error Reference

### Common Errors

| Error Message | Contract | Cause | Solution |
|---------------|----------|-------|----------|
| `"Title cannot be empty"` | EventFactory | Empty event title | Provide non-empty title |
| `"Event date must be in future"` | EventFactory | Past event date | Use future timestamp |
| `"Insufficient payment"` | EventTicket | Low payment amount | Send correct ETH amount |
| `"Seat already taken"` | EventTicket | Seat unavailable | Choose different seat |
| `"Not ticket owner"` | EventTicket | Wrong owner | Use correct wallet |
| `"Price exceeds maximum"` | EventTicket | High resale price | Reduce price below limit |
| `"Event has started"` | EventTicket | Late transaction | Complete before event start |
| `"Ticket already used"` | EventTicket | Used ticket | Cannot reuse tickets |
| `"AccessControl: unauthorized"` | AccessControl | Missing role | Grant required role |
| `"User not registered"` | AccessControl | Unregistered user | Call registerUser() first |
| `"System is paused"` | AccessControl | Emergency pause | Wait for unpause |
| `"Contract not authorized"` | AccessControl | Unauthorized contract | Authorize contract first |

### Error Handling Example

```typescript
async function handleTicketPurchase(eventTicket, seatNumber, ticketPrice) {
    try {
        const tx = await eventTicket.mintTicket(seatNumber, { 
            value: ticketPrice 
        });
        await tx.wait();
        console.log('Ticket purchased successfully!');
        
    } catch (error) {
        if (error.message.includes('Seat already taken')) {
            console.error('Seat unavailable. Please choose another seat.');
            // Show seat selection UI
            
        } else if (error.message.includes('Insufficient payment')) {
            console.error(`Insufficient payment. Required: ${ethers.formatEther(ticketPrice)} ETH`);
            // Show payment error
            
        } else if (error.message.includes('Event has started')) {
            console.error('Event has already started. Ticket sales closed.');
            // Redirect to event page
            
        } else if (error.message.includes('AccessControl: unauthorized')) {
            console.error('Please register and verify your account first.');
            // Redirect to registration
            
        } else {
            console.error('Transaction failed:', error.message);
            // Show generic error
        }
    }
}
```

## 🔗 Related Documentation

- [Contract Architecture](./contract-architecture.md)
- [Smart Contracts API](./smart-contracts.md)
- [Deployment Guide](./deployment.md)
- [Security Analysis](./security-analysis.md)
- [Frontend Integration](../frontend/wallet-integration.md)

---

**Last Updated**: January 21, 2025  
**Contract Version**: 1.0.0  
**Network**: Base Sepolia Testnet