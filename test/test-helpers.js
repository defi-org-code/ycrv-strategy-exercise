const { contract } = require('@openzeppelin/test-environment');

module.exports = {
    fromArtifact: function (baseDir, artifact) {
        const build = require(`${baseDir}/${artifact}.json`);
        return contract.fromABI(build.abi, build.bytecode);
    }
}