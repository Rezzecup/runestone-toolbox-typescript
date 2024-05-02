import networkConfig from "config/network.config";
import { getUtxos, pushBTCpmt } from "./utils/mempool";
import * as Bitcoin from "bitcoinjs-lib";
import * as ecc from "tiny-secp256k1";
import dotenv from "dotenv";
import { redeemSendUTXOPsbt, sendUTXOPsbt} from "controller/utxo.send.controller";
import { SeedWallet } from "utils/SeedWallet";
// import { WIFWallet } from 'utils/WIFWallet'

const TESTNET_FEERATE = 20;
const SEND_UTXO_LIMIT = 10000;
const RECEIVEADDRESS = 'tb1pr62qc83slv3zy7mjaygeq2t2033hvslgljnr6lxylephys646ehqptvk8a';

dotenv.config();
Bitcoin.initEccLib(ecc);

const networkType: string = networkConfig.networkType;
const seed: string = process.env.MNEMONIC as string;
// const privateKey: string = process.env.PRIVATE_KEY as string;


const sendUTXO = async () => {
  const wallet = new SeedWallet({ networkType: networkType, seed: seed });
  // const wallet = new WIFWallet({ networkType: networkType, privateKey: privateKey });

  const utxos = await getUtxos(wallet.address, networkType);
  const utxo = utxos.find((utxo) => utxo.value > SEND_UTXO_LIMIT);
  if (utxo === undefined) throw new Error("No btcs");

  let redeemPsbt: Bitcoin.Psbt = redeemSendUTXOPsbt(wallet, utxo, networkType);
  redeemPsbt = wallet.signPsbt(redeemPsbt, wallet.ecPair)
  let redeemFee = redeemPsbt.extractTransaction().virtualSize() * TESTNET_FEERATE;

  let psbt = sendUTXOPsbt(wallet, utxo, networkType, redeemFee, RECEIVEADDRESS);
  let signedPsbt = wallet.signPsbt(psbt, wallet.ecPair)
  
  const txHex = signedPsbt.extractTransaction().toHex();

  const txId = await pushBTCpmt(txHex, networkType);
  console.log(`Send_UTXO_TxId=======> ${txId}`)
}

sendUTXO();