# Quick Commands Reference

## Initial Setup Commands

```bash
# 1. Create and navigate to project directory
mkdir election-smart-contract
cd election-smart-contract

# 2. Initialize npm project
npm init -y

# 3. Install Hardhat and dependencies
npm install --save-dev hardhat
npm install --save-dev @nomicfoundation/hardhat-toolbox
npm install --save-dev @nomicfoundation/hardhat-verify
npm install dotenv

# 4. Initialize Hardhat
npx hardhat init
# Select: Create a JavaScript project

# 5. Create directory structure
mkdir -p contracts/interfaces
mkdir -p scripts
mkdir -p test
mkdir -p deployments

# 6. Create .env file
cp .env.example .env
# Edit .env with your private key and API keys
```

## Development Commands

### Compilation

```bash
# Compile all contracts
npx hardhat compile

# Clean and recompile
npx hardhat clean
npx hardhat compile

# Check for compilation errors
npx hardhat compile --force
```

### Testing

```bash
# Run all tests
npx hardhat test

# Run specific test file
npx hardhat test test/NationwideElection.test.js

# Run specific test suite
npx hardhat test --grep "Deployment"
npx hardhat test --grep "Voter Registration"
npx hardhat test --grep "Voting"

# Generate coverage report
npx hardhat coverage

# Run tests with gas reporting
REPORT_GAS=true npx hardhat test
```

### Local Development

```bash
# Start local Hardhat node
npx hardhat node

# Deploy to local node (in another terminal)
npx hardhat run scripts/deploy.js --network localhost

# Open Hardhat console
npx hardhat console --network localhost
```

## Deployment Commands

### Deploy to BSC Testnet

```bash
# Deploy contract
npx hardhat run scripts/deploy.js --network bscTestnet

# Verify contract on BSCScan
npx hardhat verify --network bscTestnet CONTRACT_ADDRESS "National General Election 2024" 7

# Example with actual address
npx hardhat verify --network bscTestnet 0x123...abc "National General Election 2024" 7
```

### Check Deployment

```bash
# View deployment info
cat deployments/bscTestnet-deployment.json

# Check contract on BSCScan
# Visit: https://testnet.bscscan.com/address/YOUR_CONTRACT_ADDRESS


### Using Hardhat Console

```bash
# Start console
npx hardhat console --network bscTestnet

# In console:
const NationwideElection = await ethers.getContractFactory("NationwideElection");
const election = NationwideElection.attach("CONTRACT_ADDRESS");

# Get election status
const status = await election.getElectionStatus();
console.log(status);

# Get all candidates
const candidates = await election.getAllCandidates();
console.log(candidates);

# Register a voter
const [commissioner] = await ethers.getSigners();
await election.connect(commissioner).registerVoter("0xVoterAddress", "ID001");

# Check if voter is registered
const isRegistered = await election.isRegisteredVoter("0xVoterAddress");
console.log(isRegistered);

# Get total voters
const totalVoters = await election.getTotalVoters();
console.log("Total Voters:", totalVoters.toString());

# Exit console
.exit
```

## Useful Hardhat Tasks

```bash
# List all available tasks
npx hardhat help

# Get account addresses
npx hardhat accounts

# Check network configuration
npx hardhat config

# Clean artifacts and cache
npx hardhat clean

# Flatten contracts (for verification)
npx hardhat flatten contracts/NationwideElection.sol > flattened.sol
```

## Debugging Commands

```bash
# Run tests with verbose output
npx hardhat test --verbose

# Run tests with stack traces
npx hardhat test --trace

# Check contract size
npx hardhat size-contracts

# Analyze gas usage
REPORT_GAS=true npx hardhat test

# Check specific transaction
npx hardhat run scripts/checkTransaction.js --network bscTestnet
```

## MetaMask Setup Commands (Manual)

```bash
# BSC Testnet Configuration
Network Name: BSC Testnet
RPC URL: https://data-seed-prebsc-1-s1.binance.org:8545
Chain ID: 97
Currency Symbol: BNB
Block Explorer: https://testnet.bscscan.com

# Get Testnet BNB
Visit: https://testnet.binance.org/faucet-smart
```

## Git Commands

```bash
# Initialize git (if not already done)
git init

# Add .gitignore
cat > .gitignore << EOF
node_modules
.env
cache
artifacts
deployments/*.json
coverage
coverage.json
typechain
typechain-types
EOF

# Initial commit
git add .
git commit -m "Initial commit: Nationwide Election Smart Contract"

# Create repository on GitHub and push
git remote add origin https://github.com/yourusername/election-smart-contract.git
git branch -M main
git push -u origin main
```

## Troubleshooting Commands

```bash
# Check Node.js version
node --version
# Should be v18.x or higher

# Check npm version
npm --version
# Should be v9.x or higher

# Clear npm cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Reset Hardhat cache
npx hardhat clean
rm -rf cache artifacts

# Check Hardhat version
npx hardhat --version

# Update Hardhat
npm update hardhat

# Check for outdated packages
npm outdated

# Update all packages
npm update
```

## Environment Variables Setup

```bash
# Create .env file
cat > .env << EOF
PRIVATE_KEY=your_private_key_here
BSC_TESTNET_RPC=https://data-seed-prebsc-1-s1.binance.org:8545
BSCSCAN_API_KEY=your_bscscan_api_key
EOF

# Verify .env is not tracked
git status

# If .env appears, add to .gitignore
echo ".env" >> .gitignore
```

## Package.json Scripts

Add these to your `package.json`:

```json
{
  "scripts": {
    "compile": "hardhat compile",
    "test": "hardhat test",
    "test:coverage": "hardhat coverage",
    "deploy:testnet": "hardhat run scripts/deploy.js --network bscTestnet",
    "deploy:local": "hardhat run scripts/deploy.js --network localhost",
    "verify": "hardhat verify --network bscTestnet",
    "interact": "hardhat run scripts/interact.js --network bscTestnet",
    "node": "hardhat node",
    "clean": "hardhat clean",
    "size": "hardhat size-contracts"
  }
}
```

Then use:

```bash
npm run compile
npm run test
npm run deploy:testnet
npm run interact -- status
```

## Performance Optimization

```bash
# Optimize contract size
npx hardhat size-contracts

# Check gas usage
REPORT_GAS=true npx hardhat test

# Analyze contract
npx hardhat compile --show-stack-traces
```

---

## Notes

- Always ensure you're on the correct network before executing commands
- Keep your private key secure and never commit it
- Test thoroughly on testnet before mainnet deployment
- Monitor gas prices and adjust as needed
- Keep backups of deployment addresses and transaction hashes