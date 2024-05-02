import * as Bitcoin from "bitcoinjs-lib";
import * as ecc from "tiny-secp256k1";
Bitcoin.initEccLib(ecc);

const UTXO_OUTPUT = 546;

interface IUtxo {
    txid: string;
    vout: number;
    value: number;
}

export const redeemSplitUTXOPsbt = (wallet: any, utxo: IUtxo, networkType: string, splitCount: number): Bitcoin.Psbt => {
    const psbt = new Bitcoin.Psbt({
        network: networkType == "testnet" ? Bitcoin.networks.testnet : Bitcoin.networks.bitcoin
    });
    psbt.addInput({
        hash: utxo.txid,
        index: utxo.vout,
        witnessUtxo: {
            value: utxo.value,
            script: wallet.output,
        },
        tapInternalKey: Buffer.from(wallet.publicKey, "hex").subarray(1, 33),
    });
    for (let i = 0; i < splitCount; i++) {
        psbt.addOutput({
            address: wallet.address,
            value: UTXO_OUTPUT,
        });
    }
    
    psbt.addOutput({
        address: wallet.address,
        value: utxo.value - UTXO_OUTPUT * splitCount - 1000,
    });

    return psbt;
}

export const splitUTXOPsbt = (wallet: any, utxo: IUtxo, networkType: string, splitCount: number, fee: number): Bitcoin.Psbt => {
    const psbt = new Bitcoin.Psbt({
        network: networkType == "testnet" ? Bitcoin.networks.testnet : Bitcoin.networks.bitcoin
    });
    psbt.addInput({
        hash: utxo.txid,
        index: utxo.vout,
        witnessUtxo: {
            value: utxo.value,
            script: wallet.output,
        },
        tapInternalKey: Buffer.from(wallet.publicKey, "hex").subarray(1, 33),
    });
    for (let i = 0; i < splitCount; i++) {
        psbt.addOutput({
            address: wallet.address,
            value: UTXO_OUTPUT,
        });
    }

    psbt.addOutput({
        address: wallet.address,
        value: utxo.value - UTXO_OUTPUT * splitCount - fee,
    });

    return psbt;
}
