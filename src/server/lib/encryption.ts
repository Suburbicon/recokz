import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

const getKey = () => {
  const key = process.env.REKASSA_ENCRYPTION_KEY;
  if (!key) {
    throw new Error("Missing REKASSA_ENCRYPTION_KEY");
  }
  const bufferKey = Buffer.from(key, "base64");
  if (bufferKey.length !== 32) {
    throw new Error("REKASSA_ENCRYPTION_KEY must be base64 32 bytes");
  }
  return bufferKey;
};

export const encryptString = (value: string) => {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString("base64");
};

export const decryptString = (payload: string) => {
  const data = Buffer.from(payload, "base64");
  const iv = data.subarray(0, IV_LENGTH);
  const tag = data.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
  const encrypted = data.subarray(IV_LENGTH + TAG_LENGTH);
  const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
};
