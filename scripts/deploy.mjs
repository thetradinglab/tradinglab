import hre from "hardhat";

const EXISTING_TOKEN_ADDRESS = "0x973760328D25Dd01B205B6bf7fCa71b495c0FFbb"; // Your deployed token address
const INITIAL_OWNER = "0xDC8fa247C247D0193a10D03149AfC2F89db3cd33"; // Your deployed token address
const SUBCRIPTION_NFT_ADDRESS = "0x9c558a277F2729fda949cd35d5d9c901a030eFAd";
const STORAGE_ADDRESS = "0x775428e10fD9997753b4c5647eb68141aDea1CED";//0x58F39bf1AE0355b5d57F57869Ba27Ee9AD438012 old latest 
const REFERRAL_ADDRESS = "0xDdD3741ebD8bF19c8d534179711632cbd77587Ab"
async function main() {
  // Skip token deployment, use existing token
  console.log("Using existing ReferralToken at:", EXISTING_TOKEN_ADDRESS);
  //const ReferralToken = await hre.ethers.getContractFactory("ReferralToken");
  //const referralToken = await ReferralToken.deploy();
  //await referralToken.waitForDeployment();
  //const referralTokenAddress = await referralToken.getAddress();
  //console.log("Referral Token deployed to:", referralTokenAddress);
   //Deploy SubscriptionNFT
  //const SubscriptionNFT = await hre.ethers.getContractFactory("SubscriptionNFT");
  //const subscriptionNFT = await SubscriptionNFT.deploy(INITIAL_OWNER);
  //await subscriptionNFT.waitForDeployment();
  //const subscriptionNFTAddress = await subscriptionNFT.getAddress();
  const existingSubscriptionNFT = await hre.ethers.getContractAt("SubscriptionNFT", SUBCRIPTION_NFT_ADDRESS);
  console.log("Using existing SubscriptionNFT at:", SUBCRIPTION_NFT_ADDRESS);
  //console.log("SubscriptionNFT deployed to:", subscriptionNFTAddress);

  //const referralStorage = await hre.ethers.getContractFactory("ReferralStorage");
  //const ReferralStorage = await referralStorage.deploy();
  //await ReferralStorage.waitForDeployment();
  //const StorageAddress = await ReferralStorage.getAddress();
  //console.log("Storage deployed to:", StorageAddress);
  console.log("Using existing storage address: ", STORAGE_ADDRESS);
  
  //await existingSubscriptionNFT.setActiveBaseURI("https://gateway.pinata.cloud/ipfs/QmUzmVgF7yiU2cvEX8p2hsx1UVNsnjAKBZCuJhvyhHkWfH");
  //await existingSubscriptionNFT.setExpiredBaseURI("https://gateway.pinata.cloud/ipfs/QmUCGFHX4jdkiFpFMQoh8y6ugt9eY4uRsiLRx3i8A62efu");

  console.log("Using existing SubscriptionNFT at:", SUBCRIPTION_NFT_ADDRESS);
  //Deploy only MultiLevelReferral
  //const Referral = await hre.ethers.getContractFactory("ReferralV1");
  //console.log("Deloying referralv1 contract");
  //const referral = await Referral.deploy();
  //await referral.waitForDeployment();
  //const referralAddress = await referral.getAddress();
  //console.log("Referral deployed to: ", referralAddress);
  console.log("Using referralv1: ", REFERRAL_ADDRESS)
  const referralLive = await hre.ethers.getContractAt("ReferralV1", REFERRAL_ADDRESS);
  await existingSubscriptionNFT.setReferralContract(REFERRAL_ADDRESS);
  await referralLive.setReferralStorage(STORAGE_ADDRESS);
  await referralLive.setRewardToken("0x973760328D25Dd01B205B6bf7fCa71b495c0FFbb");
  await referralLive.setSubscriptionNFT("0x9c558a277F2729fda949cd35d5d9c901a030eFAd");
  // Log verification info
  console.log("\nVerify with: ");
  console.log(`npx hardhat verify --network polygon ${REFERRAL_ADDRESS}`);
 
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });