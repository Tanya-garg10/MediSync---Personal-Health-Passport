import {
  Horizon,
  Keypair,
  TransactionBuilder,
  Networks,
  BASE_FEE,
  Operation,
  Memo,
  rpc,
  Contract,
  Address,
  nativeToScVal,
  scValToNative,
  xdr,
} from "@stellar/stellar-sdk";
import fs from "fs";
import path from "path";
import {
  buildCanonicalFromEvent,
  hashCanonicalRecord,
} from "./canonicalHash.js";

const HORIZON_URL = "https://horizon-testnet.stellar.org";
const SOROBAN_RPC = process.env.STELLAR_SOROBAN_RPC || "https://soroban-testnet.stellar.org";
const NETWORK = Networks.TESTNET;
const server = new Horizon.Server(HORIZON_URL);
const configPath = path.join(process.cwd(), ".stellar-config.json");

let serverKeypair: Keypair | null = null;
const localRegistry = new Map<string, { hash: string; registeredAt: string; txHash?: string }>();

export async function initStellar(): Promise<Keypair> {
  if (serverKeypair) return serverKeypair;

  const envSecret = process.env.STELLAR_SECRET_KEY;
  if (envSecret && envSecret.startsWith("S") && envSecret.length === 56) {
    try {
      serverKeypair = Keypair.fromSecret(envSecret);
      return serverKeypair;
    } catch {
      /* fall through */
    }
  }

  if (fs.existsSync(configPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(configPath, "utf-8"));
      if (data.secretKey) {
        serverKeypair = Keypair.fromSecret(data.secretKey);
        return serverKeypair;
      }
    } catch {
      /* fall through */
    }
  }

  const newKeypair = Keypair.random();
  try {
    const res = await fetch(
      `https://friendbot.stellar.org/?addr=${encodeURIComponent(newKeypair.publicKey())}`
    );
    if (res.ok) {
      fs.writeFileSync(
        configPath,
        JSON.stringify({ secretKey: newKeypair.secret(), publicKey: newKeypair.publicKey() }, null, 2)
      );
    }
  } catch {
    /* keep in-memory */
  }
  serverKeypair = newKeypair;
  return serverKeypair;
}

export function getContractId(): string | undefined {
  const id = process.env.MEDISYNC_CONTRACT_ID || process.env.STELLAR_CONTRACT_ID;
  return id && id.startsWith("C") ? id : undefined;
}

function manageDataKey(hashHex: string): string {
  return `mh_${hashHex.slice(0, 10)}`;
}

async function registerViaManageData(hashHex: string) {
  const keypair = await initStellar();
  const account = await server.loadAccount(keypair.publicKey());
  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK,
  })
    .addOperation(
      Operation.manageData({
        name: manageDataKey(hashHex),
        value: Buffer.from(hashHex, "hex"),
      })
    )
    .addMemo(Memo.hash(Buffer.from(hashHex, "hex")))
    .setTimeout(180)
    .build();

  tx.sign(keypair);
  const txResult = await server.submitTransaction(tx);
  return {
    success: true as const,
    txHash: txResult.hash,
    publicKey: keypair.publicKey(),
    mode: "manage_data" as const,
    contractId: undefined as string | undefined,
  };
}

async function verifyViaManageData(hashHex: string) {
  const keypair = await initStellar();
  try {
    const account = await server.loadAccount(keypair.publicKey());
    const key = manageDataKey(hashHex);
    const base64Value = account.data_attr[key];
    if (!base64Value) {
      return { verified: false, reason: "No matching record found on Stellar ledger." };
    }
    const storedHash = Buffer.from(base64Value, "base64").toString("hex");
    return storedHash === hashHex
      ? { verified: true, storedHash, mode: "manage_data" as const }
      : {
          verified: false,
          reason: "Hash mismatch.",
          ledgerHash: storedHash,
          mode: "manage_data" as const,
        };
  } catch {
    return { verified: false, reason: "Stellar ledger query failed." };
  }
}

async function registerViaSoroban(hashHex: string) {
  const contractId = getContractId()!;
  const keypair = await initStellar();
  const rpcServer = new rpc.Server(SOROBAN_RPC);
  const contract = new Contract(contractId);
  const hashBytes = Buffer.from(hashHex, "hex");
  const account = await server.loadAccount(keypair.publicKey());

  let tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK,
  })
    .addOperation(
      contract.call(
        "register_record",
        nativeToScVal(hashBytes, { type: "bytes" }),
        new Address(keypair.publicKey()).toScVal()
      )
    )
    .setTimeout(180)
    .build();

  const sim = await rpcServer.simulateTransaction(tx);
  if (rpc.Api.isSimulationError(sim)) {
    throw new Error(sim.error || "Soroban simulation failed");
  }
  tx = rpc.assembleTransaction(tx, sim).build();
  tx.sign(keypair);
  const sent = await rpcServer.sendTransaction(tx);
  if (sent.status === "ERROR") {
    throw new Error(sent.errorResult?.toXDR("base64") || "Soroban send failed");
  }

  let getResp = await rpcServer.getTransaction(sent.hash);
  const start = Date.now();
  while (getResp.status === "NOT_FOUND" && Date.now() - start < 30000) {
    await new Promise((r) => setTimeout(r, 1000));
    getResp = await rpcServer.getTransaction(sent.hash);
  }

  return {
    success: true as const,
    txHash: sent.hash,
    publicKey: keypair.publicKey(),
    mode: "soroban" as const,
    contractId,
  };
}

async function verifyViaSoroban(hashHex: string) {
  const contractId = getContractId()!;
  const keypair = await initStellar();
  const rpcServer = new rpc.Server(SOROBAN_RPC);
  const contract = new Contract(contractId);
  const hashBytes = Buffer.from(hashHex, "hex");
  const account = await server.loadAccount(keypair.publicKey());

  let tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK,
  })
    .addOperation(contract.call("verify_record", nativeToScVal(hashBytes, { type: "bytes" })))
    .setTimeout(180)
    .build();

  const sim = await rpcServer.simulateTransaction(tx);
  if (rpc.Api.isSimulationError(sim) || !rpc.Api.isSimulationSuccess(sim)) {
    return { verified: false, reason: "Soroban verify simulation failed.", mode: "soroban" as const };
  }

  const retval = sim.result?.retval;
  const verified = retval ? Boolean(scValToNative(retval)) : false;
  return { verified, storedHash: hashHex, mode: "soroban" as const, contractId };
}

export async function registerRecordHash(hashHex: string) {
  localRegistry.set(hashHex, {
    hash: hashHex,
    registeredAt: new Date().toISOString(),
  });

  try {
    if (getContractId()) {
      const result = await registerViaSoroban(hashHex);
      localRegistry.set(hashHex, {
        hash: hashHex,
        registeredAt: new Date().toISOString(),
        txHash: result.txHash,
      });
      return result;
    }
    const result = await registerViaManageData(hashHex);
    localRegistry.set(hashHex, {
      hash: hashHex,
      registeredAt: new Date().toISOString(),
      txHash: result.txHash,
    });
    return result;
  } catch (err: any) {
    try {
      const result = await registerViaManageData(hashHex);
      localRegistry.set(hashHex, {
        hash: hashHex,
        registeredAt: new Date().toISOString(),
        txHash: result.txHash,
      });
      return result;
    } catch (e2: any) {
      return {
        success: false as const,
        error: e2?.message || err?.message || "Registration failed",
      };
    }
  }
}

export async function verifyRecordHash(hashHex: string) {
  try {
    if (getContractId()) {
      const r = await verifyViaSoroban(hashHex);
      if (r.verified) return r;
    }
    const md = await verifyViaManageData(hashHex);
    if (md.verified) return md;
    const local = localRegistry.get(hashHex);
    if (local) {
      return {
        verified: true,
        storedHash: hashHex,
        mode: "local_cache" as const,
        registeredAt: local.registeredAt,
      };
    }
    return md;
  } catch (err: any) {
    return { verified: false, reason: err?.message || "Verification failed" };
  }
}

export function computeEventCanonicalHash(event: any): string {
  const canonical = buildCanonicalFromEvent(event);
  return hashCanonicalRecord(canonical);
}

export async function notarizeHashOnStellar(hashHex: string, _reportId: string) {
  return registerRecordHash(hashHex);
}

export async function verifyHashOnStellar(_reportId: string, hashHex: string) {
  return verifyRecordHash(hashHex);
}

export async function registerConsentOnStellar(
  consentId: string,
  doctorName: string,
  permission: string,
  expiryTime: number
) {
  const keypair = await initStellar();
  try {
    const account = await server.loadAccount(keypair.publicKey());
    const permCode = permission === "Read Only" ? "RO" : "FA";
    const valueStr = `${permCode}:${expiryTime}:${doctorName.substring(0, 30)}`;
    const tx = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: NETWORK,
    })
      .addOperation(
        Operation.manageData({
          name: `cs_${consentId.substring(0, 10)}`,
          value: Buffer.from(valueStr),
        })
      )
      .setTimeout(180)
      .build();
    tx.sign(keypair);
    const txResult = await server.submitTransaction(tx);
    return { success: true, txHash: txResult.hash };
  } catch (err: any) {
    return { success: false, error: err?.message || "Stellar write error" };
  }
}

export async function verifyConsentOnStellar(consentId: string) {
  const keypair = await initStellar();
  try {
    const account = await server.loadAccount(keypair.publicKey());
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
      return {
        valid: false,
        reason: "Consent expired on " + new Date(expiryTime * 1000).toLocaleString(),
        permission,
        doctorName,
        isExpired: true,
      };
    }
    return { valid: true, permission, doctorName, expiryTime };
  } catch {
    return { valid: false, reason: "Ledger check failed." };
  }
}

export async function getStellarWalletDetails() {
  const keypair = await initStellar();
  const publicKey = keypair.publicKey();
  try {
    const account = await server.loadAccount(publicKey);
    const nativeBalance = account.balances.find((b) => b.asset_type === "native");
    return {
      publicKey,
      balance: nativeBalance ? nativeBalance.balance : "0.00",
      contractId: getContractId() || null,
      mode: getContractId() ? "soroban" : "manage_data",
    };
  } catch {
    return {
      publicKey,
      balance: "0.00 (Unfunded)",
      contractId: getContractId() || null,
      mode: getContractId() ? "soroban" : "manage_data",
    };
  }
}

export { xdr };
