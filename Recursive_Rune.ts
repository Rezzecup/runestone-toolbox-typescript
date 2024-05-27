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
import cbor from 'cbor';
import {
  Rune,
  RuneId,
  Runestone,
  EtchInscription,
  none,
  some,
  Terms,
  Range,
  Etching,
} from "runelib";
//test
const network = networks.testnet;
// const network = networks.bitcoin;

initEccLib(ecc as any);
const ECPair: ECPairAPI = ECPairFactory(ecc);

export const contentBuffer = (content: string) => {
  return Buffer.from(content, 'utf8')
}
// const seed: string = process.env.MNEMONIC as string;
// const networkType: string = networkConfig.networkType;
// const wallet = new SeedWallet({ networkType: networkType, seed: seed });

const privateKey: string = process.env.PRIVATE_KEY as string;
const networkType: string = networkConfig.networkType;
const wallet = new WIFWallet({ networkType: networkType, privateKey: privateKey });

// input data
const txhash: string = 'ea4303aaa2c7939931a2ba129c9fc915d1905d441f2a74b6cd694c71665c7682';
const memeType: string = 'text/html;charset=utf-8';
const metaProtocol: Buffer = Buffer.concat([Buffer.from("harmonitech.team", "utf8")]);
const receiveAddress: string = 'tb1ppx220ln489s5wqu8mqgezm7twwpj0avcvle3vclpdkpqvdg3mwqsvydajn';
const metadata = {
  'type': 'HarmoniTech',
  'description': 'HarmoniTech team Recursive Rune'
}
const fee = 130000;
const parentInscriptionTXID: string = 'ea4303aaa2c7939931a2ba129c9fc915d1905d441f2a74b6cd694c71665c7682';
const contentBufferData: Buffer = contentBuffer(`<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Build Your Own Recursive Ordinal</title>
  </head>
  <body style="margin: 0px">
    <div>
      <img style="width:100%;margin:0px" src="/content/864a32c90a83835e6706c0e649f2bc9ba43281f5144efa4c86e4247264806ab3i0" />
    </div>
  </body>
</html>
`);

const revealtxIDBuffer = Buffer.from(parentInscriptionTXID, 'hex');
const inscriptionBuffer = revealtxIDBuffer.reverse();
const pointer1: number = 546 * 1;
const pointer2: number = 546 * 2;
const pointer3: number = 546 * 3;
const pointer4: number = 546 * 4;
let pointerBuffer : Array<Buffer> = [];
pointerBuffer.push(Buffer.from(pointer1.toString(16).padStart(4, '0'), 'hex').reverse());
pointerBuffer.push(Buffer.from(pointer2.toString(16).padStart(4, '0'), 'hex').reverse());
pointerBuffer.push(Buffer.from(pointer3.toString(16).padStart(4, '0'), 'hex').reverse());
pointerBuffer.push(Buffer.from(pointer4.toString(16).padStart(4, '0'), 'hex').reverse());
const metadataBuffer = cbor.encode(metadata);

const splitBuffer = (buffer: Buffer, chunkSize: number) => {
  let chunks = [];
  for (let i = 0; i < buffer.length; i += chunkSize) {
    const chunk = buffer.subarray(i, i + chunkSize);
    chunks.push(chunk);
  }
  return chunks;
};
const contentBufferArray: Array<Buffer> = splitBuffer(contentBufferData, 450)

export function createChildInscriptionTapScript(): Array<Buffer> {

  const keyPair = wallet.ecPair;
  let childOrdinalStacks: any = [
    toXOnly(keyPair.publicKey),
    opcodes.OP_CHECKSIG,
  ];
  for (let i = 0; i < 4; i++) {
    childOrdinalStacks.push(
      opcodes.OP_FALSE,
      opcodes.OP_IF,
      Buffer.from("ord", "utf8"),
      1,
      1,
      Buffer.concat([Buffer.from(memeType, "utf8")]),
      1,
      2,
      pointerBuffer[i],
      1,
      3,
      inscriptionBuffer,
      1,
      5,
      metadataBuffer,
      1,
      7,
      metaProtocol,
      opcodes.OP_0
    );
    contentBufferArray.forEach((item: Buffer) => {
      childOrdinalStacks.push(item)
    })
    childOrdinalStacks.push(opcodes.OP_ENDIF)
  }
  return childOrdinalStacks;
}

async function childInscribe() {
  const keyPair = wallet.ecPair;
  const childOrdinalStack = createChildInscriptionTapScript();

  console.log(childOrdinalStack)

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

  const psbt = new Psbt({ network });

  const parentInscriptionUTXO = {
    txid: txhash,
    vout: 1,
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

  const edicts: any = [];
    edicts.push({
      id: new RuneId(2817883, 2295),
      amount: 10000,
      output: 2,
    });
    edicts.push({
      id: new RuneId(2817883, 2295),
      amount: 10000,
      output: 3,
    });
    edicts.push({
      id: new RuneId(2817883, 2295),
      amount: 10000,
      output: 4,
    });
    edicts.push({
      id: new RuneId(2817883, 2295),
      amount: 10000,
      output: 5,
    });
  const mintstone = new Runestone(
    edicts,
    none(),
    none(),
    none()
  );

  psbt.addOutput({
    script: mintstone.encipher(),
    value: 0,
  });

  const change = utxos[0].value - 546 * 5 - fee;

  psbt.addOutput({
    address: receiveAddress, //Destination Address
    value: 546,
  });

  psbt.addOutput({
    address: receiveAddress, //Destination Address
    value: 546,
  });

  psbt.addOutput({
    address: receiveAddress, //Destination Address
    value: 546,
  });

  psbt.addOutput({
    address: receiveAddress, //Destination Address
    value: 546,
  });

  psbt.addOutput({
    address: receiveAddress, //Destination Address
    value: 546,
  });

  psbt.addOutput({
    address: receiveAddress, // Change address
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
  console.log(tx.toHex());

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
  baseURL: `https://mempool.space/testnet/api`,
  // baseURL: `https://mempool.space/api`,
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

