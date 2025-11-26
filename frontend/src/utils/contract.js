import { ethers } from 'ethers';
import NationwideElectionABI from '../contracts/NationwideElection.json';

// Replace with your deployed contract address
const CONTRACT_ADDRESS = "0x96EE21C1169C8Fa3D82fFB5B84E0eCD30A13588d";

// BSC Testnet Chain ID
const BSC_TESTNET_CHAIN_ID = '0x61'; // 97 in decimal
const BSC_MAINNET_CHAIN_ID = '0x38'; // 56 in decimal

export const checkMetaMask = () => {
  if (typeof window.ethereum === 'undefined') {
    throw new Error('MetaMask is not installed. Please install MetaMask browser extension.');
  }
  return true;
};

export const connectWallet = async () => {
  try {
    checkMetaMask();
    
    // Request account access
    const accounts = await window.ethereum.request({ 
      method: 'eth_requestAccounts' 
    });
    
    return accounts[0];
  } catch (error) {
    console.error('Error connecting wallet:', error);
    if (error.code === 4001) {
      throw new Error('Please connect to MetaMask.');
    }
    throw error;
  }
};

export const checkNetwork = async () => {
  try {
    const chainId = await window.ethereum.request({ method: 'eth_chainId' });
    
    if (chainId !== BSC_TESTNET_CHAIN_ID && chainId !== BSC_MAINNET_CHAIN_ID) {
      return false;
    }
    return true;
  } catch (error) {
    console.error('Error checking network:', error);
    return false;
  }
};

export const switchToBSCNetwork = async (useTestnet = true) => {
  try {
    const targetChainId = useTestnet ? BSC_TESTNET_CHAIN_ID : BSC_MAINNET_CHAIN_ID;
    
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: targetChainId }],
    });
    
    return true;
  } catch (error) {
    // This error code indicates that the chain has not been added to MetaMask
    if (error.code === 4902) {
      try {
        const networkParams = useTestnet ? {
          chainId: BSC_TESTNET_CHAIN_ID,
          chainName: 'BSC Testnet',
          nativeCurrency: {
            name: 'BNB',
            symbol: 'BNB',
            decimals: 18
          },
          rpcUrls: ['https://data-seed-prebsc-1-s1.binance.org:8545/'],
          blockExplorerUrls: ['https://testnet.bscscan.com/']
        } : {
          chainId: BSC_MAINNET_CHAIN_ID,
          chainName: 'Binance Smart Chain',
          nativeCurrency: {
            name: 'BNB',
            symbol: 'BNB',
            decimals: 18
          },
          rpcUrls: ['https://bsc-dataseed.binance.org/'],
          blockExplorerUrls: ['https://bscscan.com/']
        };
        
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [networkParams],
        });
        
        return true;
      } catch (addError) {
        console.error('Error adding network:', addError);
        throw new Error('Failed to add BSC network to MetaMask');
      }
    }
    throw error;
  }
};

export const getProvider = () => {
  checkMetaMask();
  return new ethers.providers.Web3Provider(window.ethereum);
};

export const getSigner = async () => {
  const provider = getProvider();
  return provider.getSigner();
};

export const getContract = async () => {
  const signer = await getSigner();
  return new ethers.Contract(CONTRACT_ADDRESS, NationwideElectionABI.abi, signer);
};

export const getContractReadOnly = () => {
  const provider = getProvider();
  return new ethers.Contract(CONTRACT_ADDRESS, NationwideElectionABI.abi, provider);
};

// Contract Functions
export const getElectionCommissioner = async () => {
  try {
    const contract = getContractReadOnly();
    return await contract.electionCommissioner();
  } catch (error) {
    console.error('Error getting commissioner:', error);
    throw error;
  }
};

export const getElectionStatus = async () => {
  try {
    const contract = getContractReadOnly();
    const status = await contract.getElectionStatus();
    
    return {
      name: status.name,
      phase: status.phase,
      startTime: status.startTime.toNumber(),
      endTime: status.endTime.toNumber(),
      totalVoters: status.totalVoters.toNumber(),
      totalCandidates: status.totalCandidates.toNumber(),
      votesCast: status.votesCast.toNumber(),
      resultsAvailable: status.resultsAvailable
    };
  } catch (error) {
    console.error('Error getting election status:', error);
    throw error;
  }
};

export const getAllCandidates = async () => {
  try {
    const contract = getContractReadOnly();
    const candidates = await contract.getAllCandidates();
    
    return candidates.map(c => ({
      id: c.id.toNumber(),
      name: c.name,
      party: c.party,
      manifesto: c.manifesto,
      voteCount: c.voteCount.toNumber(),
      isActive: c.isActive,
      nominationTime: c.nominationTime.toNumber()
    }));
  } catch (error) {
    console.error('Error getting candidates:', error);
    throw error;
  }
};

export const isRegisteredVoter = async (address) => {
  try {
    const contract = getContractReadOnly();
    return await contract.isRegisteredVoter(address);
  } catch (error) {
    console.error('Error checking voter registration:', error);
    throw error;
  }
};

export const hasVoterVoted = async (address) => {
  try {
    const contract = getContractReadOnly();
    return await contract.hasVoterVoted(address);
  } catch (error) {
    console.error('Error checking vote status:', error);
    throw error;
  }
};

export const registerVoter = async (voterAddress, nationalId) => {
  try {
    const contract = await getContract();
    const tx = await contract.registerVoter(voterAddress, nationalId);
    
    await tx.wait();
    return tx;
  } catch (error) {
    console.error('Error registering voter:', error);
    throw error;
  }
};

export const batchRegisterVoters = async (addresses, nationalIds) => {
  try {
    const contract = await getContract();
    const tx = await contract.batchRegisterVoters(addresses, nationalIds);
    
    await tx.wait();
    return tx;
  } catch (error) {
    console.error('Error batch registering voters:', error);
    throw error;
  }
};

export const nominateCandidate = async (name, party, manifesto) => {
  try {
    const contract = await getContract();
    const tx = await contract.nominateCandidate(name, party, manifesto);
    
    await tx.wait();
    return tx;
  } catch (error) {
    console.error('Error nominating candidate:', error);
    throw error;
  }
};

export const castVote = async (candidateId) => {
  try {
    const contract = await getContract();
    const tx = await contract.castVote(candidateId);
    
    await tx.wait();
    return tx;
  } catch (error) {
    console.error('Error casting vote:', error);
    throw error;
  }
};

export const moveToNextPhase = async () => {
  try {
    const contract = await getContract();
    const tx = await contract.moveToNextPhase();
    
    await tx.wait();
    return tx;
  } catch (error) {
    console.error('Error moving to next phase:', error);
    throw error;
  }
};

export const getResults = async () => {
  try {
    const contract = getContractReadOnly();
    const results = await contract.getResults();
    
    return {
      winner: results.winner.toNumber(),
      winnerName: results.winnerName,
      winnerParty: results.winnerParty,
      winnerVotes: results.winnerVotes.toNumber(),
      totalVotes: results.totalVotes.toNumber()
    };
  } catch (error) {
    console.error('Error getting results:', error);
    throw error;
  }
};

export const CONTRACT_ADDRESS_EXPORT = CONTRACT_ADDRESS;
export { ethers };