const {expect} = require("chai");

const {accounts, contract, web3} = require("@openzeppelin/test-environment");
const {constants, expectEvent, expectRevert, BN} = require("@openzeppelin/test-helpers");
const bn = (n, exponent) => {
    if (!exponent) return new BN(n);
    else return new BN(n).mul(new BN(10).pow(new BN(exponent)));
};
const expectAndPrint = (a) => {
    console.log(a.toString());
    return expect(a);
};

const Strategy = contract.fromArtifact("Strategy");
const IERC20 = contract.fromArtifact("IERC20");

const stableBankAddress = "0xFfec0067F5a79CFf07527f63D83dD5462cCf8BA4";
const ycrvBankAddress = "0xA07247b6aF51baf688D2Da732f16485fF2efc8F6";

describe("Strategy", () => {
    const setup = async ({} = {}) => {
        const strategy = await Strategy.new();

        const dai = await IERC20.at("0x6B175474E89094C44Da98b954EedeAC495271d0F");
        await dai.transfer(accounts[0], bn(10000, 18), {from: stableBankAddress});
        await dai.approve(strategy.address, bn(10000, 18), {from: accounts[0]});

        const usdt = await IERC20.at("0xdAC17F958D2ee523a2206206994597C13D831ec7");
        await usdt.transfer(accounts[0], bn(10000, 6), {from: stableBankAddress});
        await usdt.approve(strategy.address, bn(10000, 6), {from: accounts[0]});

        const ycrv = await IERC20.at("0xdF5e0e81Dff6FAF3A7e52BA697820c5e32D806A8");
        await ycrv.transfer(accounts[0], bn(10000, 18), {from: ycrvBankAddress});
        await ycrv.approve(strategy.address, bn(10000, 18), {from: accounts[0]});

        return {
            strategy,
            ycrv,
            usdt,
        };
    };

    it("deposit ycrv", async () => {
        const {strategy, ycrv, usdt} = await setup();

        console.log("\n- start ycrv flow");
        expectAndPrint(await strategy.totalSupply()).to.be.bignumber.eq(bn(0));
        expectAndPrint(await strategy.ycrvInGauge()).to.be.bignumber.eq(bn(0));
        expectAndPrint(await strategy.localYcrv()).to.be.bignumber.eq(bn(0));
        expectAndPrint(await strategy.totalYcrv()).to.be.bignumber.eq(bn(0));
        expectAndPrint(await ycrv.balanceOf(accounts[0])).to.be.bignumber.eq(bn(10000, 18));

        await strategy.deposit(bn(10000, 18), bn(0), bn(0), bn(0), bn(0), {from: accounts[0]});

        console.log("\n- after ycrv deposit");
        expectAndPrint(await strategy.totalSupply()).to.be.bignumber.eq(bn(10000, 18));
        expectAndPrint(await strategy.ycrvInGauge()).to.be.bignumber.eq(bn(10000, 18));
        expectAndPrint(await strategy.localYcrv()).to.be.bignumber.eq(bn(0));
        expectAndPrint(await strategy.totalYcrv()).to.be.bignumber.eq(bn(10000, 18));
        expectAndPrint(await strategy.ycrvPerOneShare()).to.be.bignumber.eq(bn(1, 18));
        expectAndPrint(await strategy.balanceOf(accounts[0])).to.be.bignumber.eq(bn(10000, 18));
        expectAndPrint(await ycrv.balanceOf(accounts[0])).to.be.bignumber.eq(bn(0));

        await strategy.compound();

        console.log("\n- after compound");
        expectAndPrint(await strategy.totalSupply()).to.be.bignumber.eq(bn(10000, 18));
        expectAndPrint(await strategy.ycrvInGauge()).to.be.bignumber.gt(bn(10000, 18));
        expectAndPrint(await strategy.localYcrv()).to.be.bignumber.eq(bn(0));
        expectAndPrint(await strategy.totalYcrv()).to.be.bignumber.gt(bn(10000, 18));
        expectAndPrint(await strategy.ycrvPerOneShare()).to.be.bignumber.gt(bn(1, 18));
        expectAndPrint(await strategy.balanceOf(accounts[0])).to.be.bignumber.eq(bn(10000, 18));
        expectAndPrint(await ycrv.balanceOf(accounts[0])).to.be.bignumber.eq(bn(0));

        await strategy.withdraw(bn(5000, 18), {from: accounts[0]});

        console.log("\n- after withdraw half");
        expectAndPrint(await strategy.totalSupply()).to.be.bignumber.eq(bn(5000, 18));
        expectAndPrint(await strategy.ycrvInGauge()).to.be.bignumber.lt(bn(10000, 18));
        expectAndPrint(await strategy.localYcrv()).to.be.bignumber.eq(bn(0));
        expectAndPrint(await strategy.totalYcrv()).to.be.bignumber.lt(bn(10000, 18));
        expectAndPrint(await strategy.ycrvPerOneShare()).to.be.bignumber.gt(bn(1, 18));
        expectAndPrint(await strategy.balanceOf(accounts[0])).to.be.bignumber.eq(bn(5000, 18));
        expectAndPrint(await ycrv.balanceOf(accounts[0])).to.be.bignumber.gt(bn(5000, 18));
    });

    it("deposit usdt", async () => {
        const {strategy, ycrv, usdt} = await setup();

        console.log("\n- start usdt flow");
        expectAndPrint(await strategy.totalSupply()).to.be.bignumber.eq(bn(0));
        expectAndPrint(await strategy.ycrvInGauge()).to.be.bignumber.eq(bn(0));
        expectAndPrint(await strategy.localYcrv()).to.be.bignumber.eq(bn(0));
        expectAndPrint(await strategy.totalYcrv()).to.be.bignumber.eq(bn(0));
        expectAndPrint(await usdt.balanceOf(accounts[0])).to.be.bignumber.eq(bn(10000, 6));

        await strategy.deposit(bn(0), bn(0), bn(0), bn(10000, 6), bn(0), {from: accounts[0]});

        console.log("\n- after usdt deposit");
        expectAndPrint(await strategy.totalSupply()).to.be.bignumber.gt(bn(9000, 18));
        expectAndPrint(await strategy.ycrvInGauge()).to.be.bignumber.gt(bn(9000, 18));
        expectAndPrint(await strategy.localYcrv()).to.be.bignumber.eq(bn(0));
        expectAndPrint(await strategy.totalYcrv()).to.be.bignumber.gt(bn(9000, 18));
        expectAndPrint(await strategy.ycrvPerOneShare()).to.be.bignumber.eq(bn(1, 18));
        expectAndPrint(await strategy.balanceOf(accounts[0])).to.be.bignumber.gt(bn(9000, 18));
        expectAndPrint(await usdt.balanceOf(accounts[0])).to.be.bignumber.eq(bn(0));

        await strategy.compound();

        console.log("\n- after compound");
        expectAndPrint(await strategy.totalSupply()).to.be.bignumber.gt(bn(9000, 18));
        expectAndPrint(await strategy.ycrvInGauge()).to.be.bignumber.gt(bn(9000, 18));
        expectAndPrint(await strategy.localYcrv()).to.be.bignumber.eq(bn(0));
        expectAndPrint(await strategy.totalYcrv()).to.be.bignumber.gt(bn(9000, 18));
        expectAndPrint(await strategy.ycrvPerOneShare()).to.be.bignumber.gt(bn(1, 18));
        expectAndPrint(await strategy.balanceOf(accounts[0])).to.be.bignumber.gt(bn(9000, 18));
        expectAndPrint(await usdt.balanceOf(accounts[0])).to.be.bignumber.eq(bn(0));

        await strategy.withdraw(bn(5000, 18), {from: accounts[0]});

        console.log("\n- after withdraw half");
        expectAndPrint(await strategy.totalSupply()).to.be.bignumber.gt(bn(4000, 18));
        expectAndPrint(await strategy.ycrvInGauge()).to.be.bignumber.lt(bn(5000, 18));
        expectAndPrint(await strategy.localYcrv()).to.be.bignumber.eq(bn(0));
        expectAndPrint(await strategy.totalYcrv()).to.be.bignumber.lt(bn(5000, 18));
        expectAndPrint(await strategy.ycrvPerOneShare()).to.be.bignumber.gt(bn(1, 18));
        expectAndPrint(await strategy.balanceOf(accounts[0])).to.be.bignumber.gt(bn(1000, 18));
        expectAndPrint(await ycrv.balanceOf(accounts[0])).to.be.bignumber.gt(bn(5000, 18));
    });
});
