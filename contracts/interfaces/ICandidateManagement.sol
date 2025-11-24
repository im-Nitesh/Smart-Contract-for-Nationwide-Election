// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ICandidateManagement
 * @dev Interface for candidate nomination and management in the election system
 * @notice This interface defines all candidate-related operations
 */
interface ICandidateManagement {
    
    /**
     * @dev Struct to store candidate information
     * @param id Unique identifier for the candidate
     * @param name Full name of the candidate
     * @param party Political party affiliation
     * @param manifesto Election manifesto/promises
     * @param voteCount Number of votes received
     * @param isActive Whether the candidate is active in the election
     * @param nominationTime Timestamp when candidate was nominated
     */
    struct Candidate {
        uint256 id;
        string name;
        string party;
        string manifesto;
        uint256 voteCount;
        bool isActive;
        uint256 nominationTime;
    }
    
    /**
     * @dev Nominate a new candidate for the election
     * @param _name Name of the candidate
     * @param _party Political party of the candidate
     * @param _manifesto Election manifesto or campaign promises
     * @notice Can only be called by the election commissioner during nomination phase
     * @notice Name and party cannot be empty
     */
    function nominateCandidate(
        string memory _name,
        string memory _party,
        string memory _manifesto
    ) external;
    
    /**
     * @dev Get candidate details by ID
     * @param _candidateId ID of the candidate to retrieve
     * @return Candidate struct containing all candidate information
     * @notice Returns complete candidate information including vote count
     */
    function getCandidate(uint256 _candidateId) external view returns (Candidate memory);
    
    /**
     * @dev Get all candidates participating in the election
     * @return Array of all candidates with their complete information
     * @notice Includes both active and inactive candidates
     */
    function getAllCandidates() external view returns (Candidate[] memory);
    
    /**
     * @dev Get total number of candidates nominated
     * @return uint256 Total count of candidates
     * @notice Includes both active and inactive candidates
     */
    function getTotalCandidates() external view returns (uint256);
    
    /**
     * @dev Deactivate a candidate from the election
     * @param _candidateId ID of the candidate to deactivate
     * @notice Can only be called by the election commissioner
     * @notice Cannot be called during voting phase
     * @notice Deactivated candidates cannot receive votes
     */
    function deactivateCandidate(uint256 _candidateId) external;
    
    /**
     * @dev Event emitted when a new candidate is nominated
     * @param candidateId Unique ID assigned to the candidate
     * @param name Name of the nominated candidate
     * @param party Political party of the candidate
     * @param timestamp Time when nomination occurred
     */
    event CandidateNominated(
        uint256 indexed candidateId,
        string name,
        string party,
        uint256 timestamp
    );
    
    /**
     * @dev Event emitted when a candidate is deactivated
     * @param candidateId ID of the deactivated candidate
     * @param timestamp Time when deactivation occurred
     */
    event CandidateDeactivated(
        uint256 indexed candidateId, 
        uint256 timestamp
    );
}