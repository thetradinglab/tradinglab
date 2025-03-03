// SPDX-License-Identifier: MIT
import "@openzeppelin/contracts/access/Ownable.sol";
pragma solidity ^0.8.0;

contract ReferralStorage is Ownable {
    struct User {
        address referrer;
        uint256 referralCount;
        uint256 totalRewards;
        bool isRegistered;
        bool isSubscribed;
        uint256 tokenID;
    }

    mapping(address => User) public users;
    mapping(address => address[]) public referrals;

    constructor() Ownable(msg.sender){}

    function setUser(address userAddress, User memory user) external onlyOwner {
        users[userAddress] = user;
    }
    function addReferral(address referrer, address referee) external onlyOwner {
        referrals[referrer].push(referee);
    }
    function getUser(address userAddress) external view returns (User memory) {
        return users[userAddress];
    }
    function getReferrals(address referrer) external view returns (address[] memory) {
        return referrals[referrer];
    }
    function deleteUser(address userAddress) external onlyOwner {
    // First check if user exists
    require(users[userAddress].isRegistered, "User not registered");
    
    // Handle referral relationships
    address referrer = users[userAddress].referrer;
    if (referrer != address(0)) {
        // Remove from referrer's direct referrals list
        address[] storage referrerReferrals = referrals[referrer];
        for (uint i = 0; i < referrerReferrals.length; i++) {
            if (referrerReferrals[i] == userAddress) {
                // Replace with last element and then pop
                referrerReferrals[i] = referrerReferrals[referrerReferrals.length - 1];
                referrerReferrals.pop();
                
                // Update referrer's referral count
                users[referrer].referralCount = users[referrer].referralCount > 0 ? 
                    users[referrer].referralCount - 1 : 0;
                break;
            }
        }
    }
    
    // Keep the referral tree intact by re-linking referrals
    address[] memory userReferrals = referrals[userAddress];
    for (uint i = 0; i < userReferrals.length; i++) {
        // Update each referral's referrer to the deleted user's referrer
        users[userReferrals[i]].referrer = referrer;
        
        // Add to referrer's direct referrals if there is a referrer
        if (referrer != address(0)) {
            referrals[referrer].push(userReferrals[i]);
            users[referrer].referralCount++;
        }
    }
    
    // Clear the user's data
    delete users[userAddress];
    delete referrals[userAddress];
    
    // Emit an event for transparency
    emit UserDeleted(userAddress, block.timestamp);
    }

    // Add this event to the contract
    event UserDeleted(address indexed userAddress, uint256 timestamp);
}