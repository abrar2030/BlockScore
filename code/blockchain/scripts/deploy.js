/**
 * Deploys the full BlockScore on-chain stack and wires up the
 * cross-contract roles/permissions each piece needs to talk to the others.
 *
 * This replaces the old Truffle migration, which only ever deployed
 * CreditScore (v1) and LoanContract (v1) and never granted LoanContract
 * permission to call back into CreditScore - so the two contracts, while
 * both deployed, were never actually connected on-chain.
 *
 * Usage:
 *   npx hardhat run scripts/deploy.js --network <network>
 *
 * Environment variables:
 *   TREASURY_ADDRESS      - address to receive the GovernanceToken treasury
 *                            allocation and LoanContractV2 fees. Defaults to
 *                            the deployer on local networks.
 *   LENDING_TOKEN_ADDRESS - ERC20 token LoanContractV2 lends out. Required
 *                            on any network other than hardhat/localhost/
 *                            development, where a disposable mock is
 *                            deployed automatically for convenience.
 */
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const { ethers, network } = hre;
  const [deployer] = await ethers.getSigners();

  console.log(
    `Deploying BlockScore contracts with account: ${deployer.address}`,
  );
  console.log(`Network: ${network.name}`);

  const isLocalNetwork = ["hardhat", "localhost", "development"].includes(
    network.name,
  );
  const treasuryAddress = process.env.TREASURY_ADDRESS || deployer.address;

  // -------------------------------------------------------------------
  // 1. Governance token
  // -------------------------------------------------------------------
  const GovernanceToken = await ethers.getContractFactory("GovernanceToken");
  const governanceToken = await GovernanceToken.deploy(treasuryAddress);
  await governanceToken.waitForDeployment();
  console.log(
    `GovernanceToken deployed to: ${await governanceToken.getAddress()}`,
  );

  // -------------------------------------------------------------------
  // 2. Credit scoring (v1 kept for backwards compatibility, v2 is primary)
  // -------------------------------------------------------------------
  const CreditScore = await ethers.getContractFactory("CreditScore");
  const creditScore = await CreditScore.deploy();
  await creditScore.waitForDeployment();
  console.log(
    `CreditScore (v1) deployed to: ${await creditScore.getAddress()}`,
  );

  const CreditScoreV2 = await ethers.getContractFactory("CreditScoreV2");
  const creditScoreV2 = await CreditScoreV2.deploy();
  await creditScoreV2.waitForDeployment();
  console.log(`CreditScoreV2 deployed to: ${await creditScoreV2.getAddress()}`);

  // -------------------------------------------------------------------
  // 3. Lending token for LoanContractV2. On local/test networks we deploy
  // a disposable mock so the whole stack can be exercised end-to-end; on
  // any other network you must supply a real ERC20 address via
  // LENDING_TOKEN_ADDRESS.
  // -------------------------------------------------------------------
  let lendingTokenAddress = process.env.LENDING_TOKEN_ADDRESS;
  if (!lendingTokenAddress) {
    if (!isLocalNetwork) {
      throw new Error(
        "LENDING_TOKEN_ADDRESS must be set when deploying LoanContractV2 " +
          "to a non-local network.",
      );
    }
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const mockLendingToken = await MockERC20.deploy(
      "BlockScore Test USD",
      "bsUSD",
    );
    await mockLendingToken.waitForDeployment();
    lendingTokenAddress = await mockLendingToken.getAddress();
    console.log(
      "No LENDING_TOKEN_ADDRESS supplied - deployed a mock ERC20 for " +
        `local testing at: ${lendingTokenAddress}`,
    );
  }

  // -------------------------------------------------------------------
  // 4. Loan contracts
  // -------------------------------------------------------------------
  const LoanContract = await ethers.getContractFactory("LoanContract");
  const loanContract = await LoanContract.deploy(
    await creditScore.getAddress(),
  );
  await loanContract.waitForDeployment();
  console.log(
    `LoanContract (v1) deployed to: ${await loanContract.getAddress()}`,
  );

  const LoanContractV2 = await ethers.getContractFactory("LoanContractV2");
  const loanContractV2 = await LoanContractV2.deploy(
    await creditScoreV2.getAddress(),
    lendingTokenAddress,
    treasuryAddress,
  );
  await loanContractV2.waitForDeployment();
  console.log(
    `LoanContractV2 deployed to: ${await loanContractV2.getAddress()}`,
  );

  // -------------------------------------------------------------------
  // 5. Wire up roles/permissions between contracts
  // -------------------------------------------------------------------
  console.log("Configuring cross-contract roles...");

  // v1: LoanContract must be an authorized CreditScore provider so it can
  // record loan approval/repayment credit events.
  let tx = await creditScore.authorizeProvider(await loanContract.getAddress());
  await tx.wait();

  // v2: LoanContractV2 must hold CREDIT_PROVIDER_ROLE on CreditScoreV2 for
  // the same reason - without this grant, every credit event LoanContractV2
  // tries to log reverts.
  const CREDIT_PROVIDER_ROLE = await creditScoreV2.CREDIT_PROVIDER_ROLE();
  tx = await creditScoreV2.grantRole(
    CREDIT_PROVIDER_ROLE,
    await loanContractV2.getAddress(),
  );
  await tx.wait();

  if (isLocalNetwork) {
    // For convenience on local networks, also grant the deployer the
    // operational roles needed to drive LoanContractV2 end-to-end
    // (underwriting, funding, compliance) from a single account. Do NOT
    // do this on a real deployment - these should go to the actual
    // loan officers/underwriters/compliance team members.
    const LOAN_OFFICER_ROLE = await loanContractV2.LOAN_OFFICER_ROLE();
    const UNDERWRITER_ROLE = await loanContractV2.UNDERWRITER_ROLE();
    const LIQUIDATOR_ROLE = await loanContractV2.LIQUIDATOR_ROLE();

    await (
      await loanContractV2.grantRole(LOAN_OFFICER_ROLE, deployer.address)
    ).wait();
    await (
      await loanContractV2.grantRole(UNDERWRITER_ROLE, deployer.address)
    ).wait();
    await (
      await loanContractV2.grantRole(LIQUIDATOR_ROLE, deployer.address)
    ).wait();

    // Same idea for CreditScoreV2: let the deployer act as a credit
    // provider directly for local testing.
    await (
      await creditScoreV2.grantRole(CREDIT_PROVIDER_ROLE, deployer.address)
    ).wait();
  }

  console.log("\nDeployment complete:");
  console.log(
    JSON.stringify(
      {
        governanceToken: await governanceToken.getAddress(),
        creditScore: await creditScore.getAddress(),
        creditScoreV2: await creditScoreV2.getAddress(),
        lendingToken: lendingTokenAddress,
        loanContract: await loanContract.getAddress(),
        loanContractV2: await loanContractV2.getAddress(),
        treasury: treasuryAddress,
      },
      null,
      2,
    ),
  );

  // -------------------------------------------------------------------
  // 6. Write a deployment record to deployments/<network>/addresses.json
  // - both plain addresses (for anything that just needs to know where a
  // contract lives) and, separately, each contract's constructor
  // arguments (needed to verify source on a block explorer via
  // `npx hardhat verify`, since verification re-derives and checks the
  // deployed bytecode against the constructor args that produced it).
  // -------------------------------------------------------------------
  const deploymentDir = path.join(__dirname, "..", "deployments", network.name);
  fs.mkdirSync(deploymentDir, { recursive: true });

  const addresses = {
    GovernanceToken: await governanceToken.getAddress(),
    CreditScore: await creditScore.getAddress(),
    CreditScoreV2: await creditScoreV2.getAddress(),
    LoanContract: await loanContract.getAddress(),
    LoanContractV2: await loanContractV2.getAddress(),
  };
  if (!process.env.LENDING_TOKEN_ADDRESS) {
    // Only record the mock as a deployed contract when we actually
    // deployed one ourselves.
    addresses.MockERC20_LendingToken = lendingTokenAddress;
  }

  const constructorArgs = {
    GovernanceToken: [treasuryAddress],
    CreditScore: [],
    CreditScoreV2: [],
    LoanContract: [await creditScore.getAddress()],
    LoanContractV2: [
      await creditScoreV2.getAddress(),
      lendingTokenAddress,
      treasuryAddress,
    ],
  };

  fs.writeFileSync(
    path.join(deploymentDir, "addresses.json"),
    JSON.stringify(addresses, null, 2),
  );
  fs.writeFileSync(
    path.join(deploymentDir, "constructor-args.json"),
    JSON.stringify(constructorArgs, null, 2),
  );
  console.log(`\nDeployment record written to: ${deploymentDir}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
