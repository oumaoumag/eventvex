// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./EventTicket.sol";

/**
 * @title EventFactory
 * @dev Factory contract for creating and managing event ticket contracts
 * @notice This contract allows organizers to create events and manages the platform
 */
contract EventFactory is AccessControl, ReentrancyGuard, Pausable {
    // Roles
    bytes32 public constant ORGANIZER_ROLE = keccak256("ORGANIZER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    // Counter for event IDs
    uint256 private _eventIdCounter;

    // Platform configuration
    address public platformFeeRecipient;
    uint16 public platformFee = 250; // 2.5% in basis points
    uint16 public organizerRoyalty = 500; // 5% in basis points

    // Minimal event storage
    struct EventData {
        address eventContract;
        address organizer;
        bool isActive;
    }

    mapping(uint256 => EventData) public events;
    mapping(address => uint256[]) public organizerEvents;
    mapping(address => bool) public isEventContract;

    // Events
    event EventCreated(
        uint256 indexed eventId,
        address indexed organizer,
        address indexed eventContract,
        string title,
        string metadataURI,
        uint256 eventDate,
        uint256 ticketPrice,
        uint256 maxTickets
    );
    
    event EventDeactivated(uint256 indexed eventId, address indexed organizer);
    event PlatformFeeUpdated(uint16 oldFee, uint16 newFee);
    event OrganizerRoyaltyUpdated(uint16 oldRoyalty, uint16 newRoyalty);

    /**
     * @dev Constructor to initialize the factory
     * @param _platformFeeRecipient Address to receive platform fees
     */
    constructor(address _platformFeeRecipient) {
        require(_platformFeeRecipient != address(0), "Invalid fee recipient");
        
        platformFeeRecipient = _platformFeeRecipient;
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
    }

    /**
     * @dev Create a new event
     * @param _title Event title
     * @param _description Event description
     * @param _location Event location
     * @param _eventDate Event date (timestamp)
     * @param _ticketPrice Price per ticket in wei
     * @param _maxTickets Maximum number of tickets
     * @param _maxResalePrice Maximum resale price
     */
    function createEvent(
        string memory _title,
        string memory _description,
        string memory _location,
        string memory _metadataURI,
        uint256 _eventDate,
        uint256 _ticketPrice,
        uint256 _maxTickets,
        uint256 _maxResalePrice
    ) external nonReentrant whenNotPaused returns (uint256 eventId, address eventContract) {
        require(bytes(_title).length > 0 && _eventDate > block.timestamp && _ticketPrice > 0 && _maxTickets > 0 && _maxTickets <= 10000 && _maxResalePrice >= _ticketPrice, "Invalid parameters");

        // Get new event ID
        eventId = _eventIdCounter;
        _eventIdCounter++;

        // Create event info struct
        EventTicket.EventInfo memory eventInfo = EventTicket.EventInfo({
            title: _title,
            description: _description,
            location: _location,
            metadataURI: _metadataURI,
            eventDate: _eventDate,
            ticketPrice: _ticketPrice,
            maxTickets: _maxTickets,
            maxResalePrice: _maxResalePrice,
            organizer: msg.sender,
            isActive: true,
            isCancelled: false
        });

        // Deploy new EventTicket contract
        EventTicket newEventContract = new EventTicket(
            eventInfo,
            msg.sender,
            platformFeeRecipient
        );
        
        eventContract = address(newEventContract);

        // Store minimal event data
        events[eventId] = EventData({
            eventContract: eventContract,
            organizer: msg.sender,
            isActive: true
        });

        // Update mappings
        organizerEvents[msg.sender].push(eventId);
        isEventContract[eventContract] = true;

        emit EventCreated(
            eventId,
            msg.sender,
            eventContract,
            _title,
            _metadataURI,
            _eventDate,
            _ticketPrice,
            _maxTickets
        );

        return (eventId, eventContract);
    }

    /**
     * @dev Deactivate an event (only by organizer or admin)
     * @param _eventId The event ID to deactivate
     */
    function deactivateEvent(uint256 _eventId) external {
        require(_eventId < _eventIdCounter, "Event does not exist");
        
        EventData storage eventData = events[_eventId];
        require(eventData.isActive, "Event already deactivated");
        require(
            eventData.organizer == msg.sender || hasRole(DEFAULT_ADMIN_ROLE, msg.sender),
            "Not authorized"
        );

        eventData.isActive = false;

        emit EventDeactivated(_eventId, eventData.organizer);
    }

    /**
     * @dev Get event details by ID
     */
    function getEvent(uint256 _eventId) external view returns (EventData memory) {
        require(_eventId < _eventIdCounter, "Event does not exist");
        return events[_eventId];
    }

    /**
     * @dev Get all events by an organizer
     */
    function getOrganizerEvents(address _organizer) external view returns (uint256[] memory) {
        return organizerEvents[_organizer];
    }

    /**
     * @dev Get total number of events created
     */
    function getTotalEvents() external view returns (uint256) {
        return _eventIdCounter;
    }

    /**
     * @dev Update platform fee (only admin)
     */
    function updatePlatformFee(uint16 _newFee) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_newFee <= 1000, "Fee cannot exceed 10%");
        uint16 oldFee = platformFee;
        platformFee = _newFee;
        emit PlatformFeeUpdated(oldFee, _newFee);
    }

    /**
     * @dev Update organizer royalty (only admin)
     */
    function updateOrganizerRoyalty(uint16 _newRoyalty) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_newRoyalty <= 1000, "Royalty cannot exceed 10%");
        uint16 oldRoyalty = organizerRoyalty;
        organizerRoyalty = _newRoyalty;
        emit OrganizerRoyaltyUpdated(oldRoyalty, _newRoyalty);
    }

    /**
     * @dev Update platform fee recipient (only admin)
     * @param _newRecipient New fee recipient address
     */
    function updatePlatformFeeRecipient(address _newRecipient) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_newRecipient != address(0), "Invalid recipient address");
        platformFeeRecipient = _newRecipient;
    }

    /**
     * @dev Toggle pause state
     */
    function togglePause() external onlyRole(PAUSER_ROLE) {
        paused() ? _unpause() : _pause();
    }

    /**
     * @dev Check if an address is a valid event contract created by this factory
     * @param _contract The contract address to check
     */
    function isValidEventContract(address _contract) external view returns (bool) {
        return isEventContract[_contract];
    }
}
