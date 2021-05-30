const AssoOrg = artifacts.require("AssociationOrg");
const MasterOrg = artifacts.require("MasterOrg");

contract('AssociationOrg', async (accounts) => {
 
  let tryCatch = require("../utils/exceptions.js").tryCatch;
  let errTypes = require("../utils/exceptions.js").errTypes;

  let assoSimpleOrg;
  let masterOrg;
  let owner         = accounts[0];
  let nonOwner      = accounts[1];
  let wannabeMember = accounts[5];

  before(async() => {
    masterOrg = await MasterOrg.new();
    assoSimpleOrg = await AssoOrg.new("testAssociation", "Issam_test", masterOrg.address);
  });

  it("should make the creator of the contract the owner", async() => {
    let _owner = await assoSimpleOrg.owner();
    assert.equal(_owner, owner, "Owner is the creator of the contract");
  })

  it("owner should be in member log", async() => {
    let memberHistoricCount = await assoSimpleOrg.getMemberHistoricCount();
    let _owner = await assoSimpleOrg.membersHistoric(0);
    assert.equal(memberHistoricCount, 1, "Owner is the only member");
    assert.equal(_owner.addr, owner, "Owner is the only member");
    assert.equal(_owner.name, "Issam_test", "Owner is the only member");
  })

  it("We should have only one member at start", async() => {
    let memCount = await assoSimpleOrg.membersCount();
    assert.equal(memCount, 1, "Only one member");
  })

  it("Should not allow empty member name of association name", async() => {
    await tryCatch(AssoOrg.new("testAssociation", "", masterOrg.address), errTypes.revert);
    await tryCatch(AssoOrg.new("", "Issam_test", masterOrg.address), errTypes.revert);
    await tryCatch(AssoOrg.new("", "", masterOrg.address), errTypes.revert);
  })

  it("Name is correct", async() => {
    let memCount = await assoSimpleOrg.name();
    assert.equal(memCount, "testAssociation", "Name is correct");
  })

  it("Owner is a member :)", async() => {
    let isMem = await assoSimpleOrg.members(owner);
    let amIMem = await assoSimpleOrg.amIMember();
    assert.isTrue(isMem, "Owner is a member");
    assert.isTrue(amIMem, "Owner is a member");
  })

  it("Others are not members :)", async() => {
    let isMem = await assoSimpleOrg.members(nonOwner);
    let amIMem = await assoSimpleOrg.amIMember.call({from: nonOwner});
    assert.isFalse(isMem, "Other is not a member");
    assert.isFalse(amIMem, "Other is not a member");
  })

  it("Maintenance mode can be activated by owner", async() => {
    let maintenanceModeBefore = await assoSimpleOrg.maintenanceMode();
    await assoSimpleOrg.switchMaintenanceMode();
    let maintenanceModeAfter = await assoSimpleOrg.maintenanceMode();
    await assoSimpleOrg.switchMaintenanceMode();
    assert.isFalse(maintenanceModeBefore, "Maintenance mode is not activated before");
    assert.isTrue(maintenanceModeAfter, "Maintenance mode is activated after");
  })

  it("Maintenance mode cannot be activated by non owner", async() => {
    let maintenanceModeBefore = await assoSimpleOrg.maintenanceMode();
    await tryCatch(assoSimpleOrg.switchMaintenanceMode({from:nonOwner}), errTypes.revert);
    let maintenanceModeAfter = await assoSimpleOrg.maintenanceMode();
    assert.isFalse(maintenanceModeBefore, "Maintenance mode is not activated before");
    assert.isFalse(maintenanceModeAfter, "Maintenance mode is not activated after");
  })

  it("Association creation is correctly logged", async() => {
    let masterOrg2 = await MasterOrg.new();
    await AssoOrg.new("testAssociation", "i1", masterOrg2.address);
    await AssoOrg.new("testAssociation", "i2", masterOrg2.address);
    await AssoOrg.new("testAssociation", "i3", masterOrg2.address);
    let events = await masterOrg2.getPastEvents('CreationEvent', { fromBlock: 0, toBlock: 'latest' });
    assert.equal(events.length, 3);
  })

})
