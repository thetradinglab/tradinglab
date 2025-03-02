// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract SubscriptionNFT is ERC721, Ownable {
    uint256 private _tokenIdCounter;
    mapping(uint256 => uint256) private _expiryTimes;
    address public referralContract;

    constructor(address initialOwner) 
    ERC721("SubsNFT", "SUB")
    Ownable(initialOwner) 
    {}


    using Strings for uint256;

    struct NFTDetails {
        uint256 expirationTimeStamp;
    }

    mapping(uint256 => NFTDetails) public nftDetails;

    string private activeBaseURI;
    string private inactiveBaseURI;
    
    uint256 public constant SUB_DURATION = 3 minutes;

    event NFTMinted(uint256 indexed tokenId, address indexed to, uint256 expirationTime);
    event NFTExpired(uint256 indexed tokenId);
    event NFTRenewed(uint256 indexed tokenId, uint256 newExpirationTime);
    
    function setReferralContract(address _referralContract) external onlyOwner {
        referralContract = _referralContract;
    }

    function mint(address to) external returns (uint256) {
        require(msg.sender == referralContract, "Only referral contract can mint");

        _tokenIdCounter++;
        uint256 tokenId = _tokenIdCounter;
        
        _mint(to, tokenId);

        uint256 newExpirationTime = block.timestamp + SUB_DURATION;
        nftDetails[tokenId] = NFTDetails(newExpirationTime);
        emit NFTMinted(tokenId, to, block.timestamp + SUB_DURATION);

        return tokenId;
    }

    function timeUntilExpired(uint256 tokenId) external view returns (uint256) {
        _ownerOf(tokenId);

        NFTDetails memory details = nftDetails[tokenId];
        if (block.timestamp >= details.expirationTimeStamp) {
            return 0;
        }

        return details.expirationTimeStamp - block.timestamp;
    }

    function renewSubscription(uint256 tokenId, address user) external {
        require(msg.sender == referralContract, "Only referral contract can renew");
        require(ownerOf(tokenId) == user, "Not the NFT owner");
        uint256 newExpirationTime = block.timestamp + SUB_DURATION;
        nftDetails[tokenId] = NFTDetails(newExpirationTime);
        emit NFTRenewed(tokenId, newExpirationTime);
    }

    function isActive(uint256 tokenId) public view returns (bool) {
        // Will revert if token doesn't exist
        _ownerOf(tokenId);
        NFTDetails memory details = nftDetails[tokenId];
        
        return block.timestamp < details.expirationTimeStamp;
    }

    //function batchSetActiveStatuses() {
    //  
    //}

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _ownerOf(tokenId);
        
        bool isCurrentlyActive = block.timestamp < nftDetails[tokenId].expirationTimeStamp;
        string memory baseURI = isCurrentlyActive ? activeBaseURI : inactiveBaseURI;

        return string(abi.encodePacked(baseURI));
    }
    

    function setActiveBaseURI(string memory _newBaseURI) public onlyOwner {
        activeBaseURI = _newBaseURI;
    }
    
    function setExpiredBaseURI(string memory _newBaseURI) public onlyOwner {
        inactiveBaseURI = _newBaseURI;
    }
}
