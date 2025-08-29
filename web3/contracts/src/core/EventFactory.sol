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
    uint256 public platformFee = 250; // 2.5% in basis points
    uint256 public organizerRoyalty = 500; // 5% in basis points

    // Event storage
    struct EventData {
        uint256 eventId;
        address eventContract;
        address organizer;
        string title;
        uint256 eventDate;
        uint256 ticketPrice;
        uint256 maxTickets;
        bool isActive;
        uint256 createdAt;
    }

    mapping(uint256 => EventData) public events;
    mapping(address => uint256[]) public organizerEvents;
    mapping(address => bool) public isEventContract;
    
    uint256[] public allEventIds;

    // Events
    event EventCreated(
        uint256 indexed eventId,
        address indexed organizer,
        address indexed eventContract,
        string title,
        uint256 eventDate,
        uint256 ticketPrice,
        uint256 maxTickets
    );
    
    event EventDeactivated(uint256 indexed eventId, address indexed organizer);
    event PlatformFeeUpdated(uint256 oldFee, uint256 newFee);
    event OrganizerRoyaltyUpdated(uint256 oldRoyalty, uint256 newRoyalty);

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
        uint256 _eventDate,
        uint256 _ticketPrice,
        uint256 _maxTickets,
        uint256 _maxResalePrice
    ) external nonReentrant whenNotPaused returns (uint256 eventId, address eventContract) {
        require(bytes(_title).length > 0, "Title cannot be empty");
        require(_eventDate > block.timestamp, "Event date must be in future");
        require(_ticketPrice > 0, "Ticket price must be greater than 0");
        require(_maxTickets > 0 && _maxTickets <= 10000, "Invalid max tickets");
        require(_maxResalePrice >= _ticketPrice, "Max resale price too low");

        // Get new event ID
        eventId = _eventIdCounter;
        _eventIdCounter++;

        // Create event info struct
        EventTicket.EventInfo memory eventInfo = EventTicket.EventInfo({
            title: _title,
            description: _description,
            location: _location,
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

        // Store event data
        events[eventId] = EventData({
            eventId: eventId,
            eventContract: eventContract,
            organizer: msg.sender,
            title: _title,
            eventDate: _eventDate,
            ticketPrice: _ticketPrice,
            maxTickets: _maxTickets,
            isActive: true,
            createdAt: block.timestamp
        });

        // Update mappings
        organizerEvents[msg.sender].push(eventId);
        isEventContract[eventContract] = true;
        allEventIds.push(eventId);

        // Grant organizer role if not already granted
        if (!hasRole(ORGANIZER_ROLE, msg.sender)) {
            _grantRole(ORGANIZER_ROLE, msg.sender);
        }

        emit EventCreated(
            eventId,
            msg.sender,
            eventContract,
            _title,
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
     * @param _eventId The event ID
     */
    function getEvent(uint256 _eventId) external view returns (EventData memory) {
        require(_eventId < _eventIdCounter, "Event does not exist");
        return events[_eventId];
    }

    /**
     * @dev Get all events by an organizer
     * @param _organizer The organizer address
     */
    function getOrganizerEvents(address _organizer) external view returns (uint256[] memory) {
        return organizerEvents[_organizer];
    }

    /**
     * @dev Get all active events
     */
    function getActiveEvents() external view returns (EventData[] memory) {
        uint256 activeCount = 0;
        
        // Count active events
        for (uint256 i = 0; i < allEventIds.length; i++) {
            if (events[allEventIds[i]].isActive) {
                activeCount++;
            }
        }

        // Create array of active events
        EventData[] memory activeEvents = new EventData[](activeCount);
        uint256 index = 0;
        
        for (uint256 i = 0; i < allEventIds.length; i++) {
            uint256 eventId = allEventIds[i];
            if (events[eventId].isActive) {
                activeEvents[index] = events[eventId];
                index++;
            }
        }

        return activeEvents;
    }

    /**
     * @dev Get upcoming events (events that haven't started yet)
     */
    function getUpcomingEvents() external view returns (EventData[] memory) {
        uint256 upcomingCount = 0;
        
        // Count upcoming events
        for (uint256 i = 0; i < allEventIds.length; i++) {
            EventData memory eventData = events[allEventIds[i]];
            if (eventData.isActive && eventData.eventDate > block.timestamp) {
                upcomingCount++;
            }
        }

        // Create array of upcoming events
        EventData[] memory upcomingEvents = new EventData[](upcomingCount);
        uint256 index = 0;
        
        for (uint256 i = 0; i < allEventIds.length; i++) {
            uint256 eventId = allEventIds[i];
            EventData memory eventData = events[eventId];
            if (eventData.isActive && eventData.eventDate > block.timestamp) {
                upcomingEvents[index] = eventData;
                index++;
            }
        }

        return upcomingEvents;
    }

    /**
     * @dev Get total number of events created
     */
    function getTotalEvents() external view returns (uint256) {
        return _eventIdCounter;
    }

    /**
     * @dev Update platform fee (only admin)
     * @param _newFee New platform fee in basis points
     */
    function updatePlatformFee(uint256 _newFee) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_newFee <= 1000, "Fee cannot exceed 10%"); // Max 10%
        
        uint256 oldFee = platformFee;
        platformFee = _newFee;
        
        emit PlatformFeeUpdated(oldFee, _newFee);
    }

    /**
     * @dev Update organizer royalty (only admin)
     * @param _newRoyalty New organizer royalty in basis points
     */
    function updateOrganizerRoyalty(uint256 _newRoyalty) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_newRoyalty <= 1000, "Royalty cannot exceed 10%"); // Max 10%
        
        uint256 oldRoyalty = organizerRoyalty;
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
     * @dev Emergency pause function
     */
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    /**
     * @dev Unpause function
     */
    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    /**
     * @dev Check if an address is a valid event contract created by this factory
     * @param _contract The contract address to check
     */
    function isValidEventContract(address _contract) external view returns (bool) {
        return isEventContract[_contract];
    }
}
