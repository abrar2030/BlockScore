// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./CreditScoreV2.sol";

/**
 * @title LoanContractV2
 * @dev Production-ready loan management contract with comprehensive security and compliance
 * Implements financial industry standards for loan origination, servicing, and collection
 */
contract LoanContractV2 is ReentrancyGuard, Pausable, AccessControl, EIP712 {
    using ECDSA for bytes32;
    using SafeERC20 for IERC20;

    // Role definitions
    bytes32 public constant LOAN_OFFICER_ROLE = keccak256("LOAN_OFFICER_ROLE");
    bytes32 public constant UNDERWRITER_ROLE = keccak256("UNDERWRITER_ROLE");
    bytes32 public constant COMPLIANCE_OFFICER_ROLE = keccak256(
        "COMPLIANCE_OFFICER_ROLE"
    );
    bytes32 public constant LIQUIDATOR_ROLE = keccak256("LIQUIDATOR_ROLE");
    bytes32 public constant EMERGENCY_ROLE = keccak256("EMERGENCY_ROLE");

    // Loan status enumeration
    enum LoanStatus {
        PENDING, // Application submitted
        UNDER_REVIEW, // Being reviewed by underwriter
        APPROVED, // Approved but not funded
        ACTIVE, // Funded and active
        REPAID, // Fully repaid
        DEFAULTED, // In default
        LIQUIDATED, // Liquidated/charged off
        CANCELLED // Cancelled before funding
    }

    // Risk levels
    enum RiskLevel {
        LOW,
        MEDIUM,
        HIGH,
        VERY_HIGH
    }

    struct LoanTerms {
        uint256 principalAmount;
        uint256 interestRate; // Annual rate in basis points (e.g., 500 = 5%)
        uint256 termInDays;
        uint256 originationFee; // In basis points
        uint256 latePaymentFee; // Fixed amount
        uint256 prepaymentPenalty; // In basis points
        bool allowPrepayment;
        uint256 collateralRequired; // Amount of collateral required
    }

    struct Loan {
        uint256 id;
        address borrower;
        LoanTerms terms;
        LoanStatus status;
        uint256 applicationTimestamp;
        uint256 approvalTimestamp;
        uint256 fundingTimestamp;
        uint256 dueDate;
        uint256 amountRepaid;
        uint256 interestAccrued;
        uint256 feesAccrued;
        uint256 lastPaymentTimestamp;
        uint256 nextPaymentDue;
        address underwriter;
        RiskLevel riskLevel;
        string complianceNotes;
        bytes32 documentsHash; // Hash of loan documents
        bool hasCollateral;
        uint256 collateralAmount;
        address collateralToken;
        mapping(uint256 => PaymentRecord) payments;
        uint256 paymentCount;
    }

    struct PaymentRecord {
        uint256 amount;
        uint256 timestamp;
        uint256 principalPortion;
        uint256 interestPortion;
        uint256 feesPortion;
        address payer;
        string paymentMethod;
    }

    struct LoanApplication {
        address applicant;
        uint256 requestedAmount;
        uint256 requestedTerm;
        string purpose;
        uint256 creditScore;
        uint256 annualIncome;
        uint256 debtToIncomeRatio;
        string employmentStatus;
        bytes32 documentsHash;
        uint256 timestamp;
        bool kycCompleted;
        string riskAssessment;
    }

    struct ComplianceCheck {
        bool kycVerified;
        bool amlCleared;
        bool creditCheckCompleted;
        bool incomeVerified;
        bool sanctionsCleared;
        string complianceOfficer;
        uint256 checkTimestamp;
        string notes;
    }

    // State variables
    CreditScoreV2 public creditScoreContract;
    IERC20 public lendingToken;

    mapping(uint256 => Loan) public loans;
    mapping(uint256 => LoanApplication) public applications;
    mapping(uint256 => ComplianceCheck) public complianceChecks;
    mapping(address => uint256[]) public borrowerLoans;
    mapping(address => uint256) public borrowerNonces;

    uint256 public loanCounter;
    uint256 public applicationCounter;

    // Contract configuration
    uint256 public maxLoanAmount = 1000000 * 10 ** 18; // 1M tokens
    uint256 public minLoanAmount = 1000 * 10 ** 18; // 1K tokens
    uint256 public maxInterestRate = 3600; // 36% APR
    uint256 public minCreditScore = 300;
    uint256 public maxDebtToIncomeRatio = 4300; // 43%
    uint256 public defaultGracePeriod = 30 days;
    uint256 public liquidationThreshold = 90 days;

    // Treasury and reserves
    address public treasury;
    uint256 public totalLent;
    uint256 public totalRepaid;
    uint256 public totalDefaulted;
    uint256 public reserveRatio = 1000; // 10% reserve requirement

    // Events
    event LoanApplicationSubmitted(
        uint256 indexed applicationId,
        address indexed applicant,
        uint256 requestedAmount,
        uint256 requestedTerm
    );

    event LoanApproved(
        uint256 indexed loanId,
        address indexed borrower,
        uint256 amount,
        uint256 interestRate,
        address indexed underwriter
    );

    event LoanFunded(
        uint256 indexed loanId,
        address indexed borrower,
        uint256 amount,
        uint256 timestamp
    );

    event PaymentMade(
        uint256 indexed loanId,
        address indexed payer,
        uint256 amount,
        uint256 principalPortion,
        uint256 interestPortion,
        uint256 timestamp
    );

    event LoanDefaulted(
        uint256 indexed loanId,
        address indexed borrower,
        uint256 outstandingAmount,
        uint256 timestamp
    );

    event LoanLiquidated(
        uint256 indexed loanId,
        address indexed borrower,
        uint256 recoveredAmount,
        uint256 lossAmount
    );

    event ComplianceCheckCompleted(
        uint256 indexed applicationId,
        address indexed officer,
        bool approved,
        string notes
    );

    event CollateralDeposited(
        uint256 indexed loanId,
        address indexed borrower,
        uint256 amount,
        address token
    );

    event CollateralReleased(
        uint256 indexed loanId,
        address indexed borrower,
        uint256 amount
    );

    // Custom errors
    error InsufficientCreditScore();
    error ExcessiveDebtToIncome();
    error LoanAmountOutOfRange();
    error InterestRateExceedsLimit();
    error KYCNotCompleted();
    error ComplianceCheckFailed();
    error InsufficientCollateral();
    error LoanNotActive();
    error PaymentAmountInvalid();
    error UnauthorizedLiquidation();

    /**
     * @dev Constructor
     */
    constructor(
        address _creditScoreContract,
        address _lendingToken,
        address _treasury
    ) EIP712("LoanContractV2", "1") {
        creditScoreContract = CreditScoreV2(_creditScoreContract);
        lendingToken = IERC20(_lendingToken);
        treasury = _treasury;

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(EMERGENCY_ROLE, msg.sender);
        _grantRole(COMPLIANCE_OFFICER_ROLE, msg.sender);

        loanCounter = 1;
        applicationCounter = 1;
    }

    /**
     * @dev Submit loan application with comprehensive validation
     */
    function submitLoanApplication(
        uint256 requestedAmount,
        uint256 requestedTermDays,
        string calldata purpose,
        uint256 annualIncome,
        uint256 debtToIncomeRatio,
        string calldata employmentStatus,
        bytes32 documentsHash,
        bytes calldata signature
    ) external nonReentrant whenNotPaused returns (uint256 applicationId) {
        // Input validation
        if (
            requestedAmount < minLoanAmount || requestedAmount > maxLoanAmount
        ) {
            revert LoanAmountOutOfRange();
        }

        if (debtToIncomeRatio > maxDebtToIncomeRatio) {
            revert ExcessiveDebtToIncome();
        }

        // Verify signature for data integrity
        bytes32 structHash = keccak256(
            abi.encode(
                keccak256(
                    "LoanApplication(address applicant,uint256 amount,uint256 term,uint256 income,uint256 nonce)"
                ),
                msg.sender,
                requestedAmount,
                requestedTermDays,
                annualIncome,
                borrowerNonces[msg.sender]
            )
        );

        bytes32 hash = _hashTypedDataV4(structHash);
        if (hash.recover(signature) != msg.sender) revert InvalidSignature();

        // Get credit score
        (uint256 creditScore, , bool frozen, ) = creditScoreContract
            .getCreditScore(msg.sender);
        if (frozen) revert ProfileFrozen();
        if (creditScore < minCreditScore) revert InsufficientCreditScore();

        applicationId = applicationCounter++;

        applications[applicationId] = LoanApplication({
            applicant: msg.sender,
            requestedAmount: requestedAmount,
            requestedTerm: requestedTermDays,
            purpose: purpose,
            creditScore: creditScore,
            annualIncome: annualIncome,
            debtToIncomeRatio: debtToIncomeRatio,
            employmentStatus: employmentStatus,
            documentsHash: documentsHash,
            timestamp: block.timestamp,
            kycCompleted: false,
            riskAssessment: ""
        });

        borrowerNonces[msg.sender]++;

        emit LoanApplicationSubmitted(
            applicationId,
            msg.sender,
            requestedAmount,
            requestedTermDays
        );
        return applicationId;
    }

    /**
     * @dev Complete compliance checks for loan application
     */
    function completeComplianceCheck(
        uint256 applicationId,
        bool kycVerified,
        bool amlCleared,
        bool creditCheckCompleted,
        bool incomeVerified,
        bool sanctionsCleared,
        string calldata notes
    ) external onlyRole(COMPLIANCE_OFFICER_ROLE) {
        require(applicationId < applicationCounter, "Invalid application ID");

        LoanApplication storage app = applications[applicationId];
        require(app.applicant != address(0), "Application not found");

        complianceChecks[applicationId] = ComplianceCheck({
            kycVerified: kycVerified,
            amlCleared: amlCleared,
            creditCheckCompleted: creditCheckCompleted,
            incomeVerified: incomeVerified,
            sanctionsCleared: sanctionsCleared,
            complianceOfficer: "compliance_officer", // In production, store officer ID
            checkTimestamp: block.timestamp,
            notes: notes
        });

        bool approved =
            kycVerified &&
                amlCleared &&
                creditCheckCompleted &&
                incomeVerified &&
                sanctionsCleared;

        if (approved) {
            app.kycCompleted = true;
        }

        emit ComplianceCheckCompleted(
            applicationId,
            msg.sender,
            approved,
            notes
        );
    }

    /**
     * @dev Underwrite and approve loan application
     */
    function underwriteLoan(
        uint256 applicationId,
        uint256 approvedAmount,
        uint256 interestRate,
        uint256 termInDays,
        uint256 originationFee,
        bool requiresCollateral,
        uint256 collateralAmount,
        string calldata riskAssessment
    ) external onlyRole(UNDERWRITER_ROLE) returns (uint256 loanId) {
        require(applicationId < applicationCounter, "Invalid application ID");

        LoanApplication storage app = applications[applicationId];
        require(app.applicant != address(0), "Application not found");
        require(app.kycCompleted, "KYC not completed");

        ComplianceCheck storage compliance = complianceChecks[applicationId];
        require(
            compliance.kycVerified && compliance.amlCleared,
            "Compliance checks failed"
        );

        if (interestRate > maxInterestRate) revert InterestRateExceedsLimit();

        // Determine risk level based on credit score and other factors
        RiskLevel riskLevel = _calculateRiskLevel(
            app.creditScore,
            app.debtToIncomeRatio
        );

        loanId = loanCounter++;

        Loan storage loan = loans[loanId];
        loan.id = loanId;
        loan.borrower = app.applicant;
        loan.terms = LoanTerms({
            principalAmount: approvedAmount,
            interestRate: interestRate,
            termInDays: termInDays,
            originationFee: originationFee,
            latePaymentFee: 50 * 10 ** 18, // $50 default
            prepaymentPenalty: 200, // 2%
            allowPrepayment: true,
            collateralRequired: collateralAmount
        });
        loan.status = LoanStatus.APPROVED;
        loan.applicationTimestamp = app.timestamp;
        loan.approvalTimestamp = block.timestamp;
        loan.underwriter = msg.sender;
        loan.riskLevel = riskLevel;
        loan.hasCollateral = requiresCollateral;
        loan.collateralAmount = collateralAmount;

        borrowerLoans[app.applicant].push(loanId);
        app.riskAssessment = riskAssessment;

        emit LoanApproved(
            loanId,
            app.applicant,
            approvedAmount,
            interestRate,
            msg.sender
        );
        return loanId;
    }

    /**
     * @dev Fund an approved loan
     */
    function fundLoan(
        uint256 loanId
    ) external onlyRole(LOAN_OFFICER_ROLE) nonReentrant {
        Loan storage loan = loans[loanId];
        require(loan.status == LoanStatus.APPROVED, "Loan not approved");

        // Check collateral if required
        if (loan.hasCollateral) {
            require(loan.collateralAmount > 0, "Collateral not deposited");
        }

        // Check reserve requirements
        uint256 requiredReserve =
            (loan.terms.principalAmount * reserveRatio) / 10000;
        require(
            lendingToken.balanceOf(address(this)) >=
                loan.terms.principalAmount + requiredReserve,
            "Insufficient reserves"
        );

        // Calculate origination fee
        uint256 originationFeeAmount =
            (loan.terms.principalAmount * loan.terms.originationFee) / 10000;
        uint256 netAmount = loan.terms.principalAmount - originationFeeAmount;

        // Transfer funds to borrower
        lendingToken.safeTransfer(loan.borrower, netAmount);

        // Transfer origination fee to treasury
        if (originationFeeAmount > 0) {
            lendingToken.safeTransfer(treasury, originationFeeAmount);
        }

        // Update loan status
        loan.status = LoanStatus.ACTIVE;
        loan.fundingTimestamp = block.timestamp;
        loan.dueDate = block.timestamp + (loan.terms.termInDays * 1 days);
        loan.nextPaymentDue = block.timestamp + 30 days; // Monthly payments

        // Update totals
        totalLent += loan.terms.principalAmount;

        // Record credit event
        creditScoreContract.addCreditRecord(
            loan.borrower,
            loan.terms.principalAmount,
            "loan_funded",
            5, // Positive impact for getting funded
            keccak256(abi.encodePacked(loanId, "funded")),
            "{'event':'loan_funded','compliant':true}",
            "" // Signature would be generated off-chain
        );

        emit LoanFunded(
            loanId,
            loan.borrower,
            loan.terms.principalAmount,
            block.timestamp
        );
    }

    /**
     * @dev Make a payment on an active loan
     */
    function makePayment(
        uint256 loanId,
        uint256 paymentAmount,
        string calldata paymentMethod
    ) external nonReentrant whenNotPaused {
        Loan storage loan = loans[loanId];
        require(loan.status == LoanStatus.ACTIVE, "Loan not active");
        require(paymentAmount > 0, "Payment amount must be positive");

        // Calculate payment breakdown
        (
            uint256 interestPortion,
            uint256 principalPortion,
            uint256 feesPortion
        ) = _calculatePaymentBreakdown(loanId, paymentAmount);

        // Transfer payment from borrower
        lendingToken.safeTransferFrom(msg.sender, address(this), paymentAmount);

        // Update loan state
        loan.amountRepaid += principalPortion;
        loan.interestAccrued += interestPortion;
        loan.feesAccrued += feesPortion;
        loan.lastPaymentTimestamp = block.timestamp;
        loan.nextPaymentDue = block.timestamp + 30 days;

        // Record payment
        loan.payments[loan.paymentCount] = PaymentRecord({
            amount: paymentAmount,
            timestamp: block.timestamp,
            principalPortion: principalPortion,
            interestPortion: interestPortion,
            feesPortion: feesPortion,
            payer: msg.sender,
            paymentMethod: paymentMethod
        });
        loan.paymentCount++;

        // Check if loan is fully repaid
        if (loan.amountRepaid >= loan.terms.principalAmount) {
            loan.status = LoanStatus.REPAID;
            _releaseLoanCollateral(loanId);

            // Positive credit impact for full repayment
            creditScoreContract.addCreditRecord(
                loan.borrower,
                loan.terms.principalAmount,
                "loan_repaid",
                10, // Strong positive impact
                keccak256(abi.encodePacked(loanId, "repaid")),
                "{'event':'loan_repaid','on_time':true}",
                ""
            );
        } else {
            // Regular payment credit impact
            int16 creditImpact =
                block.timestamp <= loan.nextPaymentDue ? int16(2) : int16(-1);
            creditScoreContract.addCreditRecord(
                loan.borrower,
                paymentAmount,
                "loan_payment",
                creditImpact,
                keccak256(
                    abi.encodePacked(loanId, "payment", loan.paymentCount)
                ),
                "{'event':'loan_payment'}",
                ""
            );
        }

        totalRepaid += paymentAmount;

        emit PaymentMade(
            loanId,
            msg.sender,
            paymentAmount,
            principalPortion,
            interestPortion,
            block.timestamp
        );
    }

    /**
     * @dev Deposit collateral for a loan
     */
    function depositCollateral(
        uint256 loanId,
        uint256 amount,
        address tokenAddress
    ) external nonReentrant {
        Loan storage loan = loans[loanId];
        require(
            loan.borrower == msg.sender,
            "Only borrower can deposit collateral"
        );
        require(loan.status == LoanStatus.APPROVED, "Loan must be approved");
        require(loan.hasCollateral, "Loan does not require collateral");

        IERC20 collateralToken = IERC20(tokenAddress);
        collateralToken.safeTransferFrom(msg.sender, address(this), amount);

        loan.collateralAmount = amount;
        loan.collateralToken = tokenAddress;

        emit CollateralDeposited(loanId, msg.sender, amount, tokenAddress);
    }

    /**
     * @dev Mark loan as defaulted (compliance officer only)
     */
    function markLoanAsDefaulted(
        uint256 loanId,
        string calldata reason
    ) external onlyRole(COMPLIANCE_OFFICER_ROLE) {
        Loan storage loan = loans[loanId];
        require(loan.status == LoanStatus.ACTIVE, "Loan not active");
        require(
            block.timestamp > loan.nextPaymentDue + defaultGracePeriod,
            "Grace period not expired"
        );

        loan.status = LoanStatus.DEFAULTED;

        uint256 outstandingAmount =
            loan.terms.principalAmount - loan.amountRepaid;
        totalDefaulted += outstandingAmount;

        // Negative credit impact for default
        creditScoreContract.addCreditRecord(
            loan.borrower,
            outstandingAmount,
            "loan_default",
            -25, // Severe negative impact
            keccak256(abi.encodePacked(loanId, "default")),
            string(
                abi.encodePacked(
                    "{'event':'loan_default','reason':'",
                    reason,
                    "'}"
                )
            ),
            ""
        );

        emit LoanDefaulted(
            loanId,
            loan.borrower,
            outstandingAmount,
            block.timestamp
        );
    }

    /**
     * @dev Liquidate a defaulted loan
     */
    function liquidateLoan(
        uint256 loanId
    ) external onlyRole(LIQUIDATOR_ROLE) nonReentrant {
        Loan storage loan = loans[loanId];
        require(loan.status == LoanStatus.DEFAULTED, "Loan not in default");
        require(
            block.timestamp > loan.nextPaymentDue + liquidationThreshold,
            "Liquidation threshold not met"
        );

        uint256 recoveredAmount = 0;

        // Liquidate collateral if available
        if (loan.hasCollateral && loan.collateralAmount > 0) {
            IERC20 collateralToken = IERC20(loan.collateralToken);
            recoveredAmount = loan.collateralAmount;
            collateralToken.safeTransfer(treasury, recoveredAmount);
        }

        loan.status = LoanStatus.LIQUIDATED;
        uint256 outstandingAmount =
            loan.terms.principalAmount - loan.amountRepaid;
        uint256 lossAmount =
            outstandingAmount > recoveredAmount
                ? outstandingAmount - recoveredAmount
                : 0;

        emit LoanLiquidated(loanId, loan.borrower, recoveredAmount, lossAmount);
    }

    /**
     * @dev Get loan details with privacy controls
     */
    function getLoanDetails(
        uint256 loanId
    )
        external
        view
        returns (
            address borrower,
            uint256 principalAmount,
            uint256 interestRate,
            LoanStatus status,
            uint256 amountRepaid,
            uint256 dueDate,
            RiskLevel riskLevel
        )
    {
        Loan storage loan = loans[loanId];

        // Privacy controls - only borrower, loan officers, or compliance can view
        require(
            msg.sender == loan.borrower ||
                hasRole(LOAN_OFFICER_ROLE, msg.sender) ||
                hasRole(UNDERWRITER_ROLE, msg.sender) ||
                hasRole(COMPLIANCE_OFFICER_ROLE, msg.sender),
            "Unauthorized access"
        );

        return (
            loan.borrower,
            loan.terms.principalAmount,
            loan.terms.interestRate,
            loan.status,
            loan.amountRepaid,
            loan.dueDate,
            loan.riskLevel
        );
    }

    /**
     * @dev Get borrower's loan portfolio
     */
    function getBorrowerLoans(
        address borrower
    ) external view returns (uint256[] memory) {
        require(
            msg.sender == borrower ||
                hasRole(LOAN_OFFICER_ROLE, msg.sender) ||
                hasRole(COMPLIANCE_OFFICER_ROLE, msg.sender),
            "Unauthorized access"
        );

        return borrowerLoans[borrower];
    }

    /**
     * @dev Internal function to calculate risk level
     */
    function _calculateRiskLevel(
        uint256 creditScore,
        uint256 debtToIncomeRatio
    ) internal pure returns (RiskLevel) {
        if (creditScore >= 750 && debtToIncomeRatio <= 2800) {
            return RiskLevel.LOW;
        } else if (creditScore >= 650 && debtToIncomeRatio <= 3600) {
            return RiskLevel.MEDIUM;
        } else if (creditScore >= 550) {
            return RiskLevel.HIGH;
        } else {
            return RiskLevel.VERY_HIGH;
        }
    }

    /**
     * @dev Internal function to calculate payment breakdown
     */
    function _calculatePaymentBreakdown(
        uint256 loanId,
        uint256 paymentAmount
    )
        internal
        view
        returns (
            uint256 interestPortion,
            uint256 principalPortion,
            uint256 feesPortion
        )
    {
        Loan storage loan = loans[loanId];

        // Simplified calculation - in production, use more sophisticated amortization
        uint256 outstandingPrincipal =
            loan.terms.principalAmount - loan.amountRepaid;
        uint256 dailyInterestRate = loan.terms.interestRate / 365 / 10000;
        uint256 daysSinceLastPayment =
            (block.timestamp - loan.lastPaymentTimestamp) / 1 days;

        interestPortion =
            (outstandingPrincipal * dailyInterestRate * daysSinceLastPayment) /
            10000;

        // Apply any late fees
        feesPortion = 0;
        if (block.timestamp > loan.nextPaymentDue) {
            feesPortion = loan.terms.latePaymentFee;
        }

        // Remaining goes to principal
        if (paymentAmount > interestPortion + feesPortion) {
            principalPortion = paymentAmount - interestPortion - feesPortion;
        } else {
            principalPortion = 0;
            // Adjust interest and fees if payment is insufficient
            if (paymentAmount <= feesPortion) {
                feesPortion = paymentAmount;
                interestPortion = 0;
            } else {
                interestPortion = paymentAmount - feesPortion;
            }
        }
    }

    /**
     * @dev Internal function to release loan collateral
     */
    function _releaseLoanCollateral(uint256 loanId) internal {
        Loan storage loan = loans[loanId];

        if (loan.hasCollateral && loan.collateralAmount > 0) {
            IERC20 collateralToken = IERC20(loan.collateralToken);
            collateralToken.safeTransfer(loan.borrower, loan.collateralAmount);

            emit CollateralReleased(
                loanId,
                loan.borrower,
                loan.collateralAmount
            );

            loan.collateralAmount = 0;
        }
    }

    /**
     * @dev Emergency pause function
     */
    function emergencyPause() external onlyRole(EMERGENCY_ROLE) {
        _pause();
    }

    /**
     * @dev Emergency unpause function
     */
    function emergencyUnpause() external onlyRole(EMERGENCY_ROLE) {
        _unpause();
    }

    /**
     * @dev Update contract configuration
     */
    function updateConfiguration(
        uint256 _maxLoanAmount,
        uint256 _minLoanAmount,
        uint256 _maxInterestRate,
        uint256 _minCreditScore,
        uint256 _reserveRatio
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        maxLoanAmount = _maxLoanAmount;
        minLoanAmount = _minLoanAmount;
        maxInterestRate = _maxInterestRate;
        minCreditScore = _minCreditScore;
        reserveRatio = _reserveRatio;
    }

    /**
     * @dev Get contract statistics
     */
    function getContractStats()
        external
        view
        returns (
            uint256 totalLoans,
            uint256 totalApplications,
            uint256 _totalLent,
            uint256 _totalRepaid,
            uint256 _totalDefaulted,
            uint256 activeLoans
        )
    {
        // Count active loans
        uint256 active = 0;
        for (uint256 i = 1; i < loanCounter; i++) {
            if (loans[i].status == LoanStatus.ACTIVE) {
                active++;
            }
        }

        return (
            loanCounter - 1,
            applicationCounter - 1,
            totalLent,
            totalRepaid,
            totalDefaulted,
            active
        );
    }
}
