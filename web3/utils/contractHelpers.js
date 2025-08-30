/**
 * Contract helper utilities for EventVex Web3 integration
 */

import { ethers } from "ethers";

/**
 * Get contract instance with signer
 * @param {string} contractAddress - Contract address
 * @param {Array} abi - Contract ABI
 * @param {Object} provider - Ethers provider
 * @returns {Object} Contract instance
 */
export const getContractWithSigner = async (contractAddress, abi, provider) => {
  const signer = await provider.getSigner();
  return new ethers.Contract(contractAddress, abi, signer);
};

/**
 * Get contract instance for read-only operations
 * @param {string} contractAddress - Contract address
 * @param {Array} abi - Contract ABI
 * @param {Object} provider - Ethers provider
 * @returns {Object} Contract instance
 */
export const getContractReadOnly = (contractAddress, abi, provider) => {
  return new ethers.Contract(contractAddress, abi, provider);
};

/**
 * Wait for transaction confirmation with retry logic
 * @param {Object} transaction - Transaction object
 * @param {number} confirmations - Number of confirmations to wait for
 * @param {number} timeout - Timeout in milliseconds
 * @returns {Promise<Object>} Transaction receipt
 */
export const waitForTransaction = async (transaction, confirmations = 1, timeout = 300000) => {
  try {
    const receipt = await transaction.wait(confirmations, timeout);
    return receipt;
  } catch (error) {
    if (error.code === 'TIMEOUT') {
      throw new Error('Transaction confirmation timeout. Please check the blockchain explorer.');
    }
    throw error;
  }
};

/**
 * Estimate gas for a contract function call
 * @param {Object} contract - Contract instance
 * @param {string} functionName - Function name
 * @param {Array} args - Function arguments
 * @param {Object} overrides - Transaction overrides
 * @returns {Promise<BigInt>} Estimated gas
 */
export const estimateGas = async (contract, functionName, args = [], overrides = {}) => {
  try {
    return await contract[functionName].estimateGas(...args, overrides);
  } catch (error) {
    console.error(`Gas estimation failed for ${functionName}:`, error);
    throw new Error(`Failed to estimate gas: ${error.message}`);
  }
};

/**
 * Execute contract function with gas estimation and error handling
 * @param {Object} contract - Contract instance
 * @param {string} functionName - Function name
 * @param {Array} args - Function arguments
 * @param {Object} overrides - Transaction overrides
 * @returns {Promise<Object>} Transaction result
 */
export const executeContractFunction = async (contract, functionName, args = [], overrides = {}) => {
  try {
    // Estimate gas
    const estimatedGas = await estimateGas(contract, functionName, args, overrides);
    
    // Add 20% buffer to gas estimate
    const gasLimit = (estimatedGas * 120n) / 100n;
    
    // Execute transaction
    const tx = await contract[functionName](...args, { ...overrides, gasLimit });
    
    return {
      transaction: tx,
      hash: tx.hash,
      wait: () => waitForTransaction(tx)
    };
  } catch (error) {
    console.error(`Contract function execution failed for ${functionName}:`, error);
    
    // Parse common error messages
    if (error.message.includes('user rejected')) {
      throw new Error('Transaction was rejected by user');
    } else if (error.message.includes('insufficient funds')) {
      throw new Error('Insufficient funds for transaction');
    } else if (error.message.includes('execution reverted')) {
      // Try to extract revert reason
      const reason = error.message.match(/execution reverted: (.+)/)?.[1] || 'Transaction failed';
      throw new Error(reason);
    }
    
    throw new Error(`Transaction failed: ${error.message}`);
  }
};

/**
 * Parse event logs from transaction receipt
 * @param {Object} receipt - Transaction receipt
 * @param {Object} contract - Contract instance
 * @param {string} eventName - Event name to parse
 * @returns {Array} Parsed events
 */
export const parseEventLogs = (receipt, contract, eventName) => {
  try {
    const events = [];
    
    for (const log of receipt.logs) {
      try {
        const parsedLog = contract.interface.parseLog(log);
        if (parsedLog.name === eventName) {
          events.push({
            name: parsedLog.name,
            args: parsedLog.args,
            signature: parsedLog.signature,
            topic: parsedLog.topic
          });
        }
      } catch (error) {
        // Skip logs that can't be parsed by this contract
        continue;
      }
    }
    
    return events;
  } catch (error) {
    console.error(`Failed to parse event logs for ${eventName}:`, error);
    return [];
  }
};

/**
 * Get transaction status and details
 * @param {string} txHash - Transaction hash
 * @param {Object} provider - Ethers provider
 * @returns {Promise<Object>} Transaction status
 */
export const getTransactionStatus = async (txHash, provider) => {
  try {
    const tx = await provider.getTransaction(txHash);
    const receipt = await provider.getTransactionReceipt(txHash);
    
    if (!tx) {
      return { status: 'not_found', transaction: null, receipt: null };
    }
    
    if (!receipt) {
      return { status: 'pending', transaction: tx, receipt: null };
    }
    
    return {
      status: receipt.status === 1 ? 'success' : 'failed',
      transaction: tx,
      receipt: receipt,
      confirmations: await provider.getBlockNumber() - receipt.blockNumber
    };
  } catch (error) {
    console.error('Failed to get transaction status:', error);
    return { status: 'error', error: error.message };
  }
};

/**
 * Format contract error for user display
 * @param {Error} error - Contract error
 * @returns {string} User-friendly error message
 */
export const formatContractError = (error) => {
  if (error.message.includes('user rejected')) {
    return 'Transaction was cancelled by user';
  }
  
  if (error.message.includes('insufficient funds')) {
    return 'Insufficient funds to complete transaction';
  }
  
  if (error.message.includes('Seat is already taken')) {
    return 'This seat has already been taken. Please select another seat.';
  }
  
  if (error.message.includes('Insufficient ETH sent')) {
    return 'Insufficient payment amount for this ticket';
  }
  
  if (error.message.includes('Event has already started')) {
    return 'Cannot purchase tickets for events that have already started';
  }
  
  if (error.message.includes('Ticket not for sale')) {
    return 'This ticket is not currently available for purchase';
  }
  
  if (error.message.includes('Not ticket owner')) {
    return 'You do not own this ticket';
  }
  
  if (error.message.includes('Price exceeds maximum')) {
    return 'Resale price exceeds the maximum allowed price';
  }
  
  // Default error message
  return error.message || 'An unexpected error occurred';
};

/**
 * Check if address is a valid Ethereum address
 * @param {string} address - Address to validate
 * @returns {boolean} True if valid
 */
export const isValidEthereumAddress = (address) => {
  try {
    ethers.getAddress(address);
    return true;
  } catch {
    return false;
  }
};

/**
 * Convert Wei to Ether with formatting
 * @param {BigInt|string} wei - Wei amount
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted Ether amount
 */
export const formatEther = (wei, decimals = 4) => {
  try {
    const ether = ethers.formatEther(wei);
    return parseFloat(ether).toFixed(decimals);
  } catch {
    return '0.0000';
  }
};

/**
 * Convert Ether to Wei
 * @param {string|number} ether - Ether amount
 * @returns {BigInt} Wei amount
 */
export const parseEther = (ether) => {
  try {
    return ethers.parseEther(ether.toString());
  } catch (error) {
    throw new Error(`Invalid ether amount: ${ether}`);
  }
};

/**
 * Get current gas price
 * @param {Object} provider - Ethers provider
 * @returns {Promise<BigInt>} Current gas price
 */
export const getCurrentGasPrice = async (provider) => {
  try {
    const feeData = await provider.getFeeData();
    return feeData.gasPrice;
  } catch (error) {
    console.error('Failed to get gas price:', error);
    return ethers.parseUnits('20', 'gwei'); // Fallback gas price
  }
};

/**
 * Calculate transaction cost
 * @param {BigInt} gasLimit - Gas limit
 * @param {BigInt} gasPrice - Gas price
 * @returns {string} Transaction cost in ETH
 */
export const calculateTransactionCost = (gasLimit, gasPrice) => {
  try {
    const cost = gasLimit * gasPrice;
    return ethers.formatEther(cost);
  } catch {
    return '0';
  }
};
