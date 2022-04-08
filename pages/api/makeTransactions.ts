// will be using this api/makeTransactions.ts file to generate transaction for a given checkout.
// and then it will be requested to the user to approve the transaction from the frontend wallet.

import { getMint, getAssociatedTokenAddress, createTransferCheckedInstruction } from "@solana/spl-token" 
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base"
import { clusterApiUrl, Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js"
import { NextApiRequest, NextApiResponse } from "next" // nextjs api is used to get the request and response from the frontend.
import { shopAddress, usdcAddress } from "../../lib/addresses" // we are using this file to get the shop address and usdc address.
import calculatePrice from "../../lib/calculatePrice"

export type MakeTransactionInputData = { // this is the input data that will be sent to the frontend.
  account: string, // the account that the user will be sending the transaction to.
}

export type MakeTransactionOutputData = { // this is the output data that will be available from the frontend
  transaction: string, // the transaction that will be sent to the frontend.
  message: string, // the message that will be sent to the frontend.
}

type ErrorOutput = { // this is the error output that will be available from the frontend, if there is any error.
  error: string
}

export default async function handler(
  req: NextApiRequest, // this is the request to the frontend.
  res: NextApiResponse<MakeTransactionOutputData | ErrorOutput> // this is the response that will be sent to the frontend, if there is no error then the response will be the transaction and message, if there is any error then the response will be the error.
) {
  try {
    // We pass the selected items in the query, calculate the expected cost
    console.log(req.query);
    
    const amount = calculatePrice(req.query) // calculate the price of the items that the user selected and then pass it to the frontend.
    console.log(amount);
    
    if (amount.toNumber() === 0) {
      res.status(400).json({ error: "Can't checkout with charge of 0" })
      return
    }

    // We pass the reference to use in the query
    const { reference } = req.query // get the reference from the query.
    if (!reference) {
      res.status(400).json({ error: "No reference provided" })
      return
    }

    // We pass the buyer's public key in JSON body
    const { account } = req.body as MakeTransactionInputData
    if (!account) {
      res.status(40).json({ error: "No account provided" })
      return
    }
    const buyerPublicKey = new PublicKey(account)
    const shopPublicKey = shopAddress

    // Initialize the connection to the solana dennet network
    const network = WalletAdapterNetwork.Devnet
    const endpoint = clusterApiUrl(network)
    const connection = new Connection(endpoint)

    //////------USDC PAYMENT CHANGES //////

      // Get details about the USDC token
      const usdcMint = await getMint(connection, usdcAddress); // getting the metadata about the USDC token.
      console.log(usdcMint);
      
      // The second and third lines are getting the associated token accounts for the buyer and the shop.
      // When we transfer an SPL token (like USDC) we don’t do it between the buyer and shop public keys, 
      // like we did with SOL. This might be a bit different if you’ve used other blockchains,
      // where the contract will often map data directly to the address. 
      // In Solana the contract itself (in this case the token program, which allows exchanging tokens like USDC) 
      // is stateless, and it generates accounts that hold the data. 
      // So when we call getAssociatedTokenAddress(usdcAddress, buyerPublicKey) 
      // we’re getting the address of the buyer’s USDC account.

      // Get the buyer's USDC token account address
      const buyerUsdcAddress = await getAssociatedTokenAddress(usdcAddress, buyerPublicKey);
      console.log(buyerUsdcAddress);

      // Get the shop's USDC token account address
      const shopUsdcAddress = await getAssociatedTokenAddress(usdcAddress, shopPublicKey)
      console.log(shopUsdcAddress);
      

    /////------USDC PAYMENT CHANGES /////////


    // Get a recent blockhash to include in the transaction
    // getting the block hash for the latest transaction
    const { blockhash } = await (connection.getLatestBlockhash('finalized'))

    // creating a new solnana transaction, recent blockhash is the blockhash that will be used to include the transaction in the blockchain and that is the we just fetched above
    // setting the fee payer to buyer for the transaction, that means buyer will have to sign transaction before it is processed by the network basically giving their authority for it to go ahead.
    const transaction = new Transaction({
      recentBlockhash: blockhash,
      // The buyer pays the transaction fee
      feePayer: buyerPublicKey,
    })

    // Create the instruction to send SOL from the buyer to the shop
    // A Solana transaction can contain a sequence of instructions, - they either all succeed or the transaction fails with no changes
    // here we are sending instruction, that send sol from one account to another
    // our store is crrently priced in sol but the transaction expects to be priced in lamports
    // There are 1 billion (10^9) lamports in 1 SOL but it’s best to always use the constant LAMPORTS_PER_SOL when converting between them.

    // const transferInstruction = SystemProgram.transfer({
    //   fromPubkey: buyerPublicKey,
    //   lamports: amount.multipliedBy(LAMPORTS_PER_SOL).toNumber(),
    //   toPubkey: shopPublicKey,
    // })



    //////------USDC PAYMENT CHANGES ////////

      //Note that buyerPublicKey will be the signer key, 
      //because we need their authority to transfer USDC from their USDC account.

      //The amount is slightly different too. Instead of using lamports (the smallest unit for SOL) like before,
      // we need to use the units for the token. Tokens can have any number of decimals, 
      //so the safest way to do this is to multiply by (10 ** decimals).
      // We get the number of decimals from the mint metadata that we fetched.

      // Create the instruction to send USDC from the buyer to the shop
      const transferInstruction = createTransferCheckedInstruction(
        buyerUsdcAddress, // source
        usdcAddress, // mint (token address)
        shopUsdcAddress, // destination
        buyerPublicKey, // owner of source address
        amount.toNumber() * (10 ** (await usdcMint).decimals), // amount to transfer (in units of the USDC token)
        usdcMint.decimals, // decimals of the USDC token
      )

    //////------USDC PAYMENT CHANGES ////////
    



    // Add the reference to the instruction as a key
    // This will mean this transaction is returned when we query for the reference
    // each instruction has a set of keys associated with it. 
    //Each instruction has a set of keys associated with it. The transaction can be looked up by any of these keys
    //  Each key can be a signer (or not), and writeable (or not).
    // In below, transfer function is creating and instruction with some default keys:
    
    //The buyer public key: is a signer, because they’re transferring their SOL and must give their authority. 
    //Is writeable, because their SOL balance will change

    //The shop public key: is writeable, because their SOL balance will change. 
    //Is not a signer, they don’t need to give authority to receive SOL

    // we are adding one more key to the instruction, the reference.
    // this is the key that will be used to look up the transaction, by adding it to our instruction.
    // That will allow our checkout page to detect that a payment has been made!
    // should be unique, it isn't signer nor writeable. because not involved in the actual transfer of SOL

    transferInstruction.keys.push({ 
      pubkey: new PublicKey(reference), 
      isSigner: false, 
      isWritable: false,
    })

    // Add the instruction to the transaction
    // once we have added the extra key, we can add the instruction to the transaction
    // and it have now one instruction
    transaction.add(transferInstruction)




    // serialize the transaction, //Serialization is the process of converting an object into a stream of bytes 
    // in order to store the object or transmit it to memory, a database, or a file. 
    // Its main purpose is to save the state of an object in order to be able to recreate it when needed
    
    // so we can return the transaction from the API and can use it / consume it on the checkout page .
    // We must pass requireAllSignatures: false when we serialize it because our transaction requires the 
    //buyer’s signature and we don’t have that yet. We’ll request it from their connected wallet on the /checkout page.

    // why base64? https://stackoverflow.com/questions/201479/what-is-base-64-encoding-used-for

    // Serialize the transaction and convert to base64 to return it
    const serializedTransaction = transaction.serialize({
      // We will need the buyer to sign this transaction after it's returned to them
      requireAllSignatures: false
    })
    const base64 = serializedTransaction.toString('base64')

    // Insert into database: reference, amount etc. we can do if we want to.	

    // Return the serialized transaction
    res.status(200).json({
      transaction: base64,
      message: "Thanks for your order! 🍪",
    })
  } catch (err) {
    console.error(err);

    res.status(500).json({ error: 'error creating transaction', })
    return
  }
}

// https://docs.solana.com/developing/clients/javascript-api