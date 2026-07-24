import { Horizon, Keypair, TransactionBuilder, Networks, BASE_FEE, Operation, Memo } from "@stellar/stellar-sdk";
import fs from "fs";
import path from "path";
import crypto from "crypto";

const HORIZON_URL = "https://horizon-testnet.stellar.org";
const server = new Horizon.Server(HORIZON_URL);

let serverKeypair: Keypair | null = null;

// File path to persist generated credentials so they survive backend restarts
const configPath = path.join(process.cwd(), ".stellar-config.json");

/**
 * Initializes the Stellar Keypair and funds it on Testnet if needed.
 */
export async function initStellar(): Promise<Keypair> {
  if (serverKeypair) return serverKeypair;

  const envSecret = process.env.STELLAR_SECRET_KEY;
  if (envSecret && envSecret.startsWith("S") && envSecret.length === 56) {
    try {
      serverKeypair = Keypair.fromSecret(envSecret);
      console.log("Stellar initialized with environment Secret Key. Public Key:", serverKeypair.publicKey());
      return serverKeypair;
    } catch (e) {
      console.error("Invalid STELLAR_SECRET_KEY in environment, fallback to local file:", e);
    }
  }

  // Fallback: check if we have a locally stored config keypair
  if (fs.existsSync(configPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(configPath, "utf-8"));
      if (data.secretKey) {
        serverKeypair = Keypair.fromSecret(data.secretKey);
        console.log("Stellar loaded from saved config. Public Key:", serverKeypair.publicKey());
        return serverKeypair;
      }
    } catch (e) {
      console.error("Failed to parse local stellar config, regenerating:", e);
    }
  }

  // Generate new Keypair
  const newKeypair = Keypair.random();
  const secretKey = newKeypair.secret();
  const publicKey = newKeypair.publicKey();
  
  console.log("Generated new Stellar keypair for testnet. Funding with Friendbot...", publicKey);
  
  try {
    const res = await fetch(`https://friendbot.stellar.org/?addr=${encodeURIComponent(publicKey)}`);
    if (res.ok) {
      console.log("Stellar account funded successfully by Friendbot!");
      fs.writeFileSync(configPath, JSON.stringify({ secretKey, publicKey }, null, 2));
      serverKeypair = newKeypair;
    } else {
      console.error("Friendbot funding failed:", await res.text());
    }
  } catch (e) {
    console.error("Network error funding Stellar account via Friendbot:", e);
  }

  if (!serverKeypair) {
    // If all else fails, use the generated keypair in-memory so the app can compile and function
    serverKeypair = newKeypair;
  }
  return serverKeypair;
}

/**
 * Generates a SHA-256 hash of report/event data
 */
export function generateEventHash(event: any): string {
  const eventDataString = JSON.stringify({
    id: event.id,
    title: event.title,
    date: event.date,
    findings: event.findings,
    nextSteps: event.nextSteps,
    recordType: event.recordType,
    severity: event.severity,
    clinician: event.clinician,
    facility: event.facility,
  });
  return crypto.createHash("sha256").update(eventDataString).digest("hex");
}

/**
 * Notarizes a document's SHA-256 hash onto the Stellar blockchain testnet.
 */
export async function notarizeHashOnStellar(hashHex: string, reportId: string) {
  const keypair = await initStellar();
  const publicKey = keypair.publicKey();
  
  console.log(`Submitting Stellar transaction from ${publicKey} for report ${reportId} with hash ${hashHex}...`);
  
  try {
    const account = await server.loadAccount(publicKey);
    
    // Store key = `md_${reportId}` and value = hashHex as ManageData (both in Memo and state)
    const tx = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: Networks.TESTNET,
    })
      .addOperation(
        Operation.manageData({
          name: `md_${reportId.substring(0, 10)}`, // Key up to 64 bytes
          value: Buffer.from(hashHex, "hex"),      // Value up to 64 bytes
        })
      )
      .addMemo(Memo.hash(Buffer.from(hashHex, "hex")))
      .setTimeout(180)
      .build();
    
    tx.sign(keypair);
    const txResult = await server.submitTransaction(tx);
    console.log("Stellar transaction submitted successfully. Hash:", txResult.hash);
    return {
      success: true,
      txHash: txResult.hash,
      ledger: txResult.ledger,
      publicKey: publicKey,
    };
  } catch (err: any) {
    console.error("Stellar transaction submission failed:", err?.response?.data || err);
    return {
      success: false,
      error: err?.message || "Stellar transaction error",
    };
  }
}

/**
 * Verifies a report's hash against the Stellar ledger.
 */
export async function verifyHashOnStellar(reportId: string, hashHex: string) {
  const keypair = await initStellar();
  const publicKey = keypair.publicKey();
  try {
    const account = await server.loadAccount(publicKey);
    const key = `md_${reportId.substring(0, 10)}`;
    const base64Value = account.data_attr[key];
    if (!base64Value) {
      return { verified: false, reason: "No matching record found on the Stellar ledger." };
    }
    const storedHash = Buffer.from(base64Value, "base64").toString("hex");
    if (storedHash === hashHex) {
      return { verified: true, storedHash };
    } else {
      return { verified: false, reason: "Hash mismatch. The ledger hash does not match current record.", ledgerHash: storedHash };
    }
  } catch (err: any) {
    console.error("Error verifying hash on Stellar:", err);
    return { verified: false, reason: "Stellar account not found or ledger query failed." };
  }
}

/**
 * Registers a patient consent on the Stellar ledger.
 */
export async function registerConsentOnStellar(consentId: string, doctorName: string, permission: string, expiryTime: number) {
  const keypair = await initStellar();
  const publicKey = keypair.publicKey();
  try {
    const account = await server.loadAccount(publicKey);
    
    const permCode = permission === "Read Only" ? "RO" : "FA";
    const valueStr = `${permCode}:${expiryTime}:${doctorName.substring(0, 30)}`;
    
    const tx = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: Networks.TESTNET,
    })
      .addOperation(
        Operation.manageData({
          name: `cs_${consentId.substring(0, 10)}`, // Consent keys start with cs_
          value: Buffer.from(valueStr),            // Up to 64 bytes
        })
      )
      .setTimeout(180)
      .build();
      
    tx.sign(keypair);
    const txResult = await server.submitTransaction(tx);
    return {
      success: true,
      txHash: txResult.hash,
    };
  } catch (err: any) {
    console.error("Consent registration on Stellar failed:", err);
    return { success: false, error: err?.message || "Stellar write error" };
  }
}

/**
 * Verifies a patient consent on the Stellar ledger.
 */
export async function verifyConsentOnStellar(consentId: string) {
  const keypair = await initStellar();
  const publicKey = keypair.publicKey();
  try {
    const account = await server.loadAccount(publicKey);
    const key = `cs_${consentId.substring(0, 10)}`;
    const base64Value = account.data_attr[key];
    if (!base64Value) {
      return { valid: false, reason: "No matching consent record found on Stellar ledger." };
    }
    const val = Buffer.from(base64Value, "base64").toString();
    const [permCode, expiryStr, doctorName] = val.split(":");
    const expiryTime = parseInt(expiryStr, 10);
    const permission = permCode === "RO" ? "Read Only" : "Full Access";
    
    const now = Math.floor(Date.now() / 1000);
    if (now > expiryTime) {
      return { valid: false, reason: "Consent expired on " + new Date(expiryTime * 1000).toLocaleString(), permission, doctorName, isExpired: true };
    }
    
    return { valid: true, permission, doctorName, expiryTime };
  } catch (err: any) {
    console.error("Consent verification on Stellar failed:", err);
    return { valid: false, reason: "Ledger check failed. Stellar account or consent record not accessible." };
  }
}

/**
 * Returns active public wallet address and balance
 */
export async function getStellarWalletDetails() {
  const keypair = await initStellar();
  const publicKey = keypair.publicKey();
  try {
    const account = await server.loadAccount(publicKey);
    const nativeBalance = account.balances.find((b) => b.asset_type === "native");
    return {
      publicKey,
      balance: nativeBalance ? nativeBalance.balance : "0.00",
    };
  } catch (e) {
    return {
      publicKey,
      balance: "0.00 (Unfunded)",
    };
  }
}
