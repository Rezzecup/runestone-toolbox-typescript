import networkConfig from "config/network.config";
import { getUtxos, pushBTCpmt } from "./utils/mempool";
import * as Bitcoin from "bitcoinjs-lib";
import * as ecc from "tiny-secp256k1";
import dotenv from "dotenv";
import { redeemSplitUTXOPsbt, splitUTXOPsbt} from "controller/utxo.split.controller";
import { SeedWallet } from "utils/SeedWallet";
// import { WIFWallet } from 'utils/WIFWallet'

const TESTNET_FEERATE = 20;
const SPLIT_UTXO_LIMIT = 30000;
const SPLIT_COUNT = 1;

dotenv.config();
Bitcoin.initEccLib(ecc);

const networkType: string = networkConfig.networkType;
const seed: string = process.env.MNEMONIC as string;
// const privateKey: string = process.env.PRIVATE_KEY as string;


const splitUTXO = async () => {
  const wallet = new SeedWallet({ networkType: networkType, seed: seed });
  // const wallet = new WIFWallet({ networkType: networkType, privateKey: privateKey });

  const utxos = await getUtxos(wallet.address, networkType);
  const utxo = utxos.find((utxo) => utxo.value > SPLIT_UTXO_LIMIT);
  if (utxo === undefined) throw new Error("No btcs");

  let redeemPsbt: Bitcoin.Psbt = redeemSplitUTXOPsbt(wallet, utxo, networkType, SPLIT_COUNT);
  redeemPsbt = wallet.signPsbt(redeemPsbt, wallet.ecPair)
  let redeemFee = redeemPsbt.extractTransaction().virtualSize() * TESTNET_FEERATE;

  let psbt = splitUTXOPsbt(wallet, utxo, networkType, SPLIT_COUNT, redeemFee);
  let signedPsbt = wallet.signPsbt(psbt, wallet.ecPair)
  
  const txHex = signedPsbt.extractTransaction().toHex();

  const txId = await pushBTCpmt(txHex, networkType);
  console.log(`Split_UTXO_TxId=======> ${txId}`)
}

splitUTXO();