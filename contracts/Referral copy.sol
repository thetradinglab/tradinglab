// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

interface ISubcriptionNFT is IERC721 {
    function mint(address to) external returns (uint256);
    function renewSubscription(uint256 tokenId ) external;
    function timeUntilExpired(uint256 tokenId) external view returns (uint256);
}

contract ReferralCopy is Ownable, ReentrancyGuard {

    IERC20 public rewardToken;
    ISubcriptionNFT public subscriptionNFT;
    uint256 private accumulatedProfits;

    using Strings for uint256;

    struct User {
        address referrer;
        uint256 referralCount;
        uint256 totalRewards;
        bool isRegistered;
        bool isSubscribed;
        uint256 tokenID;
    }
    
    uint256[3] public referralRewards = [500, 300, 100]; // 5%, 3%, 1%
    uint256 public registrationAmount = 100 * 10**18; // 100 tokens
    uint256 public subscriptionAmount = 50 * 10**18;
    uint256 public subscriptionDuration = 3 minutes;
    
    mapping(address => User) public users;
    mapping(address => address[]) public referrals;
    
    address payout;

    event UserRegistered(address indexed user, address indexed referrer);
    event ReferralRewardPaid(address indexed user, address indexed referrer, uint256 amount, uint256 level);
    event SubscriptionRenewed(address indexed user, uint256 indexed tokenId, uint256 expiryTime);
    event UserDeactivated(address indexed user, uint256 indexed tokenId);
    event Payout(address payout, uint256 balance);
    
    constructor(address _rewardToken, address _subscriptionNFT) Ownable(msg.sender) {
        rewardToken = IERC20(_rewardToken);
        subscriptionNFT = ISubcriptionNFT(_subscriptionNFT);
    }
    
    function register(address referrer) external nonReentrant {
        require(!users[msg.sender].isRegistered, "Already registered");
        require(referrer != msg.sender, "Cannot refer yourself");
        //transfer register amount
        require(rewardToken.transferFrom(msg.sender, address(this), registrationAmount), "Transfer failed");
        uint256 tokenId = subscriptionNFT.mint(msg.sender);

        users[msg.sender].isRegistered = true;
        users[msg.sender].referrer = referrer;
        users[msg.sender].isSubscribed = true;
        users[msg.sender].tokenID = tokenId;
        
        if (referrer != address(0) && users[referrer].isRegistered) {
            users[referrer].referralCount++;
            referrals[referrer].push(msg.sender);
            processReferralRewards(msg.sender, registrationAmount);
        }
        
        emit UserRegistered(msg.sender, referrer);
    }


    function subscribe(address user) external nonReentrant {
        require(users[user].isRegistered, "User is not registered");
        
        uint256 tokenId = users[user].tokenID;
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
            users[user].isSubscribed = true;
            processReferralRewards(user, subscriptionAmount);
            emit SubscriptionRenewed(user, tokenId, block.timestamp + subscriptionDuration);
        } catch Error(string memory reason) {
            revert(string(abi.encodePacked("NFT Renewal failed: ", reason)));
        }
    }

    function checkSubscriptionStatus(address user) public view returns (bool) {
        if (!users[user].isRegistered) return false;
        
        uint256 tokenId = users[user].tokenID;
        uint256 timeLeft = subscriptionNFT.timeUntilExpired(tokenId);
        
        return timeLeft > 0;
    }

    function updateSubscriptionStatus(address user) public {
        require(users[user].isRegistered, "User not registered");
        
        bool isSubscribed = checkSubscriptionStatus(user);
        if (users[user].isSubscribed != isSubscribed) {
            users[user].isSubscribed = isSubscribed;
            if (!isSubscribed) {
                emit UserDeactivated(user, users[user].tokenID);
            }
        }
    }

    function processReferralRewards(address user, uint256 amount) internal {
        address currentReferrer = users[user].referrer;
        updateSubscriptionStatus(user);
        for (uint256 i = 0; i < referralRewards.length && currentReferrer != address(0); i++) {
            if (users[currentReferrer].isSubscribed) {
                uint256 reward = (amount * referralRewards[i]) / 10000;
                users[currentReferrer].totalRewards += reward;
                
                require(rewardToken.transfer(currentReferrer, reward), "Reward transfer failed");
                emit ReferralRewardPaid(user, currentReferrer, reward, i + 1);
            }
            currentReferrer = users[currentReferrer].referrer;
        }
    }
    
    function updatePayout(address payoutAddress) external onlyOwner {
        require(payoutAddress != address(0), "Invalid payout address");
        payout = payoutAddress;
    }

    function payoutProfit() external onlyOwner nonReentrant {
        require(payout != address(0), "Payout address not set");
        
        uint256 balance = rewardToken.balanceOf(address(this));
        require(balance > 0, "No balance to payout");
        
        require(rewardToken.transfer(payout, balance), "Payout transfer failed");
        emit Payout(payout, balance);
    }
    
    function updateSubscription(address user, bool _newSubscription) external onlyOwner {
        users[user].isSubscribed = _newSubscription;
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
    
     function getUserReferrals(address user) external view returns (User[] memory) {
        address[] memory userAddresses = referrals[user];
        User[] memory userStats = new User[](userAddresses.length);
    
        for (uint i = 0; i < userAddresses.length; i++) {
        userStats[i] = users[userAddresses[i]];
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
        User memory userInfo = users[user];
        
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
        // Calculate total possible size (all 3 levels)
        uint256 totalSize = 0;
        address[] memory level1 = referrals[user];
        totalSize += level1.length;
        
        for (uint i = 0; i < level1.length; i++) {
            address[] memory level2 = referrals[level1[i]];
            totalSize += level2.length;
            
            for (uint j = 0; j < level2.length; j++) {
                totalSize += referrals[level2[j]].length;
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
            address[] memory level2 = referrals[addr];
            for (uint j = 0; j < level2.length; j++) {
                address addr2 = level2[j];
                downline[currentIndex] = ReferralInfo(
                    addr2,
                    2,
                    (registrationAmount * 300) / 10000 // 3% of registration
                );
                currentIndex++;
                
                // Level 3 (1% earnings)
                address[] memory level3 = referrals[addr2];
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

    function batchGetUserStats(address[] calldata userAddresses) external view returns (User[] memory userStats) {
        userStats = new User[](userAddresses.length);
        
        for (uint i = 0; i < userAddresses.length; i++) {
            address userAddress = userAddresses[i];
            User memory userInfo = users[userAddress];

            userStats[i] = User({
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