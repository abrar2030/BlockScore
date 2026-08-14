// Minimal ABI fragment for LoanContractV2 - just the pieces the frontend
// actually calls directly from the borrower's own wallet:
// submitLoanApplication() (which the backend can never call on a user's
// behalf - see code/backend/services/blockchain_service.py's
// submit_loan_agreement docstring for why), the borrowerNonces() view
// used to build its EIP-712 signature, and the event it emits (used to
// pull the on-chain applicationId out of the transaction receipt).
//
// Keeping this as a hand-picked fragment rather than importing the full
// compiled artifact avoids bundling code/blockchain's entire build output
// into the frontend. Regenerate this list from
// code/blockchain/artifacts/contracts/LoanContractV2.sol/LoanContractV2.json
// if LoanContractV2.sol's application-submission surface changes.
export const LOAN_CONTRACT_V2_ABI = [
  {
    inputs: [
      { internalType: "uint256", name: "requestedAmount", type: "uint256" },
      { internalType: "uint256", name: "requestedTermDays", type: "uint256" },
      { internalType: "string", name: "purpose", type: "string" },
      { internalType: "uint256", name: "annualIncome", type: "uint256" },
      {
        internalType: "uint256",
        name: "debtToIncomeRatio",
        type: "uint256",
      },
      { internalType: "string", name: "employmentStatus", type: "string" },
      { internalType: "bytes32", name: "documentsHash", type: "bytes32" },
      { internalType: "bytes", name: "signature", type: "bytes" },
    ],
    name: "submitLoanApplication",
    outputs: [
      { internalType: "uint256", name: "applicationId", type: "uint256" },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "", type: "address" }],
    name: "borrowerNonces",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "applicationId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "applicant",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "requestedAmount",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "requestedTerm",
        type: "uint256",
      },
    ],
    name: "LoanApplicationSubmitted",
    type: "event",
  },
];

/**
 * Address of the deployed LoanContractV2 this frontend should submit
 * applications to. Set via REACT_APP_LOAN_CONTRACT_V2_ADDRESS (see
 * .env.example) - printed by code/blockchain/scripts/deploy.js after a
 * deployment, or code/blockchain/deployments/<network>/addresses.json.
 */
export const getLoanContractV2Address = () => {
  const address = import.meta.env.REACT_APP_LOAN_CONTRACT_V2_ADDRESS;
  if (!address || address === "0x0000000000000000000000000000000000000000") {
    return null;
  }
  return address;
};
