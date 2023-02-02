const SchoolCtr = artifacts.require("School");
const CompanyCtr = artifacts.require("Company");


contract('School', async (accounts) => {

  let tryCatch = require("../utils/exceptions.js").tryCatchFree;

  let school;
  let ownerS        = accounts[0];
  let ownerC        = accounts[0];
  let alumni1       = accounts[5];
  let alumni2       = accounts[6];
  let alumni3       = accounts[7];

  let infos = "issam_el_alaoui_x2007";
  let hashInfos = web3.utils.keccak256(infos);
  let hashInfosFake = web3.utils.keccak256("issam_el_alaoui_x2008");

  before(async() => {
    school = await SchoolCtr.new(
      web3.utils.fromUtf8("01234567890123456789012345678912"),
      web3.utils.fromUtf8("01234567890123456789012345678912"),
      "EMINSIAS", {from: ownerS});

    company = await CompanyCtr.new(
      web3.utils.fromUtf8("01234567890123456789012345678912"),
      web3.utils.fromUtf8("01234567890123456789012345678912"),
      "AWBOCP", {from: ownerC});
  });

  it("School infos are correct and retrievable", async() => {
    let name = await school.name();
    assert.equal(name, "EMINSIAS", "Name is correct and public");
  })

  it("Company infos are correct and retrievable", async() => {
    let name = await company.name();
    assert.equal(name, "AWBOCP", "Name is correct and public");
  })

  it("Alumni registers to the school", async() => {
    await school.register(infos, hashInfos, 2007, true, {from: alumni1});
    let alumniStruct = await school.alumnis(alumni1);
    let validations = await school.validations(alumni1);
    assert.equal(alumniStruct.privateInfoSchool, infos, "Private infos are correct");
    assert.equal(alumniStruct.hashInfos, hashInfos, "Hashed infos are correct");
    assert.equal(alumniStruct.year, 2007, "Year is correct");
    assert.equal(alumniStruct.isPublic, true, "Profile is said public");
    assert.equal(validations, false, "School has not validated yet");
  })

  it("Alumni registers to the school with a bad hash", async() => {
    await tryCatch(school.register(infos, hashInfosFake, 2007, true, {from: alumni1}), 
      "VM Exception while processing transaction: revert Hashed Data does not correspond to said infos");
  })

  it("Alumni registers to the school and gets validated", async() => {
    await school.register(infos, hashInfos, 2007, true, {from: alumni2});
    await school.validate(alumni2, {from: ownerS})
    let validations = await school.validations(alumni2);
    assert.equal(validations, true, "School has validated");
  })

  it("Alumni submit to the company", async() => {
    await school.register(infos, hashInfos, 2007, true, {from: alumni3});
    await school.validate(alumni3, {from: ownerS})
    await company.submit(infos, {from: alumni3});
    let resultInfos = await company.infosCompany(alumni3);
    assert.equal(resultInfos, infos, "Infos have been submitted");
  })


})
