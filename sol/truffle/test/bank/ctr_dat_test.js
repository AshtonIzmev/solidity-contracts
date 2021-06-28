const MEDCtr = artifacts.require("MED");
const DATCtr = artifacts.require("DAT");
const FPCtr = artifacts.require("FP");
const KYCCtr = artifacts.require("KYC");

contract('DAT', async (accounts) => {
 
  let tryCatch = require("../utils/exceptions.js").tryCatch;
  let errTypes = require("../utils/exceptions.js").errTypes;

  let kycCtr;
  let medCtr;
  let datCtr;
  let fpCtr;
  let centralBankAcc = accounts[0];
  let treasureAcc    = accounts[9];
  let homeAffaireDept    = accounts[7];

  let issuingBank    = accounts[8];

  let citizen1    = accounts[1];
  let citizen2    = accounts[2];
  let citizen3    = accounts[3];
  let citizen4    = accounts[4];
  let citizen5    = accounts[5];

  before(async() => {
    kycCtr = await KYCCtr.new({from: homeAffaireDept});
    await kycCtr.validateKYC(centralBankAcc, {from: homeAffaireDept});
    await kycCtr.validateKYC(treasureAcc, {from: homeAffaireDept});
    medCtr = await MEDCtr.new(treasureAcc, 5, 10000, false, 10000000, kycCtr.address, {from: centralBankAcc});
    fpCtr = await FPCtr.new("Financial Products NFT", "FPNFT", {from: issuingBank});
    await kycCtr.validateKYC(citizen1, {from: homeAffaireDept});
    await kycCtr.validateKYC(citizen2, {from: homeAffaireDept});
    await kycCtr.validateKYC(citizen3, {from: homeAffaireDept});
    await kycCtr.validateKYC(citizen4, {from: homeAffaireDept});
    await kycCtr.validateKYC(citizen5, {from: homeAffaireDept});
    await kycCtr.validateKYC(fpCtr.address, {from: homeAffaireDept});
    
    await medCtr.incrementMonth({from: centralBankAcc});
    await medCtr.incrementMonth({from: centralBankAcc});
  });

  it("Public variables should be set by constructor", async() => {
    let tmpDatCtr = await DATCtr.new(1000, medCtr.address, fpCtr.address, {from: issuingBank});
    await tmpDatCtr.setProduct(2, 1, {from: issuingBank});
    await kycCtr.validateKYC(tmpDatCtr.address, {from: homeAffaireDept});
    await fpCtr.setApprovalForAll(tmpDatCtr.address, true, {from: issuingBank});
    await kycCtr.validateKYC(tmpDatCtr.address, {from: homeAffaireDept});
    let minAm = await tmpDatCtr.minimumAmount();
    let intRate = await tmpDatCtr.allowedParams(2);
    assert.equal(minAm, 1000, "Minimum amount for the DAT is set");
    assert.equal(intRate, 1, "Interest rate for the DAT is set");
  });

  it("Suscribe DAT fails because ... minimum Amount", async() => {
    let tmpMedCtr = await MEDCtr.new(treasureAcc, 5, 10000, false, 10000000, kycCtr.address, {from: centralBankAcc});
    let tmpFpCtr = await FPCtr.new("Financial Products NFT", "FPNFT", {from: issuingBank});
    let tmpDatCtr = await DATCtr.new(1000, tmpMedCtr.address, tmpFpCtr.address, {from: issuingBank});
    await tmpDatCtr.setProduct(2, 1, {from: issuingBank});
    await kycCtr.validateKYC(tmpDatCtr.address, {from: homeAffaireDept});
    await fpCtr.setApprovalForAll(tmpDatCtr.address, true, {from: issuingBank});
    await kycCtr.validateKYC(tmpMedCtr.address, {from: homeAffaireDept});
    await kycCtr.validateKYC(tmpFpCtr.address, {from: homeAffaireDept});
    await kycCtr.validateKYC(tmpDatCtr.address, {from: homeAffaireDept});
    await tmpMedCtr.incrementMonth({from: centralBankAcc});
    await tmpMedCtr.incrementMonth({from: centralBankAcc});
    await tmpMedCtr.updateAccount(citizen1, {from: citizen1});
    await tmpMedCtr.approve(tmpDatCtr.address, 1002, {from: citizen1});
    await tmpFpCtr.setApprovalForAll(tmpDatCtr.address, true, {from: issuingBank});
    await tryCatch(tmpDatCtr.subscribe(999, 2, 1, {from: citizen1}), errTypes.revert);
  });

  it("Suscribe DAT fails because ... no allowance", async() => {
    let tmpMedCtr = await MEDCtr.new(treasureAcc, 5, 10000, false, 10000000, kycCtr.address, {from: centralBankAcc});
    let tmpFpCtr = await FPCtr.new("Financial Products NFT", "FPNFT", {from: issuingBank});
    let tmpDatCtr = await DATCtr.new(1000, tmpMedCtr.address, tmpFpCtr.address, {from: issuingBank});
    await tmpDatCtr.setProduct(2, 1, {from: issuingBank});
    await kycCtr.validateKYC(tmpDatCtr.address, {from: homeAffaireDept});
    await fpCtr.setApprovalForAll(tmpDatCtr.address, true, {from: issuingBank});
    await kycCtr.validateKYC(tmpMedCtr.address, {from: homeAffaireDept});
    await kycCtr.validateKYC(tmpFpCtr.address, {from: homeAffaireDept});
    await kycCtr.validateKYC(tmpDatCtr.address, {from: homeAffaireDept});
    await tmpMedCtr.incrementMonth({from: centralBankAcc});
    await tmpMedCtr.incrementMonth({from: centralBankAcc});
    await tmpMedCtr.updateAccount(citizen1, {from: citizen1});
    await tmpFpCtr.setApprovalForAll(tmpDatCtr.address, true, {from: issuingBank});
    await tryCatch(tmpDatCtr.subscribe(1001, 2, 1, {from: citizen1}), errTypes.revert);
  });

  it("Suscribe DAT fails because ... insufficient allowance", async() => {
    let tmpMedCtr = await MEDCtr.new(treasureAcc, 5, 10000, false, 10000000, kycCtr.address, {from: centralBankAcc});
    let tmpFpCtr = await FPCtr.new("Financial Products NFT", "FPNFT", {from: issuingBank});
    let tmpDatCtr = await DATCtr.new(1000, tmpMedCtr.address, tmpFpCtr.address, {from: issuingBank});
    await tmpDatCtr.setProduct(2, 1, {from: issuingBank});
    await kycCtr.validateKYC(tmpDatCtr.address, {from: homeAffaireDept});
    await fpCtr.setApprovalForAll(tmpDatCtr.address, true, {from: issuingBank});
    await kycCtr.validateKYC(tmpMedCtr.address, {from: homeAffaireDept});
    await kycCtr.validateKYC(tmpFpCtr.address, {from: homeAffaireDept});
    await kycCtr.validateKYC(tmpDatCtr.address, {from: homeAffaireDept});
    await tmpMedCtr.incrementMonth({from: centralBankAcc});
    await tmpMedCtr.incrementMonth({from: centralBankAcc});
    await tmpMedCtr.updateAccount(citizen1, {from: citizen1});
    await tmpMedCtr.approve(tmpDatCtr.address, 999, {from: citizen1});
    await tmpFpCtr.setApprovalForAll(tmpDatCtr.address, true, {from: issuingBank});
    await tryCatch(tmpDatCtr.subscribe(1001, 2, 1, {from: citizen1}), errTypes.revert);
  });

  it("Suscribe DAT fails because ... non approuved contract address", async() => {
    let tmpMedCtr = await MEDCtr.new(treasureAcc, 5, 10000, false, 10000000, kycCtr.address, {from: centralBankAcc});
    let tmpFpCtr = await FPCtr.new("Financial Products NFT", "FPNFT", {from: issuingBank});
    let tmpDatCtr = await DATCtr.new(1000, tmpMedCtr.address, tmpFpCtr.address, {from: issuingBank});
    await tmpDatCtr.setProduct(2, 1, {from: issuingBank});
    await kycCtr.validateKYC(tmpDatCtr.address, {from: homeAffaireDept});
    await fpCtr.setApprovalForAll(tmpDatCtr.address, true, {from: issuingBank});
    await kycCtr.validateKYC(tmpMedCtr.address, {from: homeAffaireDept});
    await kycCtr.validateKYC(tmpFpCtr.address, {from: homeAffaireDept});
    await kycCtr.validateKYC(tmpDatCtr.address, {from: homeAffaireDept});
    await tmpMedCtr.incrementMonth({from: centralBankAcc});
    await tmpMedCtr.incrementMonth({from: centralBankAcc});
    await tmpMedCtr.updateAccount(citizen1, {from: citizen1});
    await tmpMedCtr.approve(tmpDatCtr.address, 1002, {from: citizen1});
    await tryCatch(tmpDatCtr.subscribe(1001, 2, 1, {from: citizen1}), errTypes.revert);
  });

  it("Suscribe DAT succeeds", async() => {
    tmpDatCtr = await DATCtr.new(1000, medCtr.address, fpCtr.address, {from: issuingBank});
    await tmpDatCtr.setProduct(2, 25, {from: issuingBank});
    await kycCtr.validateKYC(tmpDatCtr.address, {from: homeAffaireDept});
    await fpCtr.setApprovalForAll(tmpDatCtr.address, true, {from: issuingBank});
    await medCtr.updateAccount(citizen1, {from: citizen1});
    let bal11 = await medCtr.balanceOf(citizen1);
    let bal12 = await medCtr.balanceOf(tmpDatCtr.address);
    await medCtr.approve(tmpDatCtr.address, 1002, {from: citizen1});
    await tmpDatCtr.subscribe(1001, 2, 25, {from: citizen1});
    let bal21 = await medCtr.balanceOf(citizen1);
    let bal22 = await medCtr.balanceOf(tmpDatCtr.address);
    let tokId = await fpCtr.getCurrentTokenId();
    let owner = await fpCtr.ownerOf(tokId);
    let subsLen = await tmpDatCtr.getSubscriptionLength();
    let prod = await tmpDatCtr.getProduct(tokId);
    assert.equal(bal11 - bal21, 1001, "Correct amount removed from account");
    assert.equal(bal22 - bal12, 1001, "Correct amount added to account");
    assert.equal(owner, citizen1, "Token has been created and ownership is correct");
    assert.equal(subsLen, 1, "One subscription registered");
    assert.equal(prod[0].toNumber(), 0, "Correct subscription date");
    assert.equal(prod[1].toNumber(), 2, "Correct duration of product DAT");
    assert.equal(prod[2].toNumber(), 1001, "Correct amount in subscribed DAT");
  });

  it("Cancel someone else DAT", async() => {
    tmpDatCtr = await DATCtr.new(1000, medCtr.address, fpCtr.address, {from: issuingBank});
    await tmpDatCtr.setProduct(2, 25, {from: issuingBank});
    await kycCtr.validateKYC(tmpDatCtr.address, {from: homeAffaireDept});
    await fpCtr.setApprovalForAll(tmpDatCtr.address, true, {from: issuingBank});
    await medCtr.approve(tmpDatCtr.address, 1002, {from: citizen1});
    await tmpDatCtr.subscribe(1001, 2, 25, {from: citizen1});
    let tokId = await fpCtr.getCurrentTokenId();
    await tryCatch(tmpDatCtr.cancelDat(tokId, {from: citizen2}), errTypes.revert);
  });

  it("Cancel my DAT", async() => {
    tmpDatCtr = await DATCtr.new(1000, medCtr.address, fpCtr.address, {from: issuingBank});
    await tmpDatCtr.setProduct(2, 25, {from: issuingBank});
    await kycCtr.validateKYC(tmpDatCtr.address, {from: homeAffaireDept});
    await fpCtr.setApprovalForAll(tmpDatCtr.address, true, {from: issuingBank});
    let subsLen1 = await tmpDatCtr.getSubscriptionLength();
    await medCtr.updateAccount(citizen2, {from: citizen2});
    let bal11 = await medCtr.balanceOf(citizen2);
    await medCtr.approve(tmpDatCtr.address, 1002, {from: citizen2});
    await tmpDatCtr.subscribe(1001, 2, 25, {from: citizen2});
    let tokId = await fpCtr.getCurrentTokenId();
    await tmpDatCtr.cancelDat(tokId, {from: citizen2});
    await tryCatch(fpCtr.ownerOf(tokId), errTypes.revert);
    let bal12 = await medCtr.balanceOf(citizen2);
    let subsLen2 = await tmpDatCtr.getSubscriptionLength();
    assert.equal(bal11-bal12, 0, "Balance initial amount after cancelling");
    assert.equal(subsLen2 - subsLen1, 0, "No additional subscription");
  });

  it("Pay my DAT early should not be possible", async() => {
    tmpDatCtr = await DATCtr.new(1000, medCtr.address, fpCtr.address, {from: issuingBank});
    await tmpDatCtr.setProduct(2, 25, {from: issuingBank});
    await kycCtr.validateKYC(tmpDatCtr.address, {from: homeAffaireDept});
    await fpCtr.setApprovalForAll(tmpDatCtr.address, true, {from: issuingBank});
    await medCtr.updateAccount(citizen3, {from: citizen3});
    await medCtr.approve(tmpDatCtr.address, 1002, {from: citizen3});
    await tmpDatCtr.subscribe(1001, 2, 25, {from: citizen3});
    let tokId = await fpCtr.getCurrentTokenId();
    await tryCatch(tmpDatCtr.payDat(tokId, {from: citizen3}), errTypes.revert);
  });

  it("Successfuly pay my DAT", async() => {
    tmpDatCtr = await DATCtr.new(1000, medCtr.address, fpCtr.address, {from: issuingBank});
    await tmpDatCtr.setProduct(2, 25, {from: issuingBank});
    await kycCtr.validateKYC(tmpDatCtr.address, {from: homeAffaireDept});
    await fpCtr.setApprovalForAll(tmpDatCtr.address, true, {from: issuingBank});
    let bal11 = await medCtr.balanceOf(citizen3);
    await medCtr.updateAccount(citizen3, {from: citizen3});
    await medCtr.approve(tmpDatCtr.address, 2002, {from: citizen3});
    await tmpDatCtr.subscribe(1500, 2, 25, {from: citizen3});
    let tokId = await fpCtr.getCurrentTokenId();
    await medCtr.incrementDay({from: centralBankAcc});
    await medCtr.incrementDay({from: centralBankAcc});
    await medCtr.incrementDay({from: centralBankAcc});
    await tmpDatCtr.payDat(tokId, {from: citizen3});
    let bal12 = await medCtr.balanceOf(citizen3);
    await tryCatch(fpCtr.ownerOf(tokId), errTypes.revert);
    assert.equal(bal12.toNumber()-bal11.toNumber(), 368, "Interest rates have been paid minus MED taxes");
  });

  it("Unknown DAT day duration", async() => {
    tmpDatCtr = await DATCtr.new(1000, medCtr.address, fpCtr.address, {from: issuingBank});
    await tmpDatCtr.setProduct(2, 25, {from: issuingBank});
    await kycCtr.validateKYC(tmpDatCtr.address, {from: homeAffaireDept});
    await fpCtr.setApprovalForAll(tmpDatCtr.address, true, {from: issuingBank});
    await medCtr.updateAccount(citizen3, {from: citizen3});
    await medCtr.approve(tmpDatCtr.address, 2002, {from: citizen3});
    await tryCatch(tmpDatCtr.subscribe(1500, 3, 25, {from: citizen3}), errTypes.revert);
  });

  it("Unknown DAT interest rates", async() => {
    tmpDatCtr = await DATCtr.new(1000, medCtr.address, fpCtr.address, {from: issuingBank});
    await tmpDatCtr.setProduct(2, 25, {from: issuingBank});
    await kycCtr.validateKYC(tmpDatCtr.address, {from: homeAffaireDept});
    await fpCtr.setApprovalForAll(tmpDatCtr.address, true, {from: issuingBank});
    await medCtr.updateAccount(citizen3, {from: citizen3});
    await medCtr.approve(tmpDatCtr.address, 2002, {from: citizen3});
    await tryCatch(tmpDatCtr.subscribe(1500, 2, 26, {from: citizen3}), errTypes.revert);
  });

  it("Invalid DAT day duration", async() => {
    tmpDatCtr = await DATCtr.new(1000, medCtr.address, fpCtr.address, {from: issuingBank});
    await tryCatch(tmpDatCtr.setProduct(0, 25, {from: issuingBank}), errTypes.revert);
  });

  it("Invalid DAT interest rate", async() => {
    tmpDatCtr = await DATCtr.new(1000, medCtr.address, fpCtr.address, {from: issuingBank});
    await tryCatch(tmpDatCtr.setProduct(2, 0, {from: issuingBank}), errTypes.revert);
  });

})