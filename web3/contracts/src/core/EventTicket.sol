// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title EventTicket
 * @dev Enhanced ERC721 contract for event tickets with resale marketplace
 * @notice This contract represents tickets for a single event as NFTs
 */
contract EventTicket is ERC721, AccessControl, ReentrancyGuard, Pausable {
    // Roles
    bytes32 public constant ORGANIZER_ROLE = keccak256("ORGANIZER_ROLE");
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    // Token ID counter
    uint256 private _tokenIdCounter;

    // Event information
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

    // Ticket information
    struct TicketInfo {
        uint256 seatNumber;
        uint256 purchasePrice;
        uint256 purchaseTime;
        bool isUsed;
        bool isForResale;
        uint256 resalePrice;
        address originalOwner;
    }

    // State variables
    EventInfo public eventInfo;
    mapping(uint256 => TicketInfo) public tickets;
    mapping(uint256 => address) public seatTaken;
    mapping(address => bool) public hasAttended;
    
    // Platform fee (in basis points, e.g., 250 = 2.5%)
    uint256 public platformFee = 250;
    address public platformFeeRecipient;
    
    // Organizer royalty for resales (in basis points)
    uint256 public organizerRoyalty = 500;

    // Events
    event TicketMinted(uint256 indexed tokenId, address indexed buyer, uint256 seatNumber, uint256 price);
    event TicketListedForResale(uint256 indexed tokenId, uint256 price);
    event TicketSold(uint256 indexed tokenId, address indexed from, address indexed to, uint256 price);
    event TicketUnlisted(uint256 indexed tokenId);
    event TicketUsed(uint256 indexed tokenId, address indexed attendee);
    event EventCancelled();
    event RefundIssued(uint256 indexed tokenId, address indexed recipient, uint256 amount);

    /**
     * @dev Constructor to initialize the event ticket contract
     * @param _eventInfo Event details
     * @param _organizer Address of the event organizer
     * @param _platformFeeRecipient Address to receive platform fees
     */
    constructor(
        EventInfo memory _eventInfo,
        address _organizer,
        address _platformFeeRecipient
    ) ERC721(_eventInfo.title, "EVTX") {
        eventInfo = _eventInfo;
        eventInfo.organizer = _organizer;
        eventInfo.isActive = true;
        platformFeeRecipient = _platformFeeRecipient;

        // Grant roles
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ORGANIZER_ROLE, _organizer);
        _grantRole(PAUSER_ROLE, msg.sender);
    }

    /**
     * @dev Mint a new ticket for a specific seat
     * @param _seatNumber The seat number to assign
     */
    function mintTicket(uint256 _seatNumber) external payable nonReentrant whenNotPaused {
        require(eventInfo.isActive, "Event is not active");
        require(!eventInfo.isCancelled, "Event is cancelled");
        require(_seatNumber < eventInfo.maxTickets, "Invalid seat number");
        require(seatTaken[_seatNumber] == address(0), "Seat already taken");
        require(msg.value >= eventInfo.ticketPrice, "Insufficient payment");
        require(block.timestamp < eventInfo.eventDate, "Event has already started");

        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;

        // Create ticket info
        tickets[tokenId] = TicketInfo({
            seatNumber: _seatNumber,
            purchasePrice: eventInfo.ticketPrice,
            purchaseTime: block.timestamp,
            isUsed: false,
            isForResale: false,
            resalePrice: 0,
            originalOwner: msg.sender
        });

        // Mark seat as taken
        seatTaken[_seatNumber] = msg.sender;

        // Mint the NFT
        _safeMint(msg.sender, tokenId);

        // Handle payment distribution
        _distributePayment(eventInfo.ticketPrice);

        emit TicketMinted(tokenId, msg.sender, _seatNumber, eventInfo.ticketPrice);
    }

    /**
     * @dev List a ticket for resale
     * @param _tokenId The token ID to list
     * @param _price The resale price
     */
    function listForResale(uint256 _tokenId, uint256 _price) external {
        require(ownerOf(_tokenId) == msg.sender, "Not ticket owner");
        require(!tickets[_tokenId].isForResale, "Already listed");
        require(!tickets[_tokenId].isUsed, "Ticket already used");
        require(_price <= eventInfo.maxResalePrice, "Price exceeds maximum");
        require(block.timestamp < eventInfo.eventDate, "Event has started");

        tickets[_tokenId].isForResale = true;
        tickets[_tokenId].resalePrice = _price;

        emit TicketListedForResale(_tokenId, _price);
    }

    /**
     * @dev Remove ticket from resale
     * @param _tokenId The token ID to unlist
     */
    function unlistFromResale(uint256 _tokenId) external {
        require(ownerOf(_tokenId) == msg.sender, "Not ticket owner");
        require(tickets[_tokenId].isForResale, "Not listed for resale");

        tickets[_tokenId].isForResale = false;
        tickets[_tokenId].resalePrice = 0;

        emit TicketUnlisted(_tokenId);
    }

    /**
     * @dev Purchase a ticket from resale market
     * @param _tokenId The token ID to purchase
     */
    function buyResaleTicket(uint256 _tokenId) external payable nonReentrant whenNotPaused {
        require(tickets[_tokenId].isForResale, "Ticket not for sale");
        require(msg.value >= tickets[_tokenId].resalePrice, "Insufficient payment");
        require(block.timestamp < eventInfo.eventDate, "Event has started");

        address seller = ownerOf(_tokenId);
        require(msg.sender != seller, "Cannot buy own ticket");

        uint256 resalePrice = tickets[_tokenId].resalePrice;
        
        // Update ticket info
        tickets[_tokenId].isForResale = false;
        tickets[_tokenId].resalePrice = 0;

        // Update seat ownership
        seatTaken[tickets[_tokenId].seatNumber] = msg.sender;

        // Transfer the NFT
        _transfer(seller, msg.sender, _tokenId);

        // Handle resale payment distribution
        _distributeResalePayment(resalePrice, seller);

        emit TicketSold(_tokenId, seller, msg.sender, resalePrice);
    }

    /**
     * @dev Mark ticket as used (for event entry)
     * @param _tokenId The token ID to mark as used
     */
    function useTicket(uint256 _tokenId) external onlyRole(VERIFIER_ROLE) {
        require(_ownerOf(_tokenId) != address(0), "Ticket does not exist");
        require(!tickets[_tokenId].isUsed, "Ticket already used");
        require(block.timestamp >= eventInfo.eventDate, "Event has not started");

        address ticketOwner = ownerOf(_tokenId);
        tickets[_tokenId].isUsed = true;
        hasAttended[ticketOwner] = true;

        emit TicketUsed(_tokenId, ticketOwner);
    }

    /**
     * @dev Cancel the event and enable refunds
     */
    function cancelEvent() external onlyRole(ORGANIZER_ROLE) {
        require(!eventInfo.isCancelled, "Event already cancelled");
        require(block.timestamp < eventInfo.eventDate, "Cannot cancel after event start");

        eventInfo.isCancelled = true;
        eventInfo.isActive = false;

        emit EventCancelled();
    }

    /**
     * @dev Request refund for cancelled event
     * @param _tokenId The token ID to refund
     */
    function requestRefund(uint256 _tokenId) external nonReentrant {
        require(eventInfo.isCancelled, "Event not cancelled");
        require(ownerOf(_tokenId) == msg.sender, "Not ticket owner");
        require(!tickets[_tokenId].isUsed, "Ticket already used");

        uint256 refundAmount = tickets[_tokenId].purchasePrice;
        
        // Mark ticket as used to prevent double refunds
        tickets[_tokenId].isUsed = true;

        // Transfer refund
        (bool success, ) = payable(msg.sender).call{value: refundAmount}("");
        require(success, "Refund transfer failed");

        emit RefundIssued(_tokenId, msg.sender, refundAmount);
    }

    /**
     * @dev Distribute payment between platform and organizer
     * @param _amount The total payment amount
     */
    function _distributePayment(uint256 _amount) private {
        uint256 platformFeeAmount = (_amount * platformFee) / 10000;
        uint256 organizerAmount = _amount - platformFeeAmount;

        if (platformFeeAmount > 0) {
            (bool platformSuccess, ) = payable(platformFeeRecipient).call{value: platformFeeAmount}("");
            require(platformSuccess, "Platform fee transfer failed");
        }

        (bool organizerSuccess, ) = payable(eventInfo.organizer).call{value: organizerAmount}("");
        require(organizerSuccess, "Organizer payment transfer failed");
    }

    /**
     * @dev Distribute resale payment with royalties
     * @param _amount The resale amount
     * @param _seller The seller address
     */
    function _distributeResalePayment(uint256 _amount, address _seller) private {
        uint256 platformFeeAmount = (_amount * platformFee) / 10000;
        uint256 royaltyAmount = (_amount * organizerRoyalty) / 10000;
        uint256 sellerAmount = _amount - platformFeeAmount - royaltyAmount;

        // Platform fee
        if (platformFeeAmount > 0) {
            (bool platformSuccess, ) = payable(platformFeeRecipient).call{value: platformFeeAmount}("");
            require(platformSuccess, "Platform fee transfer failed");
        }

        // Organizer royalty
        if (royaltyAmount > 0) {
            (bool royaltySuccess, ) = payable(eventInfo.organizer).call{value: royaltyAmount}("");
            require(royaltySuccess, "Royalty transfer failed");
        }

        // Seller payment
        (bool sellerSuccess, ) = payable(_seller).call{value: sellerAmount}("");
        require(sellerSuccess, "Seller payment transfer failed");
    }

    /**
     * @dev Get ticket information
     * @param _tokenId The token ID
     */
    function getTicketInfo(uint256 _tokenId) external view returns (TicketInfo memory) {
        require(_ownerOf(_tokenId) != address(0), "Ticket does not exist");
        return tickets[_tokenId];
    }

    /**
     * @dev Get available seats
     */
    function getAvailableSeats() external view returns (uint256[] memory) {
        uint256[] memory available = new uint256[](eventInfo.maxTickets);
        uint256 count = 0;

        for (uint256 i = 0; i < eventInfo.maxTickets; i++) {
            if (seatTaken[i] == address(0)) {
                available[count] = i;
                count++;
            }
        }

        // Resize array to actual count
        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = available[i];
        }

        return result;
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
     * @dev See {IERC165-supportsInterface}
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
