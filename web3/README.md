# 🔗 EventVex Web3 Layer

This directory contains all blockchain-related code for the EventVex platform, organized for efficient smart contract development and deployment.

## 📁 Directory Structure

```
web3/
├── contracts/                  # Smart contract source code
│   ├── src/                   # Main contract files
│   │   ├── core/             # Core contracts (EventFactory, TicketNFT)
│   │   ├── marketplace/      # Marketplace and resale contracts
│   │   ├── governance/       # Access control and governance
│   │   ├── interfaces/       # Contract interfaces
│   │   └── libraries/        # Shared libraries and utilities
│   ├── test/                 # Contract test files
│   └── mocks/                # Mock contracts for testing
├── scripts/                  # Deployment and utility scripts
│   ├── deploy/              # Deployment scripts
│   ├── verify/              # Contract verification scripts
│   └── utils/               # Utility scripts
├── config/                  # Configuration files
│   ├── networks.js          # Network configurations
│   └── constants.js         # Contract constants
├── artifacts/               # Compiled contract artifacts (auto-generated)
├── cache/                   # Hardhat cache (auto-generated)
├── typechain-types/         # TypeScript contract types (auto-generated)
├── deployments/             # Deployment records
└── docs/                    # Contract documentation
```

## 🚀 Quick Start

### Prerequisites
- Node.js v18+
- npm or yarn
- MetaMask or compatible wallet

### Installation
```bash
cd web3
npm install
```

### Development Commands
```bash
# Compile contracts
npm run compile

# Run tests
npm run test

# Deploy to testnet
npm run deploy:testnet

# Deploy to mainnet
npm run deploy:mainnet

# Verify contracts
npm run verify

# Generate TypeScript types
npm run typechain
```

## 🎯 MVP Smart Contract Suite

### Core Contracts
1. **EventFactory.sol** - Factory for creating event contracts
2. **EventTicket.sol** - Enhanced ERC-721 ticket NFT contract
3. **TicketMarketplace.sol** - Basic resale marketplace
4. **AccessControl.sol** - Role-based access management

### Key Features
- ✅ Gasless transactions (EIP-4337 paymaster)
- ✅ Mobile wallet integration
- ✅ Basic organizer roles
- ✅ Simple payment flow with platform fees
- ✅ QR code verification
- ✅ Seat assignment system

## 🔧 Configuration

### Network Support
- **Base Sepolia** (Testnet) - Primary development network
- **Base Mainnet** - Production deployment
- **Local Hardhat** - Local development

### Environment Variables
Create a `.env` file in the web3 directory:
```env
PRIVATE_KEY=your_private_key_here
INFURA_API_KEY=your_infura_key
ETHERSCAN_API_KEY=your_etherscan_key
BASE_SEPOLIA_RPC=https://sepolia.base.org
BASE_MAINNET_RPC=https://mainnet.base.org
```

## 📋 Development Workflow

1. **Contract Development**: Write contracts in `contracts/src/`
2. **Testing**: Add tests in `contracts/test/`
3. **Compilation**: Run `npm run compile`
4. **Testing**: Run `npm run test`
5. **Deployment**: Use deployment scripts in `scripts/deploy/`
6. **Verification**: Verify on block explorer
7. **Integration**: Update frontend with new contract addresses

## 🔐 Security Considerations

- All contracts use OpenZeppelin libraries
- Comprehensive test coverage required
- Security audits before mainnet deployment
- Multi-signature wallet for contract ownership
- Timelock for critical contract upgrades

## 📚 Documentation

- Contract documentation in `docs/`
- API documentation auto-generated from NatSpec
- Integration guides for frontend developers
- Deployment guides for different networks

## 🤝 Contributing

1. Follow Solidity style guide
2. Write comprehensive tests
3. Document all public functions
4. Use semantic versioning for releases
5. Security-first development approach
