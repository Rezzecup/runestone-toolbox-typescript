import { Runestone, SpacedRune } from "runestone-js";

function exampleDecodeFromTxBuffer() {
  // https://mempool.space/testnet/tx/0201fbf76be120e0245f95011e9e92bf588d9d5888b0c1eb62823312a3a86a87
  const txBuffer = Buffer.from(
    // this is the pure output buffer
    "0a00d3e99d01a303e80700",
    "hex",
  );
  console.log({ txBuffer });

  const runestone = Runestone.dechiper(txBuffer);
  const buffer = runestone.enchiper();
  console.log({ buffer });
  // output:
  // {
  //   buffer: Buffer(37) [ 2, 3, 4, 213, 181, 157, 129, 207, 163, 160, 245, 32, 1, 38, 3, 160, 2, 6, 184, 156, 222, 147, 137, 142, 202, 1, 5, 88, 10, 232, 7, 8, 136, 164, 1, 22, 1 ],
  // }
  console.log(JSON.stringify(runestone));
  // output:
  // {"edicts":[],"etching":{"divisibility":"38","premine":"888888888888888","rune":"XVERSEFORTEST","spacers":"288","symbol":"X","terms":{"amount":"1000","cap":"21000","height":{},"offset":{}}},"pointer":"1"}

  const spacedRune = new SpacedRune(
    runestone.etching?.rune!,
    runestone.etching?.spacers!,
  );
  console.log(spacedRune.toString());
  // output: XVERSE•FOR•TEST
}

exampleDecodeFromTxBuffer()