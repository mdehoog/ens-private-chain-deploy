# ens-private-chain-deploy

Helper repo for deploying [ENS contracts](https://github.com/ensdomains/ens-contracts) to a private chain.

This is a little different from the [official private chain deployment docs](https://docs.ens.domains/deploying-ens-on-a-private-chain) in that it's deploying the `.eth` TLD and targeting compatibility with the official [ENS app](https://github.com/ensdomains/ens-app).

It also pins the `ens-contracts` npm package version to `0.0.7` for compatibility with the current version of https://github.com/ensdomains/ens-app (at time of writing).

### Contract deploy instructions

If desired, change the default gas price / gas parameters in `hardhat.config.js`.

Run the following, substituting the environment variable values as needed:

```bash
export WALLET_PRIVATE_KEY=<some private key>
export JSON_RPC_URL=https://url.of.your.eth.node:8545

npm install
npm run build
npm run deploy
```
