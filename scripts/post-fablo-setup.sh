#!/usr/bin/env bash
# Run once after `./fablo up fablo-config.json`.
#
# Fixes two gaps in the network Fablo 1.1.0 generates for this project:
#   1. The channel is created without anchor peers, so the 5 orgs cannot
#      discover each other and every endorsement fails with
#      "no peer combination can satisfy the endorsement policy".
#   2. The CAs have no `<org>.department1` affiliations, which the backend
#      uses when registering users ("Authorization failure", code 71/20).
#
# Safe to run more than once: steps that are already done are skipped.
set -uo pipefail

cd "$(dirname "$0")/.."
ROOT="$(pwd)"
CHANNEL="main-channel1"
PROFILE="MainChannel1"
ORDERER="orderer0.group1.orderer.healthcare.com:7030"
ORGS=(patient doctor pharmacy lab insurance)
FABRIC_VERSION="$(grep -E '^FABRIC_VERSION=' fablo-target/fabric-docker/.env 2>/dev/null | cut -d= -f2)"
FABRIC_VERSION="${FABRIC_VERSION:-2.4.0}"
CONFIG_DIR="$ROOT/fablo-target/fabric-config"
OUT_DIR="$ROOT/fablo-target/anchor-updates"

if [ ! -f "$CONFIG_DIR/configtx.yaml" ]; then
  echo "fablo-target/fabric-config/configtx.yaml not found - run ./fablo up fablo-config.json first" >&2
  exit 1
fi

mkdir -p "$OUT_DIR"

echo "==> Setting anchor peers on channel $CHANNEL"
for org in "${ORGS[@]}"; do
  tx="$OUT_DIR/${org}MSPanchors.tx"
  docker run --rm \
    -v "$CONFIG_DIR:/cfg:ro" -v "$OUT_DIR:/out" -e FABRIC_CFG_PATH=/cfg \
    "hyperledger/fabric-tools:$FABRIC_VERSION" \
    configtxgen -profile "$PROFILE" -channelID "$CHANNEL" -asOrg "${org}MSP" \
    -outputAnchorPeersUpdate "/out/${org}MSPanchors.tx" >/dev/null 2>&1 \
    || { echo "  $org: failed to generate anchor peer update" >&2; continue; }

  docker cp "$tx" "cli.$org.healthcare.com:/tmp/anchors.tx" >/dev/null
  out="$(docker exec "cli.$org.healthcare.com" peer channel update -o "$ORDERER" -c "$CHANNEL" -f /tmp/anchors.tx 2>&1)"
  if echo "$out" | grep -q "Successfully submitted channel update"; then
    echo "  $org: anchor peer set"
  elif echo "$out" | grep -qiE "no differences|version|already"; then
    echo "  $org: anchor peer already set"
  else
    echo "  $org: anchor peer update failed:" >&2
    echo "$out" | tail -n 3 >&2
  fi
  sleep 2
done

echo "==> Adding CA affiliations"
for org in "${ORGS[@]}"; do
  docker exec "ca.$org.healthcare.com" sh -c "
    fabric-ca-client enroll -u http://admin:adminpw@localhost:7054 -H /tmp/aff-cli >/dev/null 2>&1 || exit 1
    for aff in $org $org.department1; do
      if fabric-ca-client affiliation list --affiliation \$aff -H /tmp/aff-cli >/dev/null 2>&1; then
        echo \"  $org: \$aff already exists\"
      else
        fabric-ca-client affiliation add \$aff -H /tmp/aff-cli >/dev/null 2>&1 && echo \"  $org: added \$aff\" || echo \"  $org: failed to add \$aff\"
      fi
    done
  " || echo "  $org: could not reach ca.$org.healthcare.com" >&2
done

echo "==> Done"
