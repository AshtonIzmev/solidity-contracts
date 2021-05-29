const MEDCtr = artifacts.require("MED");
const FPCtr = artifacts.require("FP");
const MPCtr = artifacts.require("Marketplace");
const DATCtr = artifacts.require("DAT");


contract('Marketplace', async (accounts) => {
 
  let tryCatch = require("../utils/exceptions.js").tryCatch;
  let errTypes = require("../utils/exceptions.js").errTypes;

  let medCtr;
  let fpCtr;
  let datCtr;
  let mpCtr;
  let centralBankAcc = accounts[0];
  let treasureAcc    = accounts[9];

  let issuingBank    = accounts[8];

  let citizen1    = accounts[1];
  let citizen2    = accounts[2];
  let citizen3    = accounts[3];
  let citizen4    = accounts[4];
  let citizen5    = accounts[5];

  beforeEach(async() => {
    medCtr = await MEDCtr.new(treasureAcc, 5, 10000, false, 10000000, {from: centralBankAcc});
    fpCtr = await FPCtr.new("Financial Products NFT", "FPNFT", {from: issuingBank});
    datCtr = await DATCtr.new(100, 2, 25, medCtr.address, fpCtr.address, {from: issuingBank});
    mpCtr = await MPCtr.new(10, 3, medCtr.address, fpCtr.address, {from: issuingBank})
    await fpCtr.setApprovalForAll(datCtr.address, true, {from: issuingBank});
    await medCtr.incrementMonth({from: centralBankAcc});
    await medCtr.incrementMonth({from: centralBankAcc});

    await medCtr.updateAccount(citizen1, {from: citizen1});
    await medCtr.approve(datCtr.address, 1002, {from: citizen1});
    await datCtr.subscribe(200, {from: citizen1});
    await datCtr.subscribe(212, {from: citizen1});

    await medCtr.updateAccount(citizen2, {from: citizen2});
    await medCtr.approve(datCtr.address, 1004, {from: citizen2});
    await datCtr.subscribe(400, {from: citizen2});
    await datCtr.subscribe(469, {from: citizen2});

    await medCtr.updateAccount(citizen3, {from: citizen3});
    await medCtr.approve(datCtr.address, 1004, {from: citizen3});
    await datCtr.subscribe(311, {from: citizen3});
  });

  it("Public variables should be set by constructor", async() => {
    let tmpMpCtr = await MPCtr.new(12, 8, medCtr.address, fpCtr.address, {from: issuingBank})
    let sf = await tmpMpCtr.sellFee();
    let wf = await tmpMpCtr.withdrawFee();
    assert.equal(sf, 12, "Sell fees are set");
    assert.equal(wf, 8, "Withdraw fees are set");
  });

  it("Cannot sell ... no allowance for the offer", async() => {
    await medCtr.updateAccount(citizen3, {from: citizen3});
    let tokId = await datCtr.getSubscription(4);
    let owner = await fpCtr.ownerOf(tokId);
    assert.equal(owner, citizen3, "Citizen 3 is the owner"); 
    await tryCatch(mpCtr.sell(tokId, 201, {from: citizen3}), errTypes.revert);
  });

  it("Cannot sell ... not the owner", async() => {
    await medCtr.updateAccount(citizen3, {from: citizen3});
    let tokId = await datCtr.getSubscription(4);
    let owner = await fpCtr.ownerOf(tokId);
    assert.equal(owner, citizen3, "Citizen 3 is the owner"); 
    await fpCtr.approve(mpCtr.address, tokId, {from: citizen3}); 
    await tryCatch(mpCtr.sell(tokId, 201, {from: citizen4}), errTypes.revert); // citizen3 is the owner
  });

  it("Cannot sell ... price must be more than the selling fees", async() => {
    await medCtr.updateAccount(citizen3, {from: citizen3});
    let tokId = await datCtr.getSubscription(4);
    let owner = await fpCtr.ownerOf(tokId);
    assert.equal(owner, citizen3, "Citizen 3 is the owner"); 
    await fpCtr.approve(mpCtr.address, tokId, {from: citizen3}); 
    await tryCatch(mpCtr.sell(tokId, 5, {from: citizen3}), errTypes.revert);
  });

  it("Cannot withdraw ... not the owner", async() => {
    await medCtr.updateAccount(citizen3, {from: citizen3});
    await medCtr.approve(mpCtr.address, 1004, {from: citizen3});

    let tokId = await datCtr.getSubscription(4);
    let owner = await fpCtr.ownerOf(tokId);
    assert.equal(owner, citizen3, "Citizen 3 is the owner"); 
    await fpCtr.approve(mpCtr.address, tokId, {from: citizen3}); 
    await mpCtr.sell(tokId, 201, {from: citizen3});
    await tryCatch(mpCtr.withdraw(tokId, {from: citizen4}), errTypes.revert);
  });

  it("Successfull withdraw", async() => {
    await medCtr.updateAccount(citizen3, {from: citizen3});
    await medCtr.approve(mpCtr.address, 1004, {from: citizen3});

    let tokId = await datCtr.getSubscription(4);
    let owner = await fpCtr.ownerOf(tokId);
    assert.equal(owner, citizen3, "Citizen 3 is the owner"); 
    await fpCtr.approve(mpCtr.address, tokId, {from: citizen3}); 
    await mpCtr.sell(tokId, 201, {from: citizen3});
    mpCtr.withdraw(tokId, {from: citizen3});
  });

  it("Successful FP sell and buy", async() => {
    await medCtr.updateAccount(citizen5, {from: citizen5});

    let tokId = await datCtr.getSubscription(0);
    let tf1 = await mpCtr.totalFees();
    let bal11 = await medCtr.balanceOf(citizen1);
    let bal15 = await medCtr.balanceOf(citizen5);
    assert.equal(tf1, 0, "No fees collected so far");
    assert.equal(bal11.toNumber(), 19588, "No fees collected so far");
    assert.equal(bal15.toNumber(), 20000, "No fees collected so far");

    await fpCtr.approve(mpCtr.address, tokId, {from: citizen1});
    await mpCtr.sell(tokId, 201, {from: citizen1});
    let owner = await fpCtr.ownerOf(tokId);
    let tf2 = await mpCtr.totalFees();
    let bal21 = await medCtr.balanceOf(citizen1);
    let bal25 = await medCtr.balanceOf(citizen5);
    let offerLen = await mpCtr.getOfferLength();
    assert.equal(owner, mpCtr.address, "Temporary owner is the Marketplace Contract");
    assert.equal(tf2, 0, "No fees collected so far");
    assert.equal(bal21.toNumber(), 19588, "Allowance have been given but no balance mvt");
    assert.equal(bal25.toNumber(), 20000, "No payment so far");
    assert.equal(offerLen.toNumber(), 1, "One offer made");

    await medCtr.approve(mpCtr.address, 500, {from: citizen5});
    await mpCtr.buy(tokId, {from: citizen5});
    let bal31 = await medCtr.balanceOf(citizen1);
    let bal35 = await medCtr.balanceOf(citizen5);
    let tf3 = await mpCtr.totalFees();
    let newOwner = await fpCtr.ownerOf(tokId);
    let offerLen2 = await mpCtr.getOfferLength();
    assert.equal(newOwner, citizen5, "Citizen 5 successfully bought the token");
    assert.equal(tf3.toNumber(), 10, "Taken fees from successful sell");
    assert.equal(bal31.toNumber(), 19779, "Citizen 1 got his money back minus fees");
    assert.equal(bal35.toNumber(), 19799, "Citien5 paid");
    assert.equal(offerLen2.toNumber(), 0, "No more offer");
  });

})