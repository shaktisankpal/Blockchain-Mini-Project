// Live network statistics for the public landing page.
// Counts come from MongoDB (users, record index) and the chain itself (block height, peers, orgs).
const { Gateway, Wallets } = require('fabric-network');
const protos = require('fabric-protos');
const User = require('../Model/Users');
const Record = require('../Model/PaitientRecords');
const helper = require('./helper');

const CHANNEL = 'main-channel1';
const CACHE_MS = 10 * 1000;
let cache = { at: 0, value: null };

// Block height, latest block hash and the peers/orgs that can endorse on the channel.
// Uses any identity already enrolled in the patient wallet (read-only query).
async function chainInfo() {
    const wallet = await Wallets.newFileSystemWallet(await helper.getWalletPath('patient'));
    const identities = await wallet.list();
    if (identities.length === 0) return null;

    const gateway = new Gateway();
    try {
        await gateway.connect(await helper.getCCP('patient'), {
            wallet,
            identity: identities[0],
            discovery: { enabled: true, asLocalhost: true },
        });
        const network = await gateway.getNetwork(CHANNEL);
        const raw = await network.getContract('qscc').evaluateTransaction('GetChainInfo', CHANNEL);
        const info = protos.common.BlockchainInfo.decode(raw);

        const endorsers = network.getChannel().getEndorsers();
        const orgs = [...new Set(endorsers.map((e) => e.mspid))].sort();

        return {
            blockHeight: Number(info.height),
            latestBlockHash: Buffer.from(info.currentBlockHash).toString('hex'),
            peers: endorsers.length,
            organisations: orgs.map((m) => m.replace(/MSP$/, '')),
        };
    } finally {
        gateway.disconnect();
    }
}

async function getStats() {
    if (cache.value && Date.now() - cache.at < CACHE_MS) return cache.value;

    const [byRole, records, chain] = await Promise.all([
        User.aggregate([{ $group: { _id: '$orgName', count: { $sum: 1 } } }]),
        Record.countDocuments(),
        chainInfo().catch(() => null), // the page still works if the network is down
    ]);
    const users = Object.fromEntries(byRole.map((r) => [r._id, r.count]));

    const value = {
        patients: users.patient || 0,
        doctors: users.doctor || 0,
        pharmacies: users.pharmacy || 0,
        labs: users.lab || 0,
        insurers: users.insurance || 0,
        providers: (users.doctor || 0) + (users.pharmacy || 0) + (users.lab || 0) + (users.insurance || 0),
        records,
        chain, // null when the ledger can't be reached
        updatedAt: new Date().toISOString(),
    };
    cache = { at: Date.now(), value };
    return value;
}

module.exports = { getStats };
