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
const txhash: string = '66505a1520d9b9a1b309ecef17a68adb5de166e0a7108a2be6d9b46d85fd951f';
const memeType: string = 'text/html;charset=utf-8';
const metaProtocol: Buffer = Buffer.concat([Buffer.from("parcel.bitmap", "utf8")]);
const receiveAddress: string = 'tb1ppx220ln489s5wqu8mqgezm7twwpj0avcvle3vclpdkpqvdg3mwqsvydajn';
const metadata = {
  'type': 'Bitmap',
  'description': 'Bitmap Community Parent Ordinal'
}
const fee = 500000;
const parentInscriptionTXID: string = 'd9b95d549219eebcd1be0360f41c7164c4ad040b716475630154f08263ab2fdf';
const contentBufferData: Buffer = contentBuffer(`<!DOCTYPE html>
<html>
<head>
    <title>Welcome to Bitmap Community!</title>
    <style>
        body {
            font-family: 'Times New Roman', Times, serif;
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            height: 100vh;
        }
        .header-window, .content-header {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 20px;
            padding: 4px 0;
            font-size: 9px;
            width: 100%;
            border-bottom: 2px solid #666;
        }
        .header-window {
            background-color: #999;
            color: #333;
            position: fixed;
            top: 0;
            left: 0;
            z-index: 100;
        }
        .content-header {
            background-color: #ccc;
            color: #000;
            position: relative;
            top: auto;
            left: auto;
            z-index: 10;
            flex-shrink: 0;
            flex-grow: 0;
        }
        .main-window {
            background-color: #eee;
            margin-top: 22px;
            padding: 33px 0;
            flex-grow: 1;
            overflow-y: auto;
            display: flex;
            justify-content: center;
        }
        .content-window {
        background-color: #fff;
        border: 1px solid #000;
        width: 80%;
        max-width: 1000px;
        min-width: 300px;
        box-shadow: 0 0 10px #999;
        margin: 20px;
        flex-shrink: 0;
        overflow: hidden;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
    }
    .content-body {
        padding: 20px;
        width: calc(100% - 40px);
        overflow-y: auto;
        flex-grow: 1;
    }

    .profile-image {
        display: block;
        margin: 0 auto;
        width: 100px;
        height: 100px;
        border: 25px solid white;
        box-shadow: 5px 5px 10px rgba(0, 0, 0, 0.5);
        margin-top: 33px;
        margin-bottom: 33px;
        position: relative;
        z-index: 10;
    }


    @media screen and (max-width: 600px) {
        .content-window {
            width: 95%;
            margin: 10px;
        }
    }
    </style>
    
</head>
<body>
    <div class="header-window">
        <h1>Bitmap Community</h1>
    </div>

    <div class="main-window">
        <div class="content-window">
            <div class="content-header">
                <h2>Introduction Bitmap Community</h2>
            </div>
            <div class="content-body">
                <section id="introduction">
                    <a href="/content/b0778ad02073f1b7044a32b9c430cd469d0f7c430e20ecc7b40571137ca1daadi0"><img src="/content/b0778ad02073f1b7044a32b9c430cd469d0f7c430e20ecc7b40571137ca1daadi0" alt="Profile Image" class="profile-image"></a>
                    <h3>Introduction</h3>
                    <p>Hello, Bitmap Community Users! It's just our test for our next projects related Recursive.</p>
                    <p>The start of a new season is upon us, and what better time to usher in the age of Bitmap Community than with the introduction of a brand new way to interact with your Bitmap on-chain? That's right, we're about to dive into functionality!</p>
                    <p>I'm thrilled to introduce the Bitmap Communityand the <em>Bitmap Community</em> Metaprotocol. These two novel concepts form the bedrock of content management upon Bitmap land. These additions empower creators to carve out their own vision of Bitmap entirely on-chain. But let's not put the cart before the horse! What exactly are we talking about here?</p>
                    <p>This guide will cover the essentials of creating, linking, and managing your content library. You'll discover a novel approach to indexing your content through parent/child inscriptions and learn how to create an <em>index.html</em> page for your bitmap similar to traditional websites, through the use of the <em>Bitmap Community</em> Metaprotocol.</p>
                    <p>It should be noted that these additions do not directly tie in with the Bitmap's block data, however it provides a method to inscribe data unto your Bitmap that can be universally read by anyone applying the standard.</p>
                </section>

                <section id="bitmap-content-library">
                    <h3>Understanding The Bitmap Community Projects</h3>
                    <p>The Bitmap Community Projects encompasses all child inscriptions associated with your Bitmap. This can be expanded to the children of those children, to form a full family tree file system with your bitmap at the root. It stands as a straightforward, decentralized method to manage content stemming from your Bitmap, with provenance and immutability at its core. Any file can be a child inscription. To compile this content, and any content accessible through Ordinals, we craft an index page for your Bitmap by invoking the Metaprotocol <em>index.bitmap</em>.</p>
                </section>

                <section id="creating-index">
                    <h3>Creating Your Bitmap Parcel</h3>
                    <p>Mirroring the role of the <em>index.html</em> file in traditional web development, the <em>index.bitmap</em> Metaprotocol anchors itself as the welcoming front page of your Bitmap. This section details the process of earmarking your HTML document as your Bitmap's primary index: forge a child inscription to your Bitmap and label it with the Metaprotocol tag <em>Bitmap Community</em>. This act ensures that explorers can effortlessly locate the most recent HTML index file connected as a child to your Bitmap.</p>
                </section>

                <section id="conclusion">
                    <h3>Our Bitmap Community History</h3>
                    <p>And there you have it, friends! A canvas waiting for your brush, a stage eager for your performance. As we close this guide, remember that each step you take in inscribing content to your Bitmap is a stroke in the grand mural of Bitcoin and into the future. So go ahead, make your mark with confidence, knowing that your contributions are etched in the annals of the blockchain, immutable and celebrated. May your creations inspire and your Bitmap flourish. Until next time, you know where to find me</p>
                    <a href="/content/b0778ad02073f1b7044a32b9c430cd469d0f7c430e20ecc7b40571137ca1daadi0"><img src="/content/b0778ad02073f1b7044a32b9c430cd469d0f7c430e20ecc7b40571137ca1daadi0" alt="Bitoshi's Signature" style="max-width: 100%; height: auto; filter: brightness(0) invert(0.2);"></a>
                    <p><em>Everything here is strictly experimental, of course.</em></p>
                </section>
            </div>
        </div>
    </div>
</body>

</html>
`);

const revealtxIDBuffer = Buffer.from(parentInscriptionTXID, 'hex');
const inscriptionBuffer = revealtxIDBuffer.reverse();
const pointer1: number = 546 * 1;
const pointer2: number = 546 * 2;
const pointer3: number = 546 * 3;
const pointerBuffer1: Buffer = Buffer.from(pointer1.toString(16).padStart(4, '0'), 'hex').reverse();
const pointerBuffer2: Buffer = Buffer.from(pointer2.toString(16).padStart(4, '0'), 'hex').reverse();
const pointerBuffer3: Buffer = Buffer.from(pointer3.toString(16).padStart(4, '0'), 'hex').reverse();
const metadataBuffer = cbor.encode(metadata);

const splitBuffer = (buffer: Buffer, chunkSize: number) => {
  let chunks = [];
  for (let i = 0; i < buffer.length; i += chunkSize) {
    const chunk = buffer.subarray(i, i + chunkSize);
    chunks.push(chunk);
  }
  return chunks;
};
const contentBufferArray: Array<Buffer> = splitBuffer(contentBufferData, 400)

export function createChildInscriptionTapScript(): Array<Buffer> {

  const keyPair = wallet.ecPair;
  let childOrdinalStacks: any = [
    toXOnly(keyPair.publicKey),
    opcodes.OP_CHECKSIG,
    opcodes.OP_FALSE,
    opcodes.OP_IF,
    Buffer.from("ord", "utf8"),
    1,
    1,
    Buffer.concat([Buffer.from(memeType, "utf8")]),
    1,
    2,
    pointerBuffer1,
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
  ];
  contentBufferArray.forEach((item: Buffer) => {
    childOrdinalStacks.push(item)
  })
  childOrdinalStacks.push(opcodes.OP_ENDIF)

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


  const change = utxos[0].value - 546 * 2 - fee;

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

