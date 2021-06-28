var Master = artifacts.require("MasterOrg");
var KYC = artifacts.require("KYC");
var MED = artifacts.require("MED");
var FP = artifacts.require("FP");

var DAT = artifacts.require("DAT");
var Factoring = artifacts.require("Factoring");
var Mudaraba = artifacts.require("Mudaraba");
var Marketplace = artifacts.require("Marketplace");

const treasureAdd = "0x2c6dcE3da7A29Bcc67A0ab4613ae63bafB5AF603";

module.exports = async function(deployer) {
  await deployer.deploy(Master);
  await deployer.deploy(KYC);
  await deployer.deploy(MED, treasureAdd, 10, 90000, false, 200000000000000, KYC.address);
  await deployer.deploy(FP, "Finance Products", "FP");
  await deployer.deploy(Marketplace, 1, 2, MED.address, FP.address);
  await deployer.deploy(DAT, 1000, MED.address, FP.address);
  await deployer.deploy(Factoring, MED.address, FP.address);
  await deployer.deploy(Mudaraba, "A", "12345", 10000, MED.address, FP.address);

  const master = await Master.deployed();
  const kyc = await KYC.deployed();
  const med = await MED.deployed();
  const fp = await FP.deployed();
  const marketplace = await Marketplace.deployed();
  const dat = await DAT.deployed();
  const factoring = await Factoring.deployed();
  const mudaraba = await Mudaraba.deployed();
  
  console.log("var masterAdd = \"" + master.address +"\"");
  console.log("var kycAdd = \"" + kyc.address +"\"");
  console.log("var medAdd = \"" + med.address +"\"");
  console.log("var fpAdd = \"" + fp.address +"\"");
  console.log("var marketplaceAdd = \"" + marketplace.address +"\"");
  console.log("var datAdd = \"" + dat.address +"\"");
  console.log("var factoringAdd = \"" + factoring.address +"\"");
  console.log("var mudarabaAdd = \"" + mudaraba.address +"\"");
};
