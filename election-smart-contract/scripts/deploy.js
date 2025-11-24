const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("================================================================================");
  console.log("               NATIONWIDE ELECTION CONTRACT DEPLOYMENT");
  console.log("================================================================================\n");
  
  // Get network information
  const network = hre.network.name;
  console.log("🌐 Network:", network);
  
  // Get the deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("👤 Deploying contracts with account:", deployer.address);
  
  // Check balance
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  const balanceInEth = hre.ethers.formatEther(balance);
  console.log("💰 Account balance:", balanceInEth, network === "bscTestnet" ? "BNB" : "ETH");
  
  // Check if account has sufficient balance
  if (balance === 0n) {
    console.error("\n❌ ERROR: Account has no balance!");
    console.log("\n📝 To get testnet BNB:");
    console.log("   1. Visit: https://testnet.binance.org/faucet-smart");
    console.log("   2. Connect your wallet");
    console.log("   3. Request testnet BNB");
    console.log("   4. Wait for confirmation");
    console.log("   5. Run this script again\n");
    process.exit(1);
  }
  
  // Warn if balance is low
  if (parseFloat(balanceInEth) < 0.1) {
    console.log("\n⚠️  WARNING: Balance is low. You may need more funds for deployment.");
    console.log("   Get testnet BNB from: https://testnet.binance.org/faucet-smart\n");
  }
  
  // Deployment parameters
  const electionName = process.env.ELECTION_NAME || "National General Election 2024";
  const durationInDays = parseInt(process.env.ELECTION_DURATION_DAYS) || 7;
  
  console.log("\n📋 Deployment Parameters:");
  console.log("   Election Name:", electionName);
  console.log("   Duration:", durationInDays, "days");
  console.log("   Voting Period:", durationInDays * 24, "hours");
  
  // Get the contract factory
  console.log("\n📦 Getting contract factory...");
  const NationwideElection = await hre.ethers.getContractFactory("NationwideElection");
  
  console.log("🚀 Deploying NationwideElection contract...");
  console.log("   Please wait, this may take a minute...\n");
  
  // Deploy the contract
  const election = await NationwideElection.deploy(electionName, durationInDays);
  
  console.log("⏳ Waiting for deployment transaction to be mined...");
  await election.waitForDeployment();
  
  const contractAddress = await election.getAddress();
  const deploymentTx = election.deploymentTransaction();
  
  console.log("\n✅ CONTRACT DEPLOYED SUCCESSFULLY!");
  console.log("================================================================================");
  console.log("📍 Contract Address:", contractAddress);
  console.log("🔗 Transaction Hash:", deploymentTx.hash);
  if (deploymentTx.blockNumber) {
    console.log("📦 Block Number:", deploymentTx.blockNumber);
  }
  console.log("================================================================================\n");
  
  // Verify deployment by reading contract state
  console.log("🔍 Verifying deployment...");
  try {
    const deployedElectionName = await election.electionName();
    const commissioner = await election.electionCommissioner();
    const currentPhase = await election.currentPhase();
    const startTime = await election.electionStartTime();
    const endTime = await election.electionEndTime();
    
    console.log("✓ Election Name:", deployedElectionName);
    console.log("✓ Election Commissioner:", commissioner);
    console.log("✓ Current Phase:", getPhaseLabel(currentPhase));
    console.log("✓ Start Time:", new Date(Number(startTime) * 1000).toLocaleString());
    console.log("✓ End Time:", new Date(Number(endTime) * 1000).toLocaleString());
    
    console.log("\n✅ Deployment verification successful!\n");
  } catch (error) {
    console.log("\n⚠️  Could not verify deployment:", error.message);
  }
  
  // Save deployment info
  const deploymentInfo = {
    network: network,
    contractAddress: contractAddress,
    deployer: deployer.address,
    electionName: electionName,
    durationInDays: durationInDays,
    deploymentTime: new Date().toISOString(),
    transactionHash: deploymentTx.hash,
    blockNumber: deploymentTx.blockNumber || null,
    chainId: (await hre.ethers.provider.getNetwork()).chainId.toString(),
    gasUsed: deploymentTx.gasLimit ? deploymentTx.gasLimit.toString() : null
  };
  
  // Create deployments directory if it doesn't exist
  const deploymentsDir = path.join(__dirname, '..', 'deployments');
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }
  
  // Save deployment info to file
  const deploymentFile = path.join(deploymentsDir, `${network}-deployment.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  
  console.log("💾 Deployment info saved to:", deploymentFile);
  
  // Wait for block confirmations before verification
  if (network !== "hardhat" && network !== "localhost") {
    console.log("\n⏳ Waiting for 5 block confirmations before verification...");
    const receipt = await deploymentTx.wait(5);
    console.log("✓ Received", receipt.confirmations, "confirmations");
    
    console.log("\n🔍 Attempting to verify contract on BSCScan...");
    try {
      await hre.run("verify:verify", {
        address: contractAddress,
        constructorArguments: [electionName, durationInDays],
      });
      console.log("✅ Contract verified on BSCScan successfully!");
    } catch (error) {
      if (error.message.toLowerCase().includes("already verified")) {
        console.log("✅ Contract is already verified on BSCScan!");
      } else {
        console.log("\n⚠️  Automatic verification failed:", error.message);
        console.log("\n📝 You can verify manually using:");
        console.log(`   npx hardhat verify --network ${network} ${contractAddress} "${electionName}" ${durationInDays}`);
      }
    }
  }
  
  // Print deployment summary
  console.log("\n" + "=".repeat(80));
  console.log("                         DEPLOYMENT SUMMARY");
  console.log("=".repeat(80));
  console.log("Network:                ", network);
  console.log("Contract Address:       ", contractAddress);
  console.log("Deployer:               ", deployer.address);
  console.log("Election Name:          ", electionName);
  console.log("Voting Duration:        ", durationInDays, "days");
  console.log("Commissioner:           ", deployer.address);
  console.log("Initial Phase:          ", "Registration");
  console.log("Transaction Hash:       ", deploymentTx.hash);
  console.log("=".repeat(80));
  
  // Print next steps
  console.log("\n" + "=".repeat(80));
  console.log("                            NEXT STEPS");
  console.log("=".repeat(80));
  
  console.log("\n1️⃣  ADD CONTRACT TO METAMASK:");
  console.log("   • Open MetaMask");
  console.log("   • Select BSC Testnet network");
  console.log("   • Import Token > Custom Token");
  console.log("   • Contract Address:", contractAddress);
  
  console.log("\n2️⃣  INTERACT WITH CONTRACT:");
  console.log("   • Check status:");
  console.log(`     npx hardhat run scripts/interact.js --network ${network} status`);
  console.log("   • Register voters:");
  console.log(`     npx hardhat run scripts/interact.js --network ${network} register`);
  
  console.log("\n3️⃣  VIEW ON BLOCKCHAIN EXPLORER:");
  if (network === "bscTestnet") {
    console.log("   https://testnet.bscscan.com/address/" + contractAddress);
  } else if (network === "bscMainnet") {
    console.log("   https://bscscan.com/address/" + contractAddress);
  } else {
    console.log("   (Local network - no explorer available)");
  }
  
  console.log("\n4️⃣  ELECTION PHASES:");
  console.log("   Phase 0: Registration  → Register voters");
  console.log("   Phase 1: Nomination    → Nominate candidates");
  console.log("   Phase 2: Voting        → Cast votes");
  console.log("   Phase 3: Ended         → Voting closed");
  console.log("   Phase 4: Results       → View results");
  console.log("\n   Move phases: npx hardhat run scripts/interact.js --network " + network + " phase");
  
  console.log("\n5️⃣  USEFUL COMMANDS:");
  console.log("   • View candidates:");
  console.log(`     npx hardhat run scripts/interact.js --network ${network} candidates`);
  console.log("   • Cast vote:");
  console.log(`     npx hardhat run scripts/interact.js --network ${network} vote 1`);
  console.log("   • View results (after declaration):");
  console.log(`     npx hardhat run scripts/interact.js --network ${network} results`);
  
  console.log("\n" + "=".repeat(80));
  console.log("                    DEPLOYMENT COMPLETED SUCCESSFULLY! 🎉");
  console.log("=".repeat(80) + "\n");
  
  return contractAddress;
}

// Helper function to get phase label
function getPhaseLabel(phase) {
  const phases = [
    "0 (Registration)",
    "1 (Nomination)",
    "2 (Voting)",
    "3 (Ended)",
    "4 (Results Declared)"
  ];
  return phases[Number(phase)] || "Unknown";
}

// Execute deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n" + "=".repeat(80));
    console.error("                      DEPLOYMENT FAILED ❌");
    console.error("=".repeat(80));
    console.error("\n📛 Error:", error.message);
    
    if (error.message.includes("insufficient funds")) {
      console.error("\n💡 Solution:");
      console.error("   Get testnet BNB from: https://testnet.binance.org/faucet-smart");
    } else if (error.message.includes("nonce")) {
      console.error("\n💡 Solution:");
      console.error("   Reset your MetaMask account:");
      console.error("   Settings > Advanced > Reset Account");
    } else if (error.message.includes("network")) {
      console.error("\n💡 Solution:");
      console.error("   Check your network configuration in hardhat.config.js");
      console.error("   Verify RPC URL is accessible");
    }
    
    console.error("\n📚 For more help, check:");
    console.error("   • SETUP_GUIDE.md");
    console.error("   • hardhat.config.js network settings");
    console.error("   • .env file configuration");
    console.error("\n" + "=".repeat(80) + "\n");
    
    process.exit(1);
  });