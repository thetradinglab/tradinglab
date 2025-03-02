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
}