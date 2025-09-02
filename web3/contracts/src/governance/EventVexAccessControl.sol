// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title EventVexAccessControl
 * @dev Centralized access control system for EventVex platform
 * @notice Manages roles and permissions across all EventVex contracts
 */
contract EventVexAccessControl is AccessControl, ReentrancyGuard, Pausable {
    
    // Platform Roles
    bytes32 public constant PLATFORM_ADMIN_ROLE = keccak256("PLATFORM_ADMIN_ROLE");
    bytes32 public constant ORGANIZER_ROLE = keccak256("ORGANIZER_ROLE");
    bytes32 public constant VERIFIED_ORGANIZER_ROLE = keccak256("VERIFIED_ORGANIZER_ROLE");
    bytes32 public constant MODERATOR_ROLE = keccak256("MODERATOR_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant FEE_MANAGER_ROLE = keccak256("FEE_MANAGER_ROLE");
    bytes32 public constant CONTRACT_MANAGER_ROLE = keccak256("CONTRACT_MANAGER_ROLE");
    
    // User status tracking
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
        string verificationLevel; // "basic", "premium", "enterprise"
    }
    
    // Storage
    mapping(address => UserProfile) public userProfiles;
    mapping(address => mapping(bytes32 => uint256)) public roleGrantedAt;
    mapping(address => bool) public authorizedContracts;
    mapping(address => string) public organizerMetadata; // IPFS hash for organizer info
    
    // Events
    event UserRegistered(address indexed user, uint256 timestamp);
    event UserStatusChanged(address indexed user, UserStatus oldStatus, UserStatus newStatus);
    event OrganizerVerified(address indexed organizer, string verificationLevel);
    event ContractAuthorized(address indexed contractAddress, bool authorized);
    event RoleGrantedWithExpiry(bytes32 indexed role, address indexed account, uint256 expiryTime);
    
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PLATFORM_ADMIN_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
        
        // Set up role hierarchy
        _setRoleAdmin(ORGANIZER_ROLE, PLATFORM_ADMIN_ROLE);
        _setRoleAdmin(VERIFIED_ORGANIZER_ROLE, PLATFORM_ADMIN_ROLE);
        _setRoleAdmin(MODERATOR_ROLE, PLATFORM_ADMIN_ROLE);
        _setRoleAdmin(FEE_MANAGER_ROLE, PLATFORM_ADMIN_ROLE);
        _setRoleAdmin(CONTRACT_MANAGER_ROLE, PLATFORM_ADMIN_ROLE);
    }
    
    /**
     * @dev Register a new user
     */
    function registerUser() external {
        require(userProfiles[msg.sender].createdAt == 0, "User already registered");
        
        userProfiles[msg.sender] = UserProfile({
            status: UserStatus.ACTIVE,
            createdAt: block.timestamp,
            lastActivity: block.timestamp,
            eventsCreated: 0,
            ticketsPurchased: 0,
            isVerified: false,
            verificationLevel: "basic"
        });
        
        emit UserRegistered(msg.sender, block.timestamp);
    }
    
    /**
     * @dev Update user activity (called by authorized contracts)
     */
    function updateUserActivity(address user) external {
        require(authorizedContracts[msg.sender], "Unauthorized contract");
        require(userProfiles[user].createdAt != 0, "User not registered");
        
        userProfiles[user].lastActivity = block.timestamp;
    }
    
    /**
     * @dev Increment user event count
     */
    function incrementUserEvents(address user) external {
        require(authorizedContracts[msg.sender], "Unauthorized contract");
        require(userProfiles[user].createdAt != 0, "User not registered");
        
        userProfiles[user].eventsCreated++;
        userProfiles[user].lastActivity = block.timestamp;
    }
    
    /**
     * @dev Increment user ticket purchases
     */
    function incrementUserTickets(address user) external {
        require(authorizedContracts[msg.sender], "Unauthorized contract");
        require(userProfiles[user].createdAt != 0, "User not registered");
        
        userProfiles[user].ticketsPurchased++;
        userProfiles[user].lastActivity = block.timestamp;
    }
    
    /**
     * @dev Grant organizer role with automatic registration
     */
    function grantOrganizerRole(address organizer, string calldata metadata) external onlyRole(PLATFORM_ADMIN_ROLE) {
        // Auto-register if not already registered
        if (userProfiles[organizer].createdAt == 0) {
            userProfiles[organizer] = UserProfile({
                status: UserStatus.ACTIVE,
                createdAt: block.timestamp,
                lastActivity: block.timestamp,
                eventsCreated: 0,
                ticketsPurchased: 0,
                isVerified: false,
                verificationLevel: "basic"
            });
        }
        
        _grantRole(ORGANIZER_ROLE, organizer);
        roleGrantedAt[organizer][ORGANIZER_ROLE] = block.timestamp;
        organizerMetadata[organizer] = metadata;
    }
    
    /**
     * @dev Verify organizer and upgrade to verified status
     */
    function verifyOrganizer(
        address organizer, 
        string calldata verificationLevel
    ) external onlyRole(PLATFORM_ADMIN_ROLE) {
        require(hasRole(ORGANIZER_ROLE, organizer), "Not an organizer");
        
        userProfiles[organizer].isVerified = true;
        userProfiles[organizer].verificationLevel = verificationLevel;
        
        _grantRole(VERIFIED_ORGANIZER_ROLE, organizer);
        roleGrantedAt[organizer][VERIFIED_ORGANIZER_ROLE] = block.timestamp;
        
        emit OrganizerVerified(organizer, verificationLevel);
    }
    
    /**
     * @dev Change user status
     */
    function changeUserStatus(
        address user, 
        UserStatus newStatus
    ) external onlyRole(MODERATOR_ROLE) {
        require(userProfiles[user].createdAt != 0, "User not registered");
        
        UserStatus oldStatus = userProfiles[user].status;
        userProfiles[user].status = newStatus;
        
        emit UserStatusChanged(user, oldStatus, newStatus);
    }
    
    /**
     * @dev Authorize contract to interact with access control
     */
    function authorizeContract(
        address contractAddress, 
        bool authorized
    ) external onlyRole(CONTRACT_MANAGER_ROLE) {
        authorizedContracts[contractAddress] = authorized;
        emit ContractAuthorized(contractAddress, authorized);
    }
    
    /**
     * @dev Check if user can create events
     */
    function canCreateEvents(address user) external view returns (bool) {
        UserProfile memory profile = userProfiles[user];
        
        // Must be registered and active
        if (profile.createdAt == 0 || profile.status != UserStatus.ACTIVE) {
            return false;
        }
        
        // Must have organizer role
        return hasRole(ORGANIZER_ROLE, user);
    }
    
    /**
     * @dev Check if user can purchase tickets
     */
    function canPurchaseTickets(address user) external view returns (bool) {
        UserProfile memory profile = userProfiles[user];
        
        // Must be registered and active
        if (profile.createdAt == 0) {
            return false;
        }
        
        return profile.status == UserStatus.ACTIVE;
    }
    
    /**
     * @dev Check if user can list tickets for resale
     */
    function canResaleTickets(address user) external view returns (bool) {
        UserProfile memory profile = userProfiles[user];
        
        // Must be registered and active
        if (profile.createdAt == 0 || profile.status != UserStatus.ACTIVE) {
            return false;
        }
        
        // Additional checks can be added here (e.g., minimum activity)
        return true;
    }
    
    /**
     * @dev Get user verification level
     */
    function getUserVerificationLevel(address user) external view returns (string memory) {
        return userProfiles[user].verificationLevel;
    }
    
    /**
     * @dev Check if user is verified organizer
     */
    function isVerifiedOrganizer(address user) external view returns (bool) {
        return hasRole(VERIFIED_ORGANIZER_ROLE, user) && userProfiles[user].isVerified;
    }
    
    /**
     * @dev Get user statistics
     */
    function getUserStats(address user) external view returns (
        uint256 eventsCreated,
        uint256 ticketsPurchased,
        uint256 accountAge,
        uint256 lastActivity
    ) {
        UserProfile memory profile = userProfiles[user];
        return (
            profile.eventsCreated,
            profile.ticketsPurchased,
            profile.createdAt > 0 ? block.timestamp - profile.createdAt : 0,
            profile.lastActivity
        );
    }
    
    /**
     * @dev Batch grant roles
     */
    function batchGrantRole(
        bytes32 role, 
        address[] calldata accounts
    ) external onlyRole(getRoleAdmin(role)) {
        for (uint256 i = 0; i < accounts.length; i++) {
            _grantRole(role, accounts[i]);
            roleGrantedAt[accounts[i]][role] = block.timestamp;
        }
    }
    
    /**
     * @dev Batch revoke roles
     */
    function batchRevokeRole(
        bytes32 role, 
        address[] calldata accounts
    ) external onlyRole(getRoleAdmin(role)) {
        for (uint256 i = 0; i < accounts.length; i++) {
            _revokeRole(role, accounts[i]);
        }
    }
    
    /**
     * @dev Emergency pause (stops all role-based operations)
     */
    function emergencyPause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }
    
    /**
     * @dev Resume operations
     */
    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }
    
    /**
     * @dev Override to add pause functionality
     */
    function hasRole(bytes32 role, address account) public view override returns (bool) {
        if (paused() && role != PAUSER_ROLE && role != DEFAULT_ADMIN_ROLE) {
            return false;
        }
        return super.hasRole(role, account);
    }
    
    /**
     * @dev Get role granted timestamp
     */
    function getRoleGrantedAt(address account, bytes32 role) external view returns (uint256) {
        return roleGrantedAt[account][role];
    }
    
    /**
     * @dev Check if contract is authorized
     */
    function isAuthorizedContract(address contractAddress) external view returns (bool) {
        return authorizedContracts[contractAddress];
    }
}
