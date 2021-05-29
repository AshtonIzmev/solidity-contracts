const MEDCtr = artifacts.require("MED");

contract('MED Income', async (accounts) => {
 
  let tryCatch = require("../utils/exceptions.js").tryCatch;
  let errTypes = require("../utils/exceptions.js").errTypes;

  let centralBankAcc = accounts[0];
  let treasureAcc    = accounts[9];

  let citizen1    = accounts[1];
  let citizen2    = accounts[2];
  let citizen3    = accounts[3];
  let citizen4    = accounts[4];
  let citizen5    = accounts[5];
  let citizen6    = accounts[6];

  it("Universal income for everyone after two days and one month", async() => {
    tmpMedCtr = await MEDCtr.new(treasureAcc, 5, 1000, false, 50000, {from: centralBankAcc});
    await tmpMedCtr.transfer(citizen1, 20000, {from: treasureAcc});

    let bal1_1 = await tmpMedCtr.balanceOf(citizen1);

    // Two days and one month after ...
    await tmpMedCtr.incrementDay({from: centralBankAcc});
    await tmpMedCtr.incrementDay({from: centralBankAcc});
    await tmpMedCtr.incrementMonth({from: centralBankAcc});

    await tmpMedCtr.updateAccount(citizen1, {from: citizen2});
    let bal1_2 = await tmpMedCtr.balanceOf(citizen1);

    let balTreasure = await tmpMedCtr.balanceOf(treasureAcc);
    assert.equal(bal1_1, 20000, "Initial account");
    assert.equal(bal1_2, 20995, "5 e-dh of tax taken (two days) and universal income added");
    assert.equal(balTreasure, 29005, "5 e-dh of tax added and universal income taken");
  });

  it("Tax behavior after two days and one month", async() => {
    tmpMedCtr = await MEDCtr.new(treasureAcc, 5, 1000, false, 50000, {from: centralBankAcc});
    await tmpMedCtr.transfer(citizen1, 20000, {from: treasureAcc});

    // Two days and one month after ...
    await tmpMedCtr.incrementDay({from: centralBankAcc});
    await tmpMedCtr.incrementDay({from: centralBankAcc});
    await tmpMedCtr.incrementMonth({from: centralBankAcc});
    await tmpMedCtr.incrementMonth({from: centralBankAcc});
    await tmpMedCtr.incrementMonth({from: centralBankAcc});
    await tmpMedCtr.incrementMonth({from: centralBankAcc});
    await tmpMedCtr.incrementMonth({from: centralBankAcc});
    await tmpMedCtr.incrementMonth({from: centralBankAcc});
    await tmpMedCtr.incrementMonth({from: centralBankAcc});

    await tmpMedCtr.updateAccount(citizen1, {from: citizen2});
    let bal1_2 = await tmpMedCtr.balanceOf(citizen1);

    assert.equal(bal1_2, 26993, "7 e-dh of tax taken (two days) and universal income added");    
  });

  it("Universal income for everyone after 2 months", async() => {
    tmpMedCtr = await MEDCtr.new(treasureAcc, 5, 1000, false, 50000,{from: centralBankAcc});
    await tmpMedCtr.transfer(citizen1, 20000, {from: treasureAcc});

    let bal1_1 = await tmpMedCtr.balanceOf(citizen1);

    // Two one month after ...
    // not realistic because days should have been incremented
    await tmpMedCtr.incrementMonth({from: centralBankAcc});
    await tmpMedCtr.incrementMonth({from: centralBankAcc});

    await tmpMedCtr.updateAccount(citizen1, {from: citizen2});
    let bal1_2 = await tmpMedCtr.balanceOf(citizen1);

    let balTreasure = await tmpMedCtr.balanceOf(treasureAcc);
    assert.equal(bal1_1, 20000, "Initial account");
    assert.equal(bal1_2, 22000, "Universal income added");
    assert.equal(balTreasure, 28000, "No tax added");
  });

  it("Universal income for everyone after 2 months after a transfer", async() => {
    tmpMedCtr = await MEDCtr.new(treasureAcc, 5, 1000, false, 50000, {from: centralBankAcc});
    await tmpMedCtr.transfer(citizen1, 20000, {from: treasureAcc});

    let bal1_1 = await tmpMedCtr.balanceOf(citizen1);

    // Two one month after ...
    // not realistic because days should have been incremented
    await tmpMedCtr.incrementMonth({from: centralBankAcc});
    await tmpMedCtr.incrementMonth({from: centralBankAcc});

    await tmpMedCtr.transfer(citizen2, 100, {from: citizen1});
    let bal1_2 = await tmpMedCtr.balanceOf(citizen1);
    let bal2 = await tmpMedCtr.balanceOf(citizen2);

    let balTreasure = await tmpMedCtr.balanceOf(treasureAcc);
    assert.equal(bal1_1, 20000, "Initial account");
    assert.equal(bal1_2, 21900, "5 e-dh of tax taken (two days) and universal income added");
    assert.equal(bal2, 2100, "Transfered amount");
    assert.equal(balTreasure, 26000, "No tax added");
  });

  it("New universal income", async() => {
    tmpMedCtr = await MEDCtr.new(treasureAcc, 5, 1000, true, 0, {from: centralBankAcc});
    await tmpMedCtr.mint(50000, {from: centralBankAcc});
    await tmpMedCtr.transfer(citizen1, 20000, {from: treasureAcc});

    let bal1_0 = await tmpMedCtr.balanceOf(citizen1);

    // Two one month after ...
    // not realistic because days should have been incremented
    await tmpMedCtr.incrementMonth({from: centralBankAcc});
    await tmpMedCtr.updateAccount(citizen1, {from: citizen2});

    let bal1_1 = await tmpMedCtr.balanceOf(citizen1);

    await tmpMedCtr.setNewBasicIncome(2000, {from: centralBankAcc});
    await tmpMedCtr.incrementMonth({from: centralBankAcc});
    await tmpMedCtr.updateAccount(citizen1, {from: citizen2});

    let bal1_2 = await tmpMedCtr.balanceOf(citizen1);

    assert.equal(bal1_0, 20000, "Initial account");
    assert.equal(bal1_1, 21000, "After first month of basic income");
    assert.equal(bal1_2, 23000, "After income has changed");
  });

})