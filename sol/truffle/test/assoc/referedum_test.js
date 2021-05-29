var AssoOrg = artifacts.require("AssociationOrg");
var AssoCoopt = artifacts.require("AssociationAdministrationCooptation");
var AssoReferendum = artifacts.require("AssociationAdministrationReferendum");

contract('AssociationAdministration', async(accounts) => {

  let tryCatch = require("./exceptions.js").tryCatch;
  let errTypes = require("./exceptions.js").errTypes;

  let assoOrg3Members;
  let owner               = accounts[0];
  let randomGuy           = accounts[1];
  let wannabeMember       = accounts[5];
  let wannabeMemberToo    = accounts[6];

  before(async() => {
    assoOrg3Members = await AssoOrg.new("testAssociation3", "Issam_test");
    // first cooptation
    let cooptCtr = await AssoCoopt.new(assoOrg3Members.address, "Ali_test", {from: wannabeMember});
    await cooptCtr.vote();
    await assoOrg3Members.handleCooptationAction(cooptCtr.address, {from: owner});
    // second cooptation
    let cooptCtr2 = await AssoCoopt.new(assoOrg3Members.address, "Mohamed_test", {from: wannabeMemberToo});
    await cooptCtr2.vote();
    await cooptCtr2.vote({from: wannabeMember})
    await assoOrg3Members.handleCooptationAction(cooptCtr2.address, {from: wannabeMemberToo});
  });

  it("should not allow a non-member to vote", async() => {
    let assoRef = await AssoReferendum.new(assoOrg3Members.address, "What is the answer ?");
    await tryCatch(assoRef.vote({from: randomGuy}), errTypes.revert);
  });

  it("Valid vote", async() => {
    let assoRef = await AssoReferendum.new(assoOrg3Members.address, "What is the answer ?");
    let voteCountBefore = await assoRef.voteCount();
    await assoRef.vote({from: wannabeMember});
    let voteCountAfter = await assoRef.voteCount();
    let didVote = await assoRef.didVotes(wannabeMember);
    let didNotVote = await assoRef.didVotes(wannabeMemberToo);
    assert.equal(voteCountBefore, 0, "No votes before");
    assert.equal(voteCountAfter, 1, "One single vote after");
    assert.isTrue(didVote, "He did vote");
    assert.isFalse(didNotVote, "He did not vote");
  });

  it("unvote please", async() => {
    let assoRef = await AssoReferendum.new(assoOrg3Members.address, "What is the answer ?");
    let voteCountBefore = await assoRef.voteCount();
    await assoRef.vote({from: wannabeMember});
    await assoRef.unvote({from: wannabeMember});
    let voteCountAfter = await assoRef.voteCount();
    let didNotVote = await assoRef.didVotes(wannabeMember);
    assert.equal(voteCountBefore, 0, "No votes before");
    assert.equal(voteCountAfter, 0, "One single vote after");
    assert.isFalse(didNotVote, "He did not vote");
  });

  it("Duplicate vote", async() => {
    let assoRef = await AssoReferendum.new(assoOrg3Members.address, "What is the answer ?");
    let voteCountBefore = await assoRef.voteCount();
    await assoRef.vote({from: wannabeMember});
    let voteCountAfter = await assoRef.voteCount();
    await assoRef.vote({from: wannabeMember});
    let voteCountAfter2 = await assoRef.voteCount();
    assert.equal(voteCountBefore, 0, "No votes before");
    assert.equal(voteCountAfter, 1, "One single vote after");
    assert.equal(voteCountAfter2, 1, "One single vote after duplicate vote");
  });

  it("fake unvote please", async() => {
    let assoRef = await AssoReferendum.new(assoOrg3Members.address, "What is the answer ?");
    let voteCountBefore = await assoRef.voteCount();
    await assoRef.vote({from: wannabeMember});
    await assoRef.unvote({from: wannabeMemberToo});
    let voteCountAfter = await assoRef.voteCount();
    let didVote = await assoRef.didVotes(wannabeMember);
    let didNotVote = await assoRef.didVotes(wannabeMemberToo);
    assert.equal(voteCountBefore, 0, "No votes before");
    assert.equal(voteCountAfter, 1, "One single vote after");
    assert.isTrue(didVote, "He did vote");
    assert.isFalse(didNotVote, "He did not vote");
  });

  it("Valid referendum", async() => {
    let assoRef = await AssoReferendum.new(assoOrg3Members.address, "What is the question ?");
    await assoRef.vote({from: owner});
    await assoRef.vote({from: wannabeMember});
    await assoRef.vote({from: wannabeMemberToo});
    await assoOrg3Members.handleReferendumAction(assoRef.address);
    let count = await assoOrg3Members.getReferendumsCount();
    let proposition = await assoOrg3Members.referendums(0);
    assert.equal(proposition, "What is the question ?");
    assert.equal(count, 1);

    let assoRef2 = await AssoReferendum.new(assoOrg3Members.address, "What is the answer ?");
    await assoRef2.vote({from: owner});
    await assoRef2.vote({from: wannabeMember});
    await assoRef2.vote({from: wannabeMemberToo});
    await assoOrg3Members.handleReferendumAction(assoRef2.address);
    let count2 = await assoOrg3Members.getReferendumsCount();
    let proposition2 = await assoOrg3Members.referendums(1);
    assert.equal(proposition2, "What is the answer ?");
    assert.equal(count2, 2);
  });

  it("Duplicate referendum", async() => {
    let assoRef = await AssoReferendum.new(assoOrg3Members.address, "42");
    await assoRef.vote({from: owner});
    await assoRef.vote({from: wannabeMember});
    await assoRef.vote({from: wannabeMemberToo});
    await assoOrg3Members.handleReferendumAction(assoRef.address);
    await tryCatch(assoOrg3Members.handleReferendumAction(assoRef.address), errTypes.revert);
    let count = await assoOrg3Members.getReferendumsCount();
    let proposition = await assoOrg3Members.referendums(2);
    assert.equal(proposition, "42");
    assert.equal(count, 3);
  });

});