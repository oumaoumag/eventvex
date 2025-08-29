# EventVex Smart Contract Deployment Guide

This guide covers deploying EventVex smart contracts to Base Sepolia testnet and Base mainnet.

## Prerequisites

1. **Node.js v18+** installed
2. **Private key** with sufficient ETH for deployment
3. **Base Sepolia ETH** for testnet deployment
4. **Etherscan API key** for contract verification

## Setup

1. **Install dependencies:**
   ```bash
   cd web3
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your private key and API keys
   ```

3. **Compile contracts:**
   ```bash
   npm run compile
   ```

## Testnet Deployment (Base Sepolia)

1. **Get testnet ETH:**
   - Visit: https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet
   - Request ETH for your deployer address

2. **Deploy to testnet:**
   ```bash
   npm run deploy:testnet
   ```

3. **Verify contracts:**
   ```bash
   npm run verify:testnet
   ```

4. **Test deployment:**
   ```bash
   npx hardhat run scripts/utils/test-deployment.js --network baseSepolia
   ```

## Mainnet Deployment (Base)

⚠️ **IMPORTANT:** Mainnet deployment uses real ETH. Double-check everything!

1. **Final testing:**
   - Ensure all tests pass on testnet
   - Verify contract functionality
   - Review gas costs

2. **Deploy to mainnet:**
   ```bash
   npm run deploy:mainnet
   ```

3. **Verify contracts:**
   ```bash
   npm run verify:mainnet
   ```

## Post-Deployment

1. **Update frontend configuration:**
   - Copy contract addresses to frontend
   - Update network configurations
   - Test frontend integration

2. **Security checklist:**
   - [ ] Contracts verified on block explorer
   - [ ] Platform fee recipient is multisig
   - [ ] Admin roles properly configured
   - [ ] Emergency pause functionality tested

3. **Monitoring setup:**
   - Set up block explorer alerts
   - Monitor contract events
   - Track gas usage and fees

## Contract Addresses

### Base Sepolia Testnet
- EventFactory: `TBD`
- Block Explorer: https://sepolia.basescan.org

### Base Mainnet
- EventFactory: `TBD`
- Block Explorer: https://basescan.org

## Troubleshooting

### Common Issues

1. **"Insufficient funds" error:**
   - Check ETH balance in deployer wallet
   - Ensure enough ETH for gas fees

2. **"Network not supported" error:**
   - Verify RPC URLs in hardhat.config.js
   - Check network connectivity

3. **Verification failed:**
   - Wait a few minutes and retry
   - Check Etherscan API key
   - Verify constructor arguments

4. **Gas estimation failed:**
   - Check contract compilation
   - Verify network connection
   - Try increasing gas limit

### Getting Help

- Check deployment logs in `deployments/` folder
- Review transaction hashes on block explorer
- Run test deployment script for debugging

## Security Considerations

1. **Private Key Management:**
   - Never commit private keys to git
   - Use hardware wallets for mainnet
   - Consider using deployment services

2. **Contract Security:**
   - All contracts use OpenZeppelin libraries
   - Access control properly implemented
   - Emergency pause functionality available

3. **Upgrade Strategy:**
   - Contracts are not upgradeable by design
   - New versions require new deployments
   - Migration strategy needed for upgrades

## Gas Optimization

- EventFactory deployment: ~2.5M gas
- EventTicket deployment: ~3.5M gas per event
- Ticket minting: ~200K gas per ticket
- Resale transactions: ~250K gas

## Next Steps

After successful deployment:

1. **Frontend Integration:**
   - Update contract addresses
   - Test all user flows
   - Deploy frontend to production

2. **User Testing:**
   - Create test events
   - Test ticket purchasing
   - Verify QR code generation

3. **Production Monitoring:**
   - Set up analytics
   - Monitor contract events
   - Track platform metrics
