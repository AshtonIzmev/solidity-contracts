const AssoOrg = artifacts.require("AssociationOrg");

contract('AssociationOrg', async (accounts) => {
 
  let tryCatch = require("./exceptions.js").tryCatch;
  let errTypes = require("./exceptions.js").errTypes;

  let assoSimpleOrg;
  let owner         = accounts[0];
  let nonOwner      = accounts[1];
  let wannabeMember = accounts[5];

  before(async() => {
    assoSimpleOrg = await AssoOrg.new("testAssociation", "Issam_test");
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
    await tryCatch(AssoOrg.new("testAssociation", ""), errTypes.revert);
    await tryCatch(AssoOrg.new("", "Issam_test"), errTypes.revert);
    await tryCatch(AssoOrg.new("", ""), errTypes.revert);
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

})
