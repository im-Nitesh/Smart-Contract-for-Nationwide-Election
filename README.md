# 🗳️ Nationwide Election Smart Contract – Solidity + Hardhat (BSC Testnet)

This project contains a basic Solidity smart contract for managing a nationwide election. It includes functionalities for voter registration, candidate nomination, voting, and result declaration. The contract is modularized using interfaces, and the project uses Hardhat for deployment and testing.

## Part 1: Smart Contract Development

1. Smart Contract Implementation

- The election smart contract is written in Solidity and includes:

- Voter registration

- Candidate nomination

- Voting functionality

- Result declaration

- Modular design using Solidity interfaces (voter interface, candidate interface, etc.)

## Part 2: Deployment on BSC Testnet

2. Deploy Using Hardhat

- The project is configured to deploy on the Binance Smart Chain (BSC) Testnet.

- Steps involved:

- Install and configure Hardhat

- Compile the Solidity contract

- Write deployment scripts

- Deploy the contract on BSC Testnet

- Interact with the deployed contract using MetaMask or another wallet

## Part 3: Test Cases

3. Unit Testing

- Comprehensive tests are written using:

- Hardhat

- Mocha

- Chai

- The test cases cover:

- Registration of voters

- Candidate nomination

- Valid voting

- Edge cases and data validation

## Development Commands

### Compilation

```bash
# Install dependencies
npm install

# Clean and recompile
npx hardhat clean
npx hardhat compile

# Run tests
npx hardhat test
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



## Smart Contract Address - 
`https://testnet.bscscan.com/address/0x96EE21C1169C8Fa3D82fFB5B84E0eCD30A13588d#code`
