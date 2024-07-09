import * as Bitcoin from "bitcoinjs-lib";
import ecc from "@bitcoinerlab/secp256k1";
import {
  SEED,
  STANDARD_RUNE_UTXO_VALUE,
  TESTNET,
  networkType,
} from "../../config/config";
import { IUtxo } from "../../utils/types";
import { RuneId, Runestone, none } from "runelib";
import initializeWallet from "../wallet/initializeWallet";
import { SeedWallet } from "../wallet/SeedWallet";
import app from "../..";
Bitcoin.initEccLib(ecc);

// Create dummy psbt for buyer offer
export const SameRuneTransferTx = (
  addressList: Array<string>,
  amount: number,
  rune_id: string,
  networkType: string,
  runeUtxo: IUtxo
): string => {
  // Initialize seed Wallet
  const wallet: SeedWallet = initializeWallet(
    networkType,
    SEED,
    app.locals.walletIndex
  );

  // Create psbt instance
  const psbt = new Bitcoin.Psbt({
    network:
      networkType == TESTNET
        ? Bitcoin.networks.testnet
        : Bitcoin.networks.bitcoin,
  });

  // Input all buyer Rune UTXOs for rune token
  psbt.addInput({
    hash: runeUtxo.txid,
    index: runeUtxo.vout,
    witnessUtxo: {
      value: runeUtxo.value,
      script: wallet.output,
    },
    tapInternalKey: Buffer.from(wallet.publicKey, "hex").subarray(1, 33),
  });

  // Create Runestone
  const edicts: any = [];
  edicts.push({
    id: new RuneId(+rune_id.split(":")[0], +rune_id.split(":")[1]),
    amount: 0,
    output: addressList.length + 1,
  });
  const mintstone = new Runestone(edicts, none(), none(), none());

  // Add output runestone
  psbt.addOutput({
    script: mintstone.encipher(),
    value: 0,
  });

  // Add output for rune airdrop
  for (let i = 0; i < addressList.length; i++) {
    psbt.addOutput({
      address: addressList[i],
      value: STANDARD_RUNE_UTXO_VALUE,
    });
  }

  // Sign psbt using admin wallet
  const signedPsbt: Bitcoin.Psbt = wallet.signPsbt(psbt, wallet.ecPair);

  // return Virtual Size of Runestone Transaction
  return signedPsbt.extractTransaction(true).toHex();
};