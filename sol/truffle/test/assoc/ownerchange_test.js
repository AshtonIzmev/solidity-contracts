const AssoOrg = artifacts.require("AssociationOrg");
const AssoCoopt = artifacts.require("AssociationAdministrationCooptation");
const AssoAdminOC = artifacts.require("AssociationAdministrationOwnerchange");
const AssoAdminMB = artifacts.require("AssociationAdministrationMemberban");
const AssoAdminSD = artifacts.require("AssociationAdministrationSelfdestruct");
const MasterOrg = artifacts.require("MasterOrg");

contract('AssociationAdministration', async(accounts) => {

  let tryCatch = require("../utils/exceptions.js").tryCatch;
  let errTypes = require("../utils/exceptions.js").errTypes;

  let assoOrg3Members;
  let assoOrg2Members;
  let masterOrg;
  let owner               = accounts[0];
  let randomGuy           = accounts[1];
  let wannabeMember       = accounts[5];
  let wannabeMemberToo    = accounts[6];


  before(async() => {
    masterOrg = await MasterOrg.new();
    assoOrg3Members = await AssoOrg.new("testAssociation3", "Issam_test", masterOrg.address);
    // first cooptation
    let cooptCtr = await AssoCoopt.new(assoOrg3Members.address, "Ali_test", {from: wannabeMember});
    await cooptCtr.vote();
    await assoOrg3Members.handleCooptationAction(cooptCtr.address, {from: owner});
    // second cooptation
    let cooptCtr2 = await AssoCoopt.new(assoOrg3Members.address, "Mohamed_test", {from: wannabeMemberToo});
    await cooptCtr2.vote();
    await cooptCtr2.vote({from: wannabeMember})
    await assoOrg3Members.handleCooptationAction(cooptCtr2.address, {from: wannabeMemberToo});

    assoOrg2Members = await AssoOrg.new("testAssociation2", "Issam_test", masterOrg.address);
    // first cooptation
    let cooptCtr3 = await AssoCoopt.new(assoOrg2Members.address, "Ali_test", {from: wannabeMember});
    await cooptCtr3.vote();
    await assoOrg2Members.handleCooptationAction(cooptCtr3.address, {from: owner});
  });

  it("should not allow a non-member to vote", async() => {
    let admin = await AssoAdminOC.new(assoOrg3Members.address, {from: randomGuy});
    await tryCatch(admin.vote({from: randomGuy}), errTypes.revert);
  });

  it("should allow a owner to vote", async() => {
    let admin = await AssoAdminOC.new(assoOrg3Members.address, {from: randomGuy});
    await admin.vote({from: owner});
  });

  it("Valid vote", async() => {
    let adminOC = await AssoAdminOC.new(assoOrg3Members.address, {from: randomGuy});
    let voteCountBefore = await adminOC.voteCount();
    await adminOC.vote({from: wannabeMember});
    let voteCountAfter = await adminOC.voteCount();
    let didVote = await adminOC.didVotes(wannabeMember);
    let didNotVote = await adminOC.didVotes(wannabeMemberToo);
    assert.equal(voteCountBefore, 0, "No votes before");
    assert.equal(voteCountAfter, 1, "One single vote after");
    assert.isTrue(didVote, "He did vote");
    assert.isFalse(didNotVote, "He did not vote");
  });

  it("bad assoOrg reference", async() => {
    let assoOrg = await AssoOrg.new("testAssociation", "Issam_test", masterOrg.address);
    let assoOrgFake = await AssoOrg.new("testAssociationFake", "Issam_fake_test", masterOrg.address);
    let assoAdminOC = await AssoAdminOC.new(assoOrgFake.address, {from: randomGuy});
    await assoAdminOC.vote();
    await tryCatch(assoOrg.handleOwnerchangeAction(assoAdminOC.address), errTypes.revert);  
  });

  it("Simple vote OWNERSHIP change", async() => {
    let adminOC = await AssoAdminOC.new(assoOrg2Members.address, {from: wannabeMember});
    let memberHistoricCount1 = await assoOrg2Members.getMemberHistoricCount();
    await adminOC.vote();
    await adminOC.vote({from:wannabeMember});
    let ownerBefore = await assoOrg2Members.owner();
    await assoOrg2Members.handleOwnerchangeAction(adminOC.address);
    let memberHistoricCount2 = await assoOrg2Members.getMemberHistoricCount();
    let ownerAfter = await assoOrg2Members.owner();
    let adminOC2 = await AssoAdminOC.new(assoOrg2Members.address, {from: owner});
    await adminOC2.vote();
    await adminOC2.vote({from:wannabeMember});
    await assoOrg2Members.handleOwnerchangeAction(adminOC2.address);
    let memberHistoricCount3 = await assoOrg2Members.getMemberHistoricCount();
    let ownerAfter2 = await assoOrg2Members.owner();

    assert.equal(ownerBefore, owner, "Owneship Before");
    assert.equal(ownerAfter, wannabeMember, "Owneship changed :) Good luck");
    assert.equal(ownerAfter2, owner, "Owneship After again");

    assert.equal(memberHistoricCount1, 2, "Historic member count still the same");
    assert.equal(memberHistoricCount2, 2, "Historic member count still the same");
    assert.equal(memberHistoricCount3, 2, "Historic member count still the same");
  });

  it("Duplicate vote OWNERSHIP change", async() => {
    let adminOC = await AssoAdminOC.new(assoOrg2Members.address, {from: wannabeMember});
    await adminOC.vote();
    await adminOC.vote({from:wannabeMember});
    await assoOrg2Members.handleOwnerchangeAction(adminOC.address);
    let adminOC2 = await AssoAdminOC.new(assoOrg2Members.address, {from: owner});
    await adminOC2.vote();
    await adminOC2.vote({from:wannabeMember});
    await assoOrg2Members.handleOwnerchangeAction(adminOC2.address);
    await tryCatch(assoOrg2Members.handleOwnerchangeAction(adminOC.address), errTypes.revert);
  });

  it("Simple vote OWNERSHIP change refused because maintenance mode", async() => {
    let adminOC = await AssoAdminOC.new(assoOrg2Members.address, {from: wannabeMember});
    await adminOC.vote();
    await adminOC.vote({from:wannabeMember});
    await assoOrg2Members.switchMaintenanceMode({from:owner});
    await tryCatch(assoOrg2Members.handleOwnerchangeAction(adminOC.address), errTypes.revert);
  });


  it("Owner owner change ??", async() => {
    let assoOrg = await AssoOrg.new("testAssociation", "Issam_test", masterOrg.address);
    await tryCatch(AssoAdminOC.new(assoOrg.address, {from: owner}), errTypes.revert);
  })

});
