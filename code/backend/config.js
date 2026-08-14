/**
 * Configuration for the Node.js contract/auth service modules
 * (services/contractService.js, services/authService.js,
 * middleware/auth.js).
 *
 * NOTE ON PROJECT STRUCTURE: the actual running BlockScore backend is the
 * Flask app in code/backend/app.py (see code/backend/config.py for its
 * configuration) - that's what code/backend/requirements.txt,
 * code/backend/tests/, and docker-compose.yml all wire up. This file and
 * the handful of .js files that import it (authService.js, middleware/
 * auth.js, contractService.js, tests/api.test.js) are a separate,
 * unfinished Node/Express-oriented scaffold: there is no app.js, no
 * routes, and no package.json anywhere in code/backend, so nothing here
 * currently runs as a server. This file exists so contractService.js -
 * the one piece of that scaffold that talks to the blockchain - is at
 * least correctly configured and importable, matching the same
 * environment variables the Flask backend's config.py uses, rather than
 * crashing immediately on `require("./config")`.
 */

module.exports = {
  blockchain: {
    provider: process.env.BLOCKCHAIN_PROVIDER_URL || "http://localhost:8545",
    gasLimit: parseInt(process.env.BLOCKCHAIN_GAS_LIMIT || "200000", 10),
    gasPrice: parseInt(process.env.BLOCKCHAIN_GAS_PRICE || "20000000000", 10),
    fromAddress: process.env.BLOCKCHAIN_FROM_ADDRESS || "",
    privateKey: process.env.BLOCKCHAIN_PRIVATE_KEY || "",
  },
  contracts: {
    // contractService.js targets the V1 CreditScore/LoanContract pair
    // (see the ABIs it requires), so these intentionally read the same
    // *_CONTRACT_ADDRESS variables as the Python backend's
    // CREDIT_SCORE_CONTRACT_ADDRESS / LOAN_AGREEMENT_CONTRACT_ADDRESS,
    // just aimed at the V1 deployment addresses if you're running both
    // versions side by side.
    creditScoreAddress: process.env.CREDIT_SCORE_CONTRACT_ADDRESS || "",
    loanContractAddress: process.env.LOAN_AGREEMENT_CONTRACT_ADDRESS || "",
    // Overrides contractService.js's default
    // "<repo>/code/blockchain/artifacts/contracts" path for loading
    // compiled ABIs - see the comment above CONTRACT_ARTIFACTS_PATH in
    // code/backend/config.py for why this is needed for any deployment
    // where code/blockchain isn't a sibling directory on disk (e.g. the
    // Dockerized backend).
    artifactsPath: process.env.CONTRACT_ARTIFACTS_PATH || "",
  },
  api: {
    jwtSecret: process.env.JWT_SECRET_KEY || "change-me-in-production",
    jwtExpiration: process.env.JWT_EXPIRATION || "24h",
  },
};
