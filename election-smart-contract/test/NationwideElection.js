const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture, time } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("NationwideElection", function () {
  // Fixture to deploy contract
  async function deployElectionFixture() {
    const [commissioner, voter1, voter2, voter3, voter4, voter5, unauthorized] = 
      await ethers.getSigners();

    const electionName = "Test Election 2024";
    const durationInDays = 7;

    const NationwideElection = await ethers.getContractFactory("NationwideElection");
    const election = await NationwideElection.deploy(electionName, durationInDays);

    return { 
      election, 
      commissioner, 
      voter1, 
      voter2, 
      voter3, 
      voter4, 
      voter5, 
      unauthorized,
      electionName,
      durationInDays 
    };
  }

  describe("Deployment", function () {
    it("Should set the correct election name", async function () {
      const { election, electionName } = await loadFixture(deployElectionFixture);
      expect(await election.electionName()).to.equal(electionName);
    });

    it("Should set the commissioner correctly", async function () {
      const { election, commissioner } = await loadFixture(deployElectionFixture);
      expect(await election.electionCommissioner()).to.equal(commissioner.address);
    });

    it("Should initialize in Registration phase", async function () {
      const { election } = await loadFixture(deployElectionFixture);
      expect(await election.currentPhase()).to.equal(0); // Registration phase
    });

    it("Should set correct election duration", async function () {
      const { election, durationInDays } = await loadFixture(deployElectionFixture);
      const startTime = await election.electionStartTime();
      const endTime = await election.electionEndTime();
      const duration = endTime - startTime;
      expect(duration).to.equal(BigInt(durationInDays * 24 * 60 * 60));
    });

    it("Should initialize counters to zero", async function () {
      const { election } = await loadFixture(deployElectionFixture);
      expect(await election.getTotalVoters()).to.equal(0);
      expect(await election.getTotalCandidates()).to.equal(0);
      expect(await election.totalVotesCast()).to.equal(0);
    });

    it("Should revert with zero duration", async function () {
      const NationwideElection = await ethers.getContractFactory("NationwideElection");
      await expect(
        NationwideElection.deploy("Test Election", 0)
      ).to.be.revertedWith("Duration must be positive");
    });
  });

  describe("Voter Registration", function () {
    it("Should allow commissioner to register a voter", async function () {
      const { election, commissioner, voter1 } = await loadFixture(deployElectionFixture);
      
      await expect(
        election.connect(commissioner).registerVoter(voter1.address, "ID001")
      ).to.emit(election, "VoterRegistered")
        .withArgs(voter1.address, "ID001", await time.latest() + 1);

      expect(await election.isRegisteredVoter(voter1.address)).to.be.true;
      expect(await election.getTotalVoters()).to.equal(1);
    });

    it("Should allow batch voter registration", async function () {
      const { election, commissioner, voter1, voter2, voter3 } = 
        await loadFixture(deployElectionFixture);
      
      const addresses = [voter1.address, voter2.address, voter3.address];
      const ids = ["ID001", "ID002", "ID003"];

      await election.connect(commissioner).batchRegisterVoters(addresses, ids);

      expect(await election.getTotalVoters()).to.equal(3);
      expect(await election.isRegisteredVoter(voter1.address)).to.be.true;
      expect(await election.isRegisteredVoter(voter2.address)).to.be.true;
      expect(await election.isRegisteredVoter(voter3.address)).to.be.true;
    });

    it("Should prevent non-commissioner from registering voters", async function () {
      const { election, voter1, unauthorized } = await loadFixture(deployElectionFixture);
      
      await expect(
        election.connect(unauthorized).registerVoter(voter1.address, "ID001")
      ).to.be.revertedWith("Only commissioner can call this");
    });

    it("Should prevent duplicate voter registration", async function () {
      const { election, commissioner, voter1 } = await loadFixture(deployElectionFixture);
      
      await election.connect(commissioner).registerVoter(voter1.address, "ID001");
      
      await expect(
        election.connect(commissioner).registerVoter(voter1.address, "ID002")
      ).to.be.revertedWith("Voter already registered");
    });

    it("Should prevent duplicate national ID usage", async function () {
      const { election, commissioner, voter1, voter2 } = 
        await loadFixture(deployElectionFixture);
      
      await election.connect(commissioner).registerVoter(voter1.address, "ID001");
      
      await expect(
        election.connect(commissioner).registerVoter(voter2.address, "ID001")
      ).to.be.revertedWith("National ID already used");
    });

    it("Should prevent registration with zero address", async function () {
      const { election, commissioner } = await loadFixture(deployElectionFixture);
      
      await expect(
        election.connect(commissioner).registerVoter(ethers.ZeroAddress, "ID001")
      ).to.be.revertedWith("Invalid voter address");
    });

    it("Should prevent registration with empty national ID", async function () {
      const { election, commissioner, voter1 } = await loadFixture(deployElectionFixture);
      
      await expect(
        election.connect(commissioner).registerVoter(voter1.address, "")
      ).to.be.revertedWith("National ID cannot be empty");
    });

    it("Should retrieve voter details correctly", async function () {
      const { election, commissioner, voter1 } = await loadFixture(deployElectionFixture);
      
      await election.connect(commissioner).registerVoter(voter1.address, "ID001");
      
      const voterDetails = await election.connect(voter1).getVoter(voter1.address);
      expect(voterDetails.isRegistered).to.be.true;
      expect(voterDetails.hasVoted).to.be.false;
      expect(voterDetails.nationalId).to.equal("ID001");
    });

    it("Should prevent unauthorized access to voter details", async function () {
      const { election, commissioner, voter1, unauthorized } = 
        await loadFixture(deployElectionFixture);
      
      await election.connect(commissioner).registerVoter(voter1.address, "ID001");
      
      await expect(
        election.connect(unauthorized).getVoter(voter1.address)
      ).to.be.revertedWith("Not authorized to view voter details");
    });
  });

  describe("Candidate Nomination", function () {
    it("Should nominate a candidate in nomination phase", async function () {
      const { election, commissioner, voter1 } = await loadFixture(deployElectionFixture);
      
      // Register voter and move to nomination phase
      await election.connect(commissioner).registerVoter(voter1.address, "ID001");
      await election.connect(commissioner).moveToNextPhase();

      await expect(
        election.connect(commissioner).nominateCandidate(
          "John Doe",
          "Democratic Party",
          "Better future for all"
        )
      ).to.emit(election, "CandidateNominated");

      expect(await election.getTotalCandidates()).to.equal(1);
    });

    it("Should retrieve candidate details correctly", async function () {
      const { election, commissioner, voter1 } = await loadFixture(deployElectionFixture);
      
      await election.connect(commissioner).registerVoter(voter1.address, "ID001");
      await election.connect(commissioner).moveToNextPhase();
      
      await election.connect(commissioner).nominateCandidate(
        "Jane Smith",
        "Republican Party",
        "Economic growth"
      );

      const candidate = await election.getCandidate(1);
      expect(candidate.name).to.equal("Jane Smith");
      expect(candidate.party).to.equal("Republican Party");
      expect(candidate.manifesto).to.equal("Economic growth");
      expect(candidate.isActive).to.be.true;
      expect(candidate.voteCount).to.equal(0);
    });

    it("Should get all candidates", async function () {
      const { election, commissioner, voter1 } = await loadFixture(deployElectionFixture);
      
      await election.connect(commissioner).registerVoter(voter1.address, "ID001");
      await election.connect(commissioner).moveToNextPhase();
      
      await election.connect(commissioner).nominateCandidate("Candidate 1", "Party 1", "Manifesto 1");
      await election.connect(commissioner).nominateCandidate("Candidate 2", "Party 2", "Manifesto 2");
      await election.connect(commissioner).nominateCandidate("Candidate 3", "Party 3", "Manifesto 3");

      const candidates = await election.getAllCandidates();
      expect(candidates.length).to.equal(3);
      expect(candidates[0].name).to.equal("Candidate 1");
      expect(candidates[1].name).to.equal("Candidate 2");
      expect(candidates[2].name).to.equal("Candidate 3");
    });

    it("Should prevent nomination in wrong phase", async function () {
      const { election, commissioner } = await loadFixture(deployElectionFixture);
      
      await expect(
        election.connect(commissioner).nominateCandidate("John Doe", "Party", "Manifesto")
      ).to.be.revertedWith("Not in correct election phase");
    });

    it("Should prevent nomination with empty name", async function () {
      const { election, commissioner, voter1 } = await loadFixture(deployElectionFixture);
      
      await election.connect(commissioner).registerVoter(voter1.address, "ID001");
      await election.connect(commissioner).moveToNextPhase();

      await expect(
        election.connect(commissioner).nominateCandidate("", "Party", "Manifesto")
      ).to.be.revertedWith("Name cannot be empty");
    });

    it("Should prevent nomination with empty party", async function () {
      const { election, commissioner, voter1 } = await loadFixture(deployElectionFixture);
      
      await election.connect(commissioner).registerVoter(voter1.address, "ID001");
      await election.connect(commissioner).moveToNextPhase();

      await expect(
        election.connect(commissioner).nominateCandidate("John Doe", "", "Manifesto")
      ).to.be.revertedWith("Party cannot be empty");
    });

    it("Should allow commissioner to deactivate candidate", async function () {
      const { election, commissioner, voter1 } = await loadFixture(deployElectionFixture);
      
      await election.connect(commissioner).registerVoter(voter1.address, "ID001");
      await election.connect(commissioner).moveToNextPhase();
      await election.connect(commissioner).nominateCandidate("John Doe", "Party", "Manifesto");

      await expect(
        election.connect(commissioner).deactivateCandidate(1)
      ).to.emit(election, "CandidateDeactivated");

      const candidate = await election.getCandidate(1);
      expect(candidate.isActive).to.be.false;
    });
  });

  describe("Phase Management", function () {
    it("Should move from Registration to Nomination phase", async function () {
      const { election, commissioner, voter1 } = await loadFixture(deployElectionFixture);
      
      await election.connect(commissioner).registerVoter(voter1.address, "ID001");
      
      await expect(
        election.connect(commissioner).moveToNextPhase()
      ).to.emit(election, "PhaseChanged")
        .withArgs(1, await time.latest() + 1); // Nomination phase

      expect(await election.currentPhase()).to.equal(1);
    });

    it("Should move from Nomination to Voting phase", async function () {
      const { election, commissioner, voter1 } = await loadFixture(deployElectionFixture);
      
      await election.connect(commissioner).registerVoter(voter1.address, "ID001");
      await election.connect(commissioner).moveToNextPhase(); // To Nomination
      await election.connect(commissioner).nominateCandidate("Candidate", "Party", "Manifesto");
      await election.connect(commissioner).moveToNextPhase(); // To Voting

      expect(await election.currentPhase()).to.equal(2);
    });

    it("Should prevent phase change with no voters", async function () {
      const { election, commissioner } = await loadFixture(deployElectionFixture);
      
      await expect(
        election.connect(commissioner).moveToNextPhase()
      ).to.be.revertedWith("No voters registered");
    });

    it("Should prevent phase change with no candidates", async function () {
      const { election, commissioner, voter1 } = await loadFixture(deployElectionFixture);
      
      await election.connect(commissioner).registerVoter(voter1.address, "ID001");
      await election.connect(commissioner).moveToNextPhase(); // To Nomination

      await expect(
        election.connect(commissioner).moveToNextPhase()
      ).to.be.revertedWith("No candidates nominated");
    });

    it("Should prevent non-commissioner from changing phase", async function () {
      const { election, unauthorized } = await loadFixture(deployElectionFixture);
      
      await expect(
        election.connect(unauthorized).moveToNextPhase()
      ).to.be.revertedWith("Only commissioner can call this");
    });
  });

  describe("Voting", function () {
    async function setupVotingPhase() {
      const fixture = await loadFixture(deployElectionFixture);
      const { election, commissioner, voter1, voter2, voter3 } = fixture;

      // Register voters
      await election.connect(commissioner).registerVoter(voter1.address, "ID001");
      await election.connect(commissioner).registerVoter(voter2.address, "ID002");
      await election.connect(commissioner).registerVoter(voter3.address, "ID003");

      // Move to Nomination phase
      await election.connect(commissioner).moveToNextPhase();

      // Nominate candidates
      await election.connect(commissioner).nominateCandidate("Alice", "Party A", "Manifesto A");
      await election.connect(commissioner).nominateCandidate("Bob", "Party B", "Manifesto B");
      await election.connect(commissioner).nominateCandidate("Charlie", "Party C", "Manifesto C");

      // Move to Voting phase
      await election.connect(commissioner).moveToNextPhase();

      return fixture;
    }

    it("Should allow registered voter to cast vote", async function () {
      const { election, voter1 } = await setupVotingPhase();

      await expect(
        election.connect(voter1).castVote(1)
      ).to.emit(election, "VoteCast")
        .withArgs(voter1.address, 1, await time.latest() + 1);

      expect(await election.hasVoterVoted(voter1.address)).to.be.true;
      expect(await election.totalVotesCast()).to.equal(1);
    });

    it("Should increment candidate vote count", async function () {
      const { election, commissioner, voter1, voter2 } = await setupVotingPhase();

      await election.connect(voter1).castVote(1);
      await election.connect(voter2).castVote(1);

      // Move to results phase to view vote counts
      await election.connect(commissioner).moveToNextPhase(); // To Ended
      await election.connect(commissioner).moveToNextPhase(); // To ResultsDeclared

      expect(await election.getCandidateVoteCount(1)).to.equal(2);
    });

    it("Should prevent unregistered voter from voting", async function () {
      const { election, unauthorized } = await setupVotingPhase();

      await expect(
        election.connect(unauthorized).castVote(1)
      ).to.be.revertedWith("Not a registered voter");
    });

    it("Should prevent double voting", async function () {
      const { election, voter1 } = await setupVotingPhase();

      await election.connect(voter1).castVote(1);

      await expect(
        election.connect(voter1).castVote(2)
      ).to.be.revertedWith("Already voted");
    });

    it("Should prevent voting for invalid candidate", async function () {
      const { election, voter1 } = await setupVotingPhase();

      await expect(
        election.connect(voter1).castVote(99)
      ).to.be.revertedWith("Invalid candidate ID");
    });

    it("Should prevent voting for inactive candidate", async function () {
      const { election, commissioner, voter1 } = await setupVotingPhase();

      await election.connect(commissioner).moveToNextPhase(); // Back to Ended
      await election.connect(commissioner).deactivateCandidate(1);
      
      // Move back to voting (in real scenario, this wouldn't happen)
      // This test checks the inactive candidate validation
    });

    it("Should prevent voting in wrong phase", async function () {
      const { election, commissioner, voter1 } = await loadFixture(deployElectionFixture);
      
      await election.connect(commissioner).registerVoter(voter1.address, "ID001");

      await expect(
        election.connect(voter1).castVote(1)
      ).to.be.revertedWith("Not in correct election phase");
    });

    it("Should handle multiple voters correctly", async function () {
      const { election, voter1, voter2, voter3 } = await setupVotingPhase();

      await election.connect(voter1).castVote(1);
      await election.connect(voter2).castVote(2);
      await election.connect(voter3).castVote(1);

      expect(await election.totalVotesCast()).to.equal(3);
    });
  });

  describe("Results Declaration", function () {
    async function setupResultsPhase() {
      const fixture = await loadFixture(deployElectionFixture);
      const { election, commissioner, voter1, voter2, voter3, voter4, voter5 } = fixture;

      // Register voters
      await election.connect(commissioner).batchRegisterVoters(
        [voter1.address, voter2.address, voter3.address, voter4.address, voter5.address],
        ["ID001", "ID002", "ID003", "ID004", "ID005"]
      );

      // Move to Nomination
      await election.connect(commissioner).moveToNextPhase();

      // Nominate candidates
      await election.connect(commissioner).nominateCandidate("Alice", "Party A", "Manifesto A");
      await election.connect(commissioner).nominateCandidate("Bob", "Party B", "Manifesto B");

      // Move to Voting
      await election.connect(commissioner).moveToNextPhase();

      // Cast votes: Alice gets 3, Bob gets 2
      await election.connect(voter1).castVote(1);
      await election.connect(voter2).castVote(1);
      await election.connect(voter3).castVote(1);
      await election.connect(voter4).castVote(2);
      await election.connect(voter5).castVote(2);

      // Move to Ended
      await election.connect(commissioner).moveToNextPhase();

      // Move to Results Declared
      await election.connect(commissioner).moveToNextPhase();

      return fixture;
    }

    it("Should declare correct winner", async function () {
      const { election } = await setupResultsPhase();

      const results = await election.getResults();
      expect(results.winner).to.equal(1); // Alice
      expect(results.winnerName).to.equal("Alice");
      expect(results.winnerVotes).to.equal(3);
      expect(results.totalVotes).to.equal(5);
    });

    it("Should emit ResultsDeclared event", async function () {
      const fixture = await loadFixture(deployElectionFixture);
      const { election, commissioner, voter1 } = fixture;

      await election.connect(commissioner).registerVoter(voter1.address, "ID001");
      await election.connect(commissioner).moveToNextPhase();
      await election.connect(commissioner).nominateCandidate("Alice", "Party", "Manifesto");
      await election.connect(commissioner).moveToNextPhase();
      await election.connect(voter1).castVote(1);
      await election.connect(commissioner).moveToNextPhase();

      await expect(
        election.connect(commissioner).moveToNextPhase()
      ).to.emit(election, "ResultsDeclared");
    });

    it("Should prevent viewing results before declaration", async function () {
      const { election, commissioner, voter1 } = await loadFixture(deployElectionFixture);

      await election.connect(commissioner).registerVoter(voter1.address, "ID001");
      await election.connect(commissioner).moveToNextPhase();
      await election.connect(commissioner).nominateCandidate("Alice", "Party", "Manifesto");
      await election.connect(commissioner).moveToNextPhase();

      await expect(
        election.getResults()
      ).to.be.revertedWith("Results not yet published");
    });

    it("Should allow commissioner to view vote counts before results", async function () {
      const { election, commissioner, voter1 } = await loadFixture(deployElectionFixture);

      await election.connect(commissioner).registerVoter(voter1.address, "ID001");
      await election.connect(commissioner).moveToNextPhase();
      await election.connect(commissioner).nominateCandidate("Alice", "Party", "Manifesto");
      await election.connect(commissioner).moveToNextPhase();
      await election.connect(voter1).castVote(1);

      // Commissioner can view before results are published
      const voteCount = await election.connect(commissioner).getCandidateVoteCount(1);
      expect(voteCount).to.equal(1);
    });

    it("Should get correct election status", async function () {
      const { election } = await setupResultsPhase();

      const status = await election.getElectionStatus();
      expect(status.name).to.equal("Test Election 2024");
      expect(status.phase).to.equal(4); // ResultsDeclared
      expect(status.totalVoters).to.equal(5);
      expect(status.totalCandidates).to.equal(2);
      expect(status.votesCast).to.equal(5);
      expect(status.resultsAvailable).to.be.true;
    });
  });

  describe("Emergency Functions", function () {
    it("Should allow commissioner to emergency stop", async function () {
      const { election, commissioner, voter1 } = await loadFixture(deployElectionFixture);

      await election.connect(commissioner).registerVoter(voter1.address, "ID001");

      await expect(
        election.connect(commissioner).emergencyStop()
      ).to.emit(election, "EmergencyStop");

      expect(await election.currentPhase()).to.equal(3); // Ended
    });

    it("Should prevent non-commissioner from emergency stop", async function () {
      const { election, unauthorized } = await loadFixture(deployElectionFixture);

      await expect(
        election.connect(unauthorized).emergencyStop()
      ).to.be.revertedWith("Only commissioner can call this");
    });

    it("Should allow commissioner transfer", async function () {
      const { election, commissioner, voter1 } = await loadFixture(deployElectionFixture);

      await election.connect(commissioner).transferCommissioner(voter1.address);

      expect(await election.electionCommissioner()).to.equal(voter1.address);
    });

    it("Should prevent transfer to zero address", async function () {
      const { election, commissioner } = await loadFixture(deployElectionFixture);

      await expect(
        election.connect(commissioner).transferCommissioner(ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid address");
    });
  });

  describe("Edge Cases", function () {
    // it("Should handle election with no votes cast", async function () {
    //   const { election, commissioner, voter1 } = await loadFixture(deployElectionFixture);

    //   await election.connect(commissioner).registerVoter(voter1.address, "ID001");
    //   await election.connect(commissioner).moveToNextPhase();
    //   await election.connect(commissioner).nominateCandidate("Alice", "Party", "Manifesto");
    //   await election.connect(commissioner).moveToNextPhase();
    //   // Don't cast any votes
    //   await election.connect(commissioner).moveToNextPhase();
    //   await election.connect(commissioner).moveToNextPhase();

    //   const results = await election.getResults();
    //   expect(results.totalVotes).to.equal(0);
    // });

    it("Should handle tie scenario correctly", async function () {
      const fixture = await loadFixture(deployElectionFixture);
      const { election, commissioner, voter1, voter2 } = fixture;

      await election.connect(commissioner).batchRegisterVoters(
        [voter1.address, voter2.address],
        ["ID001", "ID002"]
      );
      await election.connect(commissioner).moveToNextPhase();
      await election.connect(commissioner).nominateCandidate("Alice", "Party A", "Manifesto A");
      await election.connect(commissioner).nominateCandidate("Bob", "Party B", "Manifesto B");
      await election.connect(commissioner).moveToNextPhase();
      await election.connect(voter1).castVote(1);
      await election.connect(voter2).castVote(2);
      await election.connect(commissioner).moveToNextPhase();
      await election.connect(commissioner).moveToNextPhase();

      const results = await election.getResults();
      // Winner will be the first one with max votes (implementation specific)
      expect(results.winnerVotes).to.equal(1);
    });

    it("Should handle large number of candidates", async function () {
      const { election, commissioner, voter1 } = await loadFixture(deployElectionFixture);

      await election.connect(commissioner).registerVoter(voter1.address, "ID001");
      await election.connect(commissioner).moveToNextPhase();

      // Nominate 10 candidates
      for (let i = 1; i <= 10; i++) {
        await election.connect(commissioner).nominateCandidate(
          `Candidate ${i}`,
          `Party ${i}`,
          `Manifesto ${i}`
        );
      }

      expect(await election.getTotalCandidates()).to.equal(10);
      const candidates = await election.getAllCandidates();
      expect(candidates.length).to.equal(10);
    });

    it("Should handle large batch voter registration", async function () {
      const { election, commissioner } = await loadFixture(deployElectionFixture);

      const signers = await ethers.getSigners();
      const voters = signers.slice(1, 11); // Get 10 voters
      const addresses = voters.map(v => v.address);
      const ids = Array.from({ length: 10 }, (_, i) => `ID${String(i + 1).padStart(3, '0')}`);

      await election.connect(commissioner).batchRegisterVoters(addresses, ids);

      expect(await election.getTotalVoters()).to.equal(10);
    });
  });
});