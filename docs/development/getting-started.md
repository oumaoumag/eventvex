# 🚀 EventVex Development Getting Started Guide

> **Complete setup guide for new developers joining the EventVex project**

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Project Setup](#project-setup)
- [Development Environment](#development-environment)
- [Running the Application](#running-the-application)
- [Development Workflow](#development-workflow)
- [Testing](#testing)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

## 🔧 Prerequisites

### Required Software

| Tool | Version | Purpose | Installation |
|------|---------|---------|--------------|
| **Node.js** | 18+ | JavaScript runtime | [Download](https://nodejs.org/) |
| **npm** | 8+ | Package manager | Included with Node.js |
| **Git** | Latest | Version control | [Download](https://git-scm.com/) |
| **VS Code** | Latest | Code editor | [Download](https://code.visualstudio.com/) |

### Recommended VS Code Extensions

```json
{
  "recommendations": [
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next",
    "nomicfoundation.hardhat-solidity",
    "juanblanco.solidity"
  ]
}
```

### Blockchain Prerequisites

1. **MetaMask Wallet**
   - Install [MetaMask browser extension](https://metamask.io/)
   - Create wallet and secure seed phrase
   - Add Base Sepolia testnet

2. **Test ETH**
   - Get Base Sepolia ETH from [faucet](https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet)
   - Minimum 0.1 ETH recommended for testing

3. **API Keys** (Optional for advanced features)
   - [Etherscan API key](https://etherscan.io/apis) for contract verification
   - [Infura API key](https://infura.io/) for reliable RPC access

## 📁 Project Setup

### 1. Clone Repository

```bash
# Clone the repository
git clone https://github.com/eventvex/eventvex.git
cd eventvex

# Check project structure
ls -la
```

Expected structure:
```
eventvex/
├── frontend/          # React/Next.js application
├── web3/             # Smart contracts and blockchain code
├── docs/             # Documentation
├── README.md         # Project overview
└── .gitignore        # Git ignore rules
```

### 2. Install Dependencies

#### Frontend Dependencies
```bash
cd frontend
npm install

# Verify installation
npm list --depth=0
```

#### Web3 Dependencies
```bash
cd ../web3
npm install

# Verify installation
npm list --depth=0
```

### 3. Environment Configuration

#### Frontend Environment
```bash
cd frontend
cp .env.example .env.local

# Edit .env.local with your configuration
nano .env.local
```

Required frontend environment variables:
```env
# Blockchain Configuration
NEXT_PUBLIC_CHAIN_ID=84532
NEXT_PUBLIC_RPC_URL=https://sepolia.base.org
NEXT_PUBLIC_FACTORY_ADDRESS=0x... # Will be set after deployment

# Optional: Analytics and monitoring
NEXT_PUBLIC_ANALYTICS_ID=your_analytics_id
```

#### Web3 Environment
```bash
cd ../web3
cp .env.example .env

# Edit .env with your configuration
nano .env
```

Required Web3 environment variables:
```env
# Deployment Configuration
PRIVATE_KEY=0x... # Your wallet private key (NEVER commit this)
BASE_SEPOLIA_RPC=https://sepolia.base.org
ETHERSCAN_API_KEY=your_etherscan_api_key

# Platform Configuration
PLATFORM_FEE_PERCENTAGE=250  # 2.5%
ORGANIZER_ROYALTY_PERCENTAGE=500  # 5%
```

## 🛠️ Development Environment

### 1. Compile Smart Contracts

```bash
cd web3

# Compile contracts
npm run compile

# Generate TypeScript types
npm run typechain

# Verify compilation
ls artifacts/contracts/src/core/
```

### 2. Run Tests

```bash
# Run smart contract tests
npm run test

# Run tests with coverage
npm run test:coverage

# Run gas analysis
npm run test:gas
```

### 3. Start Local Blockchain

```bash
# Start Hardhat local node
npm run node

# In another terminal, deploy to local network
npm run deploy:local
```

### 4. Start Frontend Development Server

```bash
cd frontend

# Start development server
npm run dev

# Open browser to http://localhost:3000
```

## 🏃‍♂️ Running the Application

### Development Mode

1. **Start Local Blockchain**
   ```bash
   cd web3
   npm run node
   ```

2. **Deploy Contracts Locally**
   ```bash
   npm run deploy:local
   ```

3. **Start Frontend**
   ```bash
   cd frontend
   npm run dev
   ```

4. **Configure MetaMask**
   - Add Hardhat local network (Chain ID: 31337, RPC: http://localhost:8545)
   - Import test account from Hardhat node output

### Testnet Mode

1. **Deploy to Base Sepolia**
   ```bash
   cd web3
   npm run deploy:testnet
   ```

2. **Update Frontend Configuration**
   ```bash
   cd frontend
   # Update .env.local with deployed contract addresses
   ```

3. **Start Frontend**
   ```bash
   npm run dev
   ```

4. **Configure MetaMask**
   - Switch to Base Sepolia network
   - Ensure you have test ETH

## 🔄 Development Workflow

### Git Workflow

```bash
# Create feature branch
git checkout -b feat/your-feature-name

# Make changes and commit
git add .
git commit -m "feat: add your feature description"

# Push to remote
git push origin feat/your-feature-name

# Create pull request on GitHub
```

### Code Quality Checks

```bash
# Frontend linting and formatting
cd frontend
npm run lint
npm run format

# Web3 linting
cd web3
npm run lint
npm run format
```

### Pre-commit Hooks

The project uses Husky for pre-commit hooks:

```bash
# Install Husky (if not already installed)
npm install -g husky

# Setup hooks
cd frontend
npx husky install

cd ../web3
npx husky install
```

Hooks will automatically run:
- ESLint for code quality
- Prettier for formatting
- TypeScript compilation check
- Smart contract compilation

## 🧪 Testing

### Smart Contract Testing

```bash
cd web3

# Run all tests
npm run test

# Run specific test file
npx hardhat test contracts/test/EventFactory.test.js

# Run tests with gas reporting
npm run test:gas

# Generate coverage report
npm run test:coverage
```

### Frontend Testing

```bash
cd frontend

# Run unit tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run integration tests
npm run test:integration

# Generate coverage report
npm run test:coverage
```

### End-to-End Testing

```bash
# Start all services
cd web3 && npm run node &
cd web3 && npm run deploy:local
cd frontend && npm run dev &

# Run E2E tests
cd frontend
npm run test:e2e
```

## 🚀 Deployment

### Testnet Deployment

```bash
cd web3

# Deploy to Base Sepolia
npm run deploy:testnet

# Verify contracts
npm run verify:testnet

# Test deployment
npm run test:deployment
```

### Frontend Deployment

```bash
cd frontend

# Build for production
npm run build

# Test production build locally
npm run start

# Deploy to Vercel (if configured)
npm run deploy
```

## 🔧 Troubleshooting

### Common Issues

#### 1. **Node.js Version Issues**
```bash
# Check Node.js version
node --version

# Use Node Version Manager (nvm) if needed
nvm install 18
nvm use 18
```

#### 2. **Dependency Installation Failures**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### 3. **Smart Contract Compilation Errors**
```bash
# Clean Hardhat cache
cd web3
npx hardhat clean

# Recompile contracts
npm run compile
```

#### 4. **MetaMask Connection Issues**
- Ensure MetaMask is unlocked
- Check network configuration
- Clear MetaMask activity data if needed
- Verify contract addresses are correct

#### 5. **Transaction Failures**
```bash
# Check account balance
npx hardhat run scripts/utils/check-balance.js

# Verify network connectivity
npm run test:network

# Check gas settings
npm run estimate:gas
```

### Debug Tools

```bash
# Smart contract debugging
cd web3
npm run debug:contracts

# Frontend debugging
cd frontend
npm run debug

# Network diagnostics
npm run diagnose:network
```

### Getting Help

1. **Documentation**: Check relevant docs in `/docs` folder
2. **GitHub Issues**: Search existing issues or create new one
3. **Discord/Slack**: Join development chat (if available)
4. **Code Review**: Request review from team members

## 📚 Next Steps

After completing setup:

1. **Explore Codebase**
   - Review [Architecture Documentation](../architecture/README.md)
   - Understand [Smart Contract APIs](../web3/smart-contracts.md)
   - Study [Frontend Components](../frontend/components.md)

2. **Make Your First Contribution**
   - Pick a "good first issue" from GitHub
   - Follow the [Development Workflow](./workflow.md)
   - Submit a pull request

3. **Advanced Topics**
   - [Performance Optimization](./performance.md)
   - [Security Best Practices](../web3/security.md)
   - [Deployment Strategies](../deployment/README.md)

## 🔗 Related Documentation

- [Development Workflow](./workflow.md)
- [Code Standards](./standards.md)
- [Testing Strategy](./testing.md)
- [Web3 Integration](../web3/README.md)
- [Frontend Architecture](../frontend/README.md)

---

**Welcome to EventVex development! 🎉**

For questions or issues, please check our [FAQ](../support/faq.md) or create an issue on GitHub.
