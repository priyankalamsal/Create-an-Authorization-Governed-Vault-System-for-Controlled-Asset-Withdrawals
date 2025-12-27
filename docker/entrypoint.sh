#!/bin/sh
set -e

echo "Starting Hardhat node..."
npx hardhat node --hostname 0.0.0.0 &

echo "Waiting for node to start..."
sleep 5

echo "Deploying contracts..."
npx hardhat run scripts/deploy.js --network localhost

echo "System ready on http://localhost:8545"

# Keep container running
tail -f /dev/null