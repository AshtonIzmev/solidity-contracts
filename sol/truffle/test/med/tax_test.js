const MEDCtr = artifacts.require("MED");

contract('MED Tax', async (accounts) => {
 
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

  it("Tax after two days", async() => {
    tmpMedCtr = await MEDCtr.new(treasureAcc, 5, 1000, false, 8000, {from: centralBankAcc});
    await tmpMedCtr.transfer(citizen1, 3700, {from: treasureAcc});
    await tmpMedCtr.transfer(citizen2, 3600, {from: treasureAcc});

    // Two days after ...
    await tmpMedCtr.incrementDay({from: centralBankAcc});
    await tmpMedCtr.incrementDay({from: centralBankAcc});

    await tmpMedCtr.transfer(citizen5, 20, {from: citizen1});
    await tmpMedCtr.transfer(citizen6, 20, {from: citizen2});

    let bal1 = await tmpMedCtr.balanceOf(citizen1);
    let bal2 = await tmpMedCtr.balanceOf(citizen2);
    let bal5 = await tmpMedCtr.balanceOf(citizen5);
    let bal6 = await tmpMedCtr.balanceOf(citizen6);
    let balTreasure = await tmpMedCtr.balanceOf(treasureAcc);
    assert.equal(bal1, 3679, "1 e-dh of tax taken");
    assert.equal(bal2, 3580, "No e-dh of tax taken since it was rounded to 0");
    assert.equal(bal5, 20, "Transfer correct");
    assert.equal(bal6, 20, "Transfer correct");
    assert.equal(balTreasure, 701, "1 e-dh of tax added");
  });

  it("No taxation twice in a day", async() => {
    tmpMedCtr = await MEDCtr.new(treasureAcc, 5, 1000, false, 50000, {from: centralBankAcc});
    await tmpMedCtr.transfer(citizen1, 20000, {from: treasureAcc});

    await tmpMedCtr.transfer(citizen5, 20, {from: citizen1});
    let bal1_1 = await tmpMedCtr.balanceOf(citizen1);

    // Two days after ...
    await tmpMedCtr.incrementDay({from: centralBankAcc});
    await tmpMedCtr.incrementDay({from: centralBankAcc});

    await tmpMedCtr.transfer(citizen5, 20, {from: citizen1});
    let bal1_2 = await tmpMedCtr.balanceOf(citizen1);

    await tmpMedCtr.transfer(citizen5, 20, {from: citizen1});
    let bal1_3 = await tmpMedCtr.balanceOf(citizen1);

    let balTreasure = await tmpMedCtr.balanceOf(treasureAcc);
    assert.equal(bal1_1, 19980, "No tax taken");
    assert.equal(bal1_2, 19955, "5 e-dh of tax taken");
    assert.equal(bal1_3, 19935, "No tax taken");
    assert.equal(balTreasure, 30005, "5 e-dh of tax added");
  });

  it("Central Bank force taxation", async() => {
    tmpMedCtr = await MEDCtr.new(treasureAcc, 5, 1000, false, 50000, {from: centralBankAcc});
    await tmpMedCtr.transfer(citizen1, 20000, {from: treasureAcc});

    let bal1_1 = await tmpMedCtr.balanceOf(citizen1);

    // Two days after ...
    await tmpMedCtr.incrementDay({from: centralBankAcc});
    await tmpMedCtr.incrementDay({from: centralBankAcc});

    await tmpMedCtr.updateAccount(citizen1, {from: centralBankAcc});
    let bal1_2 = await tmpMedCtr.balanceOf(citizen1);

    let balTreasure = await tmpMedCtr.balanceOf(treasureAcc);
    assert.equal(bal1_1, 20000, "Initial account");
    assert.equal(bal1_2, 19995, "5 e-dh of tax taken");
    assert.equal(balTreasure, 30005, "5 e-dh of tax added");
  });

})