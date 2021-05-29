const MEDCtr = artifacts.require("MED");

contract('MED', async (accounts) => {
 
  let tryCatch = require("../utils/exceptions.js").tryCatch;
  let errTypes = require("../utils/exceptions.js").errTypes;

  let emptyMedCtr;
  let centralBankAcc = accounts[0];
  let treasureAcc    = accounts[9];

  let citizen1    = accounts[1];
  let citizen2    = accounts[2];
  let citizen3    = accounts[3];
  let citizen4    = accounts[4];
  let citizen5    = accounts[5];
  let citizen6    = accounts[6];

  it("Name and symbol should be correct", async() => {
    emptyMedCtr = await MEDCtr.new(treasureAcc, 5, 1000, false, 0, {from: centralBankAcc});
    let name = await emptyMedCtr.name();
    let symbol = await emptyMedCtr.symbol();
    assert.equal(name, "Moroccan E-Dirham", "Name should be correct");
    assert.equal(symbol, "MED", "Symbol should be correct");
  });

  it("Contract creation with various parameters", async() => {
    await MEDCtr.new(treasureAcc, 5, 1000, false, 100, {from: centralBankAcc});
    await MEDCtr.new(treasureAcc, 95, 1000, false, 200, {from: centralBankAcc});
    await MEDCtr.new(treasureAcc, 5, 5000, false, 30000, {from: centralBankAcc});
    await MEDCtr.new(treasureAcc, 15, 100, false, 400000, {from: centralBankAcc});
    await MEDCtr.new(treasureAcc, 55, 500, false, 9999999999, {from: centralBankAcc});
  });

  it("Initial amount is correct", async() => {
    emptyMedCtr = await MEDCtr.new(treasureAcc, 5, 1000, false, 12345, {from: centralBankAcc});
    let centralBankBalance = await emptyMedCtr.balanceOf(centralBankAcc);
    let treasureBalance = await emptyMedCtr.balanceOf(treasureAcc);
    assert.equal(centralBankBalance, 0, "No money on centralBank account");
    assert.equal(treasureBalance, 12345, "No money yet on treasure reserve account");
  });

  it("should make the creator of the contract the owner", async() => {
    emptyMedCtr = await MEDCtr.new(treasureAcc, 5, 1000, false, 0, {from: centralBankAcc});
    let centralBankBalance = await emptyMedCtr.balanceOf(centralBankAcc);
    let treasureBalance = await emptyMedCtr.balanceOf(treasureAcc);
    assert.equal(centralBankBalance, 0, "No money on centralBank account");
    assert.equal(treasureBalance, 0, "No money yet on treasure reserve account");
  });

  it("Only central bank should be allowed to mint and burn", async() => {
    emptyMedCtr = await MEDCtr.new(treasureAcc, 5, 1000, true, 0, {from: centralBankAcc});
    await tryCatch(emptyMedCtr.mint(100, {from: treasureAcc}), errTypes.revert);
    await tryCatch(emptyMedCtr.burn(100, {from: treasureAcc}), errTypes.revert);
    await tryCatch(emptyMedCtr.mint(100, {from: citizen1}), errTypes.revert);
  });

  it("Can't burn money if total supply is empty", async() => {
    emptyMedCtr = await MEDCtr.new(treasureAcc, 5, 1000, false, 0, {from: centralBankAcc});
    await tryCatch(emptyMedCtr.burn(100, {from: centralBankAcc}), errTypes.revert);
  });

  it("Can't burn money if total supply is less than amount to burn", async() => {
    tmpMedCtr = await MEDCtr.new(treasureAcc, 5, 1000, true, 0, {from: centralBankAcc});
    await tmpMedCtr.mint(99, {from: centralBankAcc});
    await tryCatch(tmpMedCtr.burn(100, {from: centralBankAcc}), errTypes.revert);
  });

  it("Mint then burn work properly", async() => {
    tmpMedCtr = await MEDCtr.new(treasureAcc, 5, 1000, true, 0, {from: centralBankAcc});
    let totalSupply1 = await tmpMedCtr.totalSupply();
    assert.equal(totalSupply1, 0, "Total supply should be 0 at the begining");
    await tmpMedCtr.mint(99, {from: centralBankAcc});
    let totalSupply2 = await tmpMedCtr.totalSupply();
    assert.equal(totalSupply2, 99, "Mint did not work properly");
    await tmpMedCtr.burn(97, {from: centralBankAcc});
    let totalSupply3 = await tmpMedCtr.totalSupply();
    assert.equal(totalSupply3, 2, "Burn did not work properly");
  });

  it("Non central bank cannot mint nor burn", async() => {
    tmpMedCtr = await MEDCtr.new(treasureAcc, 5, 1000, true, 0, {from: centralBankAcc});
    tryCatch(tmpMedCtr.mint(100, {from: treasureAcc}), errTypes.revert);
    tryCatch(tmpMedCtr.mint(100, {from: citizen1}), errTypes.revert);
    await tmpMedCtr.mint(99, {from: centralBankAcc});
    tryCatch(tmpMedCtr.burn(50, {from: treasureAcc}), errTypes.revert);
    tryCatch(tmpMedCtr.burn(50, {from: citizen1}), errTypes.revert);
  });

  it("Non mintable contracts", async() => {
    tmpMedCtr = await MEDCtr.new(treasureAcc, 5, 1000, false, 0, {from: centralBankAcc});
    tryCatch(tmpMedCtr.mint(100, {from: centralBankAcc}), errTypes.revert);
    tryCatch(tmpMedCtr.mint(100, {from: centralBankAcc}), errTypes.revert);
  });

  it("Transfer is working properly", async() => {
    tmpMedCtr = await MEDCtr.new(treasureAcc, 5, 1000, false, 100, {from: centralBankAcc});

    await tmpMedCtr.transfer(citizen1, 10, {from: treasureAcc});
    await tmpMedCtr.transfer(citizen3, 15, {from: treasureAcc});
    await tmpMedCtr.transfer(citizen5, 20, {from: treasureAcc});

    let bal1 = await tmpMedCtr.balanceOf(citizen1);
    let bal2 = await tmpMedCtr.balanceOf(citizen2);
    let bal3 = await tmpMedCtr.balanceOf(citizen3);
    assert.equal(bal1, 10, "Amount has been transfered");
    assert.equal(bal2, 0, "No transfer has occured");
    assert.equal(bal3, 15, "Amount has been transfered");
    let totalSupply = await tmpMedCtr.totalSupply();
    assert.equal(totalSupply, 100, "Total supply does not change with transfer");
  });

  it("Can't transfer more than you have", async() => {
    tmpMedCtr = await MEDCtr.new(treasureAcc, 5, 1000, false, 100, {from: centralBankAcc});

    await tmpMedCtr.transfer(citizen1, 10, {from: treasureAcc});

    await tmpMedCtr.transfer(citizen2, 5, {from: citizen1});
    await tmpMedCtr.transfer(citizen3, 5, {from: citizen1});
    tryCatch(tmpMedCtr.transfer(citizen4, 5, {from: citizen1}), errTypes.revert);

    let bal1 = await tmpMedCtr.balanceOf(citizen1);
    let bal2 = await tmpMedCtr.balanceOf(citizen2);
    let bal3 = await tmpMedCtr.balanceOf(citizen3);
    assert.equal(bal1, 0, "Citizen 1 balance is now empty");
    assert.equal(bal2, 5, "No transfer has ever occured to citizen 2");
    assert.equal(bal3, 5, "Amount has been transfered to citizen 3");
  });

})