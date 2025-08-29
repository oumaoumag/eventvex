/**
 * Smart contract constants for EventVex platform
 */

// Platform fee configuration
const PLATFORM_FEE = {
  PERCENTAGE: 250, // 2.5% (basis points)
  RECIPIENT: process.env.PLATFORM_FEE_RECIPIENT || "0x0000000000000000000000000000000000000000",
};

// Organizer royalty configuration
const ORGANIZER_ROYALTY = {
  PERCENTAGE: 500, // 5% (basis points)
  MAX_PERCENTAGE: 1000, // 10% maximum
};

// Resale configuration
const RESALE = {
  MAX_PRICE_MULTIPLIER: 300, // 3x original price
  MIN_PRICE_PERCENTAGE: 50, // 50% of original price minimum
  ROYALTY_PERCENTAGE: 250, // 2.5% to original organizer
};

// Event configuration
const EVENT = {
  MAX_TICKETS_PER_EVENT: 10000,
  MIN_TICKETS_PER_EVENT: 1,
  MAX_EVENT_DURATION_DAYS: 365,
  MIN_ADVANCE_BOOKING_HOURS: 1,
  MAX_TITLE_LENGTH: 100,
  MAX_DESCRIPTION_LENGTH: 1000,
  MAX_LOCATION_LENGTH: 200,
};

// Ticket configuration
const TICKET = {
  MAX_SEATS_PER_TRANSACTION: 10,
  REFUND_WINDOW_HOURS: 24, // 24 hours before event
  QR_CODE_EXPIRY_HOURS: 2, // QR codes expire 2 hours after event start
};

// Access control roles
const ROLES = {
  DEFAULT_ADMIN_ROLE: "0x0000000000000000000000000000000000000000000000000000000000000000",
  ORGANIZER_ROLE: "0x523a704056dcd17bcf83bed8b68c59416dac1119be77755efe3bde0a64e46e0c", // keccak256("ORGANIZER_ROLE")
  VERIFIER_ROLE: "0x2f2ff15d38259d74d0e5f6b4b8e4c7e5c4b3a2d1e0f9c8b7a6958473829384756", // keccak256("VERIFIER_ROLE")
  PAUSER_ROLE: "0x65d7a28e3265b37a6474929f336521b332c1681b933f6cb9f3376673440d862a", // keccak256("PAUSER_ROLE")
};

// Gas limits for different operations
const GAS_LIMITS = {
  EVENT_CREATION: 500000,
  TICKET_MINT: 200000,
  TICKET_TRANSFER: 100000,
  RESALE_LIST: 150000,
  RESALE_PURCHASE: 250000,
  REFUND: 200000,
};

// Contract deployment configuration
const DEPLOYMENT = {
  CONFIRMATIONS: 5, // Number of confirmations to wait
  TIMEOUT: 300000, // 5 minutes timeout
  RETRY_ATTEMPTS: 3,
};

// Farcaster integration
const FARCASTER = {
  HUB_URL: process.env.FARCASTER_HUB_URL || "https://hub.farcaster.xyz",
  APP_FID: process.env.FARCASTER_APP_FID || "",
  FRAME_VERSION: "vNext",
};

// Paymaster configuration for gasless transactions
const PAYMASTER = {
  ADDRESS: process.env.PAYMASTER_ADDRESS || "",
  PRIVATE_KEY: process.env.PAYMASTER_PRIVATE_KEY || "",
  MAX_GAS_SPONSORSHIP: "0.01", // Maximum ETH to sponsor per transaction
  DAILY_LIMIT: "1.0", // Maximum ETH to sponsor per day
};

// Contract addresses (to be updated after deployment)
const CONTRACT_ADDRESSES = {
  // Base Sepolia Testnet
  84532: {
    EVENT_FACTORY: "",
    TICKET_MARKETPLACE: "",
    ACCESS_CONTROL: "",
    PAYMASTER: "",
  },
  // Base Mainnet
  8453: {
    EVENT_FACTORY: "",
    TICKET_MARKETPLACE: "",
    ACCESS_CONTROL: "",
    PAYMASTER: "",
  },
  // Local development
  31337: {
    EVENT_FACTORY: "",
    TICKET_MARKETPLACE: "",
    ACCESS_CONTROL: "",
    PAYMASTER: "",
  },
};

// Error messages
const ERROR_MESSAGES = {
  INSUFFICIENT_PAYMENT: "Insufficient payment for ticket",
  SEAT_TAKEN: "Seat is already taken",
  EVENT_NOT_FOUND: "Event not found",
  TICKET_NOT_FOUND: "Ticket not found",
  NOT_TICKET_OWNER: "Not the owner of this ticket",
  EVENT_ENDED: "Event has already ended",
  REFUND_WINDOW_CLOSED: "Refund window has closed",
  INVALID_PRICE: "Invalid price specified",
  UNAUTHORIZED: "Unauthorized access",
  PAUSED: "Contract is paused",
};

module.exports = {
  PLATFORM_FEE,
  ORGANIZER_ROYALTY,
  RESALE,
  EVENT,
  TICKET,
  ROLES,
  GAS_LIMITS,
  DEPLOYMENT,
  FARCASTER,
  PAYMASTER,
  CONTRACT_ADDRESSES,
  ERROR_MESSAGES,
};
