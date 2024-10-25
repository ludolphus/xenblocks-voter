# Xenblocks lightnode (NodeJS version)
Voter fetches records from XENBLOCKs ledger and runs verification in CPU 

## Installation instructions

Install NodeJS, see https://nodejs.org/ for instructions for your OS (macOS, Linux and Windows supported). Tested with NodeJS version 18 and 20.

Open a terminal (or command prompt on Windows). Anywhere a line starts with $ do not type that $, only the command and arguments after it ;).

Check if nodejs is installed:

$ node --version

Clone the repo:

$ git clone https://github.com/ludolphus/xenblocks-voter

$ cd xenblocks-voter

Install the voter dependencies:

$ npm install

## Run lightnode

$ node voter.js

During initialization, the lightnode will create id.json file with your private key so you are be identified among other nodes, this is also where you will receive your future rewards. If you want to reuse an existing Solana wallet, copy an existing id.json file to the lightnode directoy.

As your lightnode runs, it will submit computed data to xenblocks consensus ledger, which can be accessed here:

http://xenminer.mooo.com:5000/show_data

The lightnode will also write into a log file (voter.log) in the same directory.

## Oneliner install (Linux)

Run this just once on Ubuntu/Debian like Linux systems:

$ (command -v git >/dev/null 2>&1 || sudo apt install -y git) && (command -v node >/dev/null 2>&1 || sudo apt install -y nodejs) && git clone https://github.com/ludolphus/xenblocks-voter && cd xenblocks-voter && npm install

After it completes run the voter with:

$ node voter.js

## Tested machines

On a MacBook Pro Intel 2,6 GHz 6-Core Intel Core i7 it takes about 2 seconds to verify 100 hashes.

On a RaspberryPi 4 ARMv7 Processor it takes about 23 seconds to verify 100 hashes. This is fast enough since it takes about 1 second for a new xenblock to be found, so at least every 100 seconds it needs to do the verification.

## Web based voter

Also available: the web based xenblocks voter https://bulkminter.com/xenblocks-webvoter/
The web voter creates a new wallet in your browser. The private key is stored in localStorage and can be easily retrieved using the website. Because of the way the voter backend is setup (not using ssl) the web voter uses a proxy on bulkminter.com to relay traffic to the voter backend. It concerns these two endpoints: http://xenblocks.io:4447/getblocks/lastblock and http://xenblocks.io:5000/show_data/store_data

## Acknowledgements

This version of the xenblocks lightnode is based on the original created by Jack Levin at https://github.com/jacklevin74/voter
