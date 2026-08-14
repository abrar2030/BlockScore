require("@nomicfoundation/hardhat-toolbox");
const { subtask } = require("hardhat/config");
const {
  TASK_COMPILE_SOLIDITY_GET_SOLC_BUILD,
} = require("hardhat/builtin-tasks/task-names");

// This project's sandboxed build environment cannot reach
// binaries.soliditylang.org to download the solc compiler binary that
// Hardhat normally fetches on demand. We already ship the exact compiler
// version as an npm dependency (see package.json -> devDependencies.solc),
// so we point Hardhat at that local solc-js build instead of downloading
// one. This keeps compilation fully offline/reproducible.
subtask(TASK_COMPILE_SOLIDITY_GET_SOLC_BUILD).setAction(
  async ({ solcVersion }, _hre, runSuper) => {
    const localSolcVersion = require("solc/package.json").version;
    if (!localSolcVersion.startsWith(solcVersion)) {
      // Fall back to Hardhat's normal (network) download behavior if the
      // requested version ever drifts from the pinned local package.
      return runSuper();
    }

    return {
      compilerPath: require.resolve("solc/soljson.js"),
      isSolcJs: true,
      version: solcVersion,
      longVersion: `${solcVersion}+commit.local`,
    };
  },
);

/** @type {import('hardhat/config').HardhatUserConfig} */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      // CreditScoreV2 / LoanContractV2 have several functions with many
      // local variables (EIP-712 verification + struct construction),
      // which trips Solidity's "stack too deep" limit under the legacy
      // codegen pipeline. The IR pipeline handles stack allocation far
      // more efficiently and is the standard fix recommended by the
      // Solidity team.
      viaIR: true,
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./tests",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  networks: {
    hardhat: {
      chainId: 1337,
    },
    development: {
      url: "http://127.0.0.1:8545",
      chainId: 1337,
    },
  },
};
