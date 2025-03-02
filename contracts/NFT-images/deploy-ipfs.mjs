import  fs  from "fs";
import  pinataSDK from "@pinata/sdk";

const pinata = new pinataSDK({ pinataJWTKey: 
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiI3Zjk5MTZjNi0yN2MwLTRlNTEtYjU3YS1kYTIyZTkxMzFjMTMiLCJlbWFpbCI6ImdhbGF4aWVsc2FnYUBnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwicGluX3BvbGljeSI6eyJyZWdpb25zIjpbeyJkZXNpcmVkUmVwbGljYXRpb25Db3VudCI6MSwiaWQiOiJGUkExIn0seyJkZXNpcmVkUmVwbGljYXRpb25Db3VudCI6MSwiaWQiOiJOWUMxIn1dLCJ2ZXJzaW9uIjoxfSwibWZhX2VuYWJsZWQiOmZhbHNlLCJzdGF0dXMiOiJBQ1RJVkUifSwiYXV0aGVudGljYXRpb25UeXBlIjoic2NvcGVkS2V5Iiwic2NvcGVkS2V5S2V5IjoiNTM1ZWJmZTE4NjgxMzMyYjQ0MGMiLCJzY29wZWRLZXlTZWNyZXQiOiIzYzljMjk3NGFkMTAyMDY3YmVmNjNmODUyM2Q5OTM1MjVjZGFjYzY3YWRhMzA0NGZiYWY0NzFmMTZkZWI0ZDYxIiwiZXhwIjoxNzY3NzUxMTEzfQ.xEwe-fJWLl2-0TRKa7fx6UeIWxFd5CLxolvsh2SamDE'
});

async function uploadToIPFS() {
    try {
        // First upload the image
        const imageStream = fs.createReadStream('./contracts/NFT-images/active.png');
        const imageOptions = {
            pinataMetadata: {
                name: 'active-nft-image',
            },
            pinataOptions: {
                cidVersion: 0,
            },
        };

        const imageRes = await pinata.pinFileToIPFS(imageStream, imageOptions);
        const imageUrl = `https://gateway.pinata.cloud/ipfs/${imageRes.IpfsHash}`;
        console.log('Image IPFS URL:', imageUrl);

        // Create metadata JSON
        const metadata = {
            name: "Web3 Referral NFT",
            description: "NFT for Web3 Referral Program",
            image: imageUrl,
            attributes: [
                {
                    trait_type: "Status",
                    value: "Active"
                }
                // Add more attributes as needed
            ]
        };

        // Upload metadata to IPFS
        const metadataOptions = {
            pinataMetadata: {
                name: 'active-nft-metadata',
            },
            pinataOptions: {
                cidVersion: 0,
            },
        };

        const metadataRes = await pinata.pinJSONToIPFS(metadata, metadataOptions);
        const metadataUrl = `https://gateway.pinata.cloud/ipfs/${metadataRes.IpfsHash}`;
        console.log('Metadata IPFS URL:', metadataUrl);
        
        return metadataUrl; // This is the URL you'll use in your smart contract
    } catch (error) {
        console.error('Error uploading to IPFS:', error);
    }
}

uploadToIPFS();