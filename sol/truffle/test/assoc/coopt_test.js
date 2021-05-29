var AssoOrg = artifacts.require("AssociationOrg");
var AssoCoopt = artifacts.require("AssociationAdministrationCooptation");

contract('AssociationAdministration', async(accounts) => {

  let tryCatch = require("./exceptions.js").tryCatch;
  let errTypes = require("./exceptions.js").errTypes;

  let owner         = accounts[0];
  let randomGuy      = accounts[1];
  let wannabeMember = accounts[5];
  let wannabeMemberToo = accounts[6];
  let wannabeMemberTooToo = accounts[7];

  it("Should not allow empty coopted member name", async() => {
    let assoOrg = await AssoOrg.new("testAssociation", "Issam_test", {from: owner});
    await tryCatch(AssoCoopt.new(assoOrg.address, ""), errTypes.revert);
  })

  it("Cooptation of the creator is ok", async() => {
    let assoOrg = await AssoOrg.new("testAssociation", "Issam_test", {from: owner});
    let cooptCtr = await AssoCoopt.new(assoOrg.address, "Ali_test", {from: wannabeMember});
    let cooptedMem = await cooptCtr.proposedMember();
    await cooptCtr.vote({from: owner});

    let numCoopt = await cooptCtr.voteCount();
    let cooptPresent = await cooptCtr.didVotes(owner);
    assert.equal(cooptedMem, wannabeMember, "Correct coopted member");
    assert.equal(numCoopt.toNumber(), 1, "Correct number of cooptations");
    assert.isTrue(cooptPresent, "Cooptation is present");

    await cooptCtr.vote({from: owner});
    let numCoopt2 = await cooptCtr.voteCount();
    assert.equal(numCoopt2.toNumber(), 1, "Still correct number of cooptations");    
  });

  it("Accepted cooptation", async() => {
    let assoOrg = await AssoOrg.new("testAssociation", "Issam_test");
    let cooptCtr = await AssoCoopt.new(assoOrg.address, "Ali_test", {from: wannabeMember});
    let memberHistoricCountBefore = await assoOrg.getMemberHistoricCount();
    await cooptCtr.vote();
    await assoOrg.handleCooptationAction(cooptCtr.address, {from: owner});
    let memberHistoricCountAfter = await assoOrg.getMemberHistoricCount();
    let isMem = await assoOrg.members(wannabeMember);
    let isNotMem = await assoOrg.members(randomGuy);
    let newMember = await assoOrg.membersHistoric(1);
    assert.isTrue(isMem, "Cooptation has been accepted");
    assert.isFalse(isNotMem, "Unknown member");
    assert.equal(memberHistoricCountBefore, 1, "One member only");
    assert.equal(memberHistoricCountAfter, 2, "A new member has been registered");
    assert.equal(newMember.addr, wannabeMember, "A new member has been registered");
    assert.equal(newMember.name, "Ali_test", "Name of the new member is correct");
  });

  it("Refused cooptation in maintenance mode", async() => {
    let assoOrg = await AssoOrg.new("testAssociation", "Issam_test");
    await assoOrg.switchMaintenanceMode();
    let cooptCtr = await AssoCoopt.new(assoOrg.address, "Ali_test", {from: wannabeMember});
    await cooptCtr.vote();
    await tryCatch(assoOrg.handleCooptationAction(cooptCtr.address, {from: owner}), errTypes.revert);
  });

  it("Accepted double cooptation", async() => {
    let assoOrg = await AssoOrg.new("testAssociation", "Issam_test");
    let memberHistoricCountBefore = await assoOrg.getMemberHistoricCount();
    // first cooptation
    let cooptCtr = await AssoCoopt.new(assoOrg.address, "Mohamed_test", {from: wannabeMember});
    await cooptCtr.vote();
    await assoOrg.handleCooptationAction(cooptCtr.address, {from: owner});
    // second cooptation
    let cooptCtr2 = await AssoCoopt.new(assoOrg.address, "Ali_test", {from: wannabeMemberToo});
    await cooptCtr2.vote();
    await cooptCtr2.vote({from: wannabeMember})
    await assoOrg.handleCooptationAction(cooptCtr2.address, {from: wannabeMemberToo});
    let memberHistoricCountAfter = await assoOrg.getMemberHistoricCount();

    let isMem = await assoOrg.members(wannabeMemberToo);
    assert.isTrue(isMem, "Cooptation has been accepted");
    assert.equal(memberHistoricCountBefore, 1, "One member only");
    assert.equal(memberHistoricCountAfter, 3, "two new members have been registered");
  });

  it("Accepted triple cooptation", async() => {
    let assoOrg = await AssoOrg.new("testAssociation", "Issam_test");
    // first cooptation
    let cooptCtr = await AssoCoopt.new(assoOrg.address, "Ali_test", {from: wannabeMember});
    await cooptCtr.vote();
    await assoOrg.handleCooptationAction(cooptCtr.address, {from: owner});
    // second cooptation
    let cooptCtr2 = await AssoCoopt.new(assoOrg.address, "Mohamed_test", {from: wannabeMemberToo});
    await cooptCtr2.vote();
    await cooptCtr2.vote({from: wannabeMember})
    await assoOrg.handleCooptationAction(cooptCtr2.address, {from: wannabeMemberToo});
    // third cooptation
    let cooptCtr3 = await AssoCoopt.new(assoOrg.address, "Anass_test", {from: wannabeMemberTooToo});
    await cooptCtr3.vote({from: wannabeMemberToo});
    await cooptCtr3.vote({from: wannabeMember})
    await assoOrg.handleCooptationAction(cooptCtr3.address, {from: wannabeMember});

    let isMem = await assoOrg.members(wannabeMemberTooToo);
    assert.isTrue(isMem, "Cooptation has been accepted");
  });

  it("Invalid cooptation organisation reference", async() => {
    let assoOrg = await AssoOrg.new("testAssociation", "Issam_test");
    let assoOrgFake = await AssoOrg.new("testAssociationFake", "Issam_fake_test");
    let cooptCtr = await AssoCoopt.new(assoOrgFake.address, "Mohamed_test", {from: wannabeMember});
    await cooptCtr.vote();
    await tryCatch(assoOrg.handleCooptationAction(cooptCtr.address, {from: owner}), errTypes.revert);
  });

  it("Insufficient cooptations", async() => {
    let assoOrg = await AssoOrg.new("testAssociation", "Issam_test");
    // first cooptation OK : 1 member is 100%
    let cooptCtr = await AssoCoopt.new(assoOrg.address, "Ali_test", {from: wannabeMember});
    await cooptCtr.vote();
    await assoOrg.handleCooptationAction(cooptCtr.address, {from: owner});
    // second cooptation OK : 1 member is 50%
    let cooptCtr2 = await AssoCoopt.new(assoOrg.address, "Mohamed_test", {from: wannabeMemberToo});
    await cooptCtr2.vote();
    await assoOrg.handleCooptationAction(cooptCtr2.address, {from: owner});
    // third cooptation NOK : 1 member is 33% => needs 51% cooptations
    let cooptCtr3 = await AssoCoopt.new(assoOrg.address, "Hakim_test", {from: wannabeMemberTooToo});
    await cooptCtr3.vote();
    await tryCatch(assoOrg.handleCooptationAction(cooptCtr3.address, {from: owner}), errTypes.revert);
  });

  it("Already a member", async() => {
    let assoOrg = await AssoOrg.new("testAssociation", "Issam_test");
    // first cooptation OK
    let cooptCtr = await AssoCoopt.new(assoOrg.address, "Ali_test", {from: wannabeMember});
    await cooptCtr.vote();
    await assoOrg.handleCooptationAction(cooptCtr.address, {from: owner});
    // second cooptation NOK : already a member
    let cooptCtr2 = await AssoCoopt.new(assoOrg.address, "Mohamed_test", {from: wannabeMember});
    await cooptCtr2.vote({from:wannabeMember});
    await cooptCtr2.vote({from:owner});
    await tryCatch(assoOrg.handleCooptationAction(cooptCtr2.address, {from: owner}), errTypes.revert);
  });

  it("Cooptation of a random guy is not ok", async() => {
    let assoOrg = await AssoOrg.new("testAssociation", "Issam_test");
    let cooptCtr = await AssoCoopt.new(assoOrg.address, "Ali_test", {from: wannabeMember});
    await tryCatch(cooptCtr.vote.call({from: randomGuy}), errTypes.revert);
  });

  it("Duplicate valid cooptation", async() => {
    let assoOrg = await AssoOrg.new("testAssociation", "Issam_test");
    let cooptCtr = await AssoCoopt.new(assoOrg.address, "Ali_test", {from: wannabeMember});
    await cooptCtr.vote();
    await assoOrg.handleCooptationAction(cooptCtr.address, {from: owner});
    await tryCatch(assoOrg.handleCooptationAction(cooptCtr.address, {from: owner}), errTypes.revert);
  });

});
