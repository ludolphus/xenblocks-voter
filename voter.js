const argon2 = require('argon2');
const { Command } = require('commander');
const fs = require('fs');
const crypto = require('crypto');
const axios = require('axios');
const { Keypair } = require('@solana/web3.js');
const os = require('os');
const path = require('path');
const pMap = require('p-map');

const program = new Command();

program
    .version('1.0')
    .option('-w, --workers <number>', 'number of worker threads')
    .parse(process.argv);

const options = program.opts();

const numThreads = options.workers ? parseInt(options.workers, 10) : os.cpus().length;
console.log(`Using ${numThreads} worker threads`);

async function verifyHash(key, hashedPassword) {
    try {
        const parsedHash = await argon2.verify(hashedPassword, key);
        if (parsedHash) {
            return 'Verification: Ok';
        } else {
            throw new Error('Password verification failed.');
        }
    } catch (err) {
        return `Verification failed: ${err.message}`;
    }
}

async function generateKeypair(filePath) {
    if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        const privateKey = JSON.parse(content);
        return Keypair.fromSecretKey(Buffer.from(privateKey));
    } else {
        const keypair = Keypair.generate();
        const privateKeyBytes = Array.from(keypair.secretKey);

        console.log("\nid.json now has your private key, delete it to generate new one\n");

        fs.writeFileSync(filePath, JSON.stringify(privateKeyBytes));
        return keypair;
    }
}

async function main() {
    const filePath = path.join(__dirname, 'id.json');
    const keypair = await generateKeypair(filePath);
    const pubkey = keypair.publicKey.toString();

    console.log(`Public Key: ${pubkey}`);

    const client = axios.create();
    let globalHash = '';

    while (true) {
        try {
            const response = await client.get('http://xenblocks.io:4447/getblocks/lastblock');
            const data = response.data;
            const currentHash = crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
            if (currentHash !== globalHash) {
                globalHash = currentHash;
                const records = data;

                const startTime = Date.now();

                const results = await pMap(records, async (record) => {
                    const { key, hash_to_verify, block_id } = record;
                    const verificationResult = await verifyHash(Buffer.from(key), hash_to_verify);

                    const flag = hash_to_verify.includes('XEN11') ? 'XEN11' : hash_to_verify.includes('XUNI') ? 'XUNI' : '';

                    console.log(`hash_id: ${block_id} key: ${key} result: ${verificationResult}, target: ${flag}`);

                    return [block_id, verificationResult, hash_to_verify];
                }, { concurrency: numThreads });

                const duration = Date.now() - startTime;
                console.log(`\nTime taken for verification: ${duration}ms`);

                if (results.length === 0) {
                    console.log('No data fetched, waiting 10 seconds before next check.');
                    await new Promise(resolve => setTimeout(resolve, 10000));
                    continue;
                }

                results.sort((a, b) => a.block_id - b.block_id);
                const serializedResults = Uint8Array.from(JSON.stringify(results), (char) => char.charCodeAt(0));

                const finalHash = crypto.createHash('sha256').update(serializedResults).digest('hex');
                const firstBlockId = results[0][0];
                const lastBlockId = results[results.length - 1][0];

                const output = {
                    first_block_id: firstBlockId,
                    last_block_id: lastBlockId,
                    final_hash: finalHash,
                    pubkey: pubkey
                };

                const jsonOutput = JSON.stringify(output, null, 2);
                console.log(`\nFinal Output:\n${jsonOutput}`);

                try {
                    const postResponse = await client.post('http://xenblocks.io:5000/store_data', jsonOutput, {
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    });

                    if (postResponse.status >= 200 && postResponse.status < 300) {
                        console.log('Data successfully sent to the server.');

                        fs.appendFileSync('voter.log', jsonOutput + '\n');
                    } else {
                        console.log(`Failed to send data to the server. Status: ${postResponse.status}`);
                    }
                } catch (postError) {
                    console.log(`Failed to send data to the server. Error: ${postError.message}`);
                }
                
            } else {
                console.log('Waiting for hashes to be mined for 10 seconds before next check.');
            }

            await new Promise(resolve => setTimeout(resolve, 10000));
        } catch (error) {
            console.log(error);
            console.error(`Error: ${error.message}`);
            await new Promise(resolve => setTimeout(resolve, 10000));
        }
    }
}

main().catch(console.error);
