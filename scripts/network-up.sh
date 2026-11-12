#!/usr/bin/env bash
# Brings up the whole Fabric network in one step:
#   Fablo network + chaincode, anchor peers, CA affiliations, backend connection profiles.
#
# Requirements on the machine running this (Linux, macOS or WSL):
#   docker, Node.js 16 (Fablo packages the Node chaincode with the host's node/npm), jq
set -euo pipefail

cd "$(dirname "$0")/.."

for cmd in docker node npm jq; do
  command -v "$cmd" >/dev/null 2>&1 || { echo "Missing required command: $cmd" >&2; exit 1; }
done

# The chaincode's devDependencies (test helpers) pull in the old native `grpc`
# module, which fails to build. Peers only need runtime dependencies.
export npm_config_omit=dev
export npm_config_production=true

./fablo up fablo-config.json
./scripts/post-fablo-setup.sh

echo "==> Generating backend connection profiles"
(cd backend/config && bash ./generate-ccp.sh)

echo "==> Network is ready"
