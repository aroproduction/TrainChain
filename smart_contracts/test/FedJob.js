const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("AIModelTraining — Federated Jobs", function () {
  let contract, owner, requester, contrib1, contrib2, platform;

  beforeEach(async function () {
    [owner, requester, contrib1, contrib2, platform] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("AIModelTraining");
    contract = await Factory.connect(owner).deploy(platform.address);
    await contract.waitForDeployment();
  });

  it("createFederatedJob: stores job and emits event", async function () {
    const stake = ethers.parseEther("0.1");
    await expect(
      contract.connect(requester).createFederatedJob(
        10001, "datasetCID", "metaCID", "TinyLlama", 2,
        { value: stake }
      )
    ).to.emit(contract, "FedJobCreated").withArgs(10001, requester.address, 2, stake);
  });

  it("acceptFederatedJob: two contributors fill the slots", async function () {
    const stake = ethers.parseEther("0.1");
    await contract.connect(requester).createFederatedJob(10001, "d", "m", "M", 2, { value: stake });
    await contract.connect(contrib1).acceptFederatedJob(10001);
    await contract.connect(contrib2).acceptFederatedJob(10001);

    const details = await contract.getFedJobDetails(10001);
    expect(Number(details.contributorCount)).to.equal(2);
  });

  it("acceptFederatedJob: third contributor is rejected when slots full", async function () {
    const [,,,,, extra] = await ethers.getSigners();
    const stake = ethers.parseEther("0.1");
    await contract.connect(requester).createFederatedJob(10001, "d", "m", "M", 2, { value: stake });
    await contract.connect(contrib1).acceptFederatedJob(10001);
    await contract.connect(contrib2).acceptFederatedJob(10001);
    await expect(contract.connect(extra).acceptFederatedJob(10001))
      .to.be.revertedWith("All slots filled");
  });

  it("submitAdapter + completeFederatedJob: pays contributors and emits event", async function () {
    const stake = ethers.parseEther("0.2");
    await contract.connect(requester).createFederatedJob(10001, "d", "m", "M", 2, { value: stake });
    await contract.connect(contrib1).acceptFederatedJob(10001);
    await contract.connect(contrib2).acceptFederatedJob(10001);
    await contract.connect(contrib1).submitAdapter(10001, "Qm_adapter1");
    await contract.connect(contrib2).submitAdapter(10001, "Qm_adapter2");

    const before1 = await ethers.provider.getBalance(contrib1.address);
    const before2 = await ethers.provider.getBalance(contrib2.address);

    const tx = await contract.connect(owner).completeFederatedJob(10001, "Qm_merged");
    const receipt = await tx.wait();

    const after1 = await ethers.provider.getBalance(contrib1.address);
    const after2 = await ethers.provider.getBalance(contrib2.address);

    // Each gets (0.2 * 90% / 2) = 0.09 ETH minus tiny gas (they didn't pay gas here)
    expect(after1 - before1).to.be.closeTo(
      ethers.parseEther("0.09"), ethers.parseEther("0.001")
    );
    expect(after2 - before2).to.be.closeTo(
      ethers.parseEther("0.09"), ethers.parseEther("0.001")
    );
  });

  it("completeFederatedJob: reverts if not all adapters submitted", async function () {
    const stake = ethers.parseEther("0.2");
    await contract.connect(requester).createFederatedJob(10001, "d", "m", "M", 2, { value: stake });
    await contract.connect(contrib1).acceptFederatedJob(10001);
    await contract.connect(contrib2).acceptFederatedJob(10001);
    await contract.connect(contrib1).submitAdapter(10001, "Qm_adapter1");
    // contrib2 has NOT submitted yet

    await expect(contract.connect(owner).completeFederatedJob(10001, "Qm_merged"))
      .to.be.revertedWith("Not all adapters submitted yet");
  });

  it("completeJob (existing): uses owner modifier instead of hardcoded address", async function () {
    const stake = ethers.parseEther("0.1");
    await contract.connect(requester).createJob(1, "folder", "fcid", "mcid", "llm", "TinyLlama", { value: stake });
    await contract.connect(contrib1).acceptJob(1, { value: ethers.parseEther("0.02") });

    await expect(
      contract.connect(owner).completeJob(1, "Qm_model")
    ).to.emit(contract, "JobCompleted");
  });
});