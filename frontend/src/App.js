import React, { useState, useEffect } from "react";
import {
  AlertCircle,
  Users,
  Vote,
  Trophy,
  Calendar,
  CheckCircle,
  XCircle,
  Shield,
  Activity,
  Wallet,
  ChevronRight,
  TrendingUp,
  Lock,
  Eye,
} from "lucide-react";
import * as contractUtils from "./utils/contract";

const ElectionDApp = () => {
  const [account, setAccount] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);
  const [isCommissioner, setIsCommissioner] = useState(false);
  const [electionStatus, setElectionStatus] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [voterInfo, setVoterInfo] = useState({
    isRegistered: false,
    hasVoted: false,
  });
  const [activeTab, setActiveTab] = useState("home");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [showVoteConfirm, setShowVoteConfirm] = useState(false);
  const [selectedVoteCandidate, setSelectedVoteCandidate] = useState(null);

  const [voterAddress, setVoterAddress] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [batchVoters, setBatchVoters] = useState([{ address: "", id: "" }]);
  const [candidateName, setCandidateName] = useState("");
  const [candidateParty, setCandidateParty] = useState("");
  const [candidateManifesto, setCandidateManifesto] = useState("");

  const phaseNames = [
    "Registration",
    "Nomination",
    "Voting",
    "Ended",
    "Results Declared",
  ];

  useEffect(() => {
    checkIfWalletIsConnected();
    setupEventListeners();
  }, []);

  useEffect(() => {
    if (isConnected && isCorrectNetwork) {
      loadContractData();
    }
  }, [isConnected, isCorrectNetwork, account]);

  const checkIfWalletIsConnected = async () => {
    try {
      if (typeof window.ethereum !== "undefined") {
        const accounts = await window.ethereum.request({
          method: "eth_accounts",
        });

        if (accounts.length > 0) {
          const account = accounts[0];
          setAccount(account);
          setIsConnected(true);

          const networkOk = await contractUtils.checkNetwork();
          setIsCorrectNetwork(networkOk);

          if (networkOk) {
            await loadContractData();
          }
        }
      }
    } catch (error) {
      console.error("Error checking wallet connection:", error);
    }
  };

  const setupEventListeners = () => {
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", handleAccountsChanged);
      window.ethereum.on("chainChanged", handleChainChanged);
    }
  };

  const handleAccountsChanged = async (accounts) => {
    if (accounts.length === 0) {
      setIsConnected(false);
      setAccount("");
      setIsCommissioner(false);
    } else if (accounts[0] !== account) {
      setAccount(accounts[0]);
      await loadContractData();
    }
  };

  const handleChainChanged = () => {
    window.location.reload();
  };

  const connectWallet = async () => {
    try {
      setLoading(true);

      if (typeof window.ethereum === "undefined") {
        setMessage({
          type: "error",
          text: "MetaMask is not installed. Please install MetaMask browser extension.",
        });
        window.open("https://metamask.io/download/", "_blank");
        return;
      }

      const walletAddress = await contractUtils.connectWallet();
      setAccount(walletAddress);
      setIsConnected(true);

      const networkOk = await contractUtils.checkNetwork();

      if (!networkOk) {
        setMessage({ type: "error", text: "Please switch to BSC network" });
        await contractUtils.switchToBSCNetwork(true);
        return;
      }

      setIsCorrectNetwork(true);
      await loadContractData();

      setMessage({ type: "success", text: "Wallet connected successfully!" });
      setActiveTab("dashboard");
    } catch (error) {
      console.error("Connection error:", error);
      setMessage({
        type: "error",
        text: error.message || "Failed to connect wallet",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadContractData = async () => {
    try {
      const [status, candidatesList, commissioner, isRegistered, hasVoted] =
        await Promise.all([
          contractUtils.getElectionStatus(),
          contractUtils.getAllCandidates(),
          contractUtils.getElectionCommissioner(),
          contractUtils.isRegisteredVoter(account),
          contractUtils.hasVoterVoted(account),
        ]);

      setElectionStatus(status);
      setCandidates(candidatesList);
      setIsCommissioner(commissioner.toLowerCase() === account.toLowerCase());
      setVoterInfo({ isRegistered, hasVoted });
    } catch (error) {
      console.error("Error loading contract data:", error);
      setMessage({ type: "error", text: "Failed to load election data" });
    }
  };

  const registerVoter = async () => {
    if (!voterAddress || !nationalId) {
      setMessage({ type: "error", text: "Please fill all fields" });
      return;
    }

    if (!contractUtils.ethers.utils.isAddress(voterAddress)) {
      setMessage({ type: "error", text: "Invalid wallet address" });
      return;
    }

    setLoading(true);
    try {
      await contractUtils.registerVoter(voterAddress, nationalId);
      setMessage({ type: "success", text: "Voter registered successfully!" });
      setVoterAddress("");
      setNationalId("");
      await loadContractData();
    } catch (error) {
      console.error("Registration error:", error);
      setMessage({
        type: "error",
        text: error.reason || error.message || "Failed to register voter",
      });
    } finally {
      setLoading(false);
    }
  };

  const batchRegisterVoters = async () => {
    const validVoters = batchVoters.filter((v) => v.address && v.id);

    if (validVoters.length === 0) {
      setMessage({
        type: "error",
        text: "Please add at least one valid voter",
      });
      return;
    }

    setLoading(true);
    try {
      const addresses = validVoters.map((v) => v.address);
      const ids = validVoters.map((v) => v.id);

      await contractUtils.batchRegisterVoters(addresses, ids);
      setMessage({
        type: "success",
        text: `${validVoters.length} voters registered successfully!`,
      });
      setBatchVoters([{ address: "", id: "" }]);
      await loadContractData();
    } catch (error) {
      console.error("Batch registration error:", error);
      setMessage({
        type: "error",
        text:
          error.reason || error.message || "Failed to batch register voters",
      });
    } finally {
      setLoading(false);
    }
  };

  const nominateCandidate = async () => {
    if (!candidateName || !candidateParty) {
      setMessage({ type: "error", text: "Please fill required fields" });
      return;
    }

    setLoading(true);
    try {
      await contractUtils.nominateCandidate(
        candidateName,
        candidateParty,
        candidateManifesto
      );
      setMessage({
        type: "success",
        text: "Candidate nominated successfully!",
      });
      setCandidateName("");
      setCandidateParty("");
      setCandidateManifesto("");
      await loadContractData();
    } catch (error) {
      console.error("Nomination error:", error);
      setMessage({
        type: "error",
        text: error.reason || error.message || "Failed to nominate candidate",
      });
    } finally {
      setLoading(false);
    }
  };

  const initiateVote = (candidateId) => {
    setSelectedVoteCandidate(candidateId);
    setShowVoteConfirm(true);
  };

  const confirmVote = async () => {
    setShowVoteConfirm(false);
    setLoading(true);

    try {
      await contractUtils.castVote(selectedVoteCandidate);
      setMessage({ type: "success", text: "Vote cast successfully!" });
      await loadContractData();
    } catch (error) {
      console.error("Voting error:", error);
      setMessage({
        type: "error",
        text: error.reason || error.message || "Failed to cast vote",
      });
    } finally {
      setLoading(false);
      setSelectedVoteCandidate(null);
    }
  };

  const moveToNextPhase = async () => {
    setLoading(true);
    try {
      await contractUtils.moveToNextPhase();
      setMessage({
        type: "success",
        text: "Election phase updated successfully!",
      });
      await loadContractData();
    } catch (error) {
      console.error("Phase change error:", error);
      setMessage({
        type: "error",
        text: error.reason || error.message || "Failed to update phase",
      });
    } finally {
      setLoading(false);
    }
  };

  const addBatchVoterRow = () => {
    setBatchVoters([...batchVoters, { address: "", id: "" }]);
  };

  const removeBatchVoterRow = (index) => {
    setBatchVoters(batchVoters.filter((_, i) => i !== index));
  };

  const updateBatchVoter = (index, field, value) => {
    const updated = [...batchVoters];
    updated[index][field] = value;
    setBatchVoters(updated);
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getPhaseColor = (phase) => {
    const colors = [
      "bg-blue-500",
      "bg-purple-500",
      "bg-green-500",
      "bg-orange-500",
      "bg-red-500",
    ];
    return colors[phase] || "bg-gray-500";
  };

  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => {
        setMessage({ type: "", text: "" });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 text-white">
        <div className="absolute inset-0 overflow-hidden opacity-20">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-60 -left-40 w-96 h-96 bg-blue-500 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 right-60 w-80 h-80 bg-indigo-500 rounded-full blur-3xl animate-pulse"></div>
        </div>

        <nav className="relative z-10 container mx-auto px-6 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-2 rounded-lg">
                <Vote className="w-8 h-8" />
              </div>
              <span className="text-2xl font-bold">VoteChain</span>
            </div>

            <button
              onClick={connectWallet}
              disabled={loading}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-8 py-3 rounded-full font-semibold transition transform hover:scale-105 flex items-center space-x-2 shadow-lg disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Activity className="w-5 h-5 animate-spin" />
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <Wallet className="w-5 h-5" />
                  <span>Connect Wallet</span>
                </>
              )}
            </button>
          </div>
        </nav>

        <div className="relative z-10 container mx-auto px-6 py-20">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-6xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-blue-100 to-purple-200 bg-clip-text text-transparent">
              Blockchain-Powered Democratic Elections
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-12 leading-relaxed">
              Secure, transparent, and tamper-proof voting system built on
              Binance Smart Chain. Your vote, your voice, guaranteed integrity.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-20">
              <button
                onClick={connectWallet}
                disabled={loading}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 px-10 py-4 rounded-full font-bold text-lg transition transform hover:scale-105 shadow-2xl disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                <Wallet className="w-6 h-6" />
                <span>Get Started</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mt-16">
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 hover:bg-white/15 transition">
                <Shield className="w-12 h-12 mb-4 text-blue-400 mx-auto" />
                <h3 className="text-xl font-bold mb-3">Secure & Immutable</h3>
                <p className="text-gray-300">
                  Every vote is cryptographically secured and permanently
                  recorded on the blockchain
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 hover:bg-white/15 transition">
                <Eye className="w-12 h-12 mb-4 text-purple-400 mx-auto" />
                <h3 className="text-xl font-bold mb-3">Transparent Process</h3>
                <p className="text-gray-300">
                  Real-time election monitoring with complete transparency and
                  auditability
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 hover:bg-white/15 transition">
                <Lock className="w-12 h-12 mb-4 text-pink-400 mx-auto" />
                <h3 className="text-xl font-bold mb-3">Anonymous Voting</h3>
                <p className="text-gray-300">
                  Your vote remains private while ensuring you can only vote
                  once
                </p>
              </div>
            </div>
          </div>
        </div>

        {message.text && (
          <div className="fixed top-6 right-6 z-50 max-w-md">
            <div
              className={`p-4 rounded-xl flex items-center space-x-3 shadow-2xl backdrop-blur-lg border ${
                message.type === "success"
                  ? "bg-green-500/90 border-green-400 text-white"
                  : "bg-red-500/90 border-red-400 text-white"
              }`}
            >
              {message.type === "success" ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <XCircle className="w-5 h-5" />
              )}
              <span className="font-semibold">{message.text}</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (!isCorrectNetwork) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 text-white flex items-center justify-center p-6">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 max-w-md">
          <AlertCircle className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4 text-center">Wrong Network</h2>
          <p className="text-gray-300 mb-6 text-center">
            Please switch to Binance Smart Chain network to use this
            application.
          </p>
          <button
            onClick={() => contractUtils.switchToBSCNetwork(true)}
            className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 px-6 py-3 rounded-xl font-bold transition"
          >
            Switch to BSC Testnet
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      <header className="bg-white shadow-md border-b-4 border-blue-600">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
                <Vote className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">VoteChain</h1>
                <p className="text-sm text-gray-600">
                  Decentralized Election System
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="hidden md:block text-right">
                <div className="text-xs text-gray-600">Connected Account</div>
                <div className="font-mono text-sm text-blue-600 font-semibold">
                  {account.slice(0, 6)}...{account.slice(-4)}
                </div>
              </div>

              {isCommissioner && (
                <span className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg flex items-center space-x-1">
                  <Shield className="w-4 h-4" />
                  <span>Commissioner</span>
                </span>
              )}

              <div className="bg-green-100 text-green-700 px-4 py-2 rounded-full text-xs font-semibold flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>BSC</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {message.text && (
        <div className="container mx-auto px-6 mt-4">
          <div
            className={`p-4 rounded-xl flex items-center space-x-3 shadow-lg ${
              message.type === "success"
                ? "bg-green-50 border border-green-200 text-green-800"
                : "bg-red-50 border border-red-200 text-red-800"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <XCircle className="w-5 h-5" />
            )}
            <span className="font-semibold">{message.text}</span>
          </div>
        </div>
      )}

      <div className="container mx-auto px-6 py-8">
        <div className="bg-white rounded-2xl shadow-lg mb-8 overflow-hidden">
          <div className="flex overflow-x-auto border-b">
            {[
              { id: "dashboard", label: "Dashboard", icon: Activity },
              { id: "register", label: "Register Voters", icon: Users },
              { id: "nominate", label: "Nominate", icon: TrendingUp },
              { id: "vote", label: "Cast Vote", icon: Vote },
              { id: "results", label: "Results", icon: Trophy },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center space-x-2 px-6 py-4 font-semibold transition whitespace-nowrap ${
                  activeTab === id
                    ? "border-b-4 border-blue-600 text-blue-600 bg-blue-50"
                    : "text-gray-600 hover:text-blue-600 hover:bg-gray-50"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        {activeTab === "dashboard" && electionStatus && (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl shadow-2xl p-8 text-white">
              <h2 className="text-3xl font-bold mb-2">{electionStatus.name}</h2>
              <p className="text-blue-100 mb-6">
                Transparent. Secure. Democratic.
              </p>

              <div className="flex items-center space-x-3 mb-6">
                <span className="text-sm">Current Phase:</span>
                <span className="px-6 py-2 rounded-full font-bold shadow-lg bg-white/20 backdrop-blur-lg border border-white/30">
                  {phaseNames[electionStatus.phase]}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
                  <Users className="w-8 h-8 mb-2 text-blue-200" />
                  <div className="text-3xl font-bold">
                    {electionStatus.totalVoters.toLocaleString()}
                  </div>
                  <div className="text-sm text-blue-200">Total Voters</div>
                </div>

                <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
                  <Vote className="w-8 h-8 mb-2 text-purple-200" />
                  <div className="text-3xl font-bold">
                    {electionStatus.totalCandidates}
                  </div>
                  <div className="text-sm text-purple-200">Candidates</div>
                </div>

                <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
                  <CheckCircle className="w-8 h-8 mb-2 text-green-200" />
                  <div className="text-3xl font-bold">
                    {electionStatus.votesCast.toLocaleString()}
                  </div>
                  <div className="text-sm text-green-200">Votes Cast</div>
                </div>

                <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
                  <TrendingUp className="w-8 h-8 mb-2 text-yellow-200" />
                  <div className="text-3xl font-bold">
                    {electionStatus.totalVoters > 0
                      ? (
                          (electionStatus.votesCast /
                            electionStatus.totalVoters) *
                          100
                        ).toFixed(1)
                      : 0}
                    %
                  </div>
                  <div className="text-sm text-yellow-200">Turnout</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-6">
                Election Timeline
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="flex items-start space-x-4">
                  <div className="bg-green-100 p-3 rounded-lg">
                    <Calendar className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 font-semibold">
                      Election Start
                    </div>
                    <div className="text-lg font-bold text-gray-800">
                      {formatDate(electionStatus.startTime)}
                    </div>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="bg-red-100 p-3 rounded-lg">
                    <Calendar className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 font-semibold">
                      Election End
                    </div>
                    <div className="text-lg font-bold text-gray-800">
                      {formatDate(electionStatus.endTime)}
                    </div>
                  </div>
                </div>
              </div>

              {isCommissioner && (
                <div className="mt-8 pt-8 border-t border-gray-200">
                  <h4 className="text-lg font-bold text-gray-800 mb-4">
                    Commissioner Controls
                  </h4>
                  <div className="flex flex-wrap gap-4">
                    <button
                      onClick={moveToNextPhase}
                      disabled={loading}
                      className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-xl font-semibold transition transform hover:scale-105 shadow-lg disabled:opacity-50 flex items-center space-x-2"
                    >
                      {loading ? (
                        <Activity className="w-5 h-5 animate-spin" />
                      ) : (
                        <ChevronRight className="w-5 h-5" />
                      )}
                      <span>Move to Next Phase</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {voterInfo && (
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h3 className="text-2xl font-bold text-gray-800 mb-6">
                  Your Voting Status
                </h3>
                <div className="grid md:grid-cols-3 gap-6">
                  <div
                    className={`p-6 rounded-xl ${
                      voterInfo.isRegistered
                        ? "bg-green-50 border-2 border-green-200"
                        : "bg-gray-50 border-2 border-gray-200"
                    }`}
                  >
                    {voterInfo.isRegistered ? (
                      <CheckCircle className="w-8 h-8 text-green-600 mb-3" />
                    ) : (
                      <XCircle className="w-8 h-8 text-gray-400 mb-3" />
                    )}
                    <div className="font-bold text-gray-800 mb-1">
                      Registration
                    </div>
                    <div
                      className={`text-sm ${
                        voterInfo.isRegistered
                          ? "text-green-600"
                          : "text-gray-600"
                      }`}
                    >
                      {voterInfo.isRegistered ? "Registered" : "Not Registered"}
                    </div>
                  </div>

                  <div
                    className={`p-6 rounded-xl ${
                      voterInfo.hasVoted
                        ? "bg-blue-50 border-2 border-blue-200"
                        : "bg-gray-50 border-2 border-gray-200"
                    }`}
                  >
                    {voterInfo.hasVoted ? (
                      <CheckCircle className="w-8 h-8 text-blue-600 mb-3" />
                    ) : (
                      <Lock className="w-8 h-8 text-gray-400 mb-3" />
                    )}
                    <div className="font-bold text-gray-800 mb-1">
                      Vote Status
                    </div>
                    <div
                      className={`text-sm ${
                        voterInfo.hasVoted ? "text-blue-600" : "text-gray-600"
                      }`}
                    >
                      {voterInfo.hasVoted ? "Vote Cast" : "Not Voted Yet"}
                    </div>
                  </div>

                  <div className="p-6 rounded-xl bg-purple-50 border-2 border-purple-200">
                    <Shield className="w-8 h-8 text-purple-600 mb-3" />
                    <div className="font-bold text-gray-800 mb-1">
                      Eligibility
                    </div>
                    <div className="text-sm text-purple-600">
                      {voterInfo.isRegistered && !voterInfo.hasVoted
                        ? "Can Vote"
                        : "Action Complete"}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "register" && (
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                Register Single Voter
              </h2>

              {!isCommissioner ? (
                <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6 flex items-start space-x-3">
                  <AlertCircle className="w-6 h-6 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div className="text-yellow-800">
                    <div className="font-bold mb-1">
                      Commissioner Access Required
                    </div>
                    <div className="text-sm">
                      Only the election commissioner can register voters.
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Voter Wallet Address
                    </label>
                    <input
                      type="text"
                      value={voterAddress}
                      onChange={(e) => setVoterAddress(e.target.value)}
                      placeholder="0x..."
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      National ID
                    </label>
                    <input
                      type="text"
                      value={nationalId}
                      onChange={(e) => setNationalId(e.target.value)}
                      placeholder="Enter national ID"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition"
                    />
                  </div>

                  <button
                    onClick={registerVoter}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-4 rounded-xl font-bold transition transform hover:scale-[1.02] shadow-lg disabled:opacity-50 flex items-center justify-center space-x-2"
                  >
                    {loading ? (
                      <Activity className="w-5 h-5 animate-spin" />
                    ) : (
                      <Users className="w-5 h-5" />
                    )}
                    <span>{loading ? "Registering..." : "Register Voter"}</span>
                  </button>
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                Batch Register Voters
              </h2>

              {!isCommissioner ? (
                <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6 flex items-start space-x-3">
                  <AlertCircle className="w-6 h-6 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div className="text-yellow-800">
                    <div className="font-bold mb-1">
                      Commissioner Access Required
                    </div>
                    <div className="text-sm">
                      Only the election commissioner can batch register voters.
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="max-h-96 overflow-y-auto space-y-3">
                    {batchVoters.map((voter, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          value={voter.address}
                          onChange={(e) =>
                            updateBatchVoter(index, "address", e.target.value)
                          }
                          placeholder="0x..."
                          className="flex-1 px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-sm"
                        />
                        <input
                          type="text"
                          value={voter.id}
                          onChange={(e) =>
                            updateBatchVoter(index, "id", e.target.value)
                          }
                          placeholder="National ID"
                          className="flex-1 px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-sm"
                        />
                        {batchVoters.length > 1 && (
                          <button
                            onClick={() => removeBatchVoterRow(index)}
                            className="px-3 py-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition"
                          >
                            <XCircle className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={addBatchVoterRow}
                    className="w-full px-4 py-2 border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50 text-gray-600 hover:text-blue-600 rounded-xl transition font-semibold"
                  >
                    + Add More Voters
                  </button>

                  <button
                    onClick={batchRegisterVoters}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-6 py-4 rounded-xl font-bold transition transform hover:scale-[1.02] shadow-lg disabled:opacity-50 flex items-center justify-center space-x-2"
                  >
                    {loading ? (
                      <Activity className="w-5 h-5 animate-spin" />
                    ) : (
                      <Users className="w-5 h-5" />
                    )}
                    <span>{loading ? "Processing..." : "Batch Register"}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "nominate" && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                Nominate Candidate
              </h2>

              {!isCommissioner ? (
                <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6 flex items-start space-x-3">
                  <AlertCircle className="w-6 h-6 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div className="text-yellow-800">
                    <div className="font-bold mb-1">
                      Commissioner Access Required
                    </div>
                    <div className="text-sm">
                      Only the election commissioner can nominate candidates.
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Candidate Name *
                    </label>
                    <input
                      type="text"
                      value={candidateName}
                      onChange={(e) => setCandidateName(e.target.value)}
                      placeholder="Enter candidate full name"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-purple-100 focus:border-purple-500 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Political Party *
                    </label>
                    <input
                      type="text"
                      value={candidateParty}
                      onChange={(e) => setCandidateParty(e.target.value)}
                      placeholder="Enter party name"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-purple-100 focus:border-purple-500 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Election Manifesto
                    </label>
                    <textarea
                      value={candidateManifesto}
                      onChange={(e) => setCandidateManifesto(e.target.value)}
                      placeholder="Enter candidate's vision and promises..."
                      rows="6"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-purple-100 focus:border-purple-500 transition"
                    />
                  </div>

                  <button
                    onClick={nominateCandidate}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-4 rounded-xl font-bold transition transform hover:scale-[1.02] shadow-lg disabled:opacity-50 flex items-center justify-center space-x-2"
                  >
                    {loading ? (
                      <Activity className="w-5 h-5 animate-spin" />
                    ) : (
                      <TrendingUp className="w-5 h-5" />
                    )}
                    <span>
                      {loading ? "Nominating..." : "Nominate Candidate"}
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "vote" && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Cast Your Vote
              </h2>
              <p className="text-gray-600">
                Select your preferred candidate to participate in this historic
                election
              </p>
            </div>

            {!voterInfo || !voterInfo.isRegistered ? (
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 flex items-start space-x-3">
                <AlertCircle className="w-6 h-6 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="text-red-800">
                  <div className="font-bold mb-1">Not Registered</div>
                  <div className="text-sm">
                    You must be a registered voter to cast your vote.
                  </div>
                </div>
              </div>
            ) : voterInfo.hasVoted ? (
              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 flex items-start space-x-3">
                <CheckCircle className="w-6 h-6 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-blue-800">
                  <div className="font-bold mb-1">Vote Already Cast</div>
                  <div className="text-sm">
                    You have successfully voted in this election. Thank you for
                    participating!
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {candidates.map((candidate) => (
                  <div
                    key={candidate.id}
                    className="bg-white border-2 border-gray-200 hover:border-blue-400 rounded-2xl p-6 transition transform hover:scale-[1.01] hover:shadow-xl"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="text-xl font-bold text-gray-800">
                              {candidate.name}
                            </h3>
                            <p className="text-blue-600 font-semibold">
                              {candidate.party}
                            </p>
                          </div>
                          <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-bold">
                            ID: {candidate.id}
                          </span>
                        </div>

                        {candidate.manifesto && (
                          <p className="text-gray-600 text-sm mb-4">
                            {candidate.manifesto}
                          </p>
                        )}

                        <div className="flex items-center space-x-2">
                          {candidate.isActive && (
                            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold flex items-center space-x-1">
                              <CheckCircle className="w-3 h-3" />
                              <span>Active</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* <button
                        onClick={() => castVote(candidate.id)}
                        disabled={loading}
                        className="ml-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-xl font-bold transition transform hover:scale-105 shadow-lg disabled:opacity-50 flex items-center space-x-2"
                      >
                        <Vote className="w-5 h-5" />
                        <span>Vote</span>
                      </button> */}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "results" && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Election Results
              </h2>
              <p className="text-gray-600">
                Live voting statistics and candidate rankings
              </p>
            </div>

            <div className="space-y-4">
              {candidates
                .sort((a, b) => b.voteCount - a.voteCount)
                .map((candidate, index) => (
                  <div
                    key={candidate.id}
                    className={`bg-white rounded-2xl p-6 transition transform hover:scale-[1.01] ${
                      index === 0
                        ? "border-4 border-yellow-400 shadow-2xl"
                        : "border-2 border-gray-200 shadow-lg"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        {index === 0 && (
                          <div className="bg-gradient-to-br from-yellow-400 to-orange-500 p-3 rounded-xl shadow-lg">
                            <Trophy className="w-8 h-8 text-white" />
                          </div>
                        )}
                        {index === 1 && (
                          <div className="bg-gradient-to-br from-gray-300 to-gray-400 p-3 rounded-xl">
                            <Trophy className="w-7 h-7 text-white" />
                          </div>
                        )}
                        {index === 2 && (
                          <div className="bg-gradient-to-br from-orange-400 to-orange-600 p-3 rounded-xl">
                            <Trophy className="w-6 h-6 text-white" />
                          </div>
                        )}
                        {index > 2 && (
                          <div className="bg-gray-100 p-3 rounded-xl w-14 h-14 flex items-center justify-center">
                            <span className="text-2xl font-bold text-gray-600">
                              {index + 1}
                            </span>
                          </div>
                        )}

                        <div>
                          <h3 className="text-xl font-bold text-gray-800">
                            {candidate.name}
                          </h3>
                          <p className="text-gray-600">{candidate.party}</p>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-3xl font-bold text-blue-600">
                          {candidate.voteCount.toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-600">votes</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {electionStatus &&
                            (
                              (candidate.voteCount / electionStatus.votesCast) *
                              100
                            ).toFixed(1)}
                          %
                        </div>
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
                        <div
                          className={`h-3 rounded-full transition-all duration-1000 ${
                            index === 0
                              ? "bg-gradient-to-r from-yellow-400 to-orange-500"
                              : index === 1
                              ? "bg-gradient-to-r from-gray-400 to-gray-500"
                              : index === 2
                              ? "bg-gradient-to-r from-orange-400 to-orange-600"
                              : "bg-gradient-to-r from-blue-400 to-blue-600"
                          }`}
                          style={{
                            width: `${
                              electionStatus
                                ? (candidate.voteCount /
                                    electionStatus.votesCast) *
                                  100
                                : 0
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {showVoteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
            <div className="text-center mb-6">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Vote className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">
                Confirm Your Vote
              </h3>
              <p className="text-gray-600">This action cannot be undone</p>
            </div>

            {selectedVoteCandidate && (
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <div className="text-sm text-gray-600 mb-1">
                  You are voting for:
                </div>
                <div className="font-bold text-lg text-gray-800">
                  {candidates.find((c) => c.id === selectedVoteCandidate)?.name}
                </div>
                <div className="text-blue-600">
                  {
                    candidates.find((c) => c.id === selectedVoteCandidate)
                      ?.party
                  }
                </div>
              </div>
            )}

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowVoteConfirm(false);
                  setSelectedVoteCandidate(null);
                }}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-xl font-bold transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmVote}
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-bold transition disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <Activity className="w-5 h-5 animate-spin" />
                ) : (
                  <CheckCircle className="w-5 h-5" />
                )}
                <span>{loading ? "Processing..." : "Confirm Vote"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-40">
          <div className="bg-white rounded-2xl p-8 shadow-2xl flex flex-col items-center">
            <Activity className="w-12 h-12 text-blue-600 animate-spin mb-4" />
            <div className="text-gray-800 font-bold">
              Processing Transaction...
            </div>
            <div className="text-gray-600 text-sm mt-2">
              Please confirm in your wallet
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default ElectionDApp;
