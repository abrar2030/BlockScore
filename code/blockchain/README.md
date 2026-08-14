# BlockScore Blockchain Module

Smart contracts for the BlockScore credit-scoring and lending protocol,
built and tested with Hardhat.

## Contracts

| Contract                        | Purpose                                                                                                                                 |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `CreditScore.sol`               | V1 on-chain credit history / score registry.                                                                                            |
| `LoanContract.sol`              | V1 simple loan lifecycle, reports events to `CreditScore`.                                                                              |
| `CreditScoreV2.sol`             | Role-based (AccessControl) credit registry with EIP-712 signed submissions, freeze/dispute/compliance flows.                            |
| `LoanContractV2.sol`            | Full underwriting → funding → repayment/default loan lifecycle with ERC20 lending/collateral tokens, reports events to `CreditScoreV2`. |
| `GovernanceToken.sol`           | ERC20Votes/ERC20Permit governance token with vesting and staking.                                                                       |
| `contracts/mocks/MockERC20.sol` | Minimal mintable ERC20 used only by the test suite.                                                                                     |

## Setup

```bash
npm install
npm run compile
npm test
```

Compilation runs fully offline: this environment doesn't have network
access to `binaries.soliditylang.org` (where Hardhat normally downloads
the `solc` compiler binary on demand), so `hardhat.config.js` points
Hardhat at the `solc` npm package instead, which already bundles the
compiler.

## Deploying

```bash
npm run deploy:local        # deploys everything to an in-process Hardhat network
npx hardhat node            # in one terminal, then in another:
npx hardhat run scripts/deploy.js --network localhost
```

For a real network, set `LENDING_TOKEN_ADDRESS` (the ERC20 `LoanContractV2`
will lend out) and optionally `TREASURY_ADDRESS` before running the script.
`scripts/deploy.js` deploys every contract and wires up the roles they need
to call each other (see "Fixes" below).

## What was fixed

The repository would not compile or run correctly as received. Notable
issues found and fixed:

**Compile errors**

- `CreditScoreV2.sol` declared both an `event ProfileFrozen` and an
  `error ProfileFrozen` — Solidity doesn't allow the name collision.
  The event was renamed to `CreditProfileFrozen`/`CreditProfileUnfrozen`.
- `GovernanceToken.sol`'s inheritance list (`ERC20, ERC20Votes,
ERC20Permit, ...`) violated C3 linearization, since `ERC20Votes`
  itself extends `ERC20Permit`. Reordered to put `ERC20Permit` first.
- `LoanContractV2.sol` referenced `InvalidSignature()` and
  `ProfileFrozen()` custom errors that were never declared in that
  contract.
- An invalid direct cast from `uint256` to `int16` in `CreditScoreV2.sol`.
- A "stack too deep" compiler error in `CreditScoreV2.addCreditRecord`,
  fixed by enabling the `viaIR` compiler pipeline.

**Broken contract-to-contract integration**

- `LoanContractV2` calls `CreditScoreV2.addCreditRecord(...)` to log
  loan events, but `CreditScoreV2` required every call to carry a valid
  EIP-712 signature from `msg.sender`. Since `msg.sender` in that call is
  the `LoanContractV2` contract itself — which has no private key and can
  never produce an ECDSA signature — every single credit-record call from
  the loan contract was guaranteed to revert. Signature verification is
  now optional: it's checked when a signature is supplied (for EOA
  providers who want to self-attest), and skipped when the caller relies
  solely on `CREDIT_PROVIDER_ROLE`, which is how contract integrations
  like `LoanContractV2` are actually authenticated.

**Financial-logic bugs in `LoanContractV2`**

- `_calculatePaymentBreakdown` computed
  `interestRate / 365 / 10000` before multiplying, which truncates to
  zero for every realistic basis-point interest rate — interest was
  silently always zero. Fixed by multiplying before dividing.
- `loan.lastPaymentTimestamp` was never initialized when a loan was
  funded, so the first payment's "days since last payment" was computed
  from Unix epoch 0 instead of the funding date. Now set in `fundLoan`.
- `underwriteLoan` pre-populated `loan.collateralAmount` (meant to track
  collateral the borrower has actually deposited) with the _required_
  amount at approval time, before any collateral was deposited. This
  silently defeated `fundLoan`'s "collateral must be deposited" check —
  a loan could be funded with zero collateral on deposit. Fixed by only
  writing `loan.collateralAmount` from actual deposits, and tightening
  the funding check to require the full amount, not just a nonzero one.

**Bugs in `GovernanceToken.sol`**

- `createVestingSchedule` required the _contract's own_ balance to
  already hold the tokens being vested, before those tokens were ever
  transferred in — an impossible precondition that made vesting
  unusable. Fixed to check the funding admin's balance instead.
- The "community rewards" pool (20% of initial supply) was only ever
  tracked as a bookkeeping number; no tokens backing it were ever
  transferred into the contract's own custody. Both staking-reward
  payouts and `distributeCommunityRewards` pay out of the contract's own
  balance, so reward claims would revert with "transfer amount exceeds
  balance" as soon as they exceeded whatever had incidentally been
  staked. The constructor now actually transfers the community rewards
  allocation into the contract.
- Removed all `SafeMath` usage (31 call sites) — dead weight under
  Solidity ^0.8, which already reverts on overflow/underflow.

**Tooling**

- Replaced the incomplete Truffle setup (`truffle-config.js` +
  `migrations/`, which only ever deployed 2 of the 5 contracts and never
  granted `LoanContract` permission to call back into `CreditScore`) with
  a working Hardhat setup and `scripts/deploy.js`, which deploys all five
  contracts and wires up every cross-contract role they need.
- Removed two Truffle-style test files that called functions that don't
  exist on the actual contracts (`addRecord`, wrong `createLoan` arity) —
  they could never have passed.
- Added a full Hardhat/Mocha/Chai test suite (53 tests) covering all five
  contracts, including real EIP-712 signature flows, the collateral
  deposit/funding lifecycle, staking/vesting, and role-based access
  control.

**Backend integration**

- `backend/services/blockchain_service.py` and
  `backend/services/contractService.js` loaded contract ABIs from
  `blockchain/build/contracts/...`, which is where Truffle used to write
  them. Now that the project builds with Hardhat, artifacts live at
  `blockchain/artifacts/contracts/<File>.sol/<Contract>.json`; both
  files were updated to read from the new location.
- Note: `contractService.js` already called the real V1 contract
  functions correctly (`addCreditRecord`, `createLoan`, `approveLoan`,
  etc.) and needed no further changes beyond the ABI path.
  `blockchain_service.py`, however, calls function names
  (`updateCreditScore`, `createLoanAgreement`) that don't exist on any
  contract in this repo — it appears to have been written against a
  different/earlier contract interface. That mismatch is a backend
  business-logic issue beyond the smart-contract scope of this pass, so
  it hasn't been rewritten; flagging it here so it isn't missed.
