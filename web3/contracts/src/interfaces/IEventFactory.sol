// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IEventFactory
 * @dev Interface for the EventFactory contract
 */
interface IEventFactory {
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

    function createEvent(
        string memory _title,
        string memory _description,
        string memory _location,
        uint256 _eventDate,
        uint256 _ticketPrice,
        uint256 _maxTickets,
        uint256 _maxResalePrice
    ) external returns (uint256 eventId, address eventContract);

    function deactivateEvent(uint256 _eventId) external;
    
    function getEvent(uint256 _eventId) external view returns (EventData memory);
    
    function getOrganizerEvents(address _organizer) external view returns (uint256[] memory);
    
    function getActiveEvents() external view returns (EventData[] memory);
    
    function getUpcomingEvents() external view returns (EventData[] memory);
    
    function getTotalEvents() external view returns (uint256);
    
    function isValidEventContract(address _contract) external view returns (bool);
}
