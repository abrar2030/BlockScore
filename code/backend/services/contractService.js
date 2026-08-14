/**
 * BlockScore API - Contract interaction middleware
 * Handles interaction with Ethereum smart contracts
 */
const { Web3 } = require("web3");
const path = require("path");
const config = require("../config");

// Contract ABIs
//
// Hardhat (which this project now uses instead of Truffle) writes compiled
// artifacts to artifacts/contracts/<File>.sol/<Contract>.json rather than
// Truffle's flat build/contracts/<Contract>.json. Run `npm run compile`
// inside code/blockchain (or `npm test`, which compiles automatically)
// before starting this service so these files exist.
//
// The path below assumes code/blockchain is a sibling of code/backend on
// the same filesystem, which holds for local development but NOT for a
// Dockerized backend: docker-compose.yml's backend build context is
// scoped to ./backend alone, so code/blockchain never ends up in that
// image. Setting CONTRACT_ARTIFACTS_PATH (e.g. to wherever the compiled
// artifacts were copied/mounted into the container) overrides this.
const artifactsBase =
  process.env.CONTRACT_ARTIFACTS_PATH ||
  path.join(__dirname, "..", "..", "blockchain", "artifacts", "contracts");
const CreditScoreABI = require(
  path.join(artifactsBase, "CreditScore.sol", "CreditScore.json"),
).abi;
const LoanContractABI = require(
  path.join(artifactsBase, "LoanContract.sol", "LoanContract.json"),
).abi;

class ContractService {
  constructor() {
    this.web3 = new Web3(config.blockchain.provider);
    this.creditScoreContract = null;
    this.loanContract = null;
    this.initialized = false;
  }

  /**
   * Initialize contract connections
   */
  async init() {
    try {
      // Initialize contract instances
      if (config.contracts.creditScoreAddress) {
        this.creditScoreContract = new this.web3.eth.Contract(
          CreditScoreABI,
          config.contracts.creditScoreAddress,
        );
      }

      if (config.contracts.loanContractAddress) {
        this.loanContract = new this.web3.eth.Contract(
          LoanContractABI,
          config.contracts.loanContractAddress,
        );
      }

      this.initialized = true;
      console.log("Contract service initialized successfully");
      return true;
    } catch (error) {
      console.error("Failed to initialize contract service:", error);
      return false;
    }
  }

  /**
   * Get account address from private key
   * @param {string} privateKey - Private key (without 0x prefix)
   * @returns {string} - Account address
   */
  getAccountFromPrivateKey(privateKey) {
    try {
      const account = this.web3.eth.accounts.privateKeyToAccount(
        `0x${privateKey}`,
      );
      return account.address;
    } catch (error) {
      console.error("Invalid private key:", error);
      throw new Error("Invalid private key");
    }
  }

  /**
   * Sign and send transaction
   * @param {Object} tx - Transaction object
   * @param {string} privateKey - Private key for signing
   * @returns {Promise<Object>} - Transaction receipt
   */
  async signAndSendTransaction(tx, privateKey) {
    try {
      const account = this.web3.eth.accounts.privateKeyToAccount(
        `0x${privateKey}`,
      );
      const signedTx = await account.signTransaction({
        ...tx,
        gas: config.blockchain.gasLimit,
      });

      const receipt = await this.web3.eth.sendSignedTransaction(
        signedTx.rawTransaction,
      );
      return receipt;
    } catch (error) {
      console.error("Transaction failed:", error);
      throw new Error(`Transaction failed: ${error.message}`);
    }
  }

  /**
   * Get user's credit score
   * @param {string} userAddress - User's blockchain address
   * @returns {Promise<Object>} - Credit score and last updated timestamp
   */
  async getCreditScore(userAddress) {
    if (!this.initialized || !this.creditScoreContract) {
      throw new Error("Contract service not initialized");
    }

    try {
      const result = await this.creditScoreContract.methods
        .getCreditScore(userAddress)
        .call();
      return {
        score: parseInt(result.score),
        lastUpdated: parseInt(result.lastUpdated),
      };
    } catch (error) {
      console.error("Failed to get credit score:", error);
      throw new Error(`Failed to get credit score: ${error.message}`);
    }
  }

  /**
   * Get user's credit history
   * @param {string} userAddress - User's blockchain address
   * @returns {Promise<Array>} - Array of credit records
   */
  async getCreditHistory(userAddress) {
    if (!this.initialized || !this.creditScoreContract) {
      throw new Error("Contract service not initialized");
    }

    try {
      const records = await this.creditScoreContract.methods
        .getCreditHistory(userAddress)
        .call();

      // Format records for easier consumption
      return records.map((record) => ({
        timestamp: parseInt(record.timestamp),
        amount: parseInt(record.amount),
        repaid: record.repaid,
        repaymentTimestamp: parseInt(record.repaymentTimestamp),
        provider: record.provider,
        recordType: record.recordType,
        scoreImpact: parseInt(record.scoreImpact),
      }));
    } catch (error) {
      console.error("Failed to get credit history:", error);
      throw new Error(`Failed to get credit history: ${error.message}`);
    }
  }

  /**
   * Add credit record for a user
   * @param {string} userAddress - User's blockchain address
   * @param {number} amount - Amount involved in the credit event
   * @param {string} recordType - Type of credit record
   * @param {number} scoreImpact - Impact on credit score (-10 to 10)
   * @param {string} privateKey - Provider's private key for signing
   * @returns {Promise<Object>} - Transaction receipt
   */
  async addCreditRecord(
    userAddress,
    amount,
    recordType,
    scoreImpact,
    privateKey,
  ) {
    if (!this.initialized || !this.creditScoreContract) {
      throw new Error("Contract service not initialized");
    }

    try {
      const providerAddress = this.getAccountFromPrivateKey(privateKey);

      const tx = this.creditScoreContract.methods.addCreditRecord(
        userAddress,
        amount,
        recordType,
        scoreImpact,
      );

      const data = tx.encodeABI();
      const txObject = {
        from: providerAddress,
        to: this.creditScoreContract.options.address,
        data,
        gas: config.blockchain.gasLimit,
      };

      return await this.signAndSendTransaction(txObject, privateKey);
    } catch (error) {
      console.error("Failed to add credit record:", error);
      throw new Error(`Failed to add credit record: ${error.message}`);
    }
  }

  /**
   * Mark a credit record as repaid
   * @param {string} userAddress - User's blockchain address
   * @param {number} recordIndex - Index of the record in user's history
   * @param {string} privateKey - Provider's private key for signing
   * @returns {Promise<Object>} - Transaction receipt
   */
  async markRecordRepaid(userAddress, recordIndex, privateKey) {
    if (!this.initialized || !this.creditScoreContract) {
      throw new Error("Contract service not initialized");
    }

    try {
      const providerAddress = this.getAccountFromPrivateKey(privateKey);

      const tx = this.creditScoreContract.methods.markRepaid(
        userAddress,
        recordIndex,
      );
      const data = tx.encodeABI();

      const txObject = {
        from: providerAddress,
        to: this.creditScoreContract.options.address,
        data,
        gas: config.blockchain.gasLimit,
      };

      return await this.signAndSendTransaction(txObject, privateKey);
    } catch (error) {
      console.error("Failed to mark record as repaid:", error);
      throw new Error(`Failed to mark record as repaid: ${error.message}`);
    }
  }

  /**
   * Create a new loan
   * @param {number} amount - Loan amount
   * @param {number} interestRate - Annual interest rate (in basis points)
   * @param {number} durationDays - Loan duration in days
   * @param {string} privateKey - Borrower's private key for signing
   * @returns {Promise<Object>} - Transaction receipt and loan ID
   */
  async createLoan(amount, interestRate, durationDays, privateKey) {
    if (!this.initialized || !this.loanContract) {
      throw new Error("Contract service not initialized");
    }

    try {
      const borrowerAddress = this.getAccountFromPrivateKey(privateKey);

      const tx = this.loanContract.methods.createLoan(
        amount,
        interestRate,
        durationDays,
      );
      const data = tx.encodeABI();

      const txObject = {
        from: borrowerAddress,
        to: this.loanContract.options.address,
        data,
        gas: config.blockchain.gasLimit,
      };

      const receipt = await this.signAndSendTransaction(txObject, privateKey);

      // Extract loan ID from event logs
      const loanCreatedEvent = receipt.logs.find(
        (log) =>
          log.topics[0] ===
          this.web3.utils.sha3("LoanCreated(uint256,address,uint256)"),
      );

      const loanId = parseInt(loanCreatedEvent.topics[1], 16);

      return {
        receipt,
        loanId,
      };
    } catch (error) {
      console.error("Failed to create loan:", error);
      throw new Error(`Failed to create loan: ${error.message}`);
    }
  }

  /**
   * Approve a loan
   * @param {number} loanId - ID of the loan to approve
   * @param {string} privateKey - Owner's private key for signing
   * @returns {Promise<Object>} - Transaction receipt
   */
  async approveLoan(loanId, privateKey) {
    if (!this.initialized || !this.loanContract) {
      throw new Error("Contract service not initialized");
    }

    try {
      const ownerAddress = this.getAccountFromPrivateKey(privateKey);

      const tx = this.loanContract.methods.approveLoan(loanId);
      const data = tx.encodeABI();

      const txObject = {
        from: ownerAddress,
        to: this.loanContract.options.address,
        data,
        gas: config.blockchain.gasLimit,
      };

      return await this.signAndSendTransaction(txObject, privateKey);
    } catch (error) {
      console.error("Failed to approve loan:", error);
      throw new Error(`Failed to approve loan: ${error.message}`);
    }
  }

  /**
   * Repay a loan
   * @param {number} loanId - ID of the loan to repay
   * @param {string} privateKey - Borrower's private key for signing
   * @returns {Promise<Object>} - Transaction receipt
   */
  async repayLoan(loanId, privateKey) {
    if (!this.initialized || !this.loanContract) {
      throw new Error("Contract service not initialized");
    }

    try {
      const borrowerAddress = this.getAccountFromPrivateKey(privateKey);

      const tx = this.loanContract.methods.repayLoan(loanId);
      const data = tx.encodeABI();

      const txObject = {
        from: borrowerAddress,
        to: this.loanContract.options.address,
        data,
        gas: config.blockchain.gasLimit,
      };

      return await this.signAndSendTransaction(txObject, privateKey);
    } catch (error) {
      console.error("Failed to repay loan:", error);
      throw new Error(`Failed to repay loan: ${error.message}`);
    }
  }

  /**
   * Get borrower's loans
   * @param {string} borrowerAddress - Borrower's blockchain address
   * @returns {Promise<Array>} - Array of loan IDs
   */
  async getBorrowerLoans(borrowerAddress) {
    if (!this.initialized || !this.loanContract) {
      throw new Error("Contract service not initialized");
    }

    try {
      const loanIds = await this.loanContract.methods
        .getBorrowerLoans(borrowerAddress)
        .call();
      return loanIds.map((id) => parseInt(id));
    } catch (error) {
      console.error("Failed to get borrower loans:", error);
      throw new Error(`Failed to get borrower loans: ${error.message}`);
    }
  }

  /**
   * Get loan details
   * @param {number} loanId - ID of the loan
   * @returns {Promise<Object>} - Loan details
   */
  async getLoanDetails(loanId) {
    if (!this.initialized || !this.loanContract) {
      throw new Error("Contract service not initialized");
    }

    try {
      const loan = await this.loanContract.methods
        .getLoanDetails(loanId)
        .call();

      return {
        borrower: loan.borrower,
        amount: parseInt(loan.amount),
        interestRate: parseInt(loan.interestRate),
        creationTimestamp: parseInt(loan.creationTimestamp),
        dueDate: parseInt(loan.dueDate),
        approved: loan.approved,
        repaid: loan.repaid,
        repaymentTimestamp: parseInt(loan.repaymentTimestamp),
      };
    } catch (error) {
      console.error("Failed to get loan details:", error);
      throw new Error(`Failed to get loan details: ${error.message}`);
    }
  }
}

module.exports = new ContractService();
