const hre = require("hardhat");
const namehash = require("eth-ens-namehash");
const utils = require("web3-utils");
const ethers = hre.ethers;

const tld = "eth";
const ETH_LABEL = utils.sha3(tld);
const ETH_NODE = namehash.hash(tld);
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
const ZERO_HASH =
  "0x0000000000000000000000000000000000000000000000000000000000000000";

const MIN_COMMITMENT_AGE = 60;
const MAX_COMMITMENT_AGE = 86400;

async function main() {
  const ENSRegistry = await ethers.getContractFactory("ENSRegistry");
  const StablePriceOracle = await ethers.getContractFactory(
    "StablePriceOracle"
  );
  const DummyOracle = await ethers.getContractFactory("DummyOracle");
  const ETHRegistrarController = await ethers.getContractFactory(
    "ETHRegistrarController"
  );
  const OwnedResolver = await ethers.getContractFactory("OwnedResolver");
  const BaseRegistrarImplementation = await ethers.getContractFactory(
    "BaseRegistrarImplementation"
  );
  const ReverseRegistrar = await ethers.getContractFactory("ReverseRegistrar");
  const Root = await ethers.getContractFactory("Root");
  const DefaultReverseResolver = await ethers.getContractFactory(
    "DefaultReverseResolver"
  );

  const signers = await ethers.getSigners();
  const accounts = signers.map((s) => s.address);

  const ens = await ENSRegistry.deploy();
  await ens.deployed();
  console.log(`ENSRegistry contract address: ${ens.address}`);

  const ownedResolver = await OwnedResolver.deploy();
  await ownedResolver.deployed();
  console.log(`OwnedResolver contract address: ${ownedResolver.address}`);

  // Deploy and activate the .eth registrar
  const registrar = await BaseRegistrarImplementation.deploy(
    ens.address,
    ETH_NODE
  );
  await registrar.deployed();
  console.log(
    `BaseRegistrarImplementation contract address: ${registrar.address}`
  );

  await ens.setSubnodeRecord(
    ZERO_HASH,
    ETH_LABEL,
    registrar.address,
    ownedResolver.address,
    0
  );

  await ens.setSubnodeOwner(ZERO_HASH, utils.sha3(tld), registrar.address);

  console.log("Start: Set resolver.one address for main Resolver");

  // Set address for owned resolver
  await registrar.addController(accounts[0]);
  await registrar.register(utils.sha3("resolver"), accounts[0], 31536000);
  await ens.setResolver(
    namehash.hash(`resolver.${tld}`),
    ownedResolver.address
  );
  await ownedResolver["setAddr(bytes32,address)"](
    namehash.hash(`resolver.${tld}`),
    ownedResolver.address
  );
  await registrar.removeController(accounts[0]);

  console.log("End: Set resolver.one address for main Resolver");

  const dummyOracle = await DummyOracle.deploy(10);
  await dummyOracle.deployed();
  console.log(`DummyOracle contract address: ${dummyOracle.address}`);

  const priceOracle = await StablePriceOracle.deploy(
    dummyOracle.address,
    [0, 0, 4, 2, 1]
  );
  await priceOracle.deployed();
  console.log(`StablePriceOracle contract address: ${priceOracle.address}`);

  const ethRegistrarController = await ETHRegistrarController.deploy(
    registrar.address,
    priceOracle.address,
    MIN_COMMITMENT_AGE,
    MAX_COMMITMENT_AGE
  );
  await ethRegistrarController.deployed();
  console.log(
    `ETHRegistrarController contract address: ${ethRegistrarController.address}`
  );

  // Configure the owned resolver
  await ownedResolver["setAddr(bytes32,address)"](ETH_NODE, registrar.address);
  await ownedResolver.setInterface(ETH_NODE, "0x6ccb2df4", registrar.address); // Legacy wrong ERC721 ID
  await ownedResolver.setInterface(ETH_NODE, "0x80ac58cd", registrar.address); // Correct ERC721 ID
  await ownedResolver.setInterface(
    ETH_NODE,
    "0x018fac06",
    ethRegistrarController.address
  );
  await registrar.addController(ethRegistrarController.address);
  await ownedResolver.transferOwnership(ethRegistrarController.address);

  // Deploy and activate the reverse registrar
  const defaultReverseResolver = await DefaultReverseResolver.deploy(
    ens.address
  );
  await defaultReverseResolver.deployed();
  console.log(
    `DefaultReverseResolver contract address: ${defaultReverseResolver.address}`
  );

  const reverseRegistrar = await ReverseRegistrar.deploy(
    ens.address,
    defaultReverseResolver.address
  );
  await reverseRegistrar.deployed();
  console.log(`ReverseRegistrar contract address: ${reverseRegistrar.address}`);

  await ens.setSubnodeOwner(ZERO_HASH, utils.sha3("reverse"), accounts[0]);
  await ens.setSubnodeOwner(
    namehash.hash("reverse"),
    utils.sha3("addr"),
    reverseRegistrar.address
  );
  await ens.setOwner(namehash.hash("reverse"), ZERO_ADDRESS);

  const root = await Root.deploy(ens.address);
  await root.deployed();
  console.log(`Root contract address: ${root.address}`);
  await ens.setOwner(ZERO_HASH, root.address);

  // Transfer ownership of the root to the required account
  await root.setController(accounts[0], true);
  await root.transferOwnership(accounts[0]);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
