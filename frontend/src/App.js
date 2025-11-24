/*
NationwideElection React Starter (single-file preview)

What this file contains:
- A complete React component (default export) that:
  - Detects MetaMask
  - Connects/disconnects wallet
  - Shows election status, candidate list, and voter actions
  - Lets registered voters cast a vote (via MetaMask/ethers.js)
  - Lets commissioner register a voter / nominate a candidate / move phases
  - Displays results when available

How to use this starter:
1. Create a new React project (recommended: Vite + React).
   npm create vite@latest my-election-app -- --template react
   cd my-election-app
2. Install dependencies:
   npm install ethers react-toastify clsx
   (Optional: install Tailwind CSS; the UI below assumes Tailwind is available)
3. Replace the CONTRACT_ADDRESS and CONTRACT_ABI placeholders with your deployed
   NationwideElection contract address and ABI.
4. Start dev server: npm run dev

Notes:
- Ensure MetaMask is configured to the correct Binance Smart Chain network (Testnet or Mainnet)
- This starter uses Tailwind classes for styling. If you don't want Tailwind, you can
  use plain CSS or a UI library; the logic will still work.
- This file is a single-file demo for quickly wiring the contract; split into components
  in a real app.

*/

import React, { useEffect, useState, useCallback } from "react";
import { ethers } from "ethers";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// -------------------- REPLACE THESE --------------------
const CONTRACT_ADDRESS = "0x96EE21C1169C8Fa3D82fFB5B84E0eCD30A13588d";
const CONTRACT_ABI = [
  {
    inputs: [
      { internalType: "string", name: "_electionName", type: "string" },
      { internalType: "uint256", name: "_durationInDays", type: "uint256" },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "candidateId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "timestamp",
        type: "uint256",
      },
    ],
    name: "CandidateDeactivated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "candidateId",
        type: "uint256",
      },
      { indexed: false, internalType: "string", name: "name", type: "string" },
      { indexed: false, internalType: "string", name: "party", type: "string" },
      {
        indexed: false,
        internalType: "uint256",
        name: "timestamp",
        type: "uint256",
      },
    ],
    name: "CandidateNominated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: "string", name: "name", type: "string" },
      {
        indexed: false,
        internalType: "uint256",
        name: "startTime",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "endTime",
        type: "uint256",
      },
    ],
    name: "ElectionCreated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "timestamp",
        type: "uint256",
      },
    ],
    name: "EmergencyStop",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "enum NationwideElection.ElectionPhase",
        name: "newPhase",
        type: "uint8",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "timestamp",
        type: "uint256",
      },
    ],
    name: "PhaseChanged",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "winningCandidateId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "totalVotes",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "timestamp",
        type: "uint256",
      },
    ],
    name: "ResultsDeclared",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "voter",
        type: "address",
      },
      {
        indexed: true,
        internalType: "uint256",
        name: "candidateId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "timestamp",
        type: "uint256",
      },
    ],
    name: "VoteCast",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "voter",
        type: "address",
      },
      {
        indexed: false,
        internalType: "string",
        name: "nationalId",
        type: "string",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "timestamp",
        type: "uint256",
      },
    ],
    name: "VoterRegistered",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "voter",
        type: "address",
      },
      { indexed: false, internalType: "bool", name: "hasVoted", type: "bool" },
    ],
    name: "VoterStatusUpdated",
    type: "event",
  },
  {
    inputs: [
      { internalType: "address[]", name: "_voterAddresses", type: "address[]" },
      { internalType: "string[]", name: "_nationalIds", type: "string[]" },
    ],
    name: "batchRegisterVoters",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "_candidateId", type: "uint256" },
    ],
    name: "castVote",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "currentPhase",
    outputs: [
      {
        internalType: "enum NationwideElection.ElectionPhase",
        name: "",
        type: "uint8",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "_candidateId", type: "uint256" },
    ],
    name: "deactivateCandidate",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "electionCommissioner",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "electionEndTime",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "electionName",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "electionStartTime",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "emergencyStop",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "getAllCandidates",
    outputs: [
      {
        components: [
          { internalType: "uint256", name: "id", type: "uint256" },
          { internalType: "string", name: "name", type: "string" },
          { internalType: "string", name: "party", type: "string" },
          { internalType: "string", name: "manifesto", type: "string" },
          { internalType: "uint256", name: "voteCount", type: "uint256" },
          { internalType: "bool", name: "isActive", type: "bool" },
          { internalType: "uint256", name: "nominationTime", type: "uint256" },
        ],
        internalType: "struct ICandidateManagement.Candidate[]",
        name: "",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "_candidateId", type: "uint256" },
    ],
    name: "getCandidate",
    outputs: [
      {
        components: [
          { internalType: "uint256", name: "id", type: "uint256" },
          { internalType: "string", name: "name", type: "string" },
          { internalType: "string", name: "party", type: "string" },
          { internalType: "string", name: "manifesto", type: "string" },
          { internalType: "uint256", name: "voteCount", type: "uint256" },
          { internalType: "bool", name: "isActive", type: "bool" },
          { internalType: "uint256", name: "nominationTime", type: "uint256" },
        ],
        internalType: "struct ICandidateManagement.Candidate",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "_candidateId", type: "uint256" },
    ],
    name: "getCandidateVoteCount",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getElectionStatus",
    outputs: [
      { internalType: "string", name: "name", type: "string" },
      {
        internalType: "enum NationwideElection.ElectionPhase",
        name: "phase",
        type: "uint8",
      },
      { internalType: "uint256", name: "startTime", type: "uint256" },
      { internalType: "uint256", name: "endTime", type: "uint256" },
      { internalType: "uint256", name: "totalVoters", type: "uint256" },
      { internalType: "uint256", name: "totalCandidates", type: "uint256" },
      { internalType: "uint256", name: "votesCast", type: "uint256" },
      { internalType: "bool", name: "resultsAvailable", type: "bool" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getResults",
    outputs: [
      { internalType: "uint256", name: "winner", type: "uint256" },
      { internalType: "string", name: "winnerName", type: "string" },
      { internalType: "string", name: "winnerParty", type: "string" },
      { internalType: "uint256", name: "winnerVotes", type: "uint256" },
      { internalType: "uint256", name: "totalVotes", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getTotalCandidates",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getTotalVoters",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "_voterAddress", type: "address" },
    ],
    name: "getVoter",
    outputs: [
      {
        components: [
          { internalType: "bool", name: "isRegistered", type: "bool" },
          { internalType: "bool", name: "hasVoted", type: "bool" },
          {
            internalType: "uint256",
            name: "votedCandidateId",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "registrationTime",
            type: "uint256",
          },
          { internalType: "string", name: "nationalId", type: "string" },
        ],
        internalType: "struct IVoterManagement.Voter",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "_voterAddress", type: "address" },
    ],
    name: "hasVoterVoted",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "_voterAddress", type: "address" },
    ],
    name: "isRegisteredVoter",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "moveToNextPhase",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "string", name: "_name", type: "string" },
      { internalType: "string", name: "_party", type: "string" },
      { internalType: "string", name: "_manifesto", type: "string" },
    ],
    name: "nominateCandidate",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "_voterAddress", type: "address" },
      { internalType: "string", name: "_nationalId", type: "string" },
    ],
    name: "registerVoter",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "resultsPublished",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalVotesCast",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "_newCommissioner", type: "address" },
    ],
    name: "transferCommissioner",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "winningCandidateId",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  
];
// ------------------------------------------------------

// Helpful mapping for phases (must match Solidity enum order)
const PHASES = [
  "Registration",
  "Nomination",
  "Voting",
  "Ended",
  "ResultsDeclared",
];

export default function App() {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);

  const [status, setStatus] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [isRegistered, setIsRegistered] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [txInProgress, setTxInProgress] = useState(false);

  // UI form state
  const [registerAddress, setRegisterAddress] = useState("");
  const [registerNationalId, setRegisterNationalId] = useState("");
  const [nomName, setNomName] = useState("");
  const [nomParty, setNomParty] = useState("");
  const [nomManifesto, setNomManifesto] = useState("");

  // ---------- Wallet / Provider setup ----------
  const detectProvider = useCallback(async () => {
    if (window.ethereum) {
      const p = new ethers.providers.Web3Provider(window.ethereum, "any");
      setProvider(p);
      return p;
    } else {
      setProvider(null);
      return null;
    }
  }, []);

  const connectWallet = async () => {
    try {
      const p = await detectProvider();
      if (!p) {
        toast.error("MetaMask not detected. Install MetaMask and try again.");
        return;
      }
      await p.send("eth_requestAccounts", []);
      const s = p.getSigner();
      const a = await s.getAddress();
      setSigner(s);
      setAccount(a);
      const c = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, s);
      setContract(c);
      toast.success("Wallet connected: " + shorten(a));
    } catch (err) {
      console.error(err);
      toast.error("Failed to connect wallet: " + (err && err.message));
    }
  };

  const disconnect = () => {
    setSigner(null);
    setAccount(null);
    setContract(null);
    setIsRegistered(false);
    setHasVoted(false);
    toast.info("Disconnected");
  };

  // handle account changes
  useEffect(() => {
    if (!window.ethereum) return;
    const handler = (accounts) => {
      if (accounts.length === 0) {
        disconnect();
      } else {
        setAccount(accounts[0]);
      }
    };
    window.ethereum.on("accountsChanged", handler);
    return () =>
      window.ethereum &&
      window.ethereum.removeListener("accountsChanged", handler);
  }, []);

  // ---------- Load basic on-chain state ----------
  const loadStatusAndCandidates = useCallback(async (cInstance) => {
    if (!cInstance) return;
    try {
      setLoading(true);
      const s = await cInstance.getElectionStatus();
      // getElectionStatus returns tuple: (name, phase, start, end, totalVoters, totalCandidates, votesCast, resultsAvailable)
      const election = {
        name: s[0],
        phase: PHASES[Number(s[1])],
        phaseIndex: Number(s[1]),
        startTime: Number(s[2]) * 1000,
        endTime: Number(s[3]) * 1000,
        totalVoters: Number(s[4]),
        totalCandidates: Number(s[0]),
        votesCast: Number(s[0]),
        resultsAvailable: Boolean(s[0]),
      };
      setStatus(election);

      // load candidates array
      const rawCandidates = await cInstance.getAllCandidates();
      const parsed = rawCandidates.map((c) => ({
        id: Number(c.id),
        name: c.name,
        party: c.party,
        manifesto: c.manifesto,
        votes: Number(c.voteCount),
        isActive: c.isActive,
      }));
      setCandidates(parsed);
    } catch (err) {
      console.error("loadStatusAndCandidates", err);
      // toast.error("Failed to load election data: " + (err && err.message));
    } finally {
      setLoading(false);
    }
  }, []);

  // When account or contract set, check registration/vote status
  useEffect(() => {
    if (!contract || !account) return;
    let mounted = true;
    (async () => {
      try {
        const reg = await contract.isRegisteredVoter(account);
        const voted = await contract.hasVoterVoted(account);
        if (mounted) {
          setIsRegistered(reg);
          setHasVoted(voted);
        }
      } catch (err) {
        console.warn("couldn't fetch voter status", err);
      }
    })();
    return () => (mounted = false);
  }, [contract, account]);

  // initial detect provider and load read-only data
  useEffect(() => {
    (async () => {
      const p = await detectProvider();
      if (p) {
        try {
          const readProvider = new ethers.providers.Web3Provider(
            window.ethereum
          );
          const readContract = new ethers.Contract(
            CONTRACT_ADDRESS,
            CONTRACT_ABI,
            readProvider
          );
          await loadStatusAndCandidates(readContract);
          // subscribe to events
          readContract.on("VoteCast", (voter, candidateId, timestamp) => {
            toast.info(
              `Vote cast by ${shorten(voter)} for candidate ${candidateId}`
            );
            // reload simple data
            loadStatusAndCandidates(readContract);
          });
          readContract.on("PhaseChanged", (newPhase, ts) => {
            toast.info(`Phase changed to ${PHASES[Number(newPhase)]}`);
            loadStatusAndCandidates(readContract);
          });
        } catch (err) {
          console.error(err);
        }
      }
    })();
  }, [detectProvider, loadStatusAndCandidates]);

  // ---------- Transaction helpers ----------
  const sendTx = async (txPromise) => {
    try {
      setTxInProgress(true);
      const tx = await txPromise;
      toast.info("Transaction sent: " + shorten(tx.hash));
      await tx.wait();
      toast.success("Transaction confirmed: " + shorten(tx.hash));
      // reload read-only data
      const readProvider = new ethers.providers.Web3Provider(window.ethereum);
      const readContract = new ethers.Contract(
        CONTRACT_ADDRESS,
        CONTRACT_ABI,
        readProvider
      );
      await loadStatusAndCandidates(readContract);
      setTxInProgress(false);
      return tx;
    } catch (err) {
      console.error(err);
      toast.error("Transaction failed: " + (err && err.message));
      setTxInProgress(false);
      throw err;
    }
  };

  // Cast vote
  const handleVote = async (candidateId) => {
    if (!contract || !signer) return toast.error("Connect your wallet first");
    if (!isRegistered) return toast.error("You are not a registered voter");
    if (hasVoted) return toast.error("You already voted");
    try {
      const contractWithSigner = contract.connect(signer);
      await sendTx(contractWithSigner.castVote(candidateId));
      setHasVoted(true);
    } catch (err) {
      console.error(err);
    }
  };

  // Commissioner actions
  const handleRegisterVoter = async () => {
    if (!contract || !signer)
      return toast.error("Connect wallet as commissioner");
    try {
      const c = contract.connect(signer);
      await sendTx(c.registerVoter(registerAddress, registerNationalId));
      setRegisterAddress("");
      setRegisterNationalId("");
    } catch (err) {
      console.error(err);
    }
  };

  const handleNominate = async () => {
    if (!contract || !signer)
      return toast.error("Connect wallet as commissioner");
    try {
      const c = contract.connect(signer);
      await sendTx(c.nominateCandidate(nomName, nomParty, nomManifesto));
      setNomName("");
      setNomParty("");
      setNomManifesto("");
    } catch (err) {
      console.error(err);
    }
  };

  const handleMovePhase = async () => {
    if (!contract || !signer)
      return toast.error("Connect wallet as commissioner");
    try {
      const c = contract.connect(signer);
      await sendTx(c.moveToNextPhase());
    } catch (err) {
      console.error(err);
    }
  };

  // Get results
  const fetchResults = async () => {
    if (!contract) return;
    try {
      const r = await contract.getResults();
      toast.info(`Winner: ${r[1]} (${r[2]}) with ${Number(r[3])} votes`);
    } catch (err) {
      toast.error("Couldn't fetch results: " + (err && err.message));
    }
  };

  // ---------- Helpers ----------
  function shorten(addr) {
    if (!addr) return "";
    return addr.slice(0, 6) + "..." + addr.slice(-4);
  }

  // ---------- Render ----------
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 text-white p-6">
      <ToastContainer position="top-right" />
      <header className="max-w-5xl mx-auto flex items-center justify-between py-6">
        <div>
          <h1 className="text-3xl font-extrabold">
            Nationwide Election Dashboard
          </h1>
          <p className="text-sm text-slate-300">
            Manage voters, candidates and voting on BSC
          </p>
        </div>
        <div className="flex items-center gap-4">
          {account ? (
            <div className="bg-slate-700 px-4 py-2 rounded-lg flex items-center gap-3">
              <span className="font-mono text-sm">{shorten(account)}</span>
              <button
                onClick={disconnect}
                className="bg-red-600 px-3 py-1 rounded hover:opacity-90"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button
              onClick={connectWallet}
              className="bg-emerald-500 text-black px-4 py-2 rounded-lg font-semibold shadow-lg hover:scale-105 transition-transform"
            >
              Connect MetaMask
            </button>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left column - Status */}
        <section className="md:col-span-1 bg-white/5 rounded-xl p-5 shadow-lg">
          <h2 className="text-xl font-bold">Election Status</h2>
          {loading ? (
            <p className="text-sm text-slate-300 mt-3">Loading...</p>
          ) : status ? (
            <div className="mt-3 text-sm space-y-2 text-slate-200">
              <div>
                <strong>Name:</strong> {status.name}
              </div>
              <div>
                <strong>Phase:</strong> {status.phase}
              </div>
              <div>
                <strong>Start:</strong>{" "}
                {new Date(status.startTime).toLocaleString()}
              </div>
              <div>
                <strong>End:</strong>{" "}
                {new Date(status.endTime).toLocaleString()}
              </div>
              <div>
                <strong>Voters:</strong> {status.totalVoters}
              </div>
              <div>
                <strong>Candidates:</strong> {status.totalCandidates}
              </div>
              <div>
                <strong>Votes Cast:</strong> {status.votesCast}
              </div>
              <div>
                <strong>Results Available:</strong>{" "}
                {String(status.resultsAvailable)}
              </div>
            </div>
          ) : (
            <p className="text-slate-300 mt-3">No status loaded yet.</p>
          )}

          <div className="mt-4 flex flex-col gap-2">
            <button
              onClick={() =>
                loadStatusAndCandidates(
                  new ethers.Contract(
                    CONTRACT_ADDRESS,
                    CONTRACT_ABI,
                    provider || ethers.getDefaultProvider()
                  )
                )
              }
              className="bg-blue-600 px-3 py-2 rounded"
            >
              Refresh
            </button>
            {status && status.resultsAvailable && (
              <button
                onClick={fetchResults}
                className="bg-yellow-500 text-black px-3 py-2 rounded"
              >
                Get Results
              </button>
            )}
          </div>
        </section>

        {/* Middle column - Candidates & Vote */}
        <section className="md:col-span-2 bg-white/5 rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Candidates</h2>
            <div className="text-sm text-slate-300">
              Phase: {status ? status.phase : "-"}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {candidates.length === 0 && (
              <div className="text-slate-300">No candidates found.</div>
            )}
            {candidates.map((c) => (
              <div
                key={c.id}
                className="bg-white/3 rounded p-4 flex flex-col justify-between"
              >
                <div>
                  <div className="text-lg font-semibold">{c.name}</div>
                  <div className="text-sm text-slate-200">{c.party}</div>
                  <p className="mt-2 text-sm text-slate-300">{c.manifesto}</p>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <div className="text-sm">
                    Votes: <strong>{c.votes}</strong>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      disabled={
                        !account ||
                        status?.phase !== "Voting" ||
                        !isRegistered ||
                        hasVoted ||
                        txInProgress
                      }
                      onClick={() => handleVote(c.id)}
                      className="bg-emerald-500 text-black px-3 py-1 rounded font-semibold disabled:opacity-50"
                    >
                      Vote
                    </button>
                    <span className="text-xs text-slate-300">ID: {c.id}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6">
            <h3 className="text-lg font-semibold">Your Voter Status</h3>
            <div className="mt-2 text-sm text-slate-200">
              <div>Registered: {String(isRegistered)}</div>
              <div>Already Voted: {String(hasVoted)}</div>
            </div>
          </div>
        </section>

        {/* Bottom panels: commissioner controls */}
        <section className="md:col-span-3 bg-white/5 rounded-xl p-5 shadow-lg mt-2">
          <h2 className="text-xl font-bold">Commissioner Controls</h2>
          <p className="text-sm text-slate-300">
            These actions require the commissioner account (the address that
            deployed the contract).
          </p>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/4 p-4 rounded">
              <h4 className="font-semibold">Register Voter</h4>
              <input
                placeholder="0xAddress"
                value={registerAddress}
                onChange={(e) => setRegisterAddress(e.target.value)}
                className="mt-2 w-full p-2 rounded bg-white/5"
              />
              <input
                placeholder="National ID"
                value={registerNationalId}
                onChange={(e) => setRegisterNationalId(e.target.value)}
                className="mt-2 w-full p-2 rounded bg-white/5"
              />
              <button
                onClick={handleRegisterVoter}
                className="mt-3 bg-indigo-600 px-3 py-2 rounded disabled:opacity-50"
              >
                Register
              </button>
            </div>

            <div className="bg-white/4 p-4 rounded">
              <h4 className="font-semibold">Nominate Candidate</h4>
              <input
                placeholder="Name"
                value={nomName}
                onChange={(e) => setNomName(e.target.value)}
                className="mt-2 w-full p-2 rounded bg-white/5"
              />
              <input
                placeholder="Party"
                value={nomParty}
                onChange={(e) => setNomParty(e.target.value)}
                className="mt-2 w-full p-2 rounded bg-white/5"
              />
              <input
                placeholder="Manifesto"
                value={nomManifesto}
                onChange={(e) => setNomManifesto(e.target.value)}
                className="mt-2 w-full p-2 rounded bg-white/5"
              />
              <button
                onClick={handleNominate}
                className="mt-3 bg-purple-600 px-3 py-2 rounded"
              >
                Nominate
              </button>
            </div>

            <div className="bg-white/4 p-4 rounded">
              <h4 className="font-semibold">Advance Phase</h4>
              <div className="text-sm text-slate-300 mt-2">
                Current: {status ? status.phase : "-"}
              </div>
              <button
                onClick={handleMovePhase}
                className="mt-3 bg-yellow-600 px-3 py-2 rounded"
              >
                Move To Next Phase
              </button>
            </div>
          </div>
        </section>
      </main>

      <footer className="max-w-5xl mx-auto text-center mt-10 text-xs text-slate-400">
        Built with ❤️ for demonstration. Replace ABI & address with your
        contract data.
      </footer>
    </div>
  );
}
