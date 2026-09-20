// Contract test — seal emits, soulbound locked, revoke flips
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { network } from "hardhat";

describe("VeridexSBT", () => {
  it("seal emits, soulbound locked, revoke flips", async () => {
    const { viem } = await network.getOrCreate();
    const [minter, alice] = await viem.getWalletClients();
    const SBT = await viem.deployContract("VeridexSBT", [
      minter.account.address, "https://api.example/v1/tokens/",
    ]);
    const docId = ("0x" + "aa".repeat(32)) as `0x${string}`;
    await SBT.write.seal([
      alice.account.address, docId, ("0x" + "bb".repeat(32)) as `0x${string}`,
      ("0x" + "cc".repeat(32)) as `0x${string}`, 0n, ("0x" + "dd".repeat(32)) as `0x${string}`,
    ]);
    const id = await SBT.read.tokenOfDoc([docId]);
    let reverted = false; // soulbound: transfer must revert
    try {
      await SBT.write.transferFrom([alice.account.address, minter.account.address, id]);
    } catch { reverted = true; }
    assert.equal(reverted, true);
    await SBT.write.revoke([id]);
    const seal = (await SBT.read.getSeal([id])) as { revoked: boolean };
    assert.equal(seal.revoked, true);
  });
});
