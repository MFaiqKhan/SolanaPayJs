// This file will create coupon for the shop

import { createAssociatedTokenAccount, createMint, getAccount, mintToChecked } from '@solana/spl-token'
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base'
import { clusterApiUrl, Connection, Keypair } from '@solana/web3.js'
import base58 from 'bs58'

// Read .env into process.env
import 'dotenv/config'

// Initialise Solana connection
const network = WalletAdapterNetwork.Devnet 
const endpoint = clusterApiUrl(network)
const connection = new Connection(endpoint) // create a connection to the cluster endpoint of devnet network

// Initialise shop account
const shopPrivateKey = process.env.SHOP_PRIVATE_KEY // shop private key from .env
if (!shopPrivateKey) { // if shop private key is not set
  throw new Error('SHOP_PRIVATE_KEY not set') // throw error
}
const shopAccount = Keypair.fromSecretKey(base58.decode(shopPrivateKey))
console.log(shopAccount); // log shop account

// what is Keypair.fromSecretKey(base58.decode(shopPrivateKey))?
// Keypair.fromSecretKey(base58.decode(shopPrivateKey)) is a function that takes a base58 encoded string and returns a Keypair object
// what is a keypair?
// a keypair is a pair of keys

// Create the token, returns the token public key
console.log("Creating token...")
const myCouponAddress = await createMint( // initializing new mint token 
  connection,
  shopAccount, // payer
  shopAccount.publicKey, // who has permission to mint?
  shopAccount.publicKey, // who has permission to freeze?
  0 // decimals (0 = whole numbers)
)
console.log("Token created:", myCouponAddress.toString())

// what is associated token account? 
// associated token account is a token account that is associated with a specific account

// Create the associated token account for the shop
console.log("Creating token account for the shop...")
const shopCouponAddress = await createAssociatedTokenAccount(
  connection,
  shopAccount, // payer
  myCouponAddress, // token
  shopAccount.publicKey, // who to create an account for
)
console.log("Token account created:", shopCouponAddress.toString())

// Mint 1 million coupons to the shop account
console.log("Minting 1 million coupons to the shop account...")
await mintToChecked( // Mint tokens to an account, asserting the token mint and decimals
  connection,
  shopAccount, // payer
  myCouponAddress, // token
  shopCouponAddress, // recipient
  shopAccount, // authority to mint
  1_000_000, // amount
  0, //decimals
)
console.log("Minted 1 million coupons to the shop account")

const { amount } = await getAccount(connection, shopCouponAddress) // Retrieve information about a token account using the token account address
console.log({
  myCouponAddress: myCouponAddress.toString(),
  balance: amount.toLocaleString(),
})

//your own trade-able token on the Solana blockchain. 
//It belongs to your shop account. Only you can mint them, but we’ll soon see how anyone can hold and trade your token.