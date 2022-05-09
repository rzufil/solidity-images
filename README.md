# solidity-images

# Description
An image showcase site where artists can upload images and receive tips in ETH. Images are uploaded to IPFS and tips are sent to the image owner address. The contract owner has the ability to remove any image.

- Smart contract written in Solidity
- Local Ethereum blockchain using Ganache
- Truffle to compile and migrate the contract
- Frontend using Web3.js, React Truffle Box, and React
- IPFS for image upload

# Requirements
- [Ganache](https://trufflesuite.com/ganache/index.html)
- [Node.js](https://nodejs.org/en/)
- [NPM](https://www.npmjs.com/)
- MetaMask

# Installation
- Clone the repo
    - `git clone https://github.com/rzufil/solidity-images`
- Install Truffle globally
    - `npm install -g truffle`
- Install contract dependencies
    - `npm install`
- Open Ganache and create a local Ethereum blockchain
- Import test accounts to the Ganache network on MetaMask
- Compile and migrate the contract
    - `truffle compile`
    - `truffle migrate`
- Install client dependencies
    - `cd client`
    - `npm install`
- Start frontend
    - `npm start`

# Tests
- To test the contract run the following command at the root folder:
    - `truffle test`