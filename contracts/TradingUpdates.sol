// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract TradingUpdates {
    // Enums
    enum UpdateType { BUY, SELL, UPDATE }
    
    // Structs
    struct TradingPost {
        uint256 id;
        UpdateType updateType;
        string title;
        string description;
        uint256 timestamp;
        string asset;
        uint256 price;      // Stored as price * 10^18 for precision
        int256 change;      // Stored as change * 10^18 for precision
        bool isPositive;
        address author;
    }
    
    // State variables
    mapping(uint256 => TradingPost) private posts;
    uint256 private nextPostId;
    mapping(address => bool) private admins;
    mapping(uint256 => mapping(uint256 => uint256)) private timeIndexedPosts; // timestamp => index => postId
    mapping(string => mapping(uint256 => uint256)) private assetIndexedPosts;  // asset => index => postId
    
    // Events
    event PostCreated(uint256 indexed postId, address indexed author, string asset);
    event PostUpdated(uint256 indexed postId);
    event PostDeleted(uint256 indexed postId);
    
    // Modifiers
    modifier onlyAdmin() {
        require(admins[msg.sender], "Not authorized");
        _;
    }
    
    // Constructor
    constructor() {
        admins[msg.sender] = true;
        nextPostId = 1;
    }
    
    // Admin functions
    function addAdmin(address admin) external onlyAdmin {
        admins[admin] = true;
    }
    
    function removeAdmin(address admin) external onlyAdmin {
        require(msg.sender != admin, "Cannot remove self");
        admins[admin] = false;
    }
    
    // Core functions
    function createPost(
        UpdateType updateType,
        string memory title,
        string memory description,
        string memory asset,
        uint256 price,
        int256 change,
        bool isPositive
    ) external onlyAdmin returns (uint256) {
        uint256 postId = nextPostId++;
        
        posts[postId] = TradingPost({
            id: postId,
            updateType: updateType,
            title: title,
            description: description,
            timestamp: block.timestamp,
            asset: asset,
            price: price,
            change: change,
            isPositive: isPositive,
            author: msg.sender
        });
        
        // Index the post
        indexPost(postId, posts[postId]);
        
        emit PostCreated(postId, msg.sender, asset);
        return postId;
    }
    
    // Indexing helper
    function indexPost(uint256 postId, TradingPost storage post) private {
        uint256 timeIndex = getTimeIndex(post.timestamp);
        uint256 assetIndex = getAssetIndex(post.asset);
        
        timeIndexedPosts[timeIndex][getNextTimeSlotIndex(timeIndex)] = postId;
        assetIndexedPosts[post.asset][assetIndex] = postId;
    }
    
    // Query functions
    function getPost(uint256 postId) external view returns (TradingPost memory) {
        require(posts[postId].timestamp != 0, "Post does not exist");
        return posts[postId];
    }
    
    function getLatestPosts(uint256 limit, uint256 offset) 
        external 
        view 
        returns (TradingPost[] memory) 
    {
        require(limit <= 100, "Max 100 posts per query");
        TradingPost[] memory result = new TradingPost[](limit);
        
        uint256 count = 0;
        uint256 current = nextPostId - 1 - offset;
        
        while (count < limit && current > 0) {
            if (posts[current].timestamp != 0) {
                result[count] = posts[current];
                count++;
            }
            current--;
        }
        
        return result;
    }
    
    function getPostsByAsset(string memory asset, uint256 limit, uint256 offset)
        external
        view
        returns (TradingPost[] memory)
    {
        require(limit <= 100, "Max 100 posts per query");
        TradingPost[] memory result = new TradingPost[](limit);
        
        uint256 count = 0;
        uint256 index = offset;
        
        while (count < limit && assetIndexedPosts[asset][index] != 0) {
            uint256 postId = assetIndexedPosts[asset][index];
            if (posts[postId].timestamp != 0) {
                result[count] = posts[postId];
                count++;
            }
            index++;
        }
        
        return result;
    }
    
    // Helper functions
    function getTimeIndex(uint256 timestamp) private pure returns (uint256) {
        return timestamp / 86400; // Daily index
    }
    
    function getAssetIndex(string memory asset) private view returns (uint256) {
        return nextPostId - 1;
    }
    
    function getNextTimeSlotIndex(uint256 timeIndex) private view returns (uint256) {
        uint256 index = 0;
        while (timeIndexedPosts[timeIndex][index] != 0) {
            index++;
        }
        return index;
    }
}