// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IVoterManagement
 * @dev Interface for voter registration and management
 */
interface IVoterManagement {
    
    struct Voter {
        bool isRegistered;
        bool hasVoted;
        uint256 votedCandidateId;
        uint256 registrationTime;
        string nationalId;
    }
    
    /**
     * @dev Register a new voter
     * @param _voterAddress Address of the voter
     * @param _nationalId National ID of the voter
     */
    function registerVoter(address _voterAddress, string memory _nationalId) external;
    
    /**
     * @dev Check if an address is a registered voter
     * @param _voterAddress Address to check
     * @return bool True if registered
     */
    function isRegisteredVoter(address _voterAddress) external view returns (bool);
    
    /**
     * @dev Check if a voter has already voted
     * @param _voterAddress Address to check
     * @return bool True if already voted
     */
    function hasVoterVoted(address _voterAddress) external view returns (bool);
    
    /**
     * @dev Get voter details
     * @param _voterAddress Address of the voter
     * @return Voter struct containing voter information
     */
    function getVoter(address _voterAddress) external view returns (Voter memory);
    
    /**
     * @dev Get total number of registered voters
     * @return uint256 Total registered voters
     */
    function getTotalVoters() external view returns (uint256);
    
    event VoterRegistered(address indexed voter, string nationalId, uint256 timestamp);
    event VoterStatusUpdated(address indexed voter, bool hasVoted);
}