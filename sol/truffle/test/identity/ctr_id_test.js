const KYCCtr = artifacts.require("KYC");

contract('KYC', async (accounts) => {
 
  let tryCatch = require("../utils/exceptions.js").tryCatch;
  let errTypes = require("../utils/exceptions.js").errTypes;

  let centralBankAcc = accounts[0];
  let treasureAcc    = accounts[9];
  let homeAffaireDept    = accounts[8];

  let citizen1    = accounts[1];
  let citizen2    = accounts[2];
  let citizen3    = accounts[3];
  let citizen4    = accounts[4];
  let citizen5    = accounts[5];
  let citizen6    = accounts[6];

  it("Verification OK", async() => {
    let kycCtr = await KYCCtr.new({from: homeAffaireDept});
    await kycCtr.submitKYC("issam", "CIN12345", {from: citizen1});
    await kycCtr.validateKYC(citizen3, {from: homeAffaireDept});
    let isVerified1 = await kycCtr.isIdentified(citizen1);
    let isVerified2 = await kycCtr.isIdentified(citizen2);
    let isVerified3 = await kycCtr.isIdentified(citizen3);
    assert.isTrue(isVerified1, "Verification OK");
    assert.isFalse(isVerified2, "Verification NOK");
    assert.isTrue(isVerified3, "Verification OK");
  });

  it("Unvalidation", async() => {
    let kycCtr = await KYCCtr.new({from: homeAffaireDept});
    await kycCtr.validateKYC(citizen3, {from: homeAffaireDept});
    await kycCtr.unvalidateKYC(citizen3, {from: homeAffaireDept});
    let isVerified3 = await kycCtr.isIdentified(citizen3);
    assert.isFalse(isVerified3, "Has been unvalidated");
  });

})