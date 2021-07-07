const MEDCtr = artifacts.require("MED");
const FPCtr = artifacts.require("FP");
const FactoringCtr = artifacts.require("Factoring");
const KYCCtr = artifacts.require("KYC");

contract('Factoring', async (accounts) => {
 
  let tryCatch = require("../utils/exceptions.js").tryCatch;
  let errTypes = require("../utils/exceptions.js").errTypes;

  let kycCtr;
  let medCtr;
  let factoringCtr;
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
    await medCtr.updateAccount(citizen2, {from: citizen1});
    await medCtr.updateAccount(citizen3, {from: citizen1});
    await medCtr.updateAccount(citizen5, {from: citizen1});
  });

  beforeEach(async() => {
    factoringCtr = await FactoringCtr.new(medCtr.address, fpCtr.address, {from: citizen1});
    await fpCtr.setApprovalForAll(factoringCtr.address, true, {from: citizen1});
    await kycCtr.validateKYC(factoringCtr.address, {from: homeAffaireDept});
  });

  it("Suscribe Factoring product Succeeds", async() => {
    let subsLen1 = await factoringCtr.getSubscriptionLength();
    await fpCtr.setApprovalForAll(factoringCtr.address, true, {from: issuingBank});
    await factoringCtr.sellInvoice(999, citizen5, 15, {from: citizen1});
    let tokId = await fpCtr.getCurrentTokenId();
    let prod = await factoringCtr.getProduct(tokId);
    let owner = await fpCtr.ownerOf(tokId);
    let subsLen2 = await factoringCtr.getSubscriptionLength();
    assert.equal(owner, citizen1, "Token has been created and ownership is correct");
    assert.equal(subsLen2 - subsLen1, 1, "One subscription registered");
    assert.equal(prod[0], citizen5, "Correct borrower");
    assert.equal(prod[2], 999, "Invoice amount");
    assert.equal(prod[3], false, "Non-validated invoice yet");
    assert.equal(prod[4], 15, "Correct invoice ID");
  });

  it("Validate Factoring product Succeeds", async() => {
    await fpCtr.setApprovalForAll(factoringCtr.address, true, {from: issuingBank});
    await factoringCtr.sellInvoice(999, citizen5, 42, {from: citizen1});
    let tokId = await fpCtr.getCurrentTokenId();
    await tryCatch(factoringCtr.validateInvoice(tokId, {from: citizen4}), errTypes.revert);
    await factoringCtr.validateInvoice(tokId, {from: citizen5});

    let prod = await factoringCtr.getProduct(tokId);
    let owner = await fpCtr.ownerOf(tokId);
    assert.equal(owner, citizen1, "Token has been created and ownership is correct");
    assert.equal(prod[0], citizen5, "Correct borrower");
    assert.equal(prod[2], 999, "Invoice amount");
    assert.equal(prod[3], true, "Validated invoice yet");
    assert.equal(prod[4], 42, "Correct invoice ID");
  });

  it("Pay Factoring product Succeeds", async() => {
    await fpCtr.setApprovalForAll(factoringCtr.address, true, {from: issuingBank});
    await factoringCtr.sellInvoice(999, citizen5, 0, {from: citizen1});
    let tokId = await fpCtr.getCurrentTokenId();
    await tryCatch(factoringCtr.payInvoice(tokId, {from: citizen4}), errTypes.revert);
    await tryCatch(factoringCtr.payInvoice(tokId, {from: citizen5}), errTypes.revert);
    let bal11 = await medCtr.balanceOf(citizen1);
    let bal15 = await medCtr.balanceOf(citizen5);
    await medCtr.approve(factoringCtr.address, 1000, {from: citizen5});
    await factoringCtr.payInvoice(tokId, {from: citizen5});
    let bal21 = await medCtr.balanceOf(citizen1);
    let bal25 = await medCtr.balanceOf(citizen5);

    let prod = await factoringCtr.getProduct(tokId);
    await tryCatch(fpCtr.ownerOf(tokId), errTypes.revert);
    assert.equal(bal21-bal11, 999, "Balance initial amount after cancelling");
    assert.equal(bal15-bal25, 999, "Balance initial amount after cancelling");
    assert.equal(prod[0], citizen5, "Correct borrower");
    assert.equal(prod[2], 999, "Invoice amount");
    assert.equal(prod[3], false, "No validation needed to pay an invoice");
    assert.equal(prod[4], 0, "Correct invoice ID");
  });

  

})