# Electronic Health Record Blockchain Based Platform

## Introduction

This project is a healthcare records management system built on the Hyperledger Fabric blockchain. It allows patients to securely store and share his records with different healthcare providers, like doctor, pharmacy, lab. Patient can even claim for insurance for a record using the same system. This ensures patient privacy and data security.

## Technologies Used

- Hyperledger Fabric
- Hyperledger Explorer
- CouchDB
- Docker
- NodeJS
- ExpressJS
- MongoDB
- ReactJS
- TailwindCSS

## Features

### Patient
- Registration by anyone
- Login
- Allow access to particular healthcare provider(doctor, pharmacy, lab, insurance)
- See all records
- Claim for Insurance
  
### Doctor
- Registration by Admin
- Login
- See record history of patient
- Write Prescription

### Pharmacy
- Registration by Admin
- Login
- See Medicines Written in prescription by doctor
- Update Dispensed medicine record with bill Amount
- Write comment on unavailable medicine

### Lab
- Registration by Admin
- Login
- See Lab Tests Written in prescription by doctor
- Update Lab Test record with bill Amount

### Insurance
- Registration by Admin
- Login
- See all claim requests
- Approve/Decline Claim Request

## Installation and Usage

### Prerequisites

Verify that you have the following installed:

```bash
$ node -v
v16.20.0
```

```bash
$ npm -v
8.19.4
```

```bash
$ docker -v
Docker version 23.0.1, build a5ee5b1
```

```bash
$ docker-compose -v
Docker Compose version v2.15.1
```

```bash
$ git --version
git version 2.39.2
```

#### Installation

- Clone the repository
    
    ```bash
    $ git clone https://github.com/shaktisankpal/Blockchain-Mini-Project.git
    $ cd Blockchain-Mini-Project
    ```
- Run the network and backend on Linux, macOS or WSL (the scripts are bash). They need `docker`, **Node.js 16** and `jq`.
  Node 16 matters: Fablo packages the chaincode with the host's Node, and the backend's `fabric-client`/`grpc` dependency does not build on newer Node versions.
  On Windows, clone with `git clone -c core.autocrlf=false ...` so the scripts keep LF line endings.

- Create `backend/.env` from the example and fill in the values

    ```bash
    $ cp backend/.env.example backend/.env
    ```

- Start the hyperledger fabric network

    ```bash
    $ ./scripts/network-up.sh
    ```

    This runs `./fablo up fablo-config.json` and then:
    - sets the anchor peers on `main-channel1` (Fablo creates the channel without them, so the orgs cannot endorse transactions together),
    - adds the `<org>.department1` affiliations on every CA (needed to register users),
    - regenerates the backend connection profiles (`backend/config/generate-ccp.sh`).

    If you started the network with `./fablo up` yourself, run `./scripts/post-fablo-setup.sh` and `cd backend/config && ./generate-ccp.sh` afterwards.

- Start the backend server
  
    ```bash
    $ cd backend
    $ npm install
    $ node scripts/createAdmin.js <admin_username> <admin_password>
    $ node app.js
    ```

- Start the frontend server

    ```bash
    $ cd client
    $ npm install
    $ npm start
    ```


#### Usage

- Open the frontend server in browser

    ```bash
    http://localhost:3000
    ```
- Log in with the admin created by `node scripts/createAdmin.js` (organization: Admin) to create Doctor, Pharmacy, Lab and Insurance users.
  Do not insert the admin into MongoDB by hand: passwords are stored as bcrypt hashes, so a plain-text password can never log in.
- Patients register themselves from the Register page, then log in to the system

## Architecture

### Hyperledger Fabric Network

- 5 Organizations
    - Patient
    - Doctor
    - Pharmacy
    - Lab
    - Insurance
- Peers
    - 1 Peer for each organization
- Ledger
    - 1 CouchDB ledger for each peer
- Channel
    - main-channel1
- Chaincode
    - chaincode1

## Troubleshooting

If the network was not brought down properly, or you want a clean start, reset only this project's network (these commands do not touch other Docker containers on your machine):

1. Remove the network, its containers and volumes

    ```bash
    $ ./fablo prune
    ```

2. Remove the backend wallets (identities enrolled with the old CAs are no longer valid)

    ```bash
    $ rm -rf backend/*-wallet
    ```

3. Bring the network up again

    ```bash
    $ ./scripts/network-up.sh
    ```

Specific errors:

- **`Authorization failure` (code 71) or affiliation error (code 20) when registering a user**: the CA affiliations are missing. Run `./scripts/post-fablo-setup.sh`. If it still fails, regenerate the connection profiles (`cd backend/config && ./generate-ccp.sh`) and remove the wallets (step 2 above).
- **`no peer combination can satisfy the endorsement policy`** or **`DiscoveryService: chaincode1 error: failed constructing descriptor`**: anchor peers are not set. Run `./scripts/post-fablo-setup.sh`.
- **`npm ERR! gyp` / `grpc` build errors while Fablo packages the chaincode**: use `./scripts/network-up.sh` (it skips the chaincode's test-only dependencies) and Node.js 16.
- **`Failed to pull hyperledger/fabric-nodeenv` while installing chaincode**: a network download was interrupted. Run `docker pull hyperledger/fabric-nodeenv:2.4`, then `./fablo chaincodes install`.


## Acknowledgements

The network layout and parts of the original code are based on the open-source project [raj-71/healthcare-hyperledger](https://github.com/raj-71/healthcare-hyperledger).
