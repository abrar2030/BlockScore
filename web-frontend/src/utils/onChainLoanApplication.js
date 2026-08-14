import {
  LOAN_CONTRACT_V2_ABI,
  getLoanContractV2Address,
} from "../contracts/LoanContractV2";

// EIP-712 domain and type must match LoanContractV2.sol's
// submitLoanApplication() signature check exactly (see the contract's
// _hashTypedDataV4/EIP712 setup) - any mismatch here makes the wallet
// produce a signature the contract will reject with InvalidSignature.
const LOAN_APPLICATION_TYPES = {
  LoanApplication: [
    { name: "applicant", type: "address" },
    { name: "amount", type: "uint256" },
    { name: "term", type: "uint256" },
    { name: "income", type: "uint256" },
    { name: "nonce", type: "uint256" },
  ],
};

/**
 * Submits a loan application directly on-chain via LoanContractV2,
 * signed and sent by the connected wallet.
 *
 * This can only be done client-side: LoanContractV2.submitLoanApplication()
 * requires the applicant to be msg.sender and to have personally produced
 * the EIP-712 signature over their own application (see
 * code/blockchain/contracts/LoanContractV2.sol) - the backend has no way
 * to produce that signature on a user's behalf, the same way it can't
 * produce anyone else's signature (see
 * code/backend/services/blockchain_service.py's submit_loan_agreement
 * docstring for the full explanation).
 *
 * @param {import('web3').default} web3 - the connected Web3 instance from Web3Context
 * @param {string} fromAddress - the connected wallet address (the applicant)
 * @param {{amount: string|number, termDays: number, purpose: string, annualIncome: string|number, debtToIncomeRatio: number, employmentStatus: string}} application
 * @returns {Promise<{transactionHash: string, applicationId: string|null}>}
 */
export async function submitLoanApplicationOnChain(
  web3,
  fromAddress,
  application,
) {
  if (!web3) {
    throw new Error("Wallet is not connected.");
  }

  const contractAddress = getLoanContractV2Address();
  if (!contractAddress) {
    throw new Error(
      "On-chain loan applications are not configured (REACT_APP_LOAN_CONTRACT_V2_ADDRESS is not set).",
    );
  }

  const contract = new web3.eth.Contract(LOAN_CONTRACT_V2_ABI, contractAddress);

  const chainId = await web3.eth.getChainId();
  const nonce = await contract.methods.borrowerNonces(fromAddress).call();

  // Amounts are whole-token uint256 on-chain (see LoanContractV2.sol -
  // there's no implicit 18-decimal scaling the way an ERC20 balance would
  // have, since these figures are compared directly against
  // minLoanAmount/maxLoanAmount, not transferred as tokens at this
  // stage), so they're sent as plain integers.
  const amount = BigInt(Math.round(Number(application.amount)));
  const term = BigInt(application.termDays);
  const income = BigInt(Math.round(Number(application.annualIncome)));

  const domain = {
    name: "LoanContractV2",
    version: "1",
    chainId: Number(chainId),
    verifyingContract: contractAddress,
  };
  const message = {
    applicant: fromAddress,
    amount: amount.toString(),
    term: term.toString(),
    income: income.toString(),
    nonce: nonce.toString(),
  };

  // eth_signTypedData_v4 is the standard MetaMask/EIP-1193 method for
  // signing structured (EIP-712) data - it's what every major wallet
  // implements, so this is called directly against window.ethereum
  // rather than through a web3.js helper.
  const typedData = JSON.stringify({
    domain,
    message,
    primaryType: "LoanApplication",
    types: {
      EIP712Domain: [
        { name: "name", type: "string" },
        { name: "version", type: "string" },
        { name: "chainId", type: "uint256" },
        { name: "verifyingContract", type: "address" },
      ],
      ...LOAN_APPLICATION_TYPES,
    },
  });

  const signature = await window.ethereum.request({
    method: "eth_signTypedData_v4",
    params: [fromAddress, typedData],
  });

  const documentsHash = web3.utils.padLeft("0x0", 64);

  const receipt = await contract.methods
    .submitLoanApplication(
      amount.toString(),
      term.toString(),
      application.purpose || "",
      income.toString(),
      String(application.debtToIncomeRatio ?? 0),
      application.employmentStatus || "",
      documentsHash,
      signature,
    )
    .send({ from: fromAddress });

  const applicationId =
    receipt.events?.LoanApplicationSubmitted?.returnValues?.applicationId?.toString() ??
    null;

  return {
    transactionHash: receipt.transactionHash,
    applicationId,
  };
}
