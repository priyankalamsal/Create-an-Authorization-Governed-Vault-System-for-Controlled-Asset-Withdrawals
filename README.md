# Secure Vault System with Authorization Manager

A two-contract system for secure, authorized withdrawals on Ethereum. Funds can only be withdrawn with valid off-chain signed authorizations that can be used exactly once.

## Quick Start
```bash
docker-compose up --build
```

This starts a local blockchain, deploys both contracts, and runs tests. Contract addresses are printed to the console.

**RPC Endpoint:** `http://localhost:8545`

## How It Works

### Two Contracts

**SecureVault** - Holds funds and executes withdrawals
- Anyone can deposit ETH
- Withdrawals require valid authorization from AuthorizationManager
- Updates state before transferring funds

**AuthorizationManager** - Validates withdrawal permissions
- Verifies ECDSA signatures from authorized signer
- Ensures each authorization used only once (via nonces)
- Binds permissions to specific vault, recipient, amount, and chain

### Authorization Flow

1. Off-chain signer creates signed message with: vault address, recipient, amount, chain ID, and unique nonce
2. User calls `SecureVault.withdraw()` with authorization data
3. Vault asks AuthorizationManager to verify
4. If valid and unused, authorization is marked consumed and funds transfer
5. If invalid or reused, transaction reverts

## Project Structure
```
contracts/          # Solidity smart contracts
scripts/            # Deployment scripts
test/               # Automated tests
docker/             # Docker configuration
docker-compose.yml  # Local environment setup
```

## Security Features

✓ Replay protection (nonces prevent reuse)  
✓ Signature verification (ECDSA)  
✓ Context binding (vault, chain, recipient, amount)  
✓ State-before-transfer pattern (reentrancy safe)  
✓ Single-use initialization  
✓ Separation of concerns (custody vs authorization)

## Testing

Tests verify:
- Successful deposits and authorized withdrawals
- Replay attack prevention
- Invalid signature rejection
- State consistency

All tests run automatically with `docker-compose up`.

## Limitations

- Native ETH only (no ERC20 tokens)
- Fixed signer (set at deployment)
- No upgrade mechanism
- Assumes secure off-chain signing process

## Manual Testing

After deployment, you can interact with contracts via the RPC endpoint at `http://localhost:8545` using tools like Hardhat console or ethers.js scripts.

Contract addresses are logged during deployment.
