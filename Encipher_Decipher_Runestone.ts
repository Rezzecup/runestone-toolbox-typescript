import { Runestone, Transaction } from '@ordjs/runestone';

// See https://mempool.space/tx/2bb85f4b004be6da54f766c17c1e855187327112c231ef2ff35ebad0ea67c69e
const tx: any = {
  output: [{
    // // OP_RETURN OP_PUSHNUM_13 ...
    script_pubkey: '6a5d0900c0a2331ce820a208',
    value: 0,
  }],
};

const runestone = Runestone.decipher(tx);
// runestone.divisibility => 2
// runestone.premine => 11000000000
// runestone.symbol => ᚠ
// runestone.terms.amount => 100
console.log(runestone)