import {
  Transaction,
  script,
  Psbt,
  initEccLib,
  networks,
  Signer as BTCSigner,
  crypto,
  payments,
  opcodes,
  address as Address
} from "bitcoinjs-lib";
import { Taptree } from "bitcoinjs-lib/src/types";
import { ECPairFactory, ECPairAPI } from "ecpair";
import ecc from "@bitcoinerlab/secp256k1";
import axios, { AxiosResponse } from "axios";
import networkConfig from "config/network.config";
import { WIFWallet } from 'utils/WIFWallet'
import { SeedWallet } from "utils/SeedWallet";

//test
// const network = networks.testnet;
const network = networks.bitcoin;

initEccLib(ecc as any);
const ECPair: ECPairAPI = ECPairFactory(ecc);

// const seed: string = process.env.MNEMONIC as string;
// const networkType: string = networkConfig.networkType;
// const wallet = new SeedWallet({ networkType: networkType, seed: seed });

const privateKey: string = process.env.PRIVATE_KEY as string;
const networkType: string = networkConfig.networkType;
const wallet = new WIFWallet({ networkType: networkType, privateKey: privateKey });

export const contentBuffer = (content: string) => {
  return Buffer.from(`<!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Build Your Own Recursive Ordinal</title>
    </head>
    <body style="margin: 0px">
      <div>
        <img style="width:100%;margin:0px" src="/content/${content}" />
      </div>
    </body>
  </html>`, 'utf8')
}

const txhash: string = '9bcaa71d811e34b7176f50982712fb5f4b7726ae2084cb0f886e7eb3a4db5d69';
const txidBuffer = Buffer.from(txhash, 'hex')
const inscriptionBuffer = txidBuffer.reverse()
const pointer1: number = 546 * 1;
const pointer2: number = 546 * 2;
const pointer3: number = 546 * 3;
const pointerBuffer1: Buffer = Buffer.from(pointer1.toString(16).padStart(4, '0'), 'hex');
const pointerBuffer2: Buffer = Buffer.from(pointer2.toString(16).padStart(4, '0'), 'hex');
const pointerBuffer3: Buffer = Buffer.from(pointer3.toString(16).padStart(4, '0'), 'hex');

const content1 = '6cfd2a4ca879ba92e328acd0e2e8b0e42726bc6ff2b78d10706e138fb38b10f6i0'
const content2 = '9566bc0e79ca905bf01db55bf154acb3a04e00e8bb2e9d4903639c5badf66d42i0'
const contentBufferData1 = Buffer.from('0.364972.bitmap', 'utf8')
const contentBufferData2 = Buffer.from('1.364972.bitmap', 'utf8')

export function createChildInscriptionTapScript(): Array<Buffer> {
  
  const metadataBuffer = Buffer.from('a26474797065644269746d61706b6465736372697074696f6e78184269746d617020436f6d6d756e697479204f72646e616c73', 'hex');
  
  const keyPair = wallet.ecPair;
  const childOrdinalStacks: any = [
    toXOnly(keyPair.publicKey),
    opcodes.OP_CHECKSIG,
    opcodes.OP_FALSE,
    opcodes.OP_IF,
    Buffer.from("ord", "utf8"),
    1,
    1,
    Buffer.concat([Buffer.from("text/html;charset=utf-8", "utf8")]),
    1,
    3,
    inscriptionBuffer,
    1,
    2,
    pointerBuffer1,
    1,
    5,
    metadataBuffer,
    opcodes.OP_0,
    contentBufferData1,
    opcodes.OP_ENDIF,
    opcodes.OP_FALSE,
    opcodes.OP_IF,
    Buffer.from("ord", "utf8"),
    1,
    1,
    Buffer.concat([Buffer.from("text/html;charset=utf-8", "utf8")]),
    1,
    3,
    inscriptionBuffer,
    1,
    2,
    pointerBuffer2,
    1,
    5,
    metadataBuffer,
    opcodes.OP_0,
    contentBufferData2,
    opcodes.OP_ENDIF
  ];

  return childOrdinalStacks;
}

async function childInscribe() {
  const keyPair = wallet.ecPair;
  const childOrdinalStack = createChildInscriptionTapScript();

  const ordinal_script = script.compile(childOrdinalStack);

  const scriptTree: Taptree = {
    output: ordinal_script,
  };

  const redeem = {
    output: ordinal_script,
    redeemVersion: 192,
  };

  const ordinal_p2tr = payments.p2tr({
    internalPubkey: toXOnly(keyPair.publicKey),
    network,
    scriptTree,
    redeem,
  });

  const address = ordinal_p2tr.address ?? "";
  console.log("send coin to address", address);

  const utxos = await waitUntilUTXO(address as string);
  console.log(`Using UTXO ${utxos[0].txid}:${utxos[0].vout}`);

  const psbt = new Psbt({ network });
  const parentInscriptionUTXO = {
    txid: txhash,
    vout: 0,
    value: 546
  }
  psbt.addInput({
    hash: parentInscriptionUTXO.txid,
    index: parentInscriptionUTXO.vout,
    witnessUtxo: {
      value: parentInscriptionUTXO.value,
      script: wallet.output,
    },
    tapInternalKey: toXOnly(keyPair.publicKey),
  });

  psbt.addInput({
    hash: utxos[0].txid,
    index: utxos[0].vout,
    tapInternalKey: toXOnly(keyPair.publicKey),
    witnessUtxo: { value: utxos[0].value, script: ordinal_p2tr.output! },
    tapLeafScript: [
      {
        leafVersion: redeem.redeemVersion,
        script: redeem.output,
        controlBlock: ordinal_p2tr.witness![ordinal_p2tr.witness!.length - 1],
      },
    ],
  });

  const fee = 4500;

  const change = utxos[0].value - 546 * 3 - fee;

  psbt.addOutput({
    address: "bc1pjr267uqlj79zqmv5m9vftvjp6m8fycwm8mq63497tyudq3kp3a7qh49jue", //Destination Address
    value: 546,
  });

  psbt.addOutput({
    address: "bc1pjr267uqlj79zqmv5m9vftvjp6m8fycwm8mq63497tyudq3kp3a7qh49jue", //Destination Address
    value: 546,
  });

  psbt.addOutput({
    address: "bc1pjr267uqlj79zqmv5m9vftvjp6m8fycwm8mq63497tyudq3kp3a7qh49jue", //Destination Address
    value: 546,
  });

  psbt.addOutput({
    address: "bc1pjr267uqlj79zqmv5m9vftvjp6m8fycwm8mq63497tyudq3kp3a7qh49jue", // Change address
    value: change,
  });

  await signAndSend(keyPair, psbt);
}

childInscribe()

export async function signAndSend(
  keypair: BTCSigner,
  psbt: Psbt,
) {
  const signer = tweakSigner(keypair, { network })
  psbt.signInput(0, signer);
  psbt.signInput(1, keypair);
  psbt.finalizeAllInputs()
  const tx = psbt.extractTransaction();
  console.log(tx.virtualSize())
  console.log(`Broadcasting Transaction Hex: ${tx.toHex()}`);

  // const txid = await broadcast(tx.toHex());
  // console.log(`Success! Txid is ${txid}`);
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


const blockstream = new axios.Axios({
  // baseURL: `https://mempool.space/testnet/api`,
  baseURL: `https://mempool.space/api`,
});

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

function tweakSigner(signer: any, opts: any = {}) {
  let privateKey = signer.privateKey;
  if (!privateKey) {
    throw new Error('Private key is required for tweaking signer!');
  }
  if (signer.publicKey[0] === 3) {
    privateKey = ecc.privateNegate(privateKey);
  }
  const tweakedPrivateKey = ecc.privateAdd(privateKey, tapTweakHash(toXOnly(signer.publicKey), opts.tweakHash));
  if (!tweakedPrivateKey) {
    throw new Error('Invalid tweaked private key!');
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