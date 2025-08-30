# 🚀 EventVex Deployment Guide

## 📋 Pre-Deployment Checklist

### ✅ **Completed**
- [x] Smart contracts compiled successfully
- [x] Contract ABIs updated in frontend
- [x] TypeScript types generated
- [x] Environment variables configured

### 🔄 **In Progress**
- [ ] Testnet ETH acquired for deployment
- [ ] Contracts deployed to Base Sepolia
- [ ] Contract addresses updated in frontend
- [ ] Frontend integration tested

## 💰 **Funding Requirements**

**Deployer Address:** `0xF65781317f8E35891CD2edDa1Db26e56ba53B736`
**Current Balance:** ~0.0009 ETH
**Required:** ~0.05 ETH (recommended: 0.1 ETH for buffer)

### **Get Base Sepolia ETH:**
1. **Coinbase Faucet:** https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet
2. **QuickNode Faucet:** https://faucet.quicknode.com/base/sepolia
3. **Alchemy Faucet:** https://www.alchemy.com/faucets/base-sepolia

## 🔧 **Deployment Commands**

### **1. Deploy to Testnet**
```bash
cd web3
npm run deploy:testnet
```

### **2. Verify Contracts**
```bash
npm run verify:testnet
```

### **3. Update Frontend Config**
After deployment, update `frontend/.env`:
```env
VITE_EVENT_FACTORY_ADDRESS=<deployed_factory_address>
VITE_PLATFORM_FEE_RECIPIENT=<deployer_address>
```

## 📊 **Expected Deployment Output**

```
🚀 Deploying EventVex Core Contracts
📍 Network: baseSepolia (Chain ID: 84532)
👤 Deployer: 0xF65781317f8E35891CD2edDa1Db26e56ba53B736
💰 Balance: 0.1 ETH

📦 Deploying EventFactory...
✅ EventFactory deployed to: 0x...
💾 Deployment data saved
🔍 Verifying contracts on block explorer...
✅ EventFactory verified
🧪 Testing deployment with sample event...
✅ Sample event created successfully
📊 Total events in factory: 1
```

## 🎯 **Post-Deployment Tasks**

1. **Update Frontend Environment**
2. **Test Event Creation Flow**
3. **Test Ticket Purchase Flow**
4. **Test Resale Marketplace**
5. **Deploy to Production (Base Mainnet)**

## 🔗 **Useful Links**

- **Base Sepolia Explorer:** https://sepolia.basescan.org
- **Base Mainnet Explorer:** https://basescan.org
- **Contract Verification:** Automatic via deployment script
- **Frontend Integration:** Uses `contractIntegration.js`

## 🚨 **Troubleshooting**

### **Insufficient Funds Error**
```bash
# Check balance
npx hardhat run scripts/utils/check-balance.js --network baseSepolia

# Get more testnet ETH from faucets above
```

### **Network Issues**
```bash
# Verify network configuration
npx hardhat run scripts/utils/check-network.js --network baseSepolia
```

### **Contract Verification Failed**
```bash
# Manual verification
npx hardhat verify --network baseSepolia <contract_address> <constructor_args>
```
