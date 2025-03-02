// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

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
}

contract Referral is Ownable, ReentrancyGuard {
    IERC20 public rewardToken;
    ISubcriptionNFT public subscriptionNFT;
    IReferralStorage public referralStorage;
    
    using Strings for uint256;
    
    uint256[3] public referralRewards = [500, 300, 100]; // 5%, 3%, 1%
    uint256 public registrationAmount = 100 * 10**18; // 100 tokens
    uint256 public subscriptionAmount = 50 * 10**18;
    uint256 public subscriptionDuration = 3 minutes;
    
    address payout;
    bool public storageConnected = false;

    event UserRegistered(address indexed user, address indexed referrer);
    event ReferralRewardPaid(address indexed user, address indexed referrer, uint256 amount, uint256 level);
    event SubscriptionRenewed(address indexed user, uint256 indexed tokenId, uint256 expiryTime);
    event UserDeactivated(address indexed user, uint256 indexed tokenId);
    event Payout(address payout, uint256 balance);
    event ReferralStorageConnected(address storageContract);
    
    constructor(address _rewardToken, address _subscriptionNFT) Ownable(msg.sender) {
        rewardToken = IERC20(_rewardToken);
        subscriptionNFT = ISubcriptionNFT(_subscriptionNFT);
    }
    
    function setReferralStorage(address _referralStorage) external onlyOwner {
        require(_referralStorage != address(0), "Invalid storage address");
        referralStorage = IReferralStorage(_referralStorage);
        storageConnected = true;
        emit ReferralStorageConnected(_referralStorage);
    }
    
    function register(address referrer) external nonReentrant {
        require(storageConnected, "Storage not connected");
        IReferralStorage.User memory user = referralStorage.getUser(msg.sender);
        require(!user.isRegistered, "Already registered");
        require(referrer != msg.sender, "Cannot refer yourself");
        
        // Transfer register amount
        require(rewardToken.transferFrom(msg.sender, address(this), registrationAmount), "Transfer failed");
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
                processReferralRewards(msg.sender, registrationAmount);
            }
        }
        
        emit UserRegistered(msg.sender, referrer);
    }

    function subscribe(address user) external nonReentrant {
        require(storageConnected, "Storage not connected");
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
        
        // Transfer tokens first
        require(rewardToken.transferFrom(user, address(this), subscriptionAmount), 
            "Token transfer failed");
        
        // Then renew subscription
        try subscriptionNFT.renewSubscription(tokenId) {
            userData.isSubscribed = true;
            referralStorage.setUser(user, userData);
            processReferralRewards(user, subscriptionAmount);
            emit SubscriptionRenewed(user, tokenId, block.timestamp + subscriptionDuration);
        } catch Error(string memory reason) {
            revert(string(abi.encodePacked("NFT Renewal failed: ", reason)));
        }
    }

    function checkSubscriptionStatus(address user) public view returns (bool) {
        if (!storageConnected) return false;
        
        IReferralStorage.User memory userData = referralStorage.getUser(user);
        if (!userData.isRegistered) return false;
        
        uint256 tokenId = userData.tokenID;
        uint256 timeLeft = subscriptionNFT.timeUntilExpired(tokenId);
        
        return timeLeft > 0;
    }

    function payoutProfit() external onlyOwner nonReentrant {
        require(payout != address(0), "Payout address not set");
        
        uint256 balance = rewardToken.balanceOf(address(this));
        require(balance > 0, "No balance to payout");
        
        require(rewardToken.transfer(payout, balance), "Payout transfer failed");
        emit Payout(payout, balance);
    }

    function updateSubscriptionStatus(address user) public {
        require(storageConnected, "Storage not connected");
        IReferralStorage.User memory userData = referralStorage.getUser(user);
        require(userData.isRegistered, "User not registered");
        
        bool isSubscribed = checkSubscriptionStatus(user);
        if (userData.isSubscribed != isSubscribed) {
            userData.isSubscribed = isSubscribed;
            referralStorage.setUser(user, userData);
            if (!isSubscribed) {
                emit UserDeactivated(user, userData.tokenID);
            }
        }
    }

    function processReferralRewards(address user, uint256 amount) internal {
        if (!storageConnected) return;
        
        IReferralStorage.User memory userData = referralStorage.getUser(user);
        address currentReferrer = userData.referrer;
        updateSubscriptionStatus(user);
        
        for (uint256 i = 0; i < referralRewards.length && currentReferrer != address(0); i++) {
            IReferralStorage.User memory referrerData = referralStorage.getUser(currentReferrer);
            
            if (referrerData.isSubscribed) {
                uint256 reward = (amount * referralRewards[i]) / 10000;
                referrerData.totalRewards += reward;
                
                referralStorage.setUser(currentReferrer, referrerData);
                require(rewardToken.transfer(currentReferrer, reward), "Reward transfer failed");
                emit ReferralRewardPaid(user, currentReferrer, reward, i + 1);
            }
            currentReferrer = referrerData.referrer;
        }
    }
    
    function updatePayout(address payoutAddress) external onlyOwner {
        payout = payoutAddress;
    }

    function updateSubscription(address user, bool _newSubscription) external onlyOwner {
        require(storageConnected, "Storage not connected");
        IReferralStorage.User memory userData = referralStorage.getUser(user);
        userData.isSubscribed = _newSubscription;
        referralStorage.setUser(user, userData);
    }

    function updateSubscriptionDuration(uint256 duration) external onlyOwner {
        subscriptionDuration = duration;
    }

    function updateReferralRewards(uint256[3] memory _newRewards) external onlyOwner {
        referralRewards = _newRewards;
    }
    
    function updateRegistrationAmount(uint256 _newAmount) external onlyOwner {
        registrationAmount = _newAmount;
    }
    
    function getUserReferrals(address user) external view returns (IReferralStorage.User[] memory) {
        require(storageConnected, "Storage not connected");
        
        address[] memory userAddresses = referralStorage.getReferrals(user);
        IReferralStorage.User[] memory userStats = new IReferralStorage.User[](userAddresses.length);
    
        for (uint i = 0; i < userAddresses.length; i++) {
            userStats[i] = referralStorage.getUser(userAddresses[i]);
        }
    
        return userStats;
    }
    
    function getUserStats(address user) external view returns (
        address referrer,
        uint256 referralCount,
        uint256 totalRewards,
        bool isRegistered,
        bool isSubscribed,
        uint256 tokenID
    ) {
        require(storageConnected, "Storage not connected");
        
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
    
    struct ReferralInfo {
        address addr;
        uint256 level;
        uint256 rewardsEarned;
    }
    
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

    function batchGetUserStats(address[] calldata userAddresses) external view returns (IReferralStorage.User[] memory userStats) {
        require(storageConnected, "Storage not connected");
        
        userStats = new IReferralStorage.User[](userAddresses.length);
        
        for (uint i = 0; i < userAddresses.length; i++) {
            address userAddress = userAddresses[i];
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
}