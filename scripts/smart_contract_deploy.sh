#!/bin/bash
# ========================================================================
# BlockScore Smart Contract Deployment Automation Script
#
# This script automates the deployment of smart contracts to different
# blockchain networks with proper configuration and verification.
#
# This project uses Truffle (see code/blockchain/truffle-config.js), not
# Hardhat. Truffle's config currently only defines a "development" network
# (127.0.0.1:8545); deploying to "test" or "mainnet" requires adding a
# matching network entry to truffle-config.js first (typically via
# @truffle/hdwallet-provider using PROVIDER_URL/PRIVATE_KEY, which this
# script already loads from .env.<network>).
#
# Features:
# - Multi-network deployment support (development, test, mainnet)
# - Contract verification on block explorers (requires truffle-plugin-verify)
# - Gas optimization
# - Deployment tracking and history
# - Security checks before deployment
# ========================================================================

# Set strict error handling
set -e

# Define colors for terminal output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Resolve the project root relative to this script's own location.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
BLOCKCHAIN_DIR="${PROJECT_DIR}/code/blockchain"
CONFIG_DIR="${PROJECT_DIR}/.blockscore_config"
DEPLOYMENT_LOG="${PROJECT_DIR}/deployment.log"

# Print banner
echo -e "${BLUE}================================================================${NC}"
echo -e "${BLUE}          BlockScore Smart Contract Deployment System           ${NC}"
echo -e "${BLUE}================================================================${NC}"

# Initialize log file
echo "BlockScore Deployment Log - $(date)" > "$DEPLOYMENT_LOG"

# Parse command line arguments
NETWORK="development"
VERIFY=false
GAS_OPTIMIZATION=true
SECURITY_CHECK=true

print_usage() {
  echo "Usage: $0 [options]"
  echo ""
  echo "Options:"
  echo "  -h, --help                 Show this help message"
  echo "  -n, --network <network>    Specify network (development, test, mainnet)"
  echo "  -v, --verify               Verify contracts on block explorer (requires truffle-plugin-verify)"
  echo "  --no-gas-optimization      Disable gas optimization"
  echo "  --no-security-check        Disable security checks"
  echo ""
  echo "Examples:"
  echo "  $0                         Deploy to development network"
  echo "  $0 -n test -v              Deploy to test network and verify contracts"
  echo "  $0 -n mainnet -v           Deploy to mainnet and verify contracts"
}

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    -h|--help)
      print_usage
      exit 0
      ;;
    -n|--network)
      NETWORK="$2"
      shift 2
      ;;
    -v|--verify)
      VERIFY=true
      shift
      ;;
    --no-gas-optimization)
      GAS_OPTIMIZATION=false
      shift
      ;;
    --no-security-check)
      SECURITY_CHECK=false
      shift
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}"
      print_usage
      exit 1
      ;;
  esac
done

# Validate network
if [[ ! "$NETWORK" =~ ^(development|test|mainnet)$ ]]; then
  echo -e "${RED}Invalid network: $NETWORK${NC}"
  echo -e "${YELLOW}Valid networks: development, test, mainnet${NC}"
  exit 1
fi

# Function to log messages
log_message() {
  local level=$1
  local message=$2
  local timestamp
  timestamp=$(date "+%Y-%m-%d %H:%M:%S")

  echo "[$timestamp] [$level] $message" >> "$DEPLOYMENT_LOG"

  case $level in
    INFO)
      echo -e "${BLUE}[$level] $message${NC}"
      ;;
    SUCCESS)
      echo -e "${GREEN}[$level] $message${NC}"
      ;;
    WARNING)
      echo -e "${YELLOW}[$level] $message${NC}"
      ;;
    ERROR)
      echo -e "${RED}[$level] $message${NC}"
      ;;
    *)
      echo "[$level] $message"
      ;;
  esac
}

# Function to check if the blockchain directory and Truffle config exist
check_blockchain_directory() {
  if [ ! -d "$BLOCKCHAIN_DIR" ]; then
    log_message "ERROR" "Blockchain directory not found: $BLOCKCHAIN_DIR"
    exit 1
  fi

  if [ ! -f "${BLOCKCHAIN_DIR}/truffle-config.js" ]; then
    log_message "ERROR" "truffle-config.js not found in blockchain directory"
    exit 1
  fi

  if ! command -v npx &> /dev/null; then
    log_message "ERROR" "npx not found. Install Node.js to run Truffle."
    exit 1
  fi

  log_message "INFO" "Blockchain directory validated"
}

# Function to confirm the requested network is actually defined in
# truffle-config.js, so a missing network fails with a clear, actionable
# message instead of a confusing Truffle error deep into the process.
validate_network_configured() {
  log_message "INFO" "Checking that network '$NETWORK' is configured in truffle-config.js"

  cd "$BLOCKCHAIN_DIR"

  if node -e "const cfg = require('./truffle-config.js'); process.exit(cfg.networks && cfg.networks['$NETWORK'] ? 0 : 1);" 2>/dev/null; then
    log_message "SUCCESS" "Network '$NETWORK' is configured"
  else
    log_message "ERROR" "Network '$NETWORK' is not defined in ${BLOCKCHAIN_DIR}/truffle-config.js"
    log_message "ERROR" "Add a networks.$NETWORK entry (see the Truffle docs for @truffle/hdwallet-provider) before deploying to this network."
    exit 1
  fi
}

# Function to load environment variables
load_environment_variables() {
  log_message "INFO" "Loading environment variables for network: $NETWORK"

  # Check if .env file exists
  if [ -f "${BLOCKCHAIN_DIR}/.env" ]; then
    # shellcheck source=/dev/null
    source "${BLOCKCHAIN_DIR}/.env"
    log_message "INFO" "Loaded environment variables from .env file"
  else
    log_message "WARNING" ".env file not found in blockchain directory"
  fi

  # Check if network-specific .env file exists
  if [ -f "${BLOCKCHAIN_DIR}/.env.${NETWORK}" ]; then
    # shellcheck source=/dev/null
    source "${BLOCKCHAIN_DIR}/.env.${NETWORK}"
    log_message "INFO" "Loaded environment variables from .env.${NETWORK} file"
  fi

  # Validate required environment variables
  if [ "$NETWORK" != "development" ]; then
    if [ -z "$PROVIDER_URL" ]; then
      log_message "ERROR" "PROVIDER_URL environment variable not set for network: $NETWORK"
      exit 1
    fi

    if [ -z "$PRIVATE_KEY" ]; then
      log_message "ERROR" "PRIVATE_KEY environment variable not set for network: $NETWORK"
      exit 1
    fi
  fi

  log_message "SUCCESS" "Environment variables loaded successfully"
}

# Ensure code/blockchain has a package.json so devDependency installs
# (e.g. solhint) have somewhere to record themselves; the directory ships
# without one since contracts are compiled via a globally available truffle.
ensure_package_json() {
  cd "$BLOCKCHAIN_DIR"
  if [ ! -f "package.json" ]; then
    log_message "INFO" "No package.json in blockchain directory; creating one"
    npm init -y > /dev/null
  fi
}

# Function to run security checks
run_security_checks() {
  if [ "$SECURITY_CHECK" = false ]; then
    log_message "WARNING" "Security checks disabled"
    return 0
  fi

  log_message "INFO" "Running security checks on smart contracts"

  cd "$BLOCKCHAIN_DIR"
  ensure_package_json

  # Check if solhint is installed
  if ! npm list solhint > /dev/null 2>&1 && ! command -v solhint &> /dev/null; then
    log_message "INFO" "Installing solhint..."
    npm install --save-dev solhint
  fi

  # Run solhint
  log_message "INFO" "Running solhint..."
  if ! npx solhint "contracts/**/*.sol"; then
    log_message "ERROR" "Solhint found issues in smart contracts"
    read -r -p "Continue with deployment despite security issues? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
      log_message "INFO" "Deployment aborted by user"
      exit 1
    fi
  fi

  # Check if slither is installed (if Python is available)
  if command -v python3 > /dev/null && ! pip show slither-analyzer > /dev/null 2>&1; then
    log_message "INFO" "Installing slither-analyzer..."
    pip install slither-analyzer || log_message "WARNING" "Could not install slither-analyzer; skipping"
  fi

  # Run slither if available
  if command -v slither > /dev/null; then
    log_message "INFO" "Running slither..."
    if ! slither .; then
      log_message "WARNING" "Slither found potential vulnerabilities"
      read -r -p "Continue with deployment despite potential vulnerabilities? (y/n) " -n 1 -r
      echo
      if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_message "INFO" "Deployment aborted by user"
        exit 1
      fi
    fi
  else
    log_message "WARNING" "Slither not available, skipping advanced vulnerability checks"
  fi

  log_message "SUCCESS" "Security checks completed"
}

# Function to optimize gas usage (Truffle's compilers.solc.settings.optimizer,
# not Hardhat's solidity.settings.optimizer)
optimize_gas() {
  if [ "$GAS_OPTIMIZATION" = false ]; then
    log_message "WARNING" "Gas optimization disabled"
    return 0
  fi

  log_message "INFO" "Optimizing gas usage for smart contracts"

  cd "$BLOCKCHAIN_DIR"

  CONFIG_FILE="truffle-config.js"
  if [ ! -f "$CONFIG_FILE" ]; then
    log_message "ERROR" "truffle-config.js not found"
    exit 1
  fi

  # Check if optimization is already enabled. Checked as two separate
  # patterns (rather than one regex spanning both) since grep matches
  # line-by-line and real-world configs commonly format this across
  # multiple lines, e.g.:
  #   optimizer: {
  #     enabled: true,
  if grep -q "optimizer:" "$CONFIG_FILE" && grep -qE "enabled:\s*true" "$CONFIG_FILE"; then
    log_message "INFO" "Gas optimization already enabled in $CONFIG_FILE"
  elif grep -q "compilers:" "$CONFIG_FILE"; then
    log_message "WARNING" "A compilers block exists in $CONFIG_FILE but optimizer settings were not detected in the expected format."
    log_message "WARNING" "Please verify compilers.solc.settings.optimizer manually; leaving the file untouched."
  else
    # Backup the config file
    cp "$CONFIG_FILE" "${CONFIG_FILE}.bak"

    # Add a compilers block with the optimizer enabled
    sed -i '/module.exports = {/a \  compilers: {\n    solc: {\n      settings: {\n        optimizer: { enabled: true, runs: 200 },\n      },\n    },\n  },' "$CONFIG_FILE"

    log_message "SUCCESS" "Gas optimization enabled in $CONFIG_FILE"
  fi
}

# Function to compile contracts
compile_contracts() {
  log_message "INFO" "Compiling smart contracts"

  cd "$BLOCKCHAIN_DIR"

  # Clean the build output directory
  if [ -d "build" ]; then
    rm -rf build
  fi

  # Compile contracts
  if ! npx truffle compile; then
    log_message "ERROR" "Failed to compile smart contracts"
    exit 1
  fi

  log_message "SUCCESS" "Smart contracts compiled successfully"
}

# Function to deploy contracts
deploy_contracts() {
  log_message "INFO" "Deploying smart contracts to network: $NETWORK"

  cd "$BLOCKCHAIN_DIR"

  # Create deployment directory if it doesn't exist
  mkdir -p "deployments/$NETWORK"
  MIGRATE_OUTPUT="deployments/$NETWORK/migrate_output_$(date +%Y%m%d%H%M%S).log"

  log_message "INFO" "Running: truffle migrate --network $NETWORK"

  if ! npx truffle migrate --network "$NETWORK" --reset 2>&1 | tee "$MIGRATE_OUTPUT"; then
    log_message "ERROR" "Failed to deploy smart contracts"
    exit 1
  fi

  # Truffle does not write a clean addresses summary on its own; extract
  # "Deploying 'ContractName'" / "contract address: 0x..." pairs from the
  # migration output into deployments/$NETWORK/addresses.json so the rest
  # of this script (verification, deployment records) has one to read.
  python3 - "$MIGRATE_OUTPUT" "deployments/$NETWORK/addresses.json" << 'PYEOF'
import json
import re
import sys

log_path, out_path = sys.argv[1], sys.argv[2]
with open(log_path) as f:
    text = f.read()

addresses = {}
current = None
for line in text.splitlines():
    m = re.search(r"Deploying '([^']+)'", line)
    if m:
        current = m.group(1)
        continue
    m = re.search(r"contract address:\s+(0x[a-fA-F0-9]{40})", line)
    if m and current:
        addresses[current] = m.group(1)
        current = None

with open(out_path, "w") as f:
    json.dump(addresses, f, indent=2)

print(f"Recorded {len(addresses)} deployed contract address(es).")
PYEOF

  log_message "SUCCESS" "Smart contracts deployed successfully to network: $NETWORK"
}

# Function to verify contracts on a block explorer via truffle-plugin-verify.
verify_contracts() {
  if [ "$VERIFY" = false ]; then
    log_message "INFO" "Contract verification skipped"
    return 0
  fi

  if [ "$NETWORK" = "development" ]; then
    log_message "WARNING" "Contract verification not supported on development network"
    return 0
  fi

  log_message "INFO" "Verifying smart contracts on block explorer"

  cd "$BLOCKCHAIN_DIR"

  if ! npm list truffle-plugin-verify > /dev/null 2>&1; then
    log_message "WARNING" "truffle-plugin-verify is not installed."
    log_message "WARNING" "Run: npm install --save-dev truffle-plugin-verify, and add"
    log_message "WARNING" "  plugins: ['truffle-plugin-verify']"
    log_message "WARNING" "to truffle-config.js, then re-run with --verify."
    return 1
  fi

  # Check if deployment addresses file exists
  DEPLOYMENT_FILE="deployments/$NETWORK/addresses.json"

  if [ ! -f "$DEPLOYMENT_FILE" ]; then
    log_message "ERROR" "Deployment addresses file not found: $DEPLOYMENT_FILE"
    log_message "WARNING" "Contract verification skipped"
    return 1
  fi

  # Read contract addresses from deployment file
  CONTRACTS=$(jq -r 'keys[]' "$DEPLOYMENT_FILE")

  for CONTRACT in $CONTRACTS; do
    ADDRESS=$(jq -r ".[\"$CONTRACT\"]" "$DEPLOYMENT_FILE")

    log_message "INFO" "Verifying contract: $CONTRACT at address: $ADDRESS"

    if ! npx truffle run verify "${CONTRACT}@${ADDRESS}" --network "$NETWORK"; then
      log_message "WARNING" "Failed to verify contract: $CONTRACT"
      continue
    fi

    log_message "SUCCESS" "Contract verified: $CONTRACT"
  done

  log_message "SUCCESS" "Contract verification completed"
}

# Function to create deployment record
create_deployment_record() {
  log_message "INFO" "Creating deployment record"

  # Create config directory if it doesn't exist
  mkdir -p "$CONFIG_DIR"

  # Create deployment record
  DEPLOYMENT_RECORD="${CONFIG_DIR}/deployment_${NETWORK}_$(date +%Y%m%d%H%M%S).json"

  # Copy deployment addresses
  if [ -f "${BLOCKCHAIN_DIR}/deployments/$NETWORK/addresses.json" ]; then
    cp "${BLOCKCHAIN_DIR}/deployments/$NETWORK/addresses.json" "$DEPLOYMENT_RECORD"
    log_message "SUCCESS" "Deployment record created: $DEPLOYMENT_RECORD"
  else
    log_message "WARNING" "Deployment addresses file not found, record not created"
  fi
}

# Main execution
main() {
  log_message "INFO" "Starting smart contract deployment process"

  check_blockchain_directory
  validate_network_configured
  load_environment_variables
  run_security_checks
  optimize_gas
  compile_contracts
  deploy_contracts
  verify_contracts
  create_deployment_record

  log_message "SUCCESS" "Smart contract deployment process completed"

  echo -e "${GREEN}Deployment completed successfully!${NC}"
  echo -e "${BLUE}================================================================${NC}"
  echo -e "${BLUE}Deployment Log: $DEPLOYMENT_LOG${NC}"
  echo -e "${BLUE}================================================================${NC}"
}

# Execute main function
main
