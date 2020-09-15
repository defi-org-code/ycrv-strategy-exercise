const Web3 = require("web3");
const web3 = new Web3();

const build = require(`${__dirname}/build/contracts/Strategy.json`);
const ctorArgs = [];

const contract = new web3.eth.Contract(build.abi);
const txData = contract.deploy({
  data: build.bytecode,
  arguments: ctorArgs,
}).encodeABI();

console.log("Go to MyCrypto.com and deploy manually using this payload:\n\n");
console.log(txData);
console.log("\n");