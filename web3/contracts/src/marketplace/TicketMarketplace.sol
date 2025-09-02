// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";

/**
 * @title TicketMarketplace
 * @dev Centralized marketplace for EventVex ticket resales
 * @notice Extends the built-in resale functionality with advanced marketplace features
 */
contract TicketMarketplace is AccessControl, ReentrancyGuard, Pausable, IERC721Receiver {
    
    // Roles
    bytes32 public constant MARKETPLACE_ADMIN_ROLE = keccak256("MARKETPLACE_ADMIN_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    
    // Marketplace configuration
    uint256 public marketplaceFee = 250; // 2.5% in basis points
    address public feeRecipient;
    address public eventFactoryAddress;
    
    // Listing structure
    struct Listing {
        bytes32 listingId;
        address seller;
        address ticketContract;
        uint256 tokenId;
        uint256 price;
        uint256 listingTime;
        uint256 expirationTime;
        bool isActive;
        bool isAuction;
        uint256 minBid;
        uint256 highestBid;
        address highestBidder;
    }
    
    // Storage
    mapping(bytes32 => Listing) public listings;
    mapping(address => bytes32[]) public userListings;
    mapping(address => bytes32[]) public userBids;
    mapping(address => mapping(address => bool)) public approvedContracts;
    
    bytes32[] public allListings;
    bytes32[] public activeListings;
    
    // Events
    event TicketListed(
        bytes32 indexed listingId,
        address indexed seller,
        address indexed ticketContract,
        uint256 tokenId,
        uint256 price,
        bool isAuction
    );
    
    event TicketSold(
        bytes32 indexed listingId,
        address indexed buyer,
        address indexed seller,
        uint256 price
    );
    
    event ListingCancelled(bytes32 indexed listingId, address indexed seller);
    event BidPlaced(bytes32 indexed listingId, address indexed bidder, uint256 amount);
    event AuctionEnded(bytes32 indexed listingId, address indexed winner, uint256 amount);
    
    constructor(address _feeRecipient, address _eventFactoryAddress) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MARKETPLACE_ADMIN_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
        
        feeRecipient = _feeRecipient;
        eventFactoryAddress = _eventFactoryAddress;
    }
    
    /**
     * @dev List a ticket for sale (fixed price)
     */
    function listTicket(
        address ticketContract,
        uint256 tokenId,
        uint256 price,
        uint256 duration
    ) external nonReentrant whenNotPaused returns (bytes32) {
        require(price > 0, "Price must be greater than 0");
        require(duration > 0, "Duration must be greater than 0");
        require(approvedContracts[msg.sender][ticketContract] || 
                IERC721(ticketContract).isApprovedForAll(msg.sender, address(this)), 
                "Marketplace not approved");
        require(IERC721(ticketContract).ownerOf(tokenId) == msg.sender, "Not token owner");
        
        bytes32 listingId = keccak256(abi.encodePacked(
            ticketContract,
            tokenId,
            msg.sender,
            block.timestamp
        ));
        
        // Transfer ticket to marketplace for escrow
        IERC721(ticketContract).safeTransferFrom(msg.sender, address(this), tokenId);
        
        Listing memory newListing = Listing({
            listingId: listingId,
            seller: msg.sender,
            ticketContract: ticketContract,
            tokenId: tokenId,
            price: price,
            listingTime: block.timestamp,
            expirationTime: block.timestamp + duration,
            isActive: true,
            isAuction: false,
            minBid: 0,
            highestBid: 0,
            highestBidder: address(0)
        });
        
        listings[listingId] = newListing;
        userListings[msg.sender].push(listingId);
        allListings.push(listingId);
        activeListings.push(listingId);
        
        emit TicketListed(listingId, msg.sender, ticketContract, tokenId, price, false);
        return listingId;
    }
    
    /**
     * @dev List a ticket for auction
     */
    function listTicketForAuction(
        address ticketContract,
        uint256 tokenId,
        uint256 minBid,
        uint256 duration
    ) external nonReentrant whenNotPaused returns (bytes32) {
        require(minBid > 0, "Minimum bid must be greater than 0");
        require(duration > 0, "Duration must be greater than 0");
        require(approvedContracts[msg.sender][ticketContract] || 
                IERC721(ticketContract).isApprovedForAll(msg.sender, address(this)), 
                "Marketplace not approved");
        require(IERC721(ticketContract).ownerOf(tokenId) == msg.sender, "Not token owner");
        
        bytes32 listingId = keccak256(abi.encodePacked(
            ticketContract,
            tokenId,
            msg.sender,
            block.timestamp,
            "auction"
        ));
        
        // Transfer ticket to marketplace for escrow
        IERC721(ticketContract).safeTransferFrom(msg.sender, address(this), tokenId);
        
        Listing memory newListing = Listing({
            listingId: listingId,
            seller: msg.sender,
            ticketContract: ticketContract,
            tokenId: tokenId,
            price: 0,
            listingTime: block.timestamp,
            expirationTime: block.timestamp + duration,
            isActive: true,
            isAuction: true,
            minBid: minBid,
            highestBid: 0,
            highestBidder: address(0)
        });
        
        listings[listingId] = newListing;
        userListings[msg.sender].push(listingId);
        allListings.push(listingId);
        activeListings.push(listingId);
        
        emit TicketListed(listingId, msg.sender, ticketContract, tokenId, minBid, true);
        return listingId;
    }
    
    /**
     * @dev Buy a ticket (fixed price listing)
     */
    function buyTicket(bytes32 listingId) external payable nonReentrant whenNotPaused {
        Listing storage listing = listings[listingId];
        require(listing.isActive, "Listing not active");
        require(!listing.isAuction, "Use placeBid for auctions");
        require(block.timestamp <= listing.expirationTime, "Listing expired");
        require(msg.value >= listing.price, "Insufficient payment");
        require(msg.sender != listing.seller, "Cannot buy own listing");
        
        // Calculate fees
        uint256 marketplaceFeeAmount = (listing.price * marketplaceFee) / 10000;
        uint256 sellerAmount = listing.price - marketplaceFeeAmount;
        
        // Mark listing as inactive
        listing.isActive = false;
        _removeFromActiveListings(listingId);
        
        // Transfer ticket to buyer
        IERC721(listing.ticketContract).safeTransferFrom(
            address(this),
            msg.sender,
            listing.tokenId
        );
        
        // Transfer payments
        payable(listing.seller).transfer(sellerAmount);
        payable(feeRecipient).transfer(marketplaceFeeAmount);
        
        // Refund excess payment
        if (msg.value > listing.price) {
            payable(msg.sender).transfer(msg.value - listing.price);
        }
        
        emit TicketSold(listingId, msg.sender, listing.seller, listing.price);
    }
    
    /**
     * @dev Place bid on auction
     */
    function placeBid(bytes32 listingId) external payable nonReentrant whenNotPaused {
        Listing storage listing = listings[listingId];
        require(listing.isActive, "Listing not active");
        require(listing.isAuction, "Not an auction");
        require(block.timestamp <= listing.expirationTime, "Auction expired");
        require(msg.sender != listing.seller, "Cannot bid on own auction");
        require(msg.value >= listing.minBid, "Bid below minimum");
        require(msg.value > listing.highestBid, "Bid too low");
        
        // Refund previous highest bidder
        if (listing.highestBidder != address(0)) {
            payable(listing.highestBidder).transfer(listing.highestBid);
        }
        
        // Update highest bid
        listing.highestBid = msg.value;
        listing.highestBidder = msg.sender;
        
        userBids[msg.sender].push(listingId);
        
        emit BidPlaced(listingId, msg.sender, msg.value);
    }
    
    /**
     * @dev End auction and transfer ticket to highest bidder
     */
    function endAuction(bytes32 listingId) external nonReentrant {
        Listing storage listing = listings[listingId];
        require(listing.isActive, "Listing not active");
        require(listing.isAuction, "Not an auction");
        require(block.timestamp > listing.expirationTime, "Auction still active");
        require(msg.sender == listing.seller || msg.sender == listing.highestBidder, "Unauthorized");
        
        listing.isActive = false;
        _removeFromActiveListings(listingId);
        
        if (listing.highestBidder != address(0)) {
            // Calculate fees
            uint256 marketplaceFeeAmount = (listing.highestBid * marketplaceFee) / 10000;
            uint256 sellerAmount = listing.highestBid - marketplaceFeeAmount;
            
            // Transfer ticket to highest bidder
            IERC721(listing.ticketContract).safeTransferFrom(
                address(this),
                listing.highestBidder,
                listing.tokenId
            );
            
            // Transfer payments
            payable(listing.seller).transfer(sellerAmount);
            payable(feeRecipient).transfer(marketplaceFeeAmount);
            
            emit AuctionEnded(listingId, listing.highestBidder, listing.highestBid);
        } else {
            // No bids, return ticket to seller
            IERC721(listing.ticketContract).safeTransferFrom(
                address(this),
                listing.seller,
                listing.tokenId
            );
            
            emit AuctionEnded(listingId, address(0), 0);
        }
    }
    
    /**
     * @dev Cancel listing
     */
    function cancelListing(bytes32 listingId) external nonReentrant {
        Listing storage listing = listings[listingId];
        require(listing.isActive, "Listing not active");
        require(msg.sender == listing.seller || hasRole(MARKETPLACE_ADMIN_ROLE, msg.sender), "Unauthorized");
        
        if (listing.isAuction && listing.highestBidder != address(0)) {
            // Refund highest bidder
            payable(listing.highestBidder).transfer(listing.highestBid);
        }
        
        listing.isActive = false;
        _removeFromActiveListings(listingId);
        
        // Return ticket to seller
        IERC721(listing.ticketContract).safeTransferFrom(
            address(this),
            listing.seller,
            listing.tokenId
        );
        
        emit ListingCancelled(listingId, listing.seller);
    }
    
    /**
     * @dev Get active listings
     */
    function getActiveListings() external view returns (bytes32[] memory) {
        return activeListings;
    }
    
    /**
     * @dev Get user listings
     */
    function getUserListings(address user) external view returns (bytes32[] memory) {
        return userListings[user];
    }
    
    /**
     * @dev Remove listing from active listings array
     */
    function _removeFromActiveListings(bytes32 listingId) internal {
        for (uint256 i = 0; i < activeListings.length; i++) {
            if (activeListings[i] == listingId) {
                activeListings[i] = activeListings[activeListings.length - 1];
                activeListings.pop();
                break;
            }
        }
    }
    
    /**
     * @dev Update marketplace fee
     */
    function updateMarketplaceFee(uint256 _fee) external onlyRole(MARKETPLACE_ADMIN_ROLE) {
        require(_fee <= 1000, "Fee too high"); // Max 10%
        marketplaceFee = _fee;
    }
    
    /**
     * @dev Update fee recipient
     */
    function updateFeeRecipient(address _feeRecipient) external onlyRole(MARKETPLACE_ADMIN_ROLE) {
        feeRecipient = _feeRecipient;
    }
    
    /**
     * @dev Approve contract for marketplace operations
     */
    function approveContract(address ticketContract, bool approved) external {
        approvedContracts[msg.sender][ticketContract] = approved;
    }
    
    /**
     * @dev Pause marketplace
     */
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }
    
    /**
     * @dev Unpause marketplace
     */
    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }
    
    /**
     * @dev Handle NFT transfers
     */
    function onERC721Received(
        address,
        address,
        uint256,
        bytes calldata
    ) external pure override returns (bytes4) {
        return IERC721Receiver.onERC721Received.selector;
    }
}
