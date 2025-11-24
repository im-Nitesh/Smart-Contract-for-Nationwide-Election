const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("================================================================================");
  console.log("           SMART CONTRACT VERIFICATION TOOL");
  console.log("================================================================================\n");

  // Get contract address from command line or use default
  const contractAddress = process.argv[2] || "0x96EE21C1169C8Fa3D82fFB5B84E0eCD30A13588d";
  
  console.log("📍 Contract Address:", contractAddress);
  console.log("🌐 Network:", hre.network.name);

  // Try to load constructor arguments from deployment file
  let electionName = "National General Election 2024";
  let durationInDays = 7;

  const deploymentFile = path.join(__dirname, '..', 'deployments', `${hre.network.name}-deployment.json`);
  
  if (fs.existsSync(deploymentFile)) {
    try {
      const deploymentInfo = JSON.parse(fs.readFileSync(deploymentFile, 'utf8'));
      electionName = deploymentInfo.electionName || electionName;
      durationInDays = deploymentInfo.durationInDays || durationInDays;
      console.log("✓ Loaded constructor arguments from deployment file");
    } catch (error) {
      console.log("⚠️  Could not load deployment file, using default arguments");
    }
  } else {
    console.log("⚠️  No deployment file found, using default arguments");
  }

  console.log("\n📋 Constructor Arguments:");
  console.log("   Election Name:", electionName);
  console.log("   Duration:", durationInDays, "days");

  // Verify network configuration
  console.log("\n🔧 Network Configuration:");
  const network = await hre.ethers.provider.getNetwork();
  console.log("   Chain ID:", network.chainId.toString());
  
  if (hre.network.name === "bscTestnet" && network.chainId !== 97n) {
    console.log("\n⚠️  WARNING: You selected bscTestnet but Chain ID doesn't match (expected 97)");
    console.log("   Please check your network configuration.\n");
    return;
  }

  if (hre.network.name === "bscMainnet" && network.chainId !== 56n) {
    console.log("\n⚠️  WARNING: You selected bscMainnet but Chain ID doesn't match (expected 56)");
    console.log("   Please check your network configuration.\n");
    return;
  }

  // Check if contract exists at address
  console.log("\n🔍 Checking if contract exists...");
  const code = await hre.ethers.provider.getCode(contractAddress);
  
  if (code === "0x") {
    console.log("❌ No contract found at this address!");
    console.log("\n💡 Possible reasons:");
    console.log("   1. Wrong network (are you on testnet or mainnet?)");
    console.log("   2. Incorrect contract address");
    console.log("   3. Contract not deployed yet");
    console.log("\n📝 Current network:", hre.network.name);
    console.log("   Make sure you're on the same network where you deployed.\n");
    return;
  }

  console.log("✓ Contract found at address");

  // Try to read contract to verify it's the correct one
  try {
    console.log("\n🔍 Reading contract data...");
    const NationwideElection = await hre.ethers.getContractFactory("NationwideElection");
    const election = NationwideElection.attach(contractAddress);
    
    const contractElectionName = await election.electionName();
    const commissioner = await election.electionCommissioner();
    const currentPhase = await election.currentPhase();
    
    console.log("✓ Successfully connected to contract");
    console.log("   Election Name:", contractElectionName);
    console.log("   Commissioner:", commissioner);
    console.log("   Current Phase:", getPhaseLabel(currentPhase));
    
    // Update constructor arguments if they differ
    if (contractElectionName !== electionName) {
      console.log("\n⚠️  Constructor argument mismatch detected!");
      console.log("   Updating election name to:", contractElectionName);
      electionName = contractElectionName;
    }
    
  } catch (error) {
    console.log("⚠️  Could not read contract data:", error.message);
    console.log("   Proceeding with verification anyway...");
  }

  // Check API key
  console.log("\n🔑 Checking BSCScan API key...");
  if (!process.env.BSCSCAN_API_KEY) {
    console.log("⚠️  No BSCScan API key found in environment!");
    console.log("\n💡 To verify, you need a BSCScan API key:");
    console.log("   1. Go to: https://bscscan.com/myapikey");
    console.log("   2. Create an account and get an API key");
    console.log("   3. Add to .env file: BSCSCAN_API_KEY=your_key_here");
    console.log("\n   Attempting verification anyway (might fail)...\n");
  } else {
    console.log("✓ API key found");
  }

  console.log("\n🚀 Starting verification process...");
  console.log("   This may take 30-60 seconds...\n");

  try {
    await hre.run("verify:verify", {
      address: contractAddress,
      constructorArguments: [electionName, durationInDays],
    });

    console.log("\n" + "=".repeat(80));
    console.log("✅ CONTRACT VERIFIED SUCCESSFULLY!");
    console.log("=".repeat(80));
    
    const explorerUrl = hre.network.name === "bscTestnet" 
      ? `https://testnet.bscscan.com/address/${contractAddress}#code`
      : `https://bscscan.com/address/${contractAddress}#code`;
    
    console.log("\n🎉 Your contract is now verified and publicly visible!");
    console.log("\n🔗 View on BSCScan:");
    console.log("   " + explorerUrl);
    
    console.log("\n📝 What this means:");
    console.log("   ✓ Source code is now public and auditable");
    console.log("   ✓ Anyone can verify the bytecode matches the source");
    console.log("   ✓ Users can interact with contract directly on BSCScan");
    console.log("   ✓ Contract ABI is available");
    console.log("   ✓ Read/Write functions accessible via BSCScan UI");
    
    console.log("\n💡 Next Steps:");
    console.log("   1. Visit the BSCScan link above");
    console.log("   2. Check the 'Contract' tab");
    console.log("   3. Try 'Read Contract' to view election status");
    console.log("   4. Try 'Write Contract' to interact (connect MetaMask)");
    
    console.log("\n" + "=".repeat(80) + "\n");

  } catch (error) {
    const errorMsg = error.message.toLowerCase();
    
    if (errorMsg.includes("already verified")) {
      console.log("\n" + "=".repeat(80));
      console.log("✅ CONTRACT ALREADY VERIFIED!");
      console.log("=".repeat(80));
      console.log("\nThis contract was verified previously.\n");
      
      const explorerUrl = hre.network.name === "bscTestnet"
        ? `https://testnet.bscscan.com/address/${contractAddress}#code`
        : `https://bscscan.com/address/${contractAddress}#code`;
      
      console.log("🔗 View verified contract:");
      console.log("   " + explorerUrl + "\n");
      
    } else if (errorMsg.includes("does not have bytecode")) {
      console.log("\n" + "=".repeat(80));
      console.log("❌ VERIFICATION FAILED: Contract Not Found");
      console.log("=".repeat(80));
      console.log("\nThe contract address does not contain any deployed code.\n");
      console.log("💡 Troubleshooting:");
      console.log("   1. Verify you're on the correct network:");
      console.log("      Current network: " + hre.network.name);
      console.log("      Chain ID: " + network.chainId.toString());
      console.log("\n   2. Check the contract address is correct:");
      console.log("      " + contractAddress);
      console.log("\n   3. Ensure the contract is deployed:");
      console.log("      npx hardhat run scripts/deploy.js --network " + hre.network.name);
      console.log("\n   4. Check deployment file:");
      console.log("      cat deployments/" + hre.network.name + "-deployment.json\n");
      
    } else if (errorMsg.includes("invalid api key") || errorMsg.includes("missing api key")) {
      console.log("\n" + "=".repeat(80));
      console.log("❌ VERIFICATION FAILED: API Key Issue");
      console.log("=".repeat(80));
      console.log("\nYour BSCScan API key is missing or invalid.\n");
      console.log("💡 Solution:");
      console.log("   1. Visit: https://bscscan.com/myapikey");
      console.log("   2. Register/Login to BSCScan");
      console.log("   3. Generate an API key");
      console.log("   4. Add to your .env file:");
      console.log("      BSCSCAN_API_KEY=YOUR_API_KEY_HERE");
      console.log("\n   Current .env location: " + path.join(__dirname, '..', '.env'));
      console.log("   Make sure the file exists and contains your API key.\n");
      
    } else if (errorMsg.includes("rate limit")) {
      console.log("\n" + "=".repeat(80));
      console.log("❌ VERIFICATION FAILED: Rate Limit");
      console.log("=".repeat(80));
      console.log("\nBSCScan API rate limit reached.\n");
      console.log("💡 Solution:");
      console.log("   • Wait a few minutes and try again");
      console.log("   • Check your API key tier limits on BSCScan\n");
      
    } else {
      console.log("\n" + "=".repeat(80));
      console.log("❌ VERIFICATION FAILED");
      console.log("=".repeat(80));
      console.log("\nError:", error.message + "\n");
      console.log("💡 Common Solutions:");
      console.log("   1. Constructor Arguments Mismatch:");
      console.log("      • Verify the election name and duration match deployment");
      console.log("      • Current: \"" + electionName + "\", " + durationInDays + " days");
      console.log("\n   2. Network Issues:");
      console.log("      • Check internet connection");
      console.log("      • Try again in a few moments");
      console.log("\n   3. API Configuration:");
      console.log("      • Verify hardhat.config.js has correct BSCScan config");
      console.log("      • Check .env file has BSCSCAN_API_KEY");
      console.log("\n   4. Manual Verification:");
      console.log("      • Visit BSCScan directly");
      console.log("      • Use the 'Verify & Publish' feature");
      console.log("      • Upload the flattened contract");
      console.log("\n📚 Documentation:");
      console.log("   • Hardhat: https://hardhat.org/plugins/nomiclabs-hardhat-etherscan");
      console.log("   • BSCScan: https://docs.bscscan.com/");
      console.log("=".repeat(80) + "\n");
    }
  }
}

function getPhaseLabel(phase) {
  const phases = [
    "Registration",
    "Nomination", 
    "Voting",
    "Ended",
    "Results Declared"
  ];
  return phases[Number(phase)] || "Unknown";
}

// Execute verification
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n💥 Unexpected Error:", error.message);
    console.error("\nStack trace:", error.stack);
    process.exit(1);
  });