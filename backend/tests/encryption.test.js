const assert = require("assert");
const {
  encrypt,
  decrypt,
  wrapDek,
  unwrapDek,
} = require("../src/utils/encryption");

async function runTests() {
  process.env.VAULT_KEY = "b".repeat(64);

  const firstUserDek = require("crypto").randomBytes(32);
  const secondUserDek = require("crypto").randomBytes(32);
  const wrapped = wrapDek(firstUserDek);
  const unwrapped = unwrapDek(wrapped.encrypted, wrapped.iv, wrapped.authTag);

  assert.deepStrictEqual(unwrapped, firstUserDek);
  assert.notStrictEqual(wrapped.encrypted, firstUserDek.toString("hex"));
  console.log("✔ Test 1 Passed: A user DEK is stored only as wrapped ciphertext.");

  const encryptedPassword = encrypt("example-vault-secret", firstUserDek);
  assert.strictEqual(
    decrypt(
      encryptedPassword.encrypted,
      encryptedPassword.iv,
      encryptedPassword.authTag,
      firstUserDek
    ),
    "example-vault-secret"
  );
  assert.throws(() =>
    decrypt(
      encryptedPassword.encrypted,
      encryptedPassword.iv,
      encryptedPassword.authTag,
      secondUserDek
    )
  );
  console.log("✔ Test 2 Passed: Only the matching user's DEK decrypts a vault item.");

  const replacementByte =
    encryptedPassword.encrypted.slice(0, 2) === "00" ? "01" : "00";
  const tamperedCiphertext =
    `${replacementByte}${encryptedPassword.encrypted.slice(2)}`;
  assert.throws(() =>
    decrypt(
      tamperedCiphertext,
      encryptedPassword.iv,
      encryptedPassword.authTag,
      firstUserDek
    )
  );
  assert.throws(() =>
    unwrapDek(wrapped.encrypted, wrapped.iv, "00".repeat(16))
  );
  assert.throws(() => encrypt("secret", Buffer.alloc(16)));
  console.log("✔ Test 3 Passed: Tampered data and invalid keys are rejected.");
}

runTests().catch((error) => {
  console.error("Encryption test failed:", error);
  process.exitCode = 1;
});
