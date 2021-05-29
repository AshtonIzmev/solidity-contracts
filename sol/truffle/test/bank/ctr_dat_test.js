const MEDCtr = artifacts.require("MED");
const DATCtr = artifacts.require("DAT");
const FPCtr = artifacts.require("FP");


contract('DAT', async (accounts) => {
 
  let tryCatch = require("../utils/exceptions.js").tryCatch;
  let errTypes = require("../utils/exceptions.js").errTypes;

  let medCtr;
  let datCtr;
  let fpCtr;
  let centralBankAcc = accounts[0];
  let treasureAcc    = accounts[9];

  let issuingBank    = accounts[8];

  let citizen1    = accounts[1];
  let citizen2    = accounts[2];
  let citizen3    = accounts[3];
  let citizen4    = accounts[4];
  let citizen5    = accounts[5];

  before(async() => {
    medCtr = await MEDCtr.new(treasureAcc, 5, 10000, false, 10000000, {from: centralBankAcc});
    fpCtr = await FPCtr.new("Financial Products NFT", "FPNFT", {from: issuingBank});
    datCtr = await DATCtr.new(1000, 2, 25, medCtr.address, fpCtr.address, {from: issuingBank});
    await fpCtr.setApprovalForAll(datCtr.address, true, {from: issuingBank});
    await medCtr.incrementMonth({from: centralBankAcc});
    await medCtr.incrementMonth({from: centralBankAcc});
  });

  it("Public variables should be set by constructor", async() => {
    let tmpDatCtr = await DATCtr.new(1000, 2, 1, medCtr.address, fpCtr.address, {from: issuingBank});
    let minAm = await tmpDatCtr.minimumAmount();
    let dayDur = await tmpDatCtr.dayDuration();
    let intRate = await tmpDatCtr.interestRate();
    assert.equal(minAm, 1000, "Minimum amount for the DAT is set");
    assert.equal(dayDur, 2, "Day duration for the DAT is set");
    assert.equal(intRate, 1, "Interest rate for the DAT is set");
  });

  it("Suscribe DAT fails because ... minimum Amount", async() => {
    let tmpMedCtr = await MEDCtr.new(treasureAcc, 5, 10000, false, 10000000, {from: centralBankAcc});
    let tmpFpCtr = await FPCtr.new("Financial Products NFT", "FPNFT", {from: issuingBank});
    let tmpDatCtr = await DATCtr.new(1000, 2, 1, tmpMedCtr.address, tmpFpCtr.address, {from: issuingBank});
    await tmpMedCtr.incrementMonth({from: centralBankAcc});
    await tmpMedCtr.incrementMonth({from: centralBankAcc});
    await tmpMedCtr.updateAccount(citizen1, {from: citizen1});
    await tmpMedCtr.approve(tmpDatCtr.address, 1002, {from: citizen1});
    await tmpFpCtr.setApprovalForAll(tmpDatCtr.address, true, {from: issuingBank});
    await tryCatch(tmpDatCtr.subscribe(999, {from: citizen1}), errTypes.revert);
  });

  it("Suscribe DAT fails because ... no allowance", async() => {
    let tmpMedCtr = await MEDCtr.new(treasureAcc, 5, 10000, false, 10000000, {from: centralBankAcc});
    let tmpFpCtr = await FPCtr.new("Financial Products NFT", "FPNFT", {from: issuingBank});
    let tmpDatCtr = await DATCtr.new(1000, 2, 1, tmpMedCtr.address, tmpFpCtr.address, {from: issuingBank});
    await tmpMedCtr.incrementMonth({from: centralBankAcc});
    await tmpMedCtr.incrementMonth({from: centralBankAcc});
    await tmpMedCtr.updateAccount(citizen1, {from: citizen1});
    await tmpFpCtr.setApprovalForAll(tmpDatCtr.address, true, {from: issuingBank});
    await tryCatch(tmpDatCtr.subscribe(1001, {from: citizen1}), errTypes.revert);
  });

  it("Suscribe DAT fails because ... insufficient allowance", async() => {
    let tmpMedCtr = await MEDCtr.new(treasureAcc, 5, 10000, false, 10000000, {from: centralBankAcc});
    let tmpFpCtr = await FPCtr.new("Financial Products NFT", "FPNFT", {from: issuingBank});
    let tmpDatCtr = await DATCtr.new(1000, 2, 1, tmpMedCtr.address, tmpFpCtr.address, {from: issuingBank});
    await tmpMedCtr.incrementMonth({from: centralBankAcc});
    await tmpMedCtr.incrementMonth({from: centralBankAcc});
    await tmpMedCtr.updateAccount(citizen1, {from: citizen1});
    await tmpMedCtr.approve(tmpDatCtr.address, 999, {from: citizen1});
    await tmpFpCtr.setApprovalForAll(tmpDatCtr.address, true, {from: issuingBank});
    await tryCatch(tmpDatCtr.subscribe(1001, {from: citizen1}), errTypes.revert);
  });

  it("Suscribe DAT fails because ... non approuved contract address", async() => {
    let tmpMedCtr = await MEDCtr.new(treasureAcc, 5, 10000, false, 10000000, {from: centralBankAcc});
    let tmpFpCtr = await FPCtr.new("Financial Products NFT", "FPNFT", {from: issuingBank});
    let tmpDatCtr = await DATCtr.new(1000, 2, 1, tmpMedCtr.address, tmpFpCtr.address, {from: issuingBank});
    await tmpMedCtr.incrementMonth({from: centralBankAcc});
    await tmpMedCtr.incrementMonth({from: centralBankAcc});
    await tmpMedCtr.updateAccount(citizen1, {from: citizen1});
    await tmpMedCtr.approve(tmpDatCtr.address, 1002, {from: citizen1});
    await tryCatch(tmpDatCtr.subscribe(1001, {from: citizen1}), errTypes.revert);
  });

  it("Suscribe DAT succeeds", async() => {
    await medCtr.updateAccount(citizen1, {from: citizen1});
    let bal11 = await medCtr.balanceOf(citizen1);
    let bal12 = await medCtr.balanceOf(datCtr.address);
    await medCtr.approve(datCtr.address, 1002, {from: citizen1});
    await datCtr.subscribe(1001, {from: citizen1});
    let bal21 = await medCtr.balanceOf(citizen1);
    let bal22 = await medCtr.balanceOf(datCtr.address);
    let tokId = await fpCtr.getCurrentTokenId();
    let owner = await fpCtr.ownerOf(tokId);
    let subsLen = await datCtr.getSubscriptionLength();
    let prod = await datCtr.getProduct(tokId);
    assert.equal(bal11 - bal21, 1001, "Correct amount removed from account");
    assert.equal(bal22 - bal12, 1001, "Correct amount added to account");
    assert.equal(owner, citizen1, "Token has been created and ownership is correct");
    assert.equal(subsLen, 1, "One subscription registered");
    assert.equal(prod[1].toNumber(), 1001, "Correct amount in subscribed DAT");
  });

  it("Cancel someone else DAT", async() => {
    await medCtr.approve(datCtr.address, 1002, {from: citizen1});
    await datCtr.subscribe(1001, {from: citizen1});
    let tokId = await fpCtr.getCurrentTokenId();
    await tryCatch(datCtr.cancelDat(tokId, {from: citizen2}), errTypes.revert);
  });

  it("Cancel my DAT", async() => {
    let subsLen1 = await datCtr.getSubscriptionLength();
    await medCtr.updateAccount(citizen2, {from: citizen2});
    let bal11 = await medCtr.balanceOf(citizen2);
    await medCtr.approve(datCtr.address, 1002, {from: citizen2});
    await datCtr.subscribe(1001, {from: citizen2});
    let tokId = await fpCtr.getCurrentTokenId();
    await datCtr.cancelDat(tokId, {from: citizen2});
    await tryCatch(fpCtr.ownerOf(tokId), errTypes.revert);
    let bal12 = await medCtr.balanceOf(citizen2);
    let subsLen2 = await datCtr.getSubscriptionLength();
    assert.equal(bal11-bal12, 0, "Balance initial amount after cancelling");
    assert.equal(subsLen2 - subsLen1, 0, "No additional subscription");
  });

  it("Pay my DAT early should not be possible", async() => {
    await medCtr.updateAccount(citizen3, {from: citizen3});
    await medCtr.approve(datCtr.address, 1002, {from: citizen3});
    await datCtr.subscribe(1001, {from: citizen3});
    let tokId = await fpCtr.getCurrentTokenId();
    await tryCatch(datCtr.payDat(tokId, {from: citizen3}), errTypes.revert);
  });

  it("Successfuly pay my DAT", async() => {
    let bal11 = await medCtr.balanceOf(citizen3);
    await medCtr.updateAccount(citizen3, {from: citizen3});
    await medCtr.approve(datCtr.address, 2002, {from: citizen3});
    await datCtr.subscribe(1500, {from: citizen3});
    let tokId = await fpCtr.getCurrentTokenId();
    await medCtr.incrementDay({from: centralBankAcc});
    await medCtr.incrementDay({from: centralBankAcc});
    await medCtr.incrementDay({from: centralBankAcc});
    await datCtr.payDat(tokId, {from: citizen3});
    let bal12 = await medCtr.balanceOf(citizen3);
    await tryCatch(fpCtr.ownerOf(tokId), errTypes.revert);
    assert.equal(bal12.toNumber()-bal11.toNumber(), 368, "Interest rates have been paid minus MED taxes");
  });



})