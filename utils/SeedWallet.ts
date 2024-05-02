import * as bitcoin from "bitcoinjs-lib";
import { initEccLib, networks } from "bitcoinjs-lib";
import * as ecc from "tiny-secp256k1";
import * as bip39 from "bip39";
import BIP32Factory, { type BIP32Interface } from "bip32";
import ECPairFactory, { type ECPairInterface } from "ecpair";
import dotenv from "dotenv";

interface ISeedWallet {
  networkType: string;
  seed: string;
}

dotenv.config();
initEccLib(ecc);

const ECPair = ECPairFactory(ecc);
const bip32 = BIP32Factory(ecc);



export class SeedWallet {
  private hdPath = "m/86'/0'/0'/0/0";
  private network: bitcoin.networks.Network;
  public ecPair: ECPairInterface;
  public address: string;
  public output: Buffer;
  public publicKey: string;
  private bip32: BIP32Interface;

  constructor(walletParam : ISeedWallet) {
    if(walletParam.networkType == "mainnet") {
      this.network = networks.bitcoin;
    } else {
      this.network = networks.testnet;
    }
    const mnemonic = walletParam.seed;

    if (!bip39.validateMnemonic(mnemonic)) {
      throw new Error("invalid mnemonic");
    }
    this.bip32 = bip32.fromSeed(
      bip39.mnemonicToSeedSync(mnemonic),
      this.network
    );
    this.ecPair = ECPair.fromPrivateKey(
      this.bip32.derivePath(this.hdPath).privateKey!,
      { network: this.network }
    );
    const { address, output } = bitcoin.payments.p2tr({
      internalPubkey: this.ecPair.publicKey.subarray(1, 33),
      network: this.network,
    });
    this.address = address as string;
    this.output = output as Buffer;
    this.publicKey = this.ecPair.publicKey.toString("hex");
  }

  signPsbt(psbt: bitcoin.Psbt, ecPair: ECPairInterface): bitcoin.Psbt {
    const tweakedChildNode = ecPair.tweak(
      bitcoin.crypto.taggedHash("TapTweak", ecPair.publicKey.subarray(1, 33))
    );
    for (let i = 0; i < psbt.inputCount; i++) {
      psbt.signInput(i, tweakedChildNode);
      psbt.validateSignaturesOfInput(i, () => true);
      psbt.finalizeInput(i);
    }
    return psbt;
  }
}
