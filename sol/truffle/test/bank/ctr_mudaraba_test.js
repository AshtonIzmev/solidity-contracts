const MEDCtr = artifacts.require("MED");
const FPCtr = artifacts.require("FP");
const MudarabaCtr = artifacts.require("Mudaraba");


contract('Mudaraba', async (accounts) => {
 
  let tryCatch = require("../utils/exceptions.js").tryCatch;
  let errTypes = require("../utils/exceptions.js").errTypes;

  let medCtr;
  let mudarabaCtr;
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
    let desc = "Description";
    mudarabaCtr = await MudarabaCtr.new(desc, "1234567", 10000, medCtr.address, fpCtr.address, {from: citizen1});
    await medCtr.incrementMonth({from: centralBankAcc});
    await medCtr.incrementMonth({from: centralBankAcc});
    await medCtr.updateAccount(citizen1, {from: citizen1});
    await medCtr.updateAccount(citizen2, {from: citizen1});
    await medCtr.updateAccount(citizen3, {from: citizen1});
  });

  it("Public variables should be set by constructor", async() => {
    let desc = "Description";
    let tmpMudarabaCtr = await MudarabaCtr.new(desc, "12345", 10000, medCtr.address, fpCtr.address, {from: citizen1});
    let description = await tmpMudarabaCtr.description();
    let ice = await tmpMudarabaCtr.ice();
    let capitalCap = await tmpMudarabaCtr.capitalCap();
    assert.equal(description, desc, "Description is set");
    assert.equal(ice, 12345, "ICE is set");
    assert.equal(capitalCap, 10000, "Capital Cap is set");
  });

  it("Cannot subscribe ... no FP allowance", async() => {
    await medCtr.approve(mudarabaCtr.address, 1000, {from: citizen2});
    await tryCatch(mudarabaCtr.subscribe(1000, {from: citizen2}), errTypes.revert);
  });

  it("Cannot subscribe ... no MED allowance", async() => {
    await fpCtr.setApprovalForAll(mudarabaCtr.address, true, {from: issuingBank});
    await tryCatch(mudarabaCtr.subscribe(1000, {from: citizen3}), errTypes.revert);
  });

  it("Suscribe Mudaraba Succeeds", async() => {
    let bal11 = await medCtr.balanceOf(citizen1);
    let bal12 = await medCtr.balanceOf(mudarabaCtr.address);
    let totalCapital1 = await mudarabaCtr.totalCapital();
    let subsLen1 = await mudarabaCtr.getSubscriptionLength();
    await fpCtr.setApprovalForAll(mudarabaCtr.address, true, {from: issuingBank});
    await medCtr.approve(mudarabaCtr.address, 1000, {from: citizen1});
    await mudarabaCtr.subscribe(1000, {from: citizen1});
    let totalCapital2 = await mudarabaCtr.totalCapital();
    let bal21 = await medCtr.balanceOf(citizen1);
    let bal22 = await medCtr.balanceOf(mudarabaCtr.address);
    let tokId = await fpCtr.getCurrentTokenId();
    let prod = await mudarabaCtr.getProduct(tokId);
    let owner = await fpCtr.ownerOf(tokId);
    let subsLen2 = await mudarabaCtr.getSubscriptionLength();
    assert.equal(bal11 - bal21, 1000, "Correct amount removed from account");
    assert.equal(bal22 - bal12, 1000, "Correct amount added to account");
    assert.equal(owner, citizen1, "Token has been created and ownership is correct");
    assert.equal(subsLen2 - subsLen1, 1, "One subscription registered");
    assert.equal(totalCapital2 - totalCapital1, 1000, "Capital cap has increased with deposit");
    assert.equal(prod[1], 1000, "Added amount");
  });

  it("Add funds to Mudaraba Succeeds", async() => {
    let bal11 = await medCtr.balanceOf(citizen1);
    let totalCapital1 = await mudarabaCtr.totalCapital();
    let subsLen1 = await mudarabaCtr.getSubscriptionLength();
    await fpCtr.setApprovalForAll(mudarabaCtr.address, true, {from: issuingBank});
    await medCtr.approve(mudarabaCtr.address, 1500, {from: citizen1});
    await mudarabaCtr.subscribe(1000, {from: citizen1});
    let tokId = await fpCtr.getCurrentTokenId();
    await tryCatch(mudarabaCtr.addFund(tokId, 500, {from: citizen3}), errTypes.revert);
    await mudarabaCtr.addFund(tokId, 500, {from: citizen1});
    let prod = await mudarabaCtr.getProduct(tokId);
    let subsLen2 = await mudarabaCtr.getSubscriptionLength();
    let bal21 = await medCtr.balanceOf(citizen1);
    let totalCapital2 = await mudarabaCtr.totalCapital();
    assert.equal(bal11 - bal21, 1500, "Correct amount removed from account");
    assert.equal(subsLen2 - subsLen1, 1, "One subscription registered");
    assert.equal(totalCapital2 - totalCapital1, 1500, "Capital cap has increased with deposit");
    assert.equal(prod[1], 1500, "Added amount");
  });

  it("Withdraw funds from Mudaraba", async() => {
    let bal11 = await medCtr.balanceOf(citizen1);
    let totalCapital1 = await mudarabaCtr.totalCapital();
    let subsLen1 = await mudarabaCtr.getSubscriptionLength();
    await fpCtr.setApprovalForAll(mudarabaCtr.address, true, {from: issuingBank});
    await medCtr.approve(mudarabaCtr.address, 1500, {from: citizen1});
    await mudarabaCtr.subscribe(1000, {from: citizen1});
    let tokId = await fpCtr.getCurrentTokenId();
    await tryCatch(mudarabaCtr.withdrawFund(tokId, 500, {from: citizen3}), errTypes.revert);
    await mudarabaCtr.withdrawFund(tokId, 500, {from: citizen1});
    let prod = await mudarabaCtr.getProduct(tokId);
    let subsLen2 = await mudarabaCtr.getSubscriptionLength();
    let bal21 = await medCtr.balanceOf(citizen1);
    let totalCapital2 = await mudarabaCtr.totalCapital();
    assert.equal(bal11 - bal21, 500, "Correct amount removed from account");
    assert.equal(subsLen2 - subsLen1, 1, "One subscription registered");
    assert.equal(totalCapital2 - totalCapital1, 500, "Total capital has increased with deposit");
    assert.equal(prod[1], 500, "Removed amount from product");
  });

  it("Withdraw all funds from Mudaraba", async() => {
    let subsLen1 = await mudarabaCtr.getSubscriptionLength();
    await fpCtr.setApprovalForAll(mudarabaCtr.address, true, {from: issuingBank});
    await medCtr.approve(mudarabaCtr.address, 1500, {from: citizen1});
    await mudarabaCtr.subscribe(1000, {from: citizen1});
    let tokId = await fpCtr.getCurrentTokenId();
    await mudarabaCtr.withdrawFund(tokId, 1000, {from: citizen1});
    let prod = await mudarabaCtr.getProduct(tokId);
    await tryCatch(fpCtr.ownerOf(tokId), errTypes.revert);
    let subsLen2 = await mudarabaCtr.getSubscriptionLength();
    assert.equal(subsLen2 - subsLen1, 0, "No subscription registered");
    assert.equal(prod[1], 0, "Empty product");
  });

  it("Distribute mudaraba profit", async() => {
    let tmpMudarabaCtr = await MudarabaCtr.new("A", "12345", 10000, medCtr.address, fpCtr.address, 
      {from: citizen5});
    await medCtr.updateAccount(citizen5, {from: citizen1});
    
    await fpCtr.setApprovalForAll(tmpMudarabaCtr.address, true, {from: issuingBank});
    await medCtr.approve(tmpMudarabaCtr.address, 1500, {from: citizen1});
    await medCtr.approve(tmpMudarabaCtr.address, 1500, {from: citizen2});
    await medCtr.approve(tmpMudarabaCtr.address, 1500, {from: citizen3});
    await medCtr.approve(tmpMudarabaCtr.address, 1500, {from: citizen5});

    await tmpMudarabaCtr.subscribe(100, {from: citizen1});
    await tmpMudarabaCtr.subscribe(200, {from: citizen2});
    await tmpMudarabaCtr.subscribe(300, {from: citizen3});

    await tryCatch(tmpMudarabaCtr.distributeProfit(1000, {from: citizen4}), errTypes.revert);
    await tmpMudarabaCtr.distributeProfit(1000, {from: citizen5});
    let totalCapital = await tmpMudarabaCtr.totalCapital();
    let tokId1 = await tmpMudarabaCtr.getSubscription(0);
    let tokId2 = await tmpMudarabaCtr.getSubscription(1);
    let tokId3 = await tmpMudarabaCtr.getSubscription(2);
    let prod1 = await tmpMudarabaCtr.getProduct(tokId1);
    let prod2 = await tmpMudarabaCtr.getProduct(tokId2);
    let prod3 = await tmpMudarabaCtr.getProduct(tokId3);
    // rounding issue here => should be 1600
    assert.equal(totalCapital.toNumber(), 1599, "Total capital has been added profits");
    assert.equal(prod1[1].toNumber(), 266, "Product 1 after profit");
    assert.equal(prod2[1].toNumber(), 533, "Product 2 after profit");
    assert.equal(prod3[1].toNumber(), 800, "Product 3 after profit");
  });

  it("Take mudaraba loss", async() => {
    let tmpMudarabaCtr = await MudarabaCtr.new("A", "12345", 10000, medCtr.address, fpCtr.address, 
      {from: citizen5});
    await medCtr.updateAccount(citizen5, {from: citizen1});
    
    await fpCtr.setApprovalForAll(tmpMudarabaCtr.address, true, {from: issuingBank});
    await medCtr.approve(tmpMudarabaCtr.address, 1500, {from: citizen1});
    await medCtr.approve(tmpMudarabaCtr.address, 1500, {from: citizen2});
    await medCtr.approve(tmpMudarabaCtr.address, 1500, {from: citizen3});
    await medCtr.approve(tmpMudarabaCtr.address, 1500, {from: citizen5});

    await tmpMudarabaCtr.subscribe(100, {from: citizen1});
    await tmpMudarabaCtr.subscribe(200, {from: citizen2});
    await tmpMudarabaCtr.subscribe(300, {from: citizen3});

    await tryCatch(tmpMudarabaCtr.takeLoss(200, {from: citizen4}), errTypes.revert);
    await tmpMudarabaCtr.takeLoss(200, {from: citizen5});
    let totalCapital = await tmpMudarabaCtr.totalCapital();
    let tokId1 = await tmpMudarabaCtr.getSubscription(0);
    let tokId2 = await tmpMudarabaCtr.getSubscription(1);
    let tokId3 = await tmpMudarabaCtr.getSubscription(2);
    let prod1 = await tmpMudarabaCtr.getProduct(tokId1);
    let prod2 = await tmpMudarabaCtr.getProduct(tokId2);
    let prod3 = await tmpMudarabaCtr.getProduct(tokId3);
    // rounding issue here => should be 400
    assert.equal(totalCapital.toNumber(), 401, "Total capital has been added profits");
    assert.equal(prod1[1].toNumber(), 67, "Product 1 after profit");
    assert.equal(prod2[1].toNumber(), 134, "Product 2 after profit");
    assert.equal(prod3[1].toNumber(), 200, "Product 3 after profit");
  });


})