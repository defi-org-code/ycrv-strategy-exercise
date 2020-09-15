module.exports = {
  compilers: {
      solc: {
        version: "0.6.2",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200
          }
        }
      }
    },
  outputType: "all",
  contracts_directory: "./contracts",
  contracts_build_directory: "./build/contracts",
}