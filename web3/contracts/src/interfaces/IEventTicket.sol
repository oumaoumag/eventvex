// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

/**
 * @title IEventTicket
 * @dev Interface for the EventTicket contract
 */
interface IEventTicket is IERC721 {
    struct EventInfo {
        string title;
        string description;
        string location;
        uint256 eventDate;
        uint256 ticketPrice;
        uint256 maxTickets;
        uint256 maxResalePrice;
        address organizer;
        bool isActive;
        bool isCancelled;
    }

    struct TicketInfo {
        uint256 seatNumber;
        uint256 purchasePrice;
        uint256 purchaseTime;
        bool isUsed;
        bool isForResale;
        uint256 resalePrice;
        address originalOwner;
    }

    event TicketMinted(uint256 indexed tokenId, address indexed buyer, uint256 seatNumber, uint256 price);
    event TicketListedForResale(uint256 indexed tokenId, uint256 price);
    event TicketSold(uint256 indexed tokenId, address indexed from, address indexed to, uint256 price);
    event TicketUnlisted(uint256 indexed tokenId);
    event TicketUsed(uint256 indexed tokenId, address indexed attendee);
    event EventCancelled();
    event RefundIssued(uint256 indexed tokenId, address indexed recipient, uint256 amount);

    function mintTicket(uint256 _seatNumber) external payable;
    
    function listForResale(uint256 _tokenId, uint256 _price) external;
    
    function unlistFromResale(uint256 _tokenId) external;
    
    function buyResaleTicket(uint256 _tokenId) external payable;
    
    function useTicket(uint256 _tokenId) external;
    
    function cancelEvent() external;
    
    function requestRefund(uint256 _tokenId) external;
    
    function getTicketInfo(uint256 _tokenId) external view returns (TicketInfo memory);
    
    function getAvailableSeats() external view returns (uint256[] memory);
    
    function eventInfo() external view returns (EventInfo memory);
}
