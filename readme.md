# Runestone toolbox Typescript
---
Runestone Etch, Mint, Transfer, Recursive Rune, Airdrop, Encipher, Decipher

## Prerequisites
---
Before running the script, ensure you have the following dependencies installed:

- `bitcoinjs-lib`
- `ecpair`
- `@bitcoinerlab/secp256k1`
- `axios`
- `runelib`
-  `cbor`

You can install them using npm:

```sh
npm install bitcoinjs-lib ecpair @bitcoinerlab/secp256k1 axios runelib
```

## Configuration
---
Ensure you have a `.env` file in your project root with the following variables:

```plaintext
PRIVATE_KEY=<your_private_key>
MNEMONIC=<your_seed_mnemonic> (optional, if using SeedWallet)
```

## Recursive Rune Etching Script

This script allows you to create a recursive ordinal inscription on the Bitcoin testnet using Taproot addresses. It involves creating an HTML content, enciphering it as a Taproot script, and broadcasting the transaction to the testnet network.

### Usage

1. **Initialize ECC Library**:
   The script initializes the ECC library using `initEccLib` from `bitcoinjs-lib`.

2. **Wallet Setup**:
   The script supports two types of wallets: `SeedWallet` and `WIFWallet`. Currently, the `WIFWallet` is used.

3. **Create Etching**:
   The `etching` function is the main function that creates the recursive ordinal. It involves the following steps:
   - Define the HTML content to be inscribed.
   - Create an inscription object using `EtchInscription`.
   - Define a Taproot script with the inscription and the wallet's public key.
   - Generate a Taproot address and wait for UTXOs to be funded to this address.
   - Create a Partially Signed Bitcoin Transaction (PSBT).
   - Add inputs and outputs to the PSBT.
   - Sign and broadcast the transaction.

4. **Broadcast Transaction**:
   The `signAndSend` function handles the signing and broadcasting of the transaction. It supports both node environment and browser environment.

## Functions

- **etching()**: Main function to create the recursive ordinal inscription.
- **waitUntilUTXO(address: string)**: Polls the address for UTXOs until found.
- **getTx(id: string)**: Fetches transaction hex by ID.
- **signAndSend(keyPair: BTCSigner, psbt: Psbt, address: string)**: Signs and broadcasts the PSBT.
- **broadcast(txHex: string)**: Broadcasts the raw transaction to the network.
- **tapTweakHash(pubKey: Buffer, h: Buffer | undefined)**: Computes the Taproot tweak hash.
- **toXOnly(pubkey: Buffer)**: Converts a public key to X-only format.
- **tweakSigner(signer: BTCSigner, opts: any)**: Tweaks the signer for Taproot key tweaking.

# Taproot Rune Minting Script

This script enables the minting of Runes using Taproot addresses on the Bitcoin testnet. It leverages `bitcoinjs-lib`, `ecpair`, and `runelib` to create, sign, and broadcast a Bitcoin transaction containing Runes.

## Usage

1. **Initialize ECC Library**:
   The script initializes the ECC library using `initEccLib` from `bitcoinjs-lib`.

2. **Wallet Setup**:
   The script supports two types of wallets: `SeedWallet` and `WIFWallet`. Currently, the `WIFWallet` is used.

3. **Minting with Taproot**:
   The `mintWithTaproot` function is the main function that mints Runes. It involves the following steps:
   - Define Runes to be minted.
   - Create a Runestone with the specified Runes.
   - Tweak the signer for Taproot key tweaking.
   - Generate a Taproot address.
   - Wait for UTXOs to be funded to this address.
   - Create a Partially Signed Bitcoin Transaction (PSBT).
   - Add inputs and outputs to the PSBT.
   - Sign and broadcast the transaction.

4. **Broadcast Transaction**:
   The `signAndSend` function handles the signing and broadcasting of the transaction. It supports both node environment and browser environment.

## Functions

- **mintWithTaproot()**: Main function to mint Runes using Taproot.
- **waitUntilUTXO(address: string)**: Polls the address for UTXOs until found.
- **getTx(id: string)**: Fetches transaction hex by ID.
- **signAndSend(keyPair: BTCSigner, psbt: Psbt, address: string)**: Signs and broadcasts the PSBT.
- **broadcast(txHex: string)**: Broadcasts the raw transaction to the network.
- **tapTweakHash(pubKey: Buffer, h: Buffer | undefined)**: Computes the Taproot tweak hash.
- **toXOnly(pubkey: Buffer)**: Converts a public key to X-only format.
- **tweakSigner(signer: BTCSigner, opts: any)**: Tweaks the signer for Taproot key tweaking.
- 
# Recursive Rune Minting Script with Taproot Inscription

This script allows you to mint recursive Runes on the Bitcoin testnet using Taproot addresses. The script uses `bitcoinjs-lib`, `ecpair`, and `runelib` libraries to create, sign, and broadcast Bitcoin transactions containing Runes.

## Prerequisites

Make sure you have the following dependencies installed:

- `bitcoinjs-lib`
- `ecpair`
- `@bitcoinerlab/secp256k1`
- `axios`
- `cbor`
- `runelib`

You can install them using npm:

```sh
npm install bitcoinjs-lib ecpair @bitcoinerlab/secp256k1 axios cbor runelib
```

## Usage

### Steps Overview

1. **Initialize ECC Library**: 
   The script initializes the ECC library using `initEccLib` from `bitcoinjs-lib`.

2. **Wallet Setup**: 
   The script supports two types of wallets: `SeedWallet` and `WIFWallet`. Currently, the `WIFWallet` is used.

3. **Create Taproot Inscription**: 
   The `createChildInscriptionTapScript` function creates the Taproot script for the inscription, using the provided content and metadata.

4. **Mint Runes and Create PSBT**: 
   The `childInscribe` function mints Runes and creates a Partially Signed Bitcoin Transaction (PSBT). It includes:
   - Funding the Taproot address.
   - Adding inputs and outputs to the PSBT.
   - Signing and broadcasting the transaction.

5. **Broadcast Transaction**: 
   The `signAndSend` function handles the signing and broadcasting of the transaction.

## Functions

- **contentBuffer(content: string)**: Converts content string to a buffer.
- **createChildInscriptionTapScript()**: Creates the Taproot script for child inscriptions.
- **childInscribe()**: Main function to mint Runes using Taproot.
- **signAndSend(keyPair: BTCSigner, psbt: Psbt)**: Signs and broadcasts the PSBT.
- **waitUntilUTXO(address: string)**: Polls the address for UTXOs until found.
- **getTx(id: string)**: Fetches transaction hex by ID.
- **broadcast(txHex: string)**: Broadcasts the raw transaction to the network.
- **tapTweakHash(pubKey: Buffer, h: Buffer | undefined)**: Computes the Taproot tweak hash.
- **toXOnly(pubkey: Buffer)**: Converts a public key to X-only format.
- **tweakSigner(signer: BTCSigner, opts: any)**: Tweaks the signer for Taproot key tweaking.

## Important Variables

- **network**: Configured to use Bitcoin testnet.
- **txhash**: Transaction hash of the parent inscription.
- **memeType**: MIME type for the content.
- **metaProtocol**: Meta protocol buffer.
- **receiveAddress**: Address to receive the Runes.
- **metadata**: Metadata for the inscription.
- **fee**: Transaction fee.
- **parentInscriptionTXID**: Transaction ID of the parent inscription.
- **contentBufferData**: Buffer containing the content for the inscription.
- **revealtxIDBuffer**: Buffer of the parent inscription transaction ID.
- **pointerBuffer**: Array of buffers for pointers in the Taproot script.
- **metadataBuffer**: CBOR encoded metadata buffer.
- **contentBufferArray**: Array of content buffers split into chunks.
## Example Output

The script will output logs at various stages:
- The Taproot address where funds should be sent.
- The UTXO being used.
- The raw transaction hex to be broadcasted.
- The transaction ID after broadcasting.

## Notes

- The script is configured to work with the Bitcoin testnet.
- Ensure that you have testnet coins available in the provided private key.
- Adjust the fee and other parameters as needed.

---
