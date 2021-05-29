var AssoOrg = artifacts.require("AssociationOrg");
var AssoCoopt = artifacts.require("AssociationAdministrationCooptation");
var AssoAdminMB = artifacts.require("AssociationAdministrationMemberban");

contract('AssociationAdministration', async(accounts) => {

  let tryCatch = require("./exceptions.js").tryCatch;
  let errTypes = require("./exceptions.js").errTypes;

  let assoOrg3Members;
  let assoOrg2Members;
  let owner               = accounts[0];
  let randomGuy           = accounts[1];
  let wannabeMember       = accounts[5];
  let wannabeMemberToo    = accounts[6];

  before(async() => {
    assoOrg3Members = await AssoOrg.new("testAssociation3", "Issam_test");
    // first cooptation
    let cooptCtr = await AssoCoopt.new(assoOrg3Members.address, "Mohamed_test", {from: wannabeMember});
    await cooptCtr.vote();
    await assoOrg3Members.handleCooptationAction(cooptCtr.address, {from: owner});
    // second cooptation
    let cooptCtr2 = await AssoCoopt.new(assoOrg3Members.address, "Mohamed_test", {from: wannabeMemberToo});
    await cooptCtr2.vote();
    await cooptCtr2.vote({from: wannabeMember})
    await assoOrg3Members.handleCooptationAction(cooptCtr2.address, {from: wannabeMemberToo});

    assoOrg2Members = await AssoOrg.new("testAssociation2", "Issam_test");
    // first cooptation
    let cooptCtr3 = await AssoCoopt.new(assoOrg2Members.address, "Mohamed_test", {from: wannabeMember});
    await cooptCtr3.vote();
    await assoOrg2Members.handleCooptationAction(cooptCtr3.address, {from: owner});
  });

  it("unvote please", async() => {
    let adminMB = await AssoAdminMB.new(assoOrg3Members.address, wannabeMemberToo);
    let voteCountBefore = await adminMB.voteCount();
    await adminMB.vote({from: wannabeMember});
    await adminMB.unvote({from: wannabeMember});
    let voteCountAfter = await adminMB.voteCount();
    let didNotVote = await adminMB.didVotes(wannabeMember);
    assert.equal(voteCountBefore, 0, "No votes before");
    assert.equal(voteCountAfter, 0, "One single vote after");
    assert.isFalse(didNotVote, "He did not vote");
  });

  it("Duplicate vote", async() => {
    let adminMB = await AssoAdminMB.new(assoOrg3Members.address, wannabeMemberToo);
    let voteCountBefore = await adminMB.voteCount();
    await adminMB.vote({from: wannabeMember});
    let voteCountAfter = await adminMB.voteCount();
    await adminMB.vote({from: wannabeMember});
    let voteCountAfter2 = await adminMB.voteCount();
    assert.equal(voteCountBefore, 0, "No votes before");
    assert.equal(voteCountAfter, 1, "One single vote after");
    assert.equal(voteCountAfter2, 1, "One single vote after duplicate vote");
  });

  it("Member ban", async() => {
    let assoOrg2Mem = await AssoOrg.new("testAssociation2", "Issam_test");
    // first cooptation
    let cooptCtr3 = await AssoCoopt.new(assoOrg2Mem.address, "Ali_test", {from: wannabeMember});
    await cooptCtr3.vote();
    await assoOrg2Mem.handleCooptationAction(cooptCtr3.address, {from: owner});

    let memberHistoricCountBefore = await assoOrg2Mem.getMemberHistoricCount();
    
    let adminMB = await AssoAdminMB.new(assoOrg2Mem.address, wannabeMember);
    await adminMB.vote();
    await adminMB.vote({from: wannabeMember});
    let memberCountBefore = await assoOrg2Mem.membersCount();
    await assoOrg2Mem.handleMemberbanAction(adminMB.address);
    let memberCountAfter = await assoOrg2Mem.membersCount();

    let memberHistoricCountAfter = await assoOrg2Mem.getMemberHistoricCount();

    assert.equal(memberHistoricCountBefore, 2, "Association has 2 historic members");
    assert.equal(memberHistoricCountAfter, 2, "Number of historic members should never decrease");

    assert.equal(memberCountBefore, 2, "2 members before");
    assert.equal(memberCountAfter, 1, "One member after");
  })

  it("Duplicate Member ban", async() => {
    let assoOrg2Mem = await AssoOrg.new("testAssociation2", "Issam_test");
    // first cooptation
    let cooptCtr3 = await AssoCoopt.new(assoOrg2Mem.address, "Ali_test", {from: wannabeMember});
    await cooptCtr3.vote();
    await assoOrg2Mem.handleCooptationAction(cooptCtr3.address, {from: owner});
    
    let adminMB = await AssoAdminMB.new(assoOrg2Mem.address, wannabeMember);
    await adminMB.vote();
    await adminMB.vote({from: wannabeMember});
    await assoOrg2Mem.handleMemberbanAction(adminMB.address);
    await tryCatch(assoOrg2Mem.handleMemberbanAction(adminMB.address), errTypes.revert);
  })

  it("Owner ban impossible", async() => {
    let assoOrg = await AssoOrg.new("testAssociation", "Issam_test");
    await tryCatch(AssoAdminMB.new(assoOrg.address, owner), errTypes.revert);
  })

  it("Non member ban impossible", async() => {
    let assoOrg = await AssoOrg.new("testAssociation", "Issam_test");
    await tryCatch(AssoAdminMB.new(assoOrg.address, wannabeMemberToo), errTypes.revert);
  })

});
