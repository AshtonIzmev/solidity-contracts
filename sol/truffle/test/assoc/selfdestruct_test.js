const AssoOrg = artifacts.require("AssociationOrg");
const AssoCoopt = artifacts.require("AssociationAdministrationCooptation");
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
    let cooptCtr3 = await AssoCoopt.new(assoOrg2Members.address, "Anass_test", {from: wannabeMember});
    await cooptCtr3.vote();
    await assoOrg2Members.handleCooptationAction(cooptCtr3.address, {from: owner});
  });

  it("fake unvote please", async() => {
    let adminSD = await AssoAdminSD.new(assoOrg3Members.address);
    let voteCountBefore = await adminSD.voteCount();
    await adminSD.vote({from: wannabeMember});
    await adminSD.unvote({from: wannabeMemberToo});
    let voteCountAfter = await adminSD.voteCount();
    let didVote = await adminSD.didVotes(wannabeMember);
    let didNotVote = await adminSD.didVotes(wannabeMemberToo);
    assert.equal(voteCountBefore, 0, "No votes before");
    assert.equal(voteCountAfter, 1, "One single vote after");
    assert.isTrue(didVote, "He did vote");
    assert.isFalse(didNotVote, "He did not vote");
  });

  it("Self destruct", async() => {
    let assoOrg = await AssoOrg.new("testAssociation", "Issam_test", masterOrg.address);
    let adminSD = await AssoAdminSD.new(assoOrg.address);
    await adminSD.vote();
    await assoOrg.handleSelfdestructAction(adminSD.address);
  });

});
