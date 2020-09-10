module.exports = {
    compilers: {
        solc: {
          version: "0.6.2"
        }
      },
    outputType: "all",
    compilerOptions: {
        optimizer: {
            enabled: true,
            runs: 999999
        }
    },
    contracts_directory: "./contracts",
    contracts_build_directory: "./build/contracts",
}