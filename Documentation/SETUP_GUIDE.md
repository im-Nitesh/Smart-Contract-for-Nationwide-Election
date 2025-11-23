# Nationwide Election Smart Contract - Complete Setup Guide

## Table of Contents
1. [Project Overview](#project-overview)
2. [Prerequisites](#prerequisites)
3. [Installation](#installation)
4. [Smart Contract Architecture](#smart-contract-architecture)
5. [Deployment to BSC Testnet](#deployment-to-bsc-testnet)
6. [Testing](#testing)
7. [Interacting with the Contract](#interacting-with-the-contract)
8. [Security Considerations](#security-considerations)
9. [Troubleshooting](#troubleshooting)

---

## Project Overview

This project implements a comprehensive smart contract system for managing a nationwide election on the Binance Smart Chain (BSC) Testnet. The system provides:

- **Voter Registration**: Secure registration with national ID verification
- **Candidate Nomination**: Multi-candidate support with party affiliation
- **Voting System**: One person, one vote with transparency
- **Result Declaration**: Automated winner calculation
- **Phase Management**: Structured election phases with commissioner control

### Key Features
✅ Modular design with separate interfaces  
✅ Role-based access control  
✅ Batch operations for efficiency  
✅ Emergency stop functionality  
✅ Comprehensive event logging  
✅ Gas-optimized operations  

---

## Prerequisites

### Software Requirements
- **Node.js**: v18.x or higher
- **npm**: v9.x or higher
- **Git**: Latest version
- **MetaMask**: Browser extension

### Knowledge Requirements
- Basic understanding of Solidity
- Familiarity with Hardhat
- Knowledge of blockchain concepts
- Understanding of smart contract testing

### Accounts Needed
- MetaMask wallet with BSC Testnet configured
- BSC Testnet BNB (from faucet)
- BSCScan API key (optional, for verification)

---

## Installation

### Step 1: Create Project Directory

```bash
mkdir election-smart-contract
cd election-smart-contract
```

### Step 2: Initialize Node.js Project

```bash
npm init -y
```

### Step 3: Install Hardhat and Dependencies

```bash
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox @nomicfoundation/hardhat-verify
npm install dotenv
```

### Step 4: Initialize Hardhat

```bash
npx hardhat init
```

Select "Create a JavaScript project" when prompted.

### Step 5: Create Project Structure

```bash
mkdir -p contracts/interfaces
mkdir -p scripts
mkdir -p test
mkdir -p deployments
```

### Step 6: Create Contract Files

Create the following files in the `contracts` directory:

1. **contracts/interfaces/IVoterManagement.sol**
2. **contracts/interfaces/ICandidateManagement.sol**
3. **contracts/NationwideElection.sol**

(Use the provided contract code from artifacts)

### Step 7: Configure Environment Variables

Create `.env` file:

```bash
# Copy from .env.example
cp .env.example .env
```

Edit `.env` with your details:

```env
PRIVATE_KEY=your_metamask_private_key_here
BSC_TESTNET_RPC=https://data-seed-prebsc-1-s1.binance.org:8545
BSCSCAN_API_KEY=your_bscscan_api_key
```

**⚠️ Important**: Never commit `.env` to version control!

Add to `.gitignore`:

```bash
echo ".env" >> .gitignore
echo "node_modules" >> .gitignore
echo "cache" >> .gitignore
echo "artifacts" >> .gitignore
echo "deployments/*.json" >> .gitignore
```

### Step 8: Configure Hardhat

Replace `hardhat.config.js` with the provided configuration.

---

## Smart Contract Architecture

### Design Pattern

The contract follows a modular architecture with three main components:

```
┌─────────────────────────────────────────┐
│     NationwideElection Contract         │
├─────────────────────────────────────────┤
│  Implements:                            │
│  - IVoterManagement                     │
│  - ICandidateManagement                 │
├─────────────────────────────────────────┤
│  Core Features:                         │
│  - Phase Management                     │
│  - Voting Logic                         │
│  - Results Calculation                  │
│  - Access Control                       │
└─────────────────────────────────────────┘
```

### Interface: IVoterManagement

**Purpose**: Defines voter registration and management operations

**Key Functions**:
- `registerVoter()`: Register a single voter
- `batchRegisterVoters()`: Register multiple voters efficiently
- `isRegisteredVoter()`: Check registration status
- `hasVoterVoted()`: Check voting status
- `getVoter()`: Retrieve voter details

**Data Structure**:
```solidity
struct Voter {
    bool isRegistered;
    bool hasVoted;
    uint256 votedCandidateId;
    uint256 registrationTime;
    string nationalId;
}
```

### Interface: ICandidateManagement

**Purpose**: Defines candidate nomination and management operations

**Key Functions**:
- `nominateCandidate()`: Nominate a new candidate
- `getCandidate()`: Retrieve candidate details
- `getAllCandidates()`: Get all candidates
- `deactivateCandidate()`: Remove candidate from ballot

**Data Structure**:
```solidity
struct Candidate {
    uint256 id;
    string name;
    string party;
    string manifesto;
    uint256 voteCount;
    bool isActive;
    uint256 nominationTime;
}
```

### Election Phases

The election progresses through structured phases:

1. **Registration** (0): Voters are registered
2. **Nomination** (1): Candidates are nominated
3. **Voting** (2): Active voting period
4. **Ended** (3): Voting closed, results pending
5. **ResultsDeclared** (4): Results published

### Access Control

**Commissioner Role**:
- Register voters
- Nominate candidates
- Manage election phases
- Emergency controls
- View all data

**Voter Role**:
- Cast single vote
- View own voting status
- View candidates
- View public results

### Security Features

1. **Reentrancy Protection**: No external calls in critical functions
2. **Access Control**: Role-based permissions with modifiers
3. **Input Validation**: Comprehensive checks on all inputs
4. **State Management**: Strict phase progression
5. **Emergency Stop**: Commissioner can halt election
6. **Event Logging**: All critical actions emit events

---

## Deployment to BSC Testnet

### Step 1: Get Testnet BNB

1. Visit the BSC Testnet Faucet: https://testnet.binance.org/faucet-smart
2. Connect your MetaMask wallet
3. Request testnet BNB (0.5 BNB should be sufficient)
4. Wait for confirmation

### Step 2: Add BSC Testnet to MetaMask

**Network Details**:
- Network Name: BSC Testnet
- RPC URL: https://data-seed-prebsc-1-s1.binance.org:8545
- Chain ID: 97
- Currency Symbol: BNB
- Block Explorer: https://testnet.bscscan.com

### Step 3: Export Private Key from MetaMask

⚠️ **Security Warning**: Never share your private key!

1. Open MetaMask
2. Click on account menu (three dots)
3. Select "Account Details"
4. Click "Export Private Key"
5. Enter password
6. Copy the private key
7. Paste it in your `.env` file

### Step 4: Compile Contracts

```bash
npx hardhat compile
```

Expected output:
```
Compiled 3 Solidity files successfully
```

### Step 5: Deploy to BSC Testnet

```bash
npx hardhat run scripts/deploy.js --network bscTestnet
```

**Deployment Process**:
1. Checks deployer balance
2. Deploys contract with gas estimation
3. Waits for confirmations
4. Saves deployment info
5. Attempts contract verification

**Expected Output**:
```
Starting deployment process...
Network: bscTestnet
Deploying contracts with account: 0x...
Account balance: 0.5 BNB

Deployment Parameters:
Election Name: National General Election 2024
Duration: 7 days

Deploying NationwideElection contract...

✅ Contract deployed successfully!
Contract Address: 0x...
Transaction Hash: 0x...

Verifying deployment...
Deployed Election Name: National General Election 2024
Election Commissioner: 0x...
Current Phase: 0 (Registration)

📄 Deployment info saved to: deployments/bscTestnet-deployment.json

🔍 Verifying contract on BSCScan...
✅ Contract verified on BSCScan

================================================================================
DEPLOYMENT SUMMARY
================================================================================
Contract Address:      0x...
Network:               bscTestnet
Election Name:         National General Election 2024
Voting Duration:       7 days
Commissioner:          0x...
Current Phase:         Registration
================================================================================
```

### Step 6: Verify Deployment

Check on BSCScan:
```
https://testnet.bscscan.com/address/YOUR_CONTRACT_ADDRESS
```

---

## Testing

### Running All Tests

```bash
npx hardhat test
```

### Running Specific Test Suite

```bash
npx hardhat test --grep "Deployment"
npx hardhat test --grep "Voter Registration"
npx hardhat test --grep "Voting"
```

### Test Coverage

```bash
npx hardhat coverage
```

### Test Categories

#### 1. Deployment Tests
- ✅ Correct initialization
- ✅ Parameter validation
- ✅ Initial state verification

#### 2. Voter Registration Tests
- ✅ Single voter registration
- ✅ Batch registration
- ✅ Duplicate prevention
- ✅ Access control
- ✅ Input validation

#### 3. Candidate Nomination Tests
- ✅ Nomination in correct phase
- ✅ Candidate retrieval
- ✅ Deactivation
- ✅ Validation checks

#### 4. Phase Management Tests
- ✅ Phase progression
- ✅ Phase restrictions
- ✅ Prerequisite checks

#### 5. Voting Tests
- ✅ Vote casting
- ✅ Double vote prevention
- ✅ Unregistered voter prevention
- ✅ Invalid candidate prevention

#### 6. Results Tests
- ✅ Winner calculation
- ✅ Vote counting
- ✅ Results publication
- ✅ Access control

#### 7. Edge Cases
- ✅ No votes scenario
- ✅ Tie handling
- ✅ Large scale operations
- ✅ Emergency scenarios

### Expected Test Results

```
  NationwideElection
    Deployment
      ✓ Should set the correct election name
      ✓ Should set the commissioner correctly
      ✓ Should initialize in Registration phase
      ✓ Should set correct election duration
      ✓ Should initialize counters to zero
      ✓ Should revert with zero duration

    Voter Registration
      ✓ Should allow commissioner to register a voter
      ✓ Should allow batch voter registration
      ✓ Should prevent non-commissioner from registering voters
      ✓ Should prevent duplicate voter registration
      ... (more tests)

  75 passing (5s)
```

---

## Interacting with the Contract

### Using Hardhat Scripts

#### 1. Check Election Status

```bash
npx hardhat run scripts/interact.js --network bscTestnet status
```

#### 2. Register Voters

```bash
npx hardhat run scripts/interact.js --network bscTestnet register
```

#### 3. Nominate Candidates

```bash
npx hardhat run scripts/interact.js --network bscTestnet nominate
```

#### 4. Move to Next Phase

```bash
npx hardhat run scripts/interact.js --network bscTestnet phase
```

#### 5. Cast Vote

```bash
npx hardhat run scripts/interact.js --network bscTestnet vote 1
```

#### 6. View Results

```bash
npx hardhat run scripts/interact.js --network bscTestnet results
```

### Using Hardhat Console

Start interactive console:

```bash
npx hardhat console --network bscTestnet
```

Load contract:

```javascript
const NationwideElection = await ethers.getContractFactory("NationwideElection");
const election = NationwideElection.attach("YOUR_CONTRACT_ADDRESS");

// Get election status
const status = await election.getElectionStatus();
console.log(status);

// Register a voter
const [commissioner] = await ethers.getSigners();
await election.connect(commissioner).registerVoter(
  "0xVoterAddress",
  "NATIONAL_ID_001"
);

// Check if registered
const isRegistered = await election.isRegisteredVoter("0xVoterAddress");
console.log("Is Registered:", isRegistered);
```

### Using MetaMask and BSCScan

1. **Go to BSCScan**: https://testnet.bscscan.com/address/YOUR_CONTRACT_ADDRESS
2. **Click "Contract" tab**
3. **Click "Write Contract"**
4. **Connect MetaMask**
5. **Call functions directly**

**Example: Register Voter**
- Function: `registerVoter`
- Parameters:
  - `_voterAddress`: 0x123...
  - `_nationalId`: "ID12345"
- Click "Write"
- Confirm in MetaMask

---

## Security Considerations

### Smart Contract Security

#### 1. Access Control
- ✅ Commissioner-only functions protected
- ✅ Voter-specific operations validated
- ✅ Public read functions available

#### 2. Input Validation
- ✅ Address zero checks
- ✅ Empty string prevention
- ✅ Array length validation
- ✅ ID range checks

#### 3. State Management
- ✅ Reentrancy protection
- ✅ Phase-based restrictions
- ✅ Double-voting prevention
- ✅ Duplicate ID prevention

#### 4. Upgradeability
- ⚠️ Contract is NOT upgradeable (by design)
- Commissioner role can be transferred
- Emergency stop available

### Private Key Security

**DO NOT**:
- ❌ Commit `.env` to Git
- ❌ Share private keys
- ❌ Use production keys for testing
- ❌ Store keys in plain text on shared systems

**DO**:
- ✅ Use environment variables
- ✅ Use hardware wallets for mainnet
- ✅ Keep backups secure
- ✅ Rotate keys periodically

### Gas Optimization

The contract is optimized for gas efficiency:
- Batch operations for multiple voters
- Packed storage variables
- Efficient loops and conditionals
- Event emissions instead of storage where appropriate

**Typical Gas Costs** (BSC Testnet):
- Deploy Contract: ~3,500,000 gas
- Register Single Voter: ~120,000 gas
- Batch Register (10 voters): ~800,000 gas
- Nominate Candidate: ~180,000 gas
- Cast Vote: ~90,000 gas

---

## Troubleshooting

### Common Issues

#### Issue 1: Deployment Fails - "Insufficient Funds"

**Problem**: Not enough BNB for gas fees

**Solution**:
```bash
# Check balance
npx hardhat run --network bscTestnet scripts/checkBalance.js

# Get testnet BNB from faucet
# Visit: https://testnet.binance.org/faucet-smart
```

#### Issue 2: "Nonce too high" Error

**Problem**: Transaction nonce mismatch

**Solution**:
```bash
# Reset MetaMask account
# MetaMask > Settings > Advanced > Reset Account
```

#### Issue 3: Contract Verification Fails

**Problem**: BSCScan API issues or timing

**Solution**:
```bash
# Manual verification
npx hardhat verify --network bscTestnet CONTRACT_ADDRESS "National General Election 2024" 7
```

#### Issue 4: "Already voted" Error

**Problem**: Attempting to vote twice

**Solution**:
```javascript
// Check voting status first
const hasVoted = await election.hasVoterVoted(voterAddress);
if (hasVoted) {
  console.log("Already voted!");
}
```

#### Issue 5: "Not in correct election phase"

**Problem**: Trying to perform action in wrong phase

**Solution**:
```javascript
// Check current phase
const phase = await election.currentPhase();
// 0=Registration, 1=Nomination, 2=Voting, 3=Ended, 4=Results
console.log("Current Phase:", phase);
```

### Debug Mode

Enable verbose logging:

```javascript
// In hardhat.config.js
module.exports = {
  // ...
  networks: {
    bscTestnet: {
      // ...
      loggingEnabled: true
    }
  }
};
```

### Getting Help

If you encounter issues:

1. **Check Logs**: Look at transaction logs on BSCScan
2. **Review Events**: Check emitted events for clues
3. **Test Locally**: Deploy to Hardhat network first
4. **Check Gas**: Ensure sufficient gas limits
5. **Verify Network**: Confirm connected to correct network

---

## Project Structure

```
election-smart-contract/
├── contracts/
│   ├── interfaces/
│   │   ├── IVoterManagement.sol
│   │   └── ICandidateManagement.sol
│   └── NationwideElection.sol
├── scripts/
│   ├── deploy.js
│   └── interact.js
├── test/
│   └── NationwideElection.test.js
├── deployments/
│   └── bscTestnet-deployment.json
├── hardhat.config.js
├── package.json
├── .env
├── .env.example
├── .gitignore
└── README.md
```

---

## Next Steps

After successful deployment:

1. **Test Thoroughly**: Run all test scenarios
2. **Document Addresses**: Save all deployed addresses
3. **Create Frontend**: Build UI for user interaction
4. **Add Features**: Consider additional functionality
5. **Audit**: Get professional security audit for production
6. **Deploy Mainnet**: Deploy to BSC Mainnet when ready

---

## Additional Resources

- **Hardhat Documentation**: https://hardhat.org/docs
- **Solidity Documentation**: https://docs.soliditylang.org
- **BSC Documentation**: https://docs.binance.org
- **OpenZeppelin**: https://docs.openzeppelin.com
- **Ethers.js**: https://docs.ethers.org

---

## License

MIT License - See LICENSE file for details

---

## Contact

For questions or support regarding this project, please create an issue in the repository.

---

**Last Updated**: November 2024  
**Version**: 1.0.0