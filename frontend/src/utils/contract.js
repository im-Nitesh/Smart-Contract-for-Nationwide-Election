// import { ethers } from 'ethers';

// // Import your contract ABI (get this from artifacts after compilation)
// import NationwideElectionABI from '../contracts/NationwideElection.json';

// const CONTRACT_ADDRESS = "0x96EE21C1169C8Fa3D82fFB5B84E0eCD30A13588d"; // Replace with actual address

// export const getProvider = () => {
//   if (window.ethereum) {
//     return new ethers.providers.Web3Provider(window.ethereum);
//   }
//   throw new Error("No Ethereum provider found. Install MetaMask!");
// };

// export const getSigner = async () => {
//   const provider = getProvider();
//   return provider.getSigner();
// };

// export const getContract = async () => {
//   const signer = await getSigner();
//   return new ethers.Contract(CONTRACT_ADDRESS, NationwideElectionABI.abi, signer);
// };

// export const connectWallet = async () => {
//   try {
//     const provider = getProvider();
//     const accounts = await provider.send("eth_requestAccounts", []);
//     return accounts[0];
//   } catch (error) {
//     console.error("Error connecting wallet:", error);
//     throw error;
//   }
// };

// // Contract interaction functions
// export const registerVoter = async (voterAddress, nationalId) => {
//   const contract = await getContract();
//   const tx = await contract.registerVoter(voterAddress, nationalId);
//   await tx.wait();
//   return tx;
// };

// export const nominateCandidate = async (name, party, manifesto) => {
//   const contract = await getContract();
//   const tx = await contract.nominateCandidate(name, party, manifesto);
//   await tx.wait();
//   return tx;
// };

// export const castVote = async (candidateId) => {
//   const contract = await getContract();
//   const tx = await contract.castVote(candidateId);
//   await tx.wait();
//   return tx;
// };

// export const getElectionStatus = async () => {
//   const contract = await getContract();
//   const status = await contract.getElectionStatus();
//   return {
//     name: status.name,
//     phase: status.phase,
//     startTime: status.startTime.toNumber(),
//     endTime: status.endTime.toNumber(),
//     totalVoters: status.totalVoters.toNumber(),
//     totalCandidates: status.totalCandidates.toNumber(),
//     votesCast: status.votesCast.toNumber(),
//     resultsAvailable: status.resultsAvailable
//   };
// };

// export const getAllCandidates = async () => {
//   const contract = await getContract();
//   const candidates = await contract.getAllCandidates();
//   return candidates.map(c => ({
//     id: c.id.toNumber(),
//     name: c.name,
//     party: c.party,
//     manifesto: c.manifesto,
//     voteCount: c.voteCount.toNumber(),
//     isActive: c.isActive,
//     nominationTime: c.nominationTime.toNumber()
//   }));
// };

// export const moveToNextPhase = async () => {
//   const contract = await getContract();
//   const tx = await contract.moveToNextPhase();
//   await tx.wait();
//   return tx;
// };

// export const getResults = async () => {
//   const contract = await getContract();
//   return await contract.getResults();
// };