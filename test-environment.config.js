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
        fork: "http://18.189.176.243:8545",
        unlocked_accounts: ["0xFfec0067F5a79CFf07527f63D83dD5462cCf8BA4", "0xA07247b6aF51baf688D2Da732f16485fF2efc8F6"]
    },
};