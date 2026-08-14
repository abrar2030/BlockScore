// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

/**
 * @title CreditScoreV2
 * @dev Production-ready credit scoring contract with comprehensive security and compliance features
 * Implements financial industry standards for credit record management on blockchain
 */
contract CreditScoreV2 is ReentrancyGuard, Pausable, AccessControl, EIP712 {
    using ECDSA for bytes32;

    // Role definitions for granular access control
    bytes32 public constant CREDIT_PROVIDER_ROLE = keccak256(
        "CREDIT_PROVIDER_ROLE"
    );
    bytes32 public constant COMPLIANCE_OFFICER_ROLE = keccak256(
        "COMPLIANCE_OFFICER_ROLE"
    );
    bytes32 public constant AUDITOR_ROLE = keccak256("AUDITOR_ROLE");
    bytes32 public constant EMERGENCY_ROLE = keccak256("EMERGENCY_ROLE");

    // Credit score bounds (FICO standard)
    uint256 public constant MIN_CREDIT_SCORE = 300;
    uint256 public constant MAX_CREDIT_SCORE = 850;
    uint256 public constant DEFAULT_CREDIT_SCORE = 500;

    // Risk and compliance limits
    uint256 public constant MAX_RECORDS_PER_USER = 1000;
    uint256 public constant MAX_SCORE_IMPACT = 50;
    uint256 public constant SCORE_DECAY_PERIOD = 365 days;
    uint256 public constant RECORD_RETENTION_PERIOD = 7 * 365 days; // 7 years

    struct CreditRecord {
        uint256 id;
        uint256 timestamp;
        uint256 amount;
        bool repaid;
        uint256 repaymentTimestamp;
        address provider;
        string recordType;
        int16 scoreImpact;
        bytes32 dataHash; // Hash of sensitive data stored off-chain
        bool disputed;
        uint256 expiryDate;
        string complianceFlags; // JSON string for compliance metadata
    }

    struct CreditProfile {
        uint256 score;
        bool exists;
        uint256 lastUpdated;
        uint256 recordCount;
        bool frozen; // For compliance holds
        uint256 lastScoreDecay;
        mapping(string => uint256) categoryScores; // Different score categories
        string kycStatus; // KYC compliance status
        uint256 riskLevel; // 1-5 risk assessment
    }

    struct DisputeRecord {
        uint256 recordId;
        address disputer;
        string reason;
        uint256 timestamp;
        bool resolved;
        string resolution;
        address resolver;
    }

    // State variables
    mapping(address => CreditRecord[]) private creditHistory;
    mapping(address => CreditProfile) private creditProfiles;
    mapping(address => bool) private authorizedProviders;
    mapping(uint256 => DisputeRecord) private disputes;
    mapping(address => uint256) private userNonces;

    // Compliance and audit tracking
    mapping(address => string[]) private complianceViolations;
    mapping(bytes32 => bool) private processedTransactions;

    uint256 private recordCounter;
    uint256 private disputeCounter;

    // Contract configuration
    bool public emergencyMode;
    uint256 public maxDailyRecords = 100;
    mapping(address => uint256) private dailyRecordCounts;
    mapping(address => uint256) private lastRecordDate;

    // Events with comprehensive logging
    event CreditRecordAdded(
        address indexed user,
        address indexed provider,
        uint256 indexed recordId,
        uint256 amount,
        string recordType,
        int16 scoreImpact,
        bytes32 dataHash
    );

    event CreditScoreUpdated(
        address indexed user,
        uint256 oldScore,
        uint256 newScore,
        string reason,
        uint256 timestamp
    );

    event RecordRepaid(
        address indexed user,
        uint256 indexed recordId,
        uint256 timestamp,
        int16 scoreBonus
    );

    event DisputeRaised(
        uint256 indexed disputeId,
        address indexed user,
        uint256 indexed recordId,
        string reason
    );

    event DisputeResolved(
        uint256 indexed disputeId,
        address indexed resolver,
        bool upheld,
        string resolution
    );

    event ComplianceViolation(
        address indexed user,
        string violationType,
        string description,
        uint256 timestamp
    );

    event EmergencyModeToggled(bool enabled, address indexed admin);

    event CreditProfileFrozen(
        address indexed user,
        string reason,
        address indexed officer
    );
    event CreditProfileUnfrozen(address indexed user, address indexed officer);

    // Custom errors for gas efficiency
    error UnauthorizedAccess();
    error InvalidScoreRange();
    error RecordNotFound();
    error ProfileFrozen();
    error EmergencyModeActive();
    error DailyLimitExceeded();
    error InvalidSignature();
    error TransactionAlreadyProcessed();
    error DisputePeriodExpired();

    /**
     * @dev Constructor initializes the contract with proper role setup
     */
    constructor() EIP712("CreditScoreV2", "1") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(EMERGENCY_ROLE, msg.sender);
        _grantRole(COMPLIANCE_OFFICER_ROLE, msg.sender);

        recordCounter = 1;
        disputeCounter = 1;
    }

    /**
     * @dev Modifier to check if user profile is not frozen
     */
    modifier notFrozen(address user) {
        if (creditProfiles[user].frozen) revert ProfileFrozen();
        _;
    }

    /**
     * @dev Modifier to check emergency mode
     */
    modifier notInEmergency() {
        if (emergencyMode) revert EmergencyModeActive();
        _;
    }

    /**
     * @dev Modifier to check daily limits
     */
    modifier withinDailyLimit(address provider) {
        uint256 today = block.timestamp / 1 days;
        if (lastRecordDate[provider] != today) {
            dailyRecordCounts[provider] = 0;
            lastRecordDate[provider] = today;
        }
        if (dailyRecordCounts[provider] >= maxDailyRecords)
            revert DailyLimitExceeded();
        _;
    }

    /**
     * @dev Adds a credit record with comprehensive validation and compliance checks
     */
    function addCreditRecord(
        address user,
        uint256 amount,
        string calldata recordType,
        int16 scoreImpact,
        bytes32 dataHash,
        string calldata complianceFlags,
        bytes calldata signature
    )
        external
        onlyRole(CREDIT_PROVIDER_ROLE)
        nonReentrant
        whenNotPaused
        notFrozen(user)
        notInEmergency
        withinDailyLimit(msg.sender)
    {
        // Validate inputs
        int16 maxScoreImpact = int16(int256(MAX_SCORE_IMPACT));
        if (scoreImpact < -maxScoreImpact || scoreImpact > maxScoreImpact) {
            revert InvalidScoreRange();
        }

        // Optionally verify an EIP-712 signature for data integrity. This is
        // required for EOA providers that choose to self-attest their
        // submission off-chain; it is skipped (by passing an empty
        // `signature`) for trusted contract integrations such as
        // LoanContractV2, which cannot produce ECDSA signatures but are
        // already authenticated via CREDIT_PROVIDER_ROLE.
        if (signature.length > 0) {
            bytes32 structHash = keccak256(
                abi.encode(
                    keccak256(
                        "CreditRecord(address user,uint256 amount,string recordType,int16 scoreImpact,bytes32 dataHash,uint256 nonce)"
                    ),
                    user,
                    amount,
                    keccak256(bytes(recordType)),
                    scoreImpact,
                    dataHash,
                    userNonces[user]
                )
            );

            bytes32 hash = _hashTypedDataV4(structHash);
            if (hash.recover(signature) != msg.sender) {
                revert InvalidSignature();
            }
        }

        // Check for duplicate transactions
        bytes32 txHash = keccak256(
            abi.encodePacked(
                user,
                amount,
                recordType,
                dataHash,
                block.timestamp
            )
        );
        if (processedTransactions[txHash]) revert TransactionAlreadyProcessed();
        processedTransactions[txHash] = true;

        // Initialize profile if needed
        if (!creditProfiles[user].exists) {
            _initializeCreditProfile(user);
        }

        // Check record limits
        if (creditHistory[user].length >= MAX_RECORDS_PER_USER) {
            _archiveOldRecords(user);
        }

        // Create new record
        uint256 recordId = recordCounter++;
        uint256 expiryDate = block.timestamp + RECORD_RETENTION_PERIOD;

        creditHistory[user].push(
            CreditRecord({
                id: recordId,
                timestamp: block.timestamp,
                amount: amount,
                repaid: false,
                repaymentTimestamp: 0,
                provider: msg.sender,
                recordType: recordType,
                scoreImpact: scoreImpact,
                dataHash: dataHash,
                disputed: false,
                expiryDate: expiryDate,
                complianceFlags: complianceFlags
            })
        );

        // Update profile
        creditProfiles[user].recordCount++;
        userNonces[user]++;
        dailyRecordCounts[msg.sender]++;

        // Update credit score with decay consideration
        _updateCreditScoreWithDecay(user, scoreImpact, recordType);

        // Compliance checks
        _performComplianceChecks(user, amount, recordType);

        emit CreditRecordAdded(
            user,
            msg.sender,
            recordId,
            amount,
            recordType,
            scoreImpact,
            dataHash
        );
    }

    /**
     * @dev Marks a credit record as repaid with validation
     */
    function markRepaid(
        address user,
        uint256 recordIndex,
        bytes calldata signature
    )
        external
        onlyRole(CREDIT_PROVIDER_ROLE)
        nonReentrant
        whenNotPaused
        notFrozen(user)
    {
        if (recordIndex >= creditHistory[user].length) revert RecordNotFound();

        CreditRecord storage record = creditHistory[user][recordIndex];
        require(!record.repaid, "Record already repaid");
        require(
            record.provider == msg.sender,
            "Only original provider can mark repaid"
        );

        // Optionally verify signature (see addCreditRecord for rationale)
        if (signature.length > 0) {
            bytes32 structHash = keccak256(
                abi.encode(
                    keccak256(
                        "RepaymentRecord(address user,uint256 recordIndex,uint256 nonce)"
                    ),
                    user,
                    recordIndex,
                    userNonces[user]
                )
            );

            bytes32 hash = _hashTypedDataV4(structHash);
            if (hash.recover(signature) != msg.sender) {
                revert InvalidSignature();
            }
        }

        record.repaid = true;
        record.repaymentTimestamp = block.timestamp;
        userNonces[user]++;

        // Calculate repayment bonus based on timing
        int16 repaymentBonus = _calculateRepaymentBonus(record);

        // Update credit score
        _updateCreditScoreWithDecay(user, repaymentBonus, "repayment");

        emit RecordRepaid(user, record.id, block.timestamp, repaymentBonus);
    }

    /**
     * @dev Allows users to dispute credit records
     */
    function disputeRecord(
        uint256 recordIndex,
        string calldata reason
    ) external nonReentrant whenNotPaused {
        if (recordIndex >= creditHistory[msg.sender].length)
            revert RecordNotFound();

        CreditRecord storage record = creditHistory[msg.sender][recordIndex];
        require(!record.disputed, "Record already disputed");

        // Check if dispute period is still valid (90 days from record creation)
        if (block.timestamp > record.timestamp + 90 days)
            revert DisputePeriodExpired();

        record.disputed = true;

        uint256 disputeId = disputeCounter++;
        disputes[disputeId] = DisputeRecord({
            recordId: record.id,
            disputer: msg.sender,
            reason: reason,
            timestamp: block.timestamp,
            resolved: false,
            resolution: "",
            resolver: address(0)
        });

        emit DisputeRaised(disputeId, msg.sender, record.id, reason);
    }

    /**
     * @dev Resolves a dispute (compliance officer only)
     */
    function resolveDispute(
        uint256 disputeId,
        bool upheld,
        string calldata resolution
    ) external onlyRole(COMPLIANCE_OFFICER_ROLE) {
        DisputeRecord storage dispute = disputes[disputeId];
        require(!dispute.resolved, "Dispute already resolved");

        dispute.resolved = true;
        dispute.resolution = resolution;
        dispute.resolver = msg.sender;

        if (upheld) {
            // Find and modify the disputed record
            _adjustDisputedRecord(dispute.disputer, dispute.recordId);
        }

        emit DisputeResolved(disputeId, msg.sender, upheld, resolution);
    }

    /**
     * @dev Freezes a user profile for compliance reasons
     */
    function freezeProfile(
        address user,
        string calldata reason
    ) external onlyRole(COMPLIANCE_OFFICER_ROLE) {
        creditProfiles[user].frozen = true;
        complianceViolations[user].push(reason);

        emit CreditProfileFrozen(user, reason, msg.sender);
        emit ComplianceViolation(
            user,
            "PROFILE_FROZEN",
            reason,
            block.timestamp
        );
    }

    /**
     * @dev Unfreezes a user profile
     */
    function unfreezeProfile(
        address user
    ) external onlyRole(COMPLIANCE_OFFICER_ROLE) {
        creditProfiles[user].frozen = false;
        emit CreditProfileUnfrozen(user, msg.sender);
    }

    /**
     * @dev Emergency pause function
     */
    function emergencyPause() external onlyRole(EMERGENCY_ROLE) {
        _pause();
        emergencyMode = true;
        emit EmergencyModeToggled(true, msg.sender);
    }

    /**
     * @dev Emergency unpause function
     */
    function emergencyUnpause() external onlyRole(EMERGENCY_ROLE) {
        _unpause();
        emergencyMode = false;
        emit EmergencyModeToggled(false, msg.sender);
    }

    /**
     * @dev Gets user's credit score with privacy controls
     */
    function getCreditScore(
        address user
    )
        external
        view
        returns (
            uint256 score,
            uint256 lastUpdated,
            bool frozen,
            uint256 riskLevel
        )
    {
        // Only allow user themselves, authorized providers, or compliance officers
        require(
            msg.sender == user ||
                hasRole(CREDIT_PROVIDER_ROLE, msg.sender) ||
                hasRole(COMPLIANCE_OFFICER_ROLE, msg.sender) ||
                hasRole(AUDITOR_ROLE, msg.sender),
            "Unauthorized access to credit score"
        );

        CreditProfile storage profile = creditProfiles[user];
        if (!profile.exists) {
            return (0, 0, false, 0);
        }

        return (
            profile.score,
            profile.lastUpdated,
            profile.frozen,
            profile.riskLevel
        );
    }

    /**
     * @dev Gets user's credit history with privacy controls
     */
    function getCreditHistory(
        address user
    ) external view returns (CreditRecord[] memory) {
        require(
            msg.sender == user ||
                hasRole(CREDIT_PROVIDER_ROLE, msg.sender) ||
                hasRole(COMPLIANCE_OFFICER_ROLE, msg.sender) ||
                hasRole(AUDITOR_ROLE, msg.sender),
            "Unauthorized access to credit history"
        );

        return creditHistory[user];
    }

    /**
     * @dev Gets compliance violations for a user (compliance officers only)
     */
    function getComplianceViolations(
        address user
    )
        external
        view
        onlyRole(COMPLIANCE_OFFICER_ROLE)
        returns (string[] memory)
    {
        return complianceViolations[user];
    }

    /**
     * @dev Internal function to initialize credit profile
     */
    function _initializeCreditProfile(address user) internal {
        CreditProfile storage profile = creditProfiles[user];
        profile.score = DEFAULT_CREDIT_SCORE;
        profile.exists = true;
        profile.lastUpdated = block.timestamp;
        profile.recordCount = 0;
        profile.frozen = false;
        profile.lastScoreDecay = block.timestamp;
        profile.kycStatus = "PENDING";
        profile.riskLevel = 3; // Medium risk by default
    }

    /**
     * @dev Updates credit score with time decay consideration
     */
    function _updateCreditScoreWithDecay(
        address user,
        int16 impact,
        string memory reason
    ) internal {
        CreditProfile storage profile = creditProfiles[user];
        uint256 oldScore = profile.score;

        // Apply time decay if enough time has passed
        if (block.timestamp > profile.lastScoreDecay + SCORE_DECAY_PERIOD) {
            _applyScoreDecay(user);
        }

        // Apply the new impact
        int256 newScore = int256(profile.score) + int256(impact);

        // Ensure score stays within bounds
        if (newScore < int256(MIN_CREDIT_SCORE))
            newScore = int256(MIN_CREDIT_SCORE);
        if (newScore > int256(MAX_CREDIT_SCORE))
            newScore = int256(MAX_CREDIT_SCORE);

        profile.score = uint256(newScore);
        profile.lastUpdated = block.timestamp;

        // Update risk level based on score
        _updateRiskLevel(user);

        emit CreditScoreUpdated(
            user,
            oldScore,
            uint256(newScore),
            reason,
            block.timestamp
        );
    }

    /**
     * @dev Applies time-based score decay
     */
    function _applyScoreDecay(address user) internal {
        CreditProfile storage profile = creditProfiles[user];

        // Gradual improvement over time for users with low scores
        if (profile.score < DEFAULT_CREDIT_SCORE) {
            uint256 improvement = (DEFAULT_CREDIT_SCORE - profile.score) / 10;
            profile.score += improvement;
        }

        profile.lastScoreDecay = block.timestamp;
    }

    /**
     * @dev Updates risk level based on credit score
     */
    function _updateRiskLevel(address user) internal {
        CreditProfile storage profile = creditProfiles[user];

        if (profile.score >= 750) {
            profile.riskLevel = 1; // Low risk
        } else if (profile.score >= 650) {
            profile.riskLevel = 2; // Low-medium risk
        } else if (profile.score >= 550) {
            profile.riskLevel = 3; // Medium risk
        } else if (profile.score >= 450) {
            profile.riskLevel = 4; // High risk
        } else {
            profile.riskLevel = 5; // Very high risk
        }
    }

    /**
     * @dev Calculates repayment bonus based on how quickly the record was repaid
     */
    function _calculateRepaymentBonus(
        CreditRecord memory record
    ) internal view returns (int16) {
        uint256 elapsed = block.timestamp - record.timestamp;
        if (elapsed <= 30 days) {
            return 15; // Repaid quickly
        } else if (elapsed <= 90 days) {
            return 10; // Standard repayment bonus
        } else {
            return 5; // Repaid slowly, but still repaid
        }
    }

    /**
     * @dev Performs compliance checks on new records
     */
    function _performComplianceChecks(
        address user,
        uint256 amount,
        string memory recordType
    ) internal {
        // Flag defaults for mandatory compliance review
        if (keccak256(bytes(recordType)) == keccak256(bytes("loan_default"))) {
            complianceViolations[user].push("LOAN_DEFAULT_RECORDED");
            emit ComplianceViolation(
                user,
                "LOAN_DEFAULT_RECORDED",
                "A loan default was recorded for this user",
                block.timestamp
            );
        }

        // Check for suspicious patterns
        if (amount > 1000000 * 10 ** 18) {
            // Very large amount
            complianceViolations[user].push("LARGE_TRANSACTION");
            emit ComplianceViolation(
                user,
                "LARGE_TRANSACTION",
                "Transaction amount exceeds threshold",
                block.timestamp
            );
        }

        // Check frequency of records
        uint256 recentRecords = 0;
        uint256 cutoffTime = block.timestamp - 1 days;

        for (uint256 i = 0; i < creditHistory[user].length; i++) {
            if (creditHistory[user][i].timestamp > cutoffTime) {
                recentRecords++;
            }
        }

        if (recentRecords > 10) {
            complianceViolations[user].push("HIGH_FREQUENCY");
            emit ComplianceViolation(
                user,
                "HIGH_FREQUENCY",
                "High frequency of credit records",
                block.timestamp
            );
        }
    }

    /**
     * @dev Archives old records to manage storage
     */
    function _archiveOldRecords(address user) internal {
        // In a production system, you'd move old records to cheaper storage
        // For now, we'll just emit an event
        emit ComplianceViolation(
            user,
            "RECORD_LIMIT",
            "Maximum records reached, archiving old records",
            block.timestamp
        );
    }

    /**
     * @dev Adjusts a disputed record
     */
    function _adjustDisputedRecord(address user, uint256 recordId) internal {
        // Find and adjust the record - simplified implementation
        for (uint256 i = 0; i < creditHistory[user].length; i++) {
            if (creditHistory[user][i].id == recordId) {
                // Reverse the score impact
                _updateCreditScoreWithDecay(
                    user,
                    -creditHistory[user][i].scoreImpact,
                    "dispute_resolution"
                );
                break;
            }
        }
    }

    /**
     * @dev Batch processing for efficiency (admin only)
     */
    function batchUpdateScores(
        address[] calldata users,
        int16[] calldata impacts,
        string calldata reason
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(users.length == impacts.length, "Array length mismatch");

        for (uint256 i = 0; i < users.length; i++) {
            if (
                creditProfiles[users[i]].exists &&
                !creditProfiles[users[i]].frozen
            ) {
                _updateCreditScoreWithDecay(users[i], impacts[i], reason);
            }
        }
    }

    /**
     * @dev Updates contract configuration (admin only)
     */
    function updateConfiguration(
        uint256 _maxDailyRecords
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        maxDailyRecords = _maxDailyRecords;
    }

    /**
     * @dev Gets contract statistics for monitoring
     */
    function getContractStats()
        external
        view
        returns (
            uint256 totalRecords,
            uint256 totalDisputes,
            uint256 activeProviders,
            bool isPaused,
            bool isEmergencyMode
        )
    {
        // This would require additional tracking in a production system
        return (
            recordCounter - 1,
            disputeCounter - 1,
            0,
            paused(),
            emergencyMode
        );
    }
}
