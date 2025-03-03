// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";

interface ISubcriptionNFT is IERC721 {
    function mint(address to) external returns (uint256);
    function renewSubscription(uint256 tokenId) external;
    function timeUntilExpired(uint256 tokenId) external view returns (uint256);
}

interface IReferralStorage {
    struct User {
        address referrer;
        uint256 referralCount;
        uint256 totalRewards;
        bool isRegistered;
        bool isSubscribed;
        uint256 tokenID;
    }
    
    function setUser(address userAddress, User memory user) external;
    function getUser(address userAddress) external view returns (User memory);
    function addReferral(address referrer, address referee) external;
    function getReferrals(address referrer) external view returns (address[] memory);
    function deleteUser(address user) external;
}

contract ReferralV2 is Ownable, ReentrancyGuard, Initializable {
    using SafeERC20 for IERC20;
    using Strings for uint256;
    
    // Version tracking
    string public version = "1.0.0";
    
    // Contract references
    IERC20 public rewardToken;
    ISubcriptionNFT public subscriptionNFT;
    IReferralStorage public referralStorage;
    
    // Referral system parameters
    uint256[3] public referralRewards = [500, 300, 100]; // 5%, 3%, 1%
    uint256 public registrationAmount = 100 * 10**18; // 100 tokens
    uint256 public subscriptionAmount = 50 * 10**18;
    uint256 public subscriptionDuration = 3 minutes;
    
    // System status flags
    address public payout;
    bool public paused = false;
    bool public storageConnected = false;
    bool public tokenConnected = false;
    bool public nftConnected = false;
    
    // Max referral depth to query in getReferralTree (for gas optimization)
    uint256 public maxReferralDepth = 3;
    uint256 public maxReferralsPerLevel = 100;

        // Deletion related parameters
    bool public allowSelfDeletion = false;
    uint256 public deletionCooldown = 30 days;
    mapping(address => uint256) public lastDeletionRequest;

    // Events
    event UserRegistered(address indexed user, address indexed referrer, uint256 amount, uint256 tokenId, uint256 timestamp);
    event ReferralRewardPaid(address indexed user, address indexed referrer, uint256 amount, uint256 level, uint256 timestamp);
    event SubscriptionRenewed(address indexed user, uint256 indexed tokenId, uint256 expiryTime, uint256 amount, uint256 timestamp);
    event UserDeactivated(address indexed user, uint256 indexed tokenId, uint256 timestamp);
    event UserDeleted(address indexed user, uint256 indexed tokenId, uint256 timestamp);
    event DeletionRequested(address indexed user, uint256 requestTime, uint256 timestamp);
    event DeletionCancelled(address indexed user, uint256 timestamp);
    event Payout(address indexed payout, uint256 balance, uint256 timestamp);
    event ReferralStorageConnected(address indexed storageContract, uint256 timestamp);
    event RewardTokenConnected(address indexed tokenContract, uint256 timestamp);
    event SubscriptionNFTConnected(address indexed nftContract, uint256 timestamp);
    event ContractPaused(address indexed by, uint256 timestamp);
    event ContractUnpaused(address indexed by, uint256 timestamp);
    event ParameterUpdated(string indexed paramName, uint256 oldValue, uint256 newValue, uint256 timestamp);
    event BoolParameterUpdated(string indexed paramName, bool oldValue, bool newValue, uint256 timestamp);
    event VersionUpdated(string oldVersion, string newVersion, uint256 timestamp);
    event EmergencyWithdrawal(address indexed token, address indexed to, uint256 amount, uint256 timestamp);
    event SubscriptionPaid(address indexed user, uint256 indexed tokenId, uint256 amount, uint256 timestamp);
    event RegistrationPaid(address indexed user, uint256 indexed tokenId, uint256 amount, uint256 timestamp);

    modifier whenNotPaused() {
        require(!paused, "Contract is paused");
        _;
    }
    
    modifier allContractsConnected() {
        require(storageConnected, "Storage not connected");
        require(tokenConnected, "Token not connected");
        require(nftConnected, "NFT not connected");
        _;
    }
    
    constructor() Ownable(msg.sender) {
        // Empty constructor for upgradeable design
    }
    
    /**
     * @dev Initialize function to be called once after deployment
     * @param _version Initial version string
     */
    function initialize(string memory _version) external initializer onlyOwner {
        version = _version;
        emit VersionUpdated("0.0.0", _version, block.timestamp);
    }
    
    /**
     * @dev Set the reward token contract address
     * @param _rewardToken Address of the ERC20 token contract
     */
    function setRewardToken(address _rewardToken) external onlyOwner {
        require(_rewardToken != address(0), "Invalid token address");
        rewardToken = IERC20(_rewardToken);
        tokenConnected = true;
        emit RewardTokenConnected(_rewardToken, block.timestamp);
    }
    
    /**
     * @dev Set the subscription NFT contract address
     * @param _subscriptionNFT Address of the subscription NFT contract
     */
    function setSubscriptionNFT(address _subscriptionNFT) external onlyOwner {
        require(_subscriptionNFT != address(0), "Invalid NFT address");
        subscriptionNFT = ISubcriptionNFT(_subscriptionNFT);
        nftConnected = true;
        emit SubscriptionNFTConnected(_subscriptionNFT, block.timestamp);
    }
    
    /**
     * @dev Get the reward token contract address
     * @return Address of the reward token contract
     */
    function getRewardToken() external view returns (address) {
        return address(rewardToken);
    }
    
    /**
     * @dev Get the subscription NFT contract address
     * @return Address of the subscription NFT contract
     */
    function getSubscriptionNFT() external view returns (address) {
        return address(subscriptionNFT);
    }
    
    /**
     * @dev Set the referral storage contract address
     * @param _referralStorage Address of the referral storage contract
     */
    function setReferralStorage(address _referralStorage) external onlyOwner {
        require(_referralStorage != address(0), "Invalid storage address");
        referralStorage = IReferralStorage(_referralStorage);
        storageConnected = true;
        emit ReferralStorageConnected(_referralStorage, block.timestamp);
    }
    
    /**
     * @dev Register a new user with optional referrer
     * @param referrer Address of the referrer (0x0 if none)
     */
    function register(address referrer) external nonReentrant whenNotPaused allContractsConnected {
        IReferralStorage.User memory user = referralStorage.getUser(msg.sender);
        require(!user.isRegistered, "Already registered");
        require(referrer != msg.sender, "Cannot refer yourself");
        
        // State changes
        uint256 tokenId = subscriptionNFT.mint(msg.sender);
        
        IReferralStorage.User memory newUser = IReferralStorage.User({
            referrer: referrer,
            referralCount: 0,
            totalRewards: 0,
            isRegistered: true,
            isSubscribed: true,
            tokenID: tokenId
        });
        
        referralStorage.setUser(msg.sender, newUser);
        
        if (referrer != address(0)) {
            IReferralStorage.User memory referrerUser = referralStorage.getUser(referrer);
            if (referrerUser.isRegistered) {
                referrerUser.referralCount++;
                referralStorage.setUser(referrer, referrerUser);
                referralStorage.addReferral(referrer, msg.sender);
            }
        }
        
        // External calls last (follows checks-effects-interactions pattern)
        try this.attemptTransfer(msg.sender, address(this), registrationAmount) {
            emit RegistrationPaid(msg.sender, tokenId, subscriptionAmount, block.timestamp);
        } catch Error(string memory reason){
            revert(string(abi.encodePacked("Registration payment failed:", reason)));
        }
        
        // Process rewards after all state changes are complete
        if (referrer != address(0)) {
            IReferralStorage.User memory referrerUser = referralStorage.getUser(referrer);
            if (referrerUser.isRegistered) {
                processReferralRewards(msg.sender, registrationAmount);
            }
        }
        
        emit UserRegistered(msg.sender, referrer, registrationAmount, tokenId, block.timestamp);
    }

    /**
     * @dev Renew a user's subscription
     * @param user Address of the user to renew
     */
    function subscribe(address user) external nonReentrant whenNotPaused allContractsConnected {
        IReferralStorage.User memory userData = referralStorage.getUser(user);
        require(userData.isRegistered, "User is not registered");
        
        uint256 tokenId = userData.tokenID;
        require(tokenId != 0, "No NFT found");
        require(subscriptionNFT.ownerOf(tokenId) == user, "Not NFT owner");
        
        // Check token allowance first
        uint256 allowance = rewardToken.allowance(user, address(this));
        require(allowance >= subscriptionAmount, "Insufficient token allowance");
        
        // Check token balance
        uint256 balance = rewardToken.balanceOf(user);
        require(balance >= subscriptionAmount, "Insufficient token balance");
        
        // State changes first
        userData.isSubscribed = true;
        referralStorage.setUser(user, userData);
        
        // External calls last
        try this.attemptTransfer(user, address(this), subscriptionAmount) {
            emit SubscriptionPaid(user, tokenId, subscriptionAmount, block.timestamp);
        } catch Error(string memory reason){
            userData.isSubscribed = false;
            revert(string(abi.encodePacked("Renewal payment failed: ", reason)));
        }
        
        try subscriptionNFT.renewSubscription(tokenId) {
            // Process rewards after all state changes and external calls
            processReferralRewards(user, subscriptionAmount);
            emit SubscriptionRenewed(user, tokenId, block.timestamp + subscriptionDuration, subscriptionAmount, block.timestamp);
        } catch Error(string memory reason) {
            revert(string(abi.encodePacked("NFT Renewal failed: ", reason)));
        }
    }


    /**
    *
    *
     */
    function attemptTransfer(address origin, address beneficiary, uint256 amount) external {
        require(msg.sender == address(this));  // this function should be called only by this contract
        rewardToken.safeTransferFrom(origin, beneficiary, amount);
    }

    /**
     * @dev Check if a user's subscription is active
     * @param user Address of the user to check
     * @return Boolean indicating if subscription is active
     */
    function checkSubscriptionStatus(address user) public view returns (bool) {
        if (!storageConnected || !nftConnected) return false;
        
        IReferralStorage.User memory userData = referralStorage.getUser(user);
        if (!userData.isRegistered) return false;
        
        uint256 tokenId = userData.tokenID;
        uint256 timeLeft = subscriptionNFT.timeUntilExpired(tokenId);
        
        return timeLeft > 0;
    }

    /**
     * @dev Transfer contract balance to payout address
     */
    function payoutProfit() external onlyOwner nonReentrant whenNotPaused {
        require(payout != address(0), "Payout address not set");
        require(tokenConnected, "Token not connected");
        
        uint256 balance = rewardToken.balanceOf(address(this));
        require(balance > 0, "No balance to payout");
        
        rewardToken.safeTransfer(payout, balance);
        emit Payout(payout, balance, block.timestamp);
    }

    /**
     * @dev Update a user's subscription status based on NFT expiry
     * @param user Address of the user to update
     */
    function updateSubscriptionStatus(address user) public whenNotPaused {
        require(storageConnected, "Storage not connected");
        require(nftConnected, "NFT not connected");
        
        IReferralStorage.User memory userData = referralStorage.getUser(user);
        require(userData.isRegistered, "User not registered");
        
        bool isSubscribed = checkSubscriptionStatus(user);
        if (userData.isSubscribed != isSubscribed) {
            userData.isSubscribed = isSubscribed;
            referralStorage.setUser(user, userData);
            if (!isSubscribed) {
                emit UserDeactivated(user, userData.tokenID, block.timestamp);
            }
        }
    }

    /**
     * @dev Process referral rewards for all levels
     * @param user Address of the user generating rewards
     * @param amount Amount to calculate rewards from
     */
    function processReferralRewards(address user, uint256 amount) internal {
        if (!storageConnected || !tokenConnected) return;
        
        IReferralStorage.User memory userData = referralStorage.getUser(user);
        address currentReferrer = userData.referrer;
        updateSubscriptionStatus(user);
        
        // We'll collect all transfers to do them at the end
        address[] memory rewardAddresses = new address[](referralRewards.length);
        uint256[] memory rewardAmounts = new uint256[](referralRewards.length);
        uint256[] memory rewardLevels = new uint256[](referralRewards.length);
        uint256 rewardCount = 0;
        
        for (uint256 i = 0; i < referralRewards.length && currentReferrer != address(0); i++) {
            IReferralStorage.User memory referrerData = referralStorage.getUser(currentReferrer);
            
            if (referrerData.isSubscribed) {
                uint256 reward = (amount * referralRewards[i]) / 10000;
                referrerData.totalRewards += reward;
                
                // Update state first
                referralStorage.setUser(currentReferrer, referrerData);
                
                // Store the transfer for later
                rewardAddresses[rewardCount] = currentReferrer;
                rewardAmounts[rewardCount] = reward;
                rewardLevels[rewardCount] = i + 1;
                rewardCount++;
            }
            currentReferrer = referrerData.referrer;
        }
        
        // Execute all transfers at the end
        for (uint256 i = 0; i < rewardCount; i++) {
            rewardToken.safeTransfer(rewardAddresses[i], rewardAmounts[i]);
            emit ReferralRewardPaid(user, rewardAddresses[i], rewardAmounts[i], rewardLevels[i], block.timestamp);
        }
    }
    
    /**
     * @dev Set the payout address
     * @param payoutAddress Address to receive payouts
     */
    function updatePayout(address payoutAddress) external onlyOwner {
        require(payoutAddress != address(0), "Cannot set zero address");
        payout = payoutAddress;
        emit ParameterUpdated("payout", 0, 0, block.timestamp);
    }

    /**
     * @dev Manually update a user's subscription status
     * @param user Address of the user
     * @param _newSubscription New subscription status
     */
    function updateSubscription(address user, bool _newSubscription) external onlyOwner whenNotPaused {
        require(storageConnected, "Storage not connected");
        require(user != address(0), "Cannot update zero address");
        
        IReferralStorage.User memory userData = referralStorage.getUser(user);
        userData.isSubscribed = _newSubscription;
        referralStorage.setUser(user, userData);
    }

    /**
     * @dev Update subscription duration
     * @param duration New duration in seconds
     */
    function updateSubscriptionDuration(uint256 duration) external onlyOwner {
        require(duration > 0, "Duration must be positive");
        uint256 oldValue = subscriptionDuration;
        subscriptionDuration = duration;
        emit ParameterUpdated("subscriptionDuration", oldValue, duration, block.timestamp);
    }

    /**
     * @dev Update referral rewards percentages
     * @param _newRewards Array of 3 reward percentages in basis points
     */
    function updateReferralRewards(uint256[3] memory _newRewards) external onlyOwner {
        for (uint i = 0; i < 3; i++) {
            require(_newRewards[i] <= 1000, "Reward too high"); // Max 10%
        }
        referralRewards = _newRewards;
        emit ParameterUpdated("referralRewards", 0, 0, block.timestamp);
    }
    
    /**
     * @dev Update registration amount
     * @param _newAmount New registration amount in token units
     */
    function updateRegistrationAmount(uint256 _newAmount) external onlyOwner {
        require(_newAmount > 0, "Amount must be positive");
        uint256 oldValue = registrationAmount;
        registrationAmount = _newAmount;
        emit ParameterUpdated("registrationAmount", oldValue, _newAmount, block.timestamp);
    }
    
    /**
     * @dev Update subscription amount
     * @param _newAmount New subscription amount in token units
     */
    function updateSubscriptionAmount(uint256 _newAmount) external onlyOwner {
        require(_newAmount > 0, "Amount must be positive");
        uint256 oldValue = subscriptionAmount;
        subscriptionAmount = _newAmount;
        emit ParameterUpdated("subscriptionAmount", oldValue, _newAmount, block.timestamp);
    }
    
        // ==================== User Deletion Functions ====================

    /**
     * @dev Enable or disable self-deletion functionality
     * @param _allowSelfDeletion New status
     */
    function updateSelfDeletionStatus(bool _allowSelfDeletion) external onlyOwner {
        bool oldValue = allowSelfDeletion;
        allowSelfDeletion = _allowSelfDeletion;
        emit BoolParameterUpdated("allowSelfDeletion", oldValue, _allowSelfDeletion, block.timestamp);
    }

    /**
     * @dev Update deletion cooldown period
     * @param _deletionCooldown New cooldown in seconds
     */
    function updateDeletionCooldown(uint256 _deletionCooldown) external onlyOwner {
        require(_deletionCooldown <= 365 days, "Cooldown too long");
        uint256 oldValue = deletionCooldown;
        deletionCooldown = _deletionCooldown;
        emit ParameterUpdated("deletionCooldown", oldValue, _deletionCooldown, block.timestamp);
    }

    /**
     * @dev Request account deletion (starts the cooldown)
     */
    function requestDeletion() external nonReentrant whenNotPaused {
        require(allowSelfDeletion, "Self-deletion not allowed");
        require(storageConnected, "Storage not connected");
        
        IReferralStorage.User memory user = referralStorage.getUser(msg.sender);
        require(user.isRegistered, "User not registered");
        
        lastDeletionRequest[msg.sender] = block.timestamp;
        emit DeletionRequested(msg.sender, block.timestamp, block.timestamp);
    }

    /**
     * @dev Cancel a pending deletion request
     */
    function cancelDeletionRequest() external nonReentrant whenNotPaused {
        require(lastDeletionRequest[msg.sender] > 0, "No deletion request");
        
        delete lastDeletionRequest[msg.sender];
        emit DeletionCancelled(msg.sender, block.timestamp);
    }

    /**
     * @dev Execute account self-deletion after cooldown
     */
    function executeDeleteSelf() external nonReentrant whenNotPaused allContractsConnected {
        require(allowSelfDeletion, "Self-deletion not allowed");
        uint256 requestTime = lastDeletionRequest[msg.sender];
        require(requestTime > 0, "No deletion request");
        require(block.timestamp >= requestTime + deletionCooldown, "Cooldown not complete");
        
        _deleteUser(msg.sender);
    }

    /**
     * @dev Admin function to delete a user
     * @param user Address of user to delete
     */
    function adminDeleteUser(address user) external onlyOwner nonReentrant whenNotPaused allContractsConnected {
        require(user != address(0), "Cannot delete zero address");
        _deleteUser(user);
    }

    /**
     * @dev Internal function to handle user deletion
     * @param user Address of user to delete
     */
    function _deleteUser(address user) internal {
        IReferralStorage.User memory userData = referralStorage.getUser(user);
        require(userData.isRegistered, "User not registered");
        
        uint256 tokenId = userData.tokenID;
        
        // Try to burn the NFT if it exists and we still have access to it
        //try subscriptionNFT.ownerOf(tokenId) returns (address owner) {
        //    if (owner == user) {
        //        // Only try to burn if user still owns the NFT
        //        try subscriptionNFT.burn(tokenId) {
        //            // NFT successfully burned
        //        } catch {
        //            // If burn fails, we still proceed with deletion
        //            // This allows deletion even if NFT was transferred away
        //        }
        //    }
        //} catch {
        //    // If ownerOf fails (token doesn't exist), we still proceed
        //}
        
        // Delete the user from storage
        try referralStorage.deleteUser(user) {
            // Reset deletion request data
            delete lastDeletionRequest[user];
            
            emit UserDeleted(user, tokenId, block.timestamp);
        } catch Error(string memory reason) {
            revert(string(abi.encodePacked("User deletion failed: ", reason)));
        }
    }

    /**
     * @dev Get list of referrals for a user with detailed info
     * @param user Address of the user
     * @return Array of User structs
     */
    function getUserReferrals(address user) external view returns (IReferralStorage.User[] memory) {
        require(storageConnected, "Storage not connected");
        require(user != address(0), "Cannot query zero address");
        
        address[] memory userAddresses = referralStorage.getReferrals(user);
        IReferralStorage.User[] memory userStats = new IReferralStorage.User[](userAddresses.length);
    
        for (uint i = 0; i < userAddresses.length; i++) {
            userStats[i] = referralStorage.getUser(userAddresses[i]);
        }
    
        return userStats;
    }
    
    /**
     * @dev Get detailed stats for a user
     * @param user Address of the user
     * @return referrer - Address of user who referrer the requested user into program
     * @return referralCount Number of users the requested user has referred into the program
     * @return totalRewards  Amount of rewards the requested user has earned from referrals
     * @return isRegistered  Boolean of requested user registration status
     * @return isSubscribed  Boolean of requested user subscription status
     * @return tokenID Number ID of the requested users NFT
     */
    function getUserStats(address user) external view returns (
        address referrer,
        uint256 referralCount,
        uint256 totalRewards,
        bool isRegistered,
        bool isSubscribed,
        uint256 tokenID
    ) {
        require(storageConnected, "Storage not connected");
        require(nftConnected, "NFT not connected");
        require(user != address(0), "Cannot query zero address");
        
        IReferralStorage.User memory userInfo = referralStorage.getUser(user);
        
        return (
            userInfo.referrer,
            userInfo.referralCount,
            userInfo.totalRewards,
            userInfo.isRegistered,
            subscriptionNFT.timeUntilExpired(userInfo.tokenID) > 0,
            userInfo.tokenID
        );
    }
    
        /**
     * @dev Get user deletion information
     * @param user Address of the user
     * @return requestTime Time of deletion request (0 if none)
     * @return cooldownComplete Whether cooldown period has passed
     * @return timeRemaining Time remaining in cooldown (0 if complete)
     */
    function getDeletionStatus(address user) external view returns (
        uint256 requestTime,
        bool cooldownComplete,
        uint256 timeRemaining
    ) {
        requestTime = lastDeletionRequest[user];
        
        if (requestTime > 0) {
            uint256 completionTime = requestTime + deletionCooldown;
            cooldownComplete = block.timestamp >= completionTime;
            
            if (!cooldownComplete) {
                timeRemaining = completionTime - block.timestamp;
            }
        }
        
        return (requestTime, cooldownComplete, timeRemaining);
    }

    struct ReferralInfo {
        address addr;
        uint256 level;
        uint256 rewardsEarned;
    }
    
    /**
     * @dev Update maximum referral depth for tree queries
     * @param _maxDepth New maximum depth (1-3)
     */
    function updateMaxReferralDepth(uint256 _maxDepth) external onlyOwner {
        require(_maxDepth >= 1 && _maxDepth <= 3, "Depth must be 1-3");
        uint256 oldValue = maxReferralDepth;
        maxReferralDepth = _maxDepth;
        emit ParameterUpdated("maxReferralDepth", oldValue, _maxDepth, block.timestamp);
    }
    
    /**
     * @dev Update maximum referrals per level for queries
     * @param _maxReferrals New maximum (10-1000)
     */
    function updateMaxReferralsPerLevel(uint256 _maxReferrals) external onlyOwner {
        require(_maxReferrals >= 10 && _maxReferrals <= 1000, "Value must be 10-1000");
        uint256 oldValue = maxReferralsPerLevel;
        maxReferralsPerLevel = _maxReferrals;
        emit ParameterUpdated("maxReferralsPerLevel", oldValue, _maxReferrals, block.timestamp);
    }
    
    /**
     * @dev Get referral tree for a user with pagination
     * @param user Address of the user
     * @return downline Referral tree of user
     */
    function getReferralTree(address user) external view returns (
        ReferralInfo[] memory downline
    ) {
        require(storageConnected, "Storage not connected");
        
        // Calculate total possible size (all 3 levels)
        uint256 totalSize = 0;
        address[] memory level1 = referralStorage.getReferrals(user);
        totalSize += level1.length;
        
        for (uint i = 0; i < level1.length; i++) {
            address[] memory level2 = referralStorage.getReferrals(level1[i]);
            totalSize += level2.length;
            
            for (uint j = 0; j < level2.length; j++) {
                totalSize += referralStorage.getReferrals(level2[j]).length;
            }
        }
        
        downline = new ReferralInfo[](totalSize);
        uint256 currentIndex = 0;
        
        // Level 1 (5% earnings)
        for (uint i = 0; i < level1.length; i++) {
            address addr = level1[i];
            downline[currentIndex] = ReferralInfo(
                addr,
                1,
                (registrationAmount * 500) / 10000 // 5% of registration
            );
            currentIndex++;
            
            // Level 2 (3% earnings)
            address[] memory level2 = referralStorage.getReferrals(addr);
            for (uint j = 0; j < level2.length; j++) {
                address addr2 = level2[j];
                downline[currentIndex] = ReferralInfo(
                    addr2,
                    2,
                    (registrationAmount * 300) / 10000 // 3% of registration
                );
                currentIndex++;
                
                // Level 3 (1% earnings)
                address[] memory level3 = referralStorage.getReferrals(addr2);
                for (uint k = 0; k < level3.length; k++) {
                    downline[currentIndex] = ReferralInfo(
                        level3[k],
                        3,
                        (registrationAmount * 100) / 10000 // 1% of registration
                    );
                    currentIndex++;
                }
            }
        }
        
        return downline;
    } 

    /**
     * @dev Batch get user stats for multiple addresses
     * @param userAddresses Array of user addresses
     * @return userStats Array of User structs
     */
    function batchGetUserStats(address[] calldata userAddresses) external view returns (IReferralStorage.User[] memory userStats) {
        require(storageConnected, "Storage not connected");
        require(nftConnected, "NFT not connected");
        require(userAddresses.length <= 100, "Batch size too large");
        
        userStats = new IReferralStorage.User[](userAddresses.length);
        
        for (uint i = 0; i < userAddresses.length; i++) {
            address userAddress = userAddresses[i];
            require(userAddress != address(0), "Cannot query zero address");
            
            IReferralStorage.User memory userInfo = referralStorage.getUser(userAddress);

            // Make a copy with the correct subscription status
            userStats[i] = IReferralStorage.User({
                referrer: userInfo.referrer,
                referralCount: userInfo.referralCount,
                totalRewards: userInfo.totalRewards,
                isRegistered: userInfo.isRegistered,
                isSubscribed: subscriptionNFT.timeUntilExpired(userInfo.tokenID) > 0,
                tokenID: userInfo.tokenID
            });
        }
        
        return userStats;
    }
    
    /**
     * @dev Pause contract operations
     */
    function pause() external onlyOwner {
        paused = true;
        emit ContractPaused(msg.sender, block.timestamp);
    }
    
    /**
     * @dev Unpause contract operations
     */
    function unpause() external onlyOwner {
        paused = false;
        emit ContractUnpaused(msg.sender, block.timestamp);
    }
    
    /**
     * @dev Update contract version
     * @param _newVersion New version string
     */
    function updateVersion(string memory _newVersion) external onlyOwner {
        string memory oldVersion = version;
        version = _newVersion;
        emit VersionUpdated(oldVersion, _newVersion, block.timestamp);
    }
    
    /**
     * @dev Emergency withdrawal of tokens
     * @param tokenAddress Address of token to withdraw
     * @param to Address to send tokens to
     * @param amount Amount to withdraw
     */
    function emergencyWithdraw(address tokenAddress, address to, uint256 amount) external onlyOwner {
        require(to != address(0), "Cannot withdraw to zero address");
        require(amount > 0, "Amount must be positive");
        
        IERC20 token = IERC20(tokenAddress);
        uint256 balance = token.balanceOf(address(this));
        require(balance >= amount, "Insufficient balance");
        
        token.safeTransfer(to, amount);
        emit EmergencyWithdrawal(tokenAddress, to, amount, block.timestamp);
    }
}