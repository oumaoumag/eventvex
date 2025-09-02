# 🚀 EventVex Base Mainnet Deployment Guide

## 📋 Pre-Deployment Checklist

### 1. Wallet Preparation
- [ ] Ensure wallet has sufficient ETH (minimum 0.02 ETH recommended)
- [ ] Verify wallet address: `0xF65781317f8E35891CD2edDa1Db26e56ba53B736`
- [ ] Backup private key securely
- [ ] Test wallet connection to Base mainnet

### 2. Environment Configuration
- [ ] All configurations updated to Base mainnet
- [ ] RPC endpoints configured with Infura API key
- [ ] Contract addresses cleared for fresh deployment

### 3. Code Verification
- [ ] All tests passing: `npm test`
- [ ] Contract sizes within limits
- [ ] Security audit completed (recommended)

## 🔧 Deployment Commands

### Option 1: Full Automated Deployment
```bash
cd web3
npm run deploy:mainnet:full
```

This single command will:
1. Deploy all contracts to Base mainnet
2. Configure access control and permissions
3. Fund the paymaster
4. Save deployment data

### Option 2: Step-by-Step Deployment
```bash
cd web3

# 1. Deploy core contracts
npm run deploy:mainnet

# 2. Deploy additional contracts
npm run deploy:additional:mainnet

# 3. Configure contracts
npm run configure:mainnet

# 4. Update environment files
npm run update:env:mainnet
```

### Option 3: Manual Deployment Steps
```bash
cd web3

# Deploy EventFactory
hardhat run scripts/deploy/01-deploy-core.js --network baseMainnet

# Deploy supporting contracts
hardhat run scripts/deploy/02-deploy-additional.js --network baseMainnet

# Configure contracts
hardhat run scripts/deploy/03-configure-contracts.js --network baseMainnet

# Update environment files
node scripts/deploy/05-update-env.js baseMainnet
```

## 🔍 Post-Deployment Verification

### 1. Verify Contracts on BaseScan
```bash
cd web3
npm run verify:mainnet:full
```

### 2. Update Environment Files
```bash
cd web3
npm run update:env:mainnet
```

### 3. Test Deployment
```bash
cd web3
npm test -- --network baseMainnet
```

## 📊 Expected Deployment Costs

| Component | Estimated Gas | Estimated Cost (at 0.5 gwei) |
|-----------|---------------|-------------------------------|
| EventFactory | ~2.1M gas | ~0.0011 ETH |
| EventVexAccessControl | ~1.8M gas | ~0.0009 ETH |
| TicketMarketplace | ~2.0M gas | ~0.0010 ETH |
| EventVexPaymaster | ~1.2M gas | ~0.0006 ETH |
| Configuration | ~0.5M gas | ~0.0003 ETH |
| **Total** | **~7.6M gas** | **~0.004 ETH** |

*Note: Gas prices on Base mainnet are typically much lower than Ethereum mainnet*

## 🔐 Security Considerations

### Before Deployment
- [ ] Code audit completed
- [ ] Test coverage >95%
- [ ] Private key security verified
- [ ] Multi-signature setup (recommended for production)

### After Deployment
- [ ] Verify all contracts on BaseScan
- [ ] Test all critical functions
- [ ] Set up monitoring and alerts
- [ ] Implement incident response procedures

## 📝 Contract Addresses (To be updated after deployment)

### Base Mainnet
```
EventFactory:          [TO_BE_DEPLOYED]
EventVexAccessControl: [TO_BE_DEPLOYED]
TicketMarketplace:     [TO_BE_DEPLOYED]
EventVexPaymaster:     [TO_BE_DEPLOYED]
```

### Deployment Information
- **Network**: Base Mainnet (Chain ID: 8453)
- **Deployer**: 0xF65781317f8E35891CD2edDa1Db26e56ba53B736
- **Deployment Date**: [TO_BE_UPDATED]
- **Total Cost**: [TO_BE_UPDATED]

## 🚨 Emergency Procedures

### If Deployment Fails
1. Check wallet balance and gas prices
2. Verify network connectivity
3. Review error messages for specific issues
4. Use retry mechanisms built into deployment scripts

### If Configuration Fails
1. Manually grant required roles
2. Use the configure script with specific parameters
3. Verify contract authorizations

### Emergency Contacts
- **Technical Lead**: [Your contact]
- **Security Team**: [Security contact]
- **Infrastructure**: [DevOps contact]

## 📚 Related Documentation

- [Contract Architecture](./docs/web3/contract-architecture.md)
- [Deployment Analysis](./docs/web3/deployment-analysis.md)
- [Security Analysis](./docs/web3/security-analysis.md)
- [Contract Functions](./docs/web3/contract-functions.md)

## 🎯 Post-Deployment Tasks

### Immediate (0-24 hours)
- [ ] Verify all contracts on BaseScan
- [ ] Update documentation with mainnet addresses
- [ ] Test critical user flows
- [ ] Set up monitoring dashboards

### Short-term (1-7 days)
- [ ] Conduct security audit of deployed contracts
- [ ] Set up bug bounty program
- [ ] Implement comprehensive monitoring
- [ ] Create incident response procedures

### Long-term (1+ weeks)
- [ ] Monitor gas usage and optimize
- [ ] Gather user feedback and iterate
- [ ] Plan for future upgrades
- [ ] Scale infrastructure as needed

---

**⚠️ Important Notes:**
- Always test on testnet first
- Keep private keys secure
- Monitor gas prices before deployment
- Have emergency procedures ready
- Verify all contracts after deployment