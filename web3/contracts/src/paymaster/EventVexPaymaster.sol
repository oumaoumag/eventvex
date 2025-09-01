// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title EventVexPaymaster
 * @dev EIP-4337 compatible paymaster for gasless transactions
 * @notice Sponsors gas fees for EventVex users to enable mobile-friendly UX
 */
contract EventVexPaymaster is Ownable, ReentrancyGuard, Pausable {
    
    // Events
    event GasSponsored(address indexed user, uint256 gasUsed, uint256 gasCost);
    event FundsDeposited(address indexed depositor, uint256 amount);
    event FundsWithdrawn(address indexed recipient, uint256 amount);
    event SponsorshipLimitUpdated(uint256 newLimit);
    event UserLimitUpdated(uint256 newLimit);
    
    // Configuration
    uint256 public maxGasSponsorshipPerTx = 0.01 ether; // Max gas to sponsor per transaction
    uint256 public maxGasSponsorshipPerUser = 0.1 ether; // Max gas per user per day
    uint256 public dailyGasLimit = 1 ether; // Total daily gas sponsorship limit
    
    // Tracking
    mapping(address => uint256) public userGasUsedToday;
    mapping(address => uint256) public lastResetDay;
    uint256 public totalGasUsedToday;
    uint256 public lastGlobalResetDay;
    
    // Authorized contracts that can request gas sponsorship
    mapping(address => bool) public authorizedContracts;
    
    // EventVex contract addresses for validation
    address public eventFactoryAddress;
    mapping(address => bool) public eventTicketContracts;
    
    constructor(address _eventFactoryAddress) Ownable(msg.sender) {
        eventFactoryAddress = _eventFactoryAddress;
        lastGlobalResetDay = block.timestamp / 1 days;
    }
    
    /**
     * @dev Receive function to accept ETH deposits
     */
    receive() external payable {
        emit FundsDeposited(msg.sender, msg.value);
    }
    
    /**
     * @dev Deposit funds to sponsor gas fees
     */
    function depositFunds() external payable {
        require(msg.value > 0, "Must deposit some ETH");
        emit FundsDeposited(msg.sender, msg.value);
    }
    
    /**
     * @dev Withdraw funds (owner only)
     */
    function withdrawFunds(uint256 amount) external onlyOwner {
        require(amount <= address(this).balance, "Insufficient balance");
        payable(owner()).transfer(amount);
        emit FundsWithdrawn(owner(), amount);
    }
    
    /**
     * @dev Check if user is eligible for gas sponsorship
     */
    function isEligibleForSponsorship(
        address user,
        uint256 estimatedGas,
        uint256 gasPrice
    ) public view returns (bool) {
        if (paused()) return false;
        
        uint256 estimatedCost = estimatedGas * gasPrice;
        
        // Check transaction limit
        if (estimatedCost > maxGasSponsorshipPerTx) return false;
        
        // Check daily limits
        uint256 currentDay = block.timestamp / 1 days;
        
        // Check global daily limit
        uint256 globalUsedToday = (currentDay == lastGlobalResetDay) ? totalGasUsedToday : 0;
        if (globalUsedToday + estimatedCost > dailyGasLimit) return false;
        
        // Check user daily limit
        uint256 userUsedToday = (currentDay == lastResetDay[user]) ? userGasUsedToday[user] : 0;
        if (userUsedToday + estimatedCost > maxGasSponsorshipPerUser) return false;
        
        // Check contract balance
        if (address(this).balance < estimatedCost) return false;
        
        return true;
    }
    
    /**
     * @dev Sponsor gas for a transaction (called by authorized contracts)
     */
    function sponsorGas(
        address user,
        uint256 gasUsed,
        uint256 gasPrice
    ) external nonReentrant whenNotPaused returns (bool) {
        require(authorizedContracts[msg.sender] || 
                msg.sender == eventFactoryAddress || 
                eventTicketContracts[msg.sender], 
                "Unauthorized contract");
        
        uint256 gasCost = gasUsed * gasPrice;
        
        // Validate sponsorship eligibility
        require(isEligibleForSponsorship(user, gasUsed, gasPrice), "Not eligible for sponsorship");
        
        // Update tracking
        uint256 currentDay = block.timestamp / 1 days;
        
        // Reset global counter if new day
        if (currentDay != lastGlobalResetDay) {
            totalGasUsedToday = 0;
            lastGlobalResetDay = currentDay;
        }
        
        // Reset user counter if new day
        if (currentDay != lastResetDay[user]) {
            userGasUsedToday[user] = 0;
            lastResetDay[user] = currentDay;
        }
        
        // Update counters
        totalGasUsedToday += gasCost;
        userGasUsedToday[user] += gasCost;
        
        // Transfer gas cost to the caller (who paid for gas)
        payable(msg.sender).transfer(gasCost);
        
        emit GasSponsored(user, gasUsed, gasCost);
        return true;
    }
    
    /**
     * @dev Add authorized contract
     */
    function addAuthorizedContract(address contractAddress) external onlyOwner {
        authorizedContracts[contractAddress] = true;
    }
    
    /**
     * @dev Remove authorized contract
     */
    function removeAuthorizedContract(address contractAddress) external onlyOwner {
        authorizedContracts[contractAddress] = false;
    }
    
    /**
     * @dev Add event ticket contract
     */
    function addEventTicketContract(address contractAddress) external {
        require(msg.sender == eventFactoryAddress, "Only factory can add ticket contracts");
        eventTicketContracts[contractAddress] = true;
    }
    
    /**
     * @dev Update sponsorship limits
     */
    function updateSponsorshipLimits(
        uint256 _maxPerTx,
        uint256 _maxPerUser,
        uint256 _dailyLimit
    ) external onlyOwner {
        maxGasSponsorshipPerTx = _maxPerTx;
        maxGasSponsorshipPerUser = _maxPerUser;
        dailyGasLimit = _dailyLimit;
        
        emit SponsorshipLimitUpdated(_maxPerTx);
        emit UserLimitUpdated(_maxPerUser);
    }
    
    /**
     * @dev Pause sponsorship (emergency)
     */
    function pauseSponsorship() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Resume sponsorship
     */
    function resumeSponsorship() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Get contract balance
     */
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }
    
    /**
     * @dev Get user's remaining daily sponsorship
     */
    function getUserRemainingSponsorship(address user) external view returns (uint256) {
        uint256 currentDay = block.timestamp / 1 days;
        uint256 userUsedToday = (currentDay == lastResetDay[user]) ? userGasUsedToday[user] : 0;
        
        if (userUsedToday >= maxGasSponsorshipPerUser) {
            return 0;
        }
        
        return maxGasSponsorshipPerUser - userUsedToday;
    }
    
    /**
     * @dev Get global remaining daily sponsorship
     */
    function getGlobalRemainingSponsorship() external view returns (uint256) {
        uint256 currentDay = block.timestamp / 1 days;
        uint256 globalUsedToday = (currentDay == lastGlobalResetDay) ? totalGasUsedToday : 0;
        
        if (globalUsedToday >= dailyGasLimit) {
            return 0;
        }
        
        return dailyGasLimit - globalUsedToday;
    }
}
