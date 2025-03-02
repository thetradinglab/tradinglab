// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ReferralToken is ERC20, Ownable {
    uint256 public constant INITIAL_SUPPLY = 1_000_000 * 10**18; // 1 million tokens
    uint256 public constant MAX_SUPPLY = 10_000_000 * 10**18; // 10 million tokens
    
    constructor() ERC20("ReferralToken", "REF") Ownable(msg.sender) {
        _mint(msg.sender, INITIAL_SUPPLY);
    }
    
    // Function to mint new tokens (only owner)
    function mint(address to, uint256 amount) external onlyOwner {
        require(totalSupply() + amount <= MAX_SUPPLY, "Would exceed max supply");
        _mint(to, amount);
    }
    
    // Function to approve spending for the referral contract
    function approveReferralContract(address referralContract, uint256 amount) external {
        require(referralContract != address(0), "Invalid referral contract");
        _approve(msg.sender, referralContract, amount);
    }
}