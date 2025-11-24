// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/IVoterManagement.sol";
import "./interfaces/ICandidateManagement.sol";

/**
 * @title NationwideElection
 * @dev Smart contract for managing a nationwide election
 * @notice This contract handles voter registration, candidate nomination, voting, and result declaration
 */
contract NationwideElection is IVoterManagement, ICandidateManagement {
    
    // State variables
    address public electionCommissioner;
    string public electionName;
    uint256 public electionStartTime;
    uint256 public electionEndTime;
    bool public resultsPublished;
    
    // Enums
    enum ElectionPhase { Registration, Nomination, Voting, Ended, ResultsDeclared }
    ElectionPhase public currentPhase;
    
    // Mappings
    mapping(address => Voter) private voters;
    mapping(string => bool) private usedNationalIds;
    mapping(uint256 => Candidate) private candidates;
    
    // Arrays
    address[] private voterAddresses;
    uint256[] private candidateIds;
    
    // Counters
    uint256 private candidateCounter;
    uint256 public totalVotesCast;
    uint256 public winningCandidateId;
    
    // Modifiers
    modifier onlyCommissioner() {
        require(msg.sender == electionCommissioner, "Only commissioner can call this");
        _;
    }
    
    modifier onlyDuringPhase(ElectionPhase _phase) {
        require(currentPhase == _phase, "Not in correct election phase");
        _;
    }
    
    modifier onlyRegisteredVoter() {
        require(voters[msg.sender].isRegistered, "Not a registered voter");
        _;
    }
    
    modifier hasNotVoted() {
        require(!voters[msg.sender].hasVoted, "Already voted");
        _;
    }
    
    modifier validCandidate(uint256 _candidateId) {
        require(_candidateId > 0 && _candidateId <= candidateCounter, "Invalid candidate ID");
        require(candidates[_candidateId].isActive, "Candidate is not active");
        _;
    }
    
    // Events
    event ElectionCreated(string name, uint256 startTime, uint256 endTime);
    event PhaseChanged(ElectionPhase newPhase, uint256 timestamp);
    event VoteCast(address indexed voter, uint256 indexed candidateId, uint256 timestamp);
    event ResultsDeclared(uint256 indexed winningCandidateId, uint256 totalVotes, uint256 timestamp);
    event EmergencyStop(uint256 timestamp);
    
    /**
     * @dev Constructor to initialize the election
     * @param _electionName Name of the election
     * @param _durationInDays Duration of voting period in days
     */
    constructor(string memory _electionName, uint256 _durationInDays) {
        require(_durationInDays > 0, "Duration must be positive");
        
        electionCommissioner = msg.sender;
        electionName = _electionName;
        currentPhase = ElectionPhase.Registration;
        electionStartTime = block.timestamp;
        electionEndTime = block.timestamp + (_durationInDays * 1 days);
        resultsPublished = false;
        candidateCounter = 0;
        totalVotesCast = 0;
        
        emit ElectionCreated(_electionName, electionStartTime, electionEndTime);
    }
    
    // ==================== Voter Management Functions ====================
    
    /**
     * @dev Register a new voter
     * @param _voterAddress Address of the voter to register
     * @param _nationalId National ID of the voter
     */
    function registerVoter(
        address _voterAddress,
        string memory _nationalId
    ) 
        external 
        override 
        onlyCommissioner 
        onlyDuringPhase(ElectionPhase.Registration) 
    {
        require(_voterAddress != address(0), "Invalid voter address");
        require(!voters[_voterAddress].isRegistered, "Voter already registered");
        require(!usedNationalIds[_nationalId], "National ID already used");
        require(bytes(_nationalId).length > 0, "National ID cannot be empty");
        
        voters[_voterAddress] = Voter({
            isRegistered: true,
            hasVoted: false,
            votedCandidateId: 0,
            registrationTime: block.timestamp,
            nationalId: _nationalId
        });
        
        usedNationalIds[_nationalId] = true;
        voterAddresses.push(_voterAddress);
        
        emit VoterRegistered(_voterAddress, _nationalId, block.timestamp);
    }
    
    /**
     * @dev Batch register multiple voters
     * @param _voterAddresses Array of voter addresses
     * @param _nationalIds Array of national IDs
     */
    function batchRegisterVoters(
        address[] memory _voterAddresses,
        string[] memory _nationalIds
    ) 
        external 
        onlyCommissioner 
        onlyDuringPhase(ElectionPhase.Registration) 
    {
        require(
            _voterAddresses.length == _nationalIds.length,
            "Arrays length mismatch"
        );
        require(_voterAddresses.length > 0, "Empty arrays");
        
        for (uint256 i = 0; i < _voterAddresses.length; i++) {
            if (!voters[_voterAddresses[i]].isRegistered && 
                !usedNationalIds[_nationalIds[i]]) {
                
                voters[_voterAddresses[i]] = Voter({
                    isRegistered: true,
                    hasVoted: false,
                    votedCandidateId: 0,
                    registrationTime: block.timestamp,
                    nationalId: _nationalIds[i]
                });
                
                usedNationalIds[_nationalIds[i]] = true;
                voterAddresses.push(_voterAddresses[i]);
                
                emit VoterRegistered(_voterAddresses[i], _nationalIds[i], block.timestamp);
            }
        }
    }
    
    /**
     * @dev Check if an address is a registered voter
     */
    function isRegisteredVoter(address _voterAddress) 
        external 
        view 
        override 
        returns (bool) 
    {
        return voters[_voterAddress].isRegistered;
    }
    
    /**
     * @dev Check if a voter has already voted
     */
    function hasVoterVoted(address _voterAddress) 
        external 
        view 
        override 
        returns (bool) 
    {
        return voters[_voterAddress].hasVoted;
    }
    
    /**
     * @dev Get voter details
     */
    function getVoter(address _voterAddress) 
        external 
        view 
        override 
        returns (Voter memory) 
    {
        require(
            msg.sender == electionCommissioner || msg.sender == _voterAddress,
            "Not authorized to view voter details"
        );
        return voters[_voterAddress];
    }
    
    /**
     * @dev Get total number of registered voters
     */
    function getTotalVoters() external view override returns (uint256) {
        return voterAddresses.length;
    }
    
    // ==================== Candidate Management Functions ====================
    
    /**
     * @dev Nominate a new candidate
     * @param _name Name of the candidate
     * @param _party Political party
     * @param _manifesto Election manifesto
     */
    function nominateCandidate(
        string memory _name,
        string memory _party,
        string memory _manifesto
    ) 
        external 
        override 
        onlyCommissioner 
        onlyDuringPhase(ElectionPhase.Nomination) 
    {
        require(bytes(_name).length > 0, "Name cannot be empty");
        require(bytes(_party).length > 0, "Party cannot be empty");
        
        candidateCounter++;
        
        candidates[candidateCounter] = Candidate({
            id: candidateCounter,
            name: _name,
            party: _party,
            manifesto: _manifesto,
            voteCount: 0,
            isActive: true,
            nominationTime: block.timestamp
        });
        
        candidateIds.push(candidateCounter);
        
        emit CandidateNominated(candidateCounter, _name, _party, block.timestamp);
    }
    
    /**
     * @dev Get candidate details by ID
     */
    function getCandidate(uint256 _candidateId) 
        external 
        view 
        override 
        returns (Candidate memory) 
    {
        require(_candidateId > 0 && _candidateId <= candidateCounter, "Invalid candidate ID");
        return candidates[_candidateId];
    }
    
    /**
     * @dev Get all candidates
     */
    function getAllCandidates() external view override returns (Candidate[] memory) {
        Candidate[] memory allCandidates = new Candidate[](candidateCounter);
        
        for (uint256 i = 1; i <= candidateCounter; i++) {
            allCandidates[i - 1] = candidates[i];
        }
        
        return allCandidates;
    }
    
    /**
     * @dev Get total number of candidates
     */
    function getTotalCandidates() external view override returns (uint256) {
        return candidateCounter;
    }
    
    /**
     * @dev Deactivate a candidate
     */
    function deactivateCandidate(uint256 _candidateId) 
        external 
        override 
        onlyCommissioner 
    {
        require(_candidateId > 0 && _candidateId <= candidateCounter, "Invalid candidate ID");
        require(candidates[_candidateId].isActive, "Candidate already inactive");
        require(currentPhase != ElectionPhase.Voting, "Cannot deactivate during voting");
        
        candidates[_candidateId].isActive = false;
        
        emit CandidateDeactivated(_candidateId, block.timestamp);
    }
    
    // ==================== Voting Functions ====================
    
    /**
     * @dev Cast a vote for a candidate
     * @param _candidateId ID of the candidate to vote for
     */
    function castVote(uint256 _candidateId) 
        external 
        onlyDuringPhase(ElectionPhase.Voting)
        onlyRegisteredVoter
        hasNotVoted
        validCandidate(_candidateId)
    {
        require(block.timestamp <= electionEndTime, "Election has ended");
        
        voters[msg.sender].hasVoted = true;
        voters[msg.sender].votedCandidateId = _candidateId;
        
        candidates[_candidateId].voteCount++;
        totalVotesCast++;
        
        emit VoteCast(msg.sender, _candidateId, block.timestamp);
        emit VoterStatusUpdated(msg.sender, true);
    }
    
    /**
     * @dev Get vote count for a specific candidate
     */
    function getCandidateVoteCount(uint256 _candidateId) 
        external 
        view 
        returns (uint256) 
    {
        require(_candidateId > 0 && _candidateId <= candidateCounter, "Invalid candidate ID");
        require(
            resultsPublished || msg.sender == electionCommissioner,
            "Results not yet published"
        );
        return candidates[_candidateId].voteCount;
    }
    
    // ==================== Election Management Functions ====================
    
    /**
     * @dev Move to next election phase
     */
    function moveToNextPhase() external onlyCommissioner {
        require(currentPhase != ElectionPhase.ResultsDeclared, "Election already completed");
        
        if (currentPhase == ElectionPhase.Registration) {
            require(voterAddresses.length > 0, "No voters registered");
            currentPhase = ElectionPhase.Nomination;
        } else if (currentPhase == ElectionPhase.Nomination) {
            require(candidateCounter > 0, "No candidates nominated");
            currentPhase = ElectionPhase.Voting;
        } else if (currentPhase == ElectionPhase.Voting) {
            currentPhase = ElectionPhase.Ended;
        } else if (currentPhase == ElectionPhase.Ended) {
            currentPhase = ElectionPhase.ResultsDeclared;
            _calculateResults();
        }
        
        emit PhaseChanged(currentPhase, block.timestamp);
    }
    
    /**
     * @dev Calculate and declare election results
     */
    function _calculateResults() private {
        require(!resultsPublished, "Results already published");
        require(currentPhase == ElectionPhase.ResultsDeclared, "Not in results phase");
        
        uint256 maxVotes = 0;
        uint256 winnerId = 0;
        
        for (uint256 i = 1; i <= candidateCounter; i++) {
            if (candidates[i].voteCount > maxVotes) {
                maxVotes = candidates[i].voteCount;
                winnerId = i;
            }
        }
        
        winningCandidateId = winnerId;
        resultsPublished = true;
        
        emit ResultsDeclared(winnerId, totalVotesCast, block.timestamp);
    }
    
    /**
     * @dev Get election results
     */
    function getResults() 
        external 
        view 
        returns (
            uint256 winner,
            string memory winnerName,
            string memory winnerParty,
            uint256 winnerVotes,
            uint256 totalVotes
        ) 
    {
        require(resultsPublished, "Results not yet published");
        require(winningCandidateId > 0, "No winner determined");
        
        Candidate memory winningCandidate = candidates[winningCandidateId];
        
        return (
            winningCandidateId,
            winningCandidate.name,
            winningCandidate.party,
            winningCandidate.voteCount,
            totalVotesCast
        );
    }
    
    /**
     * @dev Get current election status
     */
    function getElectionStatus() 
        external 
        view 
        returns (
            string memory name,
            ElectionPhase phase,
            uint256 startTime,
            uint256 endTime,
            uint256 totalVoters,
            uint256 totalCandidates,
            uint256 votesCast,
            bool resultsAvailable
        ) 
    {
        return (
            electionName,
            currentPhase,
            electionStartTime,
            electionEndTime,
            voterAddresses.length,
            candidateCounter,
            totalVotesCast,
            resultsPublished
        );
    }
    
    /**
     * @dev Emergency stop function
     */
    function emergencyStop() external onlyCommissioner {
        currentPhase = ElectionPhase.Ended;
        emit EmergencyStop(block.timestamp);
    }
    
    /**
     * @dev Transfer commissioner role
     */
    function transferCommissioner(address _newCommissioner) external onlyCommissioner {
        require(_newCommissioner != address(0), "Invalid address");
        require(_newCommissioner != electionCommissioner, "Same commissioner");
        electionCommissioner = _newCommissioner;
    }
}