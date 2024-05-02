import networkConfig from "config/network.config";
import { getUtxos, pushBTCpmt } from "./utils/mempool";
import * as Bitcoin from "bitcoinjs-lib";
import * as ecc from "tiny-secp256k1";
import { SeedWallet } from "utils/SeedWallet";
// import { WIFWallet } from 'utils/WIFWallet'
import dotenv from "dotenv";
import { redeemMergeUTXOPsbt, mergeUTXOPsbt } from "controller/utxo.merge.controller";

const TESTNET_FEERATE = 20;
const MERGE_COUNT = 5;

dotenv.config();
Bitcoin.initEccLib(ecc);

const networkType: string = networkConfig.networkType;
const seed: string = process.env.MNEMONIC as string;
// const privateKey: string = process.env.PRIVATE_KEY as string;


const mergeUTXO = async () => {
  const wallet = new SeedWallet({ networkType: networkType, seed: seed });
  // const wallet = new WIFWallet({ networkType: networkType, privateKey: privateKey });

  const utxos = await getUtxos(wallet.address, networkType);
  if (utxos.length < MERGE_COUNT) throw new Error("No btcs");

  let redeemPsbt: Bitcoin.Psbt = redeemMergeUTXOPsbt(wallet, utxos, networkType, MERGE_COUNT);
  redeemPsbt = wallet.signPsbt(redeemPsbt, wallet.ecPair)
  let redeemFee = redeemPsbt.extractTransaction().virtualSize() * TESTNET_FEERATE;

  let psbt = mergeUTXOPsbt(wallet, utxos, networkType, MERGE_COUNT, redeemFee);
  let signedPsbt = wallet.signPsbt(psbt, wallet.ecPair)

  const txHex = signedPsbt.extractTransaction().toHex();
  const txId = await pushBTCpmt(txHex, networkType);
  console.log(`Merge_UTXO_TxId=======> ${txId}`)
}

mergeUTXO();