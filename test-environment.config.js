// test-environment.config.js

module.exports = {
    accounts: {
        amount: 10,
        ether: 100,
    },
    contracts: {
        type: 'truffle',
        defaultGas: 10e6,
        defaultGasPrice: 1,
        artifactsDir: 'build/contracts',
    },
    setupProvider: async (baseProvider) => baseProvider,
    coverage: false,
    node: {
        allowUnlimitedContractSize: false,
        gasLimit: 10e6,
        gasPrice: 1,
    },
};