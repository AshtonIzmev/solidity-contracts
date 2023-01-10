const InstitutionCtr = artifacts.require("Institution");
const SchoolCtr = artifacts.require("School");
const AssoCompanyCtr = artifacts.require("Company");


contract('School', async (accounts) => {

  let tryCatch = require("../utils/exceptions.js").tryCatch;
  let errTypes = require("../utils/exceptions.js").errTypes;

  let school;
  let owner         = accounts[0];
  let alumni1       = accounts[5];
  let alumni2       = accounts[6];
  let alumni3       = accounts[7];

  before(async() => {
    school = await SchoolCtr.new(
      web3.utils.fromUtf8("01234567890123456789012345678912"),
      web3.utils.fromUtf8("01234567890123456789012345678912"),
      "EMINSIAS");
  });

  it("School infos are correct and retrievable", async() => {
    let name = await school.name();
    assert.equal(name, "EMINSIAS", "Name is correct and public");
  })

})
