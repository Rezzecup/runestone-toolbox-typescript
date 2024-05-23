import {
  Transaction,
  script,
  Psbt,
  address as Address,
  initEccLib,
  networks,
  Signer as BTCSigner,
  crypto,
  payments,
  opcodes,
} from "bitcoinjs-lib";
import { U32, U64, U128 } from "big-varuint-js";
import { Taptree } from "bitcoinjs-lib/src/types";
import { ECPairFactory, ECPairAPI } from "ecpair";
import ecc from "@bitcoinerlab/secp256k1";
import axios, { AxiosResponse } from "axios";
import { Runestone, RuneId, SpacedRune, Symbol } from 'runestone-js';
import networkConfig from "config/network.config";
import { WIFWallet } from 'utils/WIFWallet'
import { SeedWallet } from "utils/SeedWallet";

const network = networks.testnet;
initEccLib(ecc as any);
declare const window: any;
const ECPair: ECPairAPI = ECPairFactory(ecc);

// const seed: string = process.env.MNEMONIC as string;
// const networkType: string = networkConfig.networkType;
// const wallet = new SeedWallet({ networkType: networkType, seed: seed });

const privateKey: string = process.env.PRIVATE_KEY as string;
const networkType: string = networkConfig.networkType;
const wallet = new WIFWallet({ networkType: networkType, privateKey: privateKey });

const blockstream = new axios.Axios({
  baseURL: `https://mempool.space/testnet/api`,
});

async function getTaprootScript() {
  try {
    const response: AxiosResponse<string> = await axios.get(
      `https://mempool.space/api/tx/b21f673d0da0b870c0aed945a018510ca93d79332d3a2ee655f665fc9dd2d261/hex`)
    const data = response.data;
    const tx = Transaction.fromHex(data);

    const inputIndex = 1; // Example input index
    
    // Access the witness buffer for the specific input
    const witnessBuffer = tx.ins[inputIndex].witness;
    
    // Example: Decompile the last element, assuming it contains relevant script information
    const etchingScriptBuffer = witnessBuffer[witnessBuffer.length -2];
    const decompiledEtchingScript = script.decompile(etchingScriptBuffer);
    
    // Assuming that your etching stacks are in the decompiled script based on your known format
    console.log('Etching Stacks:', decompiledEtchingScript);
    
  } catch (error) {
    console.log(error)
  }
}
// getTaprootScript();

async function etching() {
  const keyPair = wallet.ecPair;
  const runestone = createRunestone();
  const etchingStacks: any = [
    toXOnly(keyPair.publicKey),
    opcodes.OP_CHECKSIG,
    opcodes.OP_FALSE,
    opcodes.OP_IF,
    Buffer.from("ord", "utf8"),
    1,
    1,
    Buffer.concat([Buffer.from("text/plain;charset=utf-8", "utf8")]),
    1,
    2,
    opcodes.OP_0,
    1,
    13,
    runestone.commitBuffer,
    opcodes.OP_0,
    Buffer.concat([Buffer.from("MoonCity Recursive Parent", "utf8")]),
    opcodes.OP_ENDIF,
  ];
  const etching_script = script.compile(etchingStacks);

  const scriptTree: Taptree = {
    output: etching_script,
  };

  const redeem = {
    output: etching_script,
    redeemVersion: 192,
  };

  const etching_p2tr = payments.p2tr({
    internalPubkey: toXOnly(keyPair.publicKey),
    network,
    scriptTree,
    redeem,
  });

  const address = etching_p2tr.address ?? "";
  console.log("send coin to address", address);

  const utxos = await waitUntilUTXO(address as string);
  console.log(`Using UTXO ${utxos[0].txid}:${utxos[0].vout}`);

  const psbt = new Psbt({ network });

  psbt.addInput({
    hash: utxos[0].txid,
    index: utxos[0].vout,
    tapInternalKey: toXOnly(keyPair.publicKey),
    witnessUtxo: { value: utxos[0].value, script: etching_p2tr.output! },
    tapLeafScript: [
      {
        leafVersion: redeem.redeemVersion,
        script: redeem.output,
        controlBlock: etching_p2tr.witness![etching_p2tr.witness!.length - 1],
      },
    ],
  });

  const runeScript = script.compile([
    opcodes.OP_RETURN,
    opcodes.OP_13,
    runestone.buffer
  ]);

  psbt.addOutput({
    script: runeScript,
    value: 0,
  });

  const fee = 20000;

  const change = utxos[0].value - 546 - fee;

  psbt.addOutput({
    address: "tb1pjr267uqlj79zqmv5m9vftvjp6m8fycwm8mq63497tyudq3kp3a7qqanaxk", // change address
    value: 546,
  });

  psbt.addOutput({
    address: "tb1pjr267uqlj79zqmv5m9vftvjp6m8fycwm8mq63497tyudq3kp3a7qqanaxk", // change address
    value: change,
  });

  await signAndSend(keyPair, psbt, address as string);
}

export function createRunestone() {

  const spacedRune = SpacedRune.fromString("MOONCITY.RECURSIVE.PARENT");

  const runestone = new Runestone({
    edicts: [],
    pointer: new U32(BigInt(0)),
    etching: {
      rune: spacedRune.rune,
      spacers: spacedRune.spacers,
      premine: new U128(BigInt(10000000)),
      symbol: Symbol.fromString("$"),
      terms: {
        amount: new U128(BigInt(10000000)),
        cap: new U128(BigInt(10000000)),
      },
    },
    // mint: new RuneId(new U64(2587000n), new U32(1818n))
  });

  const buffer = runestone.enchiper();
  return { buffer, commitBuffer: runestone.etching?.rune?.commitBuffer() };

}
export async function waitUntilUTXO(address: string) {
  return new Promise<IUTXO[]>((resolve, reject) => {
    let intervalId: any;
    const checkForUtxo = async () => {
      try {
        const response: AxiosResponse<string> = await blockstream.get(
          `/address/${address}/utxo`
        );
        const data: IUTXO[] = response.data
          ? JSON.parse(response.data)
          : undefined;
        console.log(data);
        if (data.length > 0) {
          resolve(data);
          clearInterval(intervalId);
        }
      } catch (error) {
        reject(error);
        clearInterval(intervalId);
      }
    };
    intervalId = setInterval(checkForUtxo, 4000);
  });
}

export async function getTx(id: string): Promise<string> {
  const response: AxiosResponse<string> = await blockstream.get(
    `/tx/${id}/hex`
  );
  return response.data;
}

export async function signAndSend(
  keypair: BTCSigner,
  psbt: Psbt,
  address: string
) {
  if (process.env.NODE) {
    psbt.signAllInputs(keypair);
    psbt.finalizeAllInputs();

    const tx = psbt.extractTransaction();
    console.log(`Broadcasting Transaction Hex: ${tx.toHex()}`);
    // const txid = await broadcast(tx.toHex());
    // console.log(`Success! Txid is ${txid}`);
  } else {
    // in browser

    try {
      let res = await window.unisat.signPsbt(psbt.toHex(), {
        toSignInputs: [
          {
            index: 0,
            address: address,
          },
        ],
      });

      console.log("signed psbt", res);

      res = await window.unisat.pushPsbt(res);

      console.log("txid", res);
    } catch (e) {
      console.log(e);
    }
  }
}

export async function broadcast(txHex: string) {
  const response: AxiosResponse<string> = await blockstream.post("/tx", txHex);
  return response.data;
}

function tapTweakHash(pubKey: Buffer, h: Buffer | undefined): Buffer {
  return crypto.taggedHash(
    "TapTweak",
    Buffer.concat(h ? [pubKey, h] : [pubKey])
  );
}

function toXOnly(pubkey: Buffer): Buffer {
  return pubkey.subarray(1, 33);
}

function tweakSigner(signer: BTCSigner, opts: any = {}): BTCSigner {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  let privateKey: Uint8Array | undefined = signer.privateKey!;
  if (!privateKey) {
    throw new Error("Private key is required for tweaking signer!");
  }
  if (signer.publicKey[0] === 3) {
    privateKey = ecc.privateNegate(privateKey);
  }

  const tweakedPrivateKey = ecc.privateAdd(
    privateKey,
    tapTweakHash(toXOnly(signer.publicKey), opts.tweakHash)
  );
  if (!tweakedPrivateKey) {
    throw new Error("Invalid tweaked private key!");
  }

  return ECPair.fromPrivateKey(Buffer.from(tweakedPrivateKey), {
    network: opts.network,
  });
}

interface IUTXO {
  txid: string;
  vout: number;
  status: {
    confirmed: boolean;
    block_height: number;
    block_hash: string;
    block_time: number;
  };
  value: number;
}


// main
etching();
