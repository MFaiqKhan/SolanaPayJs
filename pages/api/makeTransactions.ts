// will be using this api/makeTransactions.ts file to generate transaction for a given checkout.
// and then it will be requested to the user to approve the transaction from the frontend wallet.


/////-----Sending coupon to buyer -----/////

//creating a transaction that, in addition to sending USDC from the buyer to our shop, 
//sends a coupon from the shop to the buyer



// -------------Transaction Request ----- ///////////////


//This flexibility to send any transaction isn’t available to us in Solana Pay’s transfer requests, 
//but it’s the goal of an upcoming Solana Pay specification: transaction requests.
// Instead of encoding parameters for a single payment, we encode a URL that the wallet should use to request a transaction.
// It will then display that transaction to the user to approve. This API can return any transaction at all!

//The wallet makes two requests to our URL. In the first it sends a GET request, and we can return some data identifying ourselves
//. The wallet can display this to the user so they understand who they’re transacting with. 
//In the second it sends a POST request with the public key of the buyer, and we return our transaction and message.
//The wallet will display the transaction to the user so they can approve it.


import { getMint, getAssociatedTokenAddress, createTransferCheckedInstruction, getOrCreateAssociatedTokenAccount } from "@solana/spl-token"
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base"
import { clusterApiUrl, Connection, Keypair, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js"
import { NextApiRequest, NextApiResponse } from "next" // nextjs api is used to get the request and response from the frontend.
import { shopAddress, usdcAddress, couponAddress } from "../../lib/addresses" // we are using this file to get the shop address and usdc address.
import calculatePrice from "../../lib/calculatePrice"
import base58 from "bs58"
import "dotenv/config";

export type MakeTransactionInputData = { // this is the input data variable os custom type that will be sent to the frontend.
  account: string, // the account that the user will be sending the transaction to.
}

export type MakeTransactionOutputData = { // this is the output data variable os custom type that will be available from the frontend
  transaction: string, // the transaction that will be sent to the frontend.
  message: string, // the message that will be sent to the frontend.
}

type ErrorOutput = { // this is the error output that will be available from the frontend, if there is any error.
  error: string
}


type MakeTransactionGetResponse = {  // this is the response that will be sent to the frontend, if the request is a get request.
  label: string,
  icon: string, // the label and icon that will be sent to the frontend.
}

const get = (res: NextApiResponse<MakeTransactionGetResponse>) => { // this is the get function that will be called from the handler function.
  res.status(200).json({ // if the response status is 200, then the response will be sent to the frontend.
    label: "Bakery Co.",
    icon: "https://ibb.co/5F3sYRc",
  })
}

const post = async (req: NextApiRequest, res: NextApiResponse<MakeTransactionOutputData | ErrorOutput>) =>
//req: NextApiRequest : this is the request to the frontend. 
// res: NextApiResponse<MakeTransactionOutputData | ErrorOutput> : this is the response that will be sent to the frontend, if there is no error then the response will be the transaction and message, if there is any error then the response will be the error.
{
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

    //we’re going to be sending a coupon from the shop account, we’re going to need to sign the transaction as the shop.
    // So we use the shop’s private key (which we have in .env from the script), and load the shop account from it
    const shopPrivateKey = process.env.SHOP_PRIVATE_KEY as string
    if (!shopPrivateKey) {
      res.status(400).json({ error: "No shop private key provided" })
      return
    }

    const shopKeypair = Keypair.fromSecretKey(base58.decode(shopPrivateKey))
    console.log(shopKeypair);

    const buyerPublicKey = new PublicKey(account)
    const shopPublicKey = shopKeypair.publicKey

    // Initialize the connection to the solana dennet network
    const network = WalletAdapterNetwork.Devnet
    const endpoint = clusterApiUrl(network)
    const connection = new Connection(endpoint)


    // Get the buyer and seller coupon token accounts
    // Buyer one may not exist, so we create it (which costs SOL) as the shop account if it doesn't 

    /* const buyerCouponAddress = await getOrCreateAssociatedTokenAccount(
      connection,
      shopKeypair, // shop pays the fee to create it
      couponAddress, // which token the account is for
      buyerPublicKey, // who the token account belongs to (the buyer)
    ).then(account => account.address) */
    //console.log(buyerCouponAddress); // it is account address of the buyer coupon account.


    // Get the buyer and seller coupon token accounts
    // Buyer one may not exist, so we create it (which costs SOL) as the shop account if it doesn't 
    const buyerCouponAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      shopKeypair, // shop pays the fee to create it
      couponAddress, // which token the account is for
      buyerPublicKey, // who the token account belongs to (the buyer)
    )
    // getOrCreateAssociatedTokenAccount() is returning as an Account Object. 
    // Previously we only needed the address, but now we also need to check the amount so we keep it in this form

    // If the buyer has at least 5 coupons, they can use them and get a discount
    const buyerGetsCouponDiscount = buyerCouponAccount.amount >= 5

    const shopCouponAddress = await getAssociatedTokenAddress(couponAddress, shopPublicKey)


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


    // If the buyer has the coupon discount, divide the amount in USDC by 2
    const amountToPay = buyerGetsCouponDiscount ? amount.dividedBy(2) : amount // if the buyer has the coupon discount, then the amount to pay is half of the amount.

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
      amountToPay.toNumber() * (10 ** (await usdcMint).decimals), // amount to transfer (in units of the USDC token)
      usdcMint.decimals, // decimals of the USDC token
    )
    // The amount we charge the user in the transferInstruction is now based on buyerGetsCouponDiscount -
    // if they have the coupon discount then we charge them half as much


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

    // If we’re applying the coupon discount then the direction of the coupon exchange swaps - 
    //the buyer must send us 5 coupons in exchange for the discount. 
    //If they don’t yet have enough coupons for the discount then the shop continues to send them a 
    //single coupon with each transaction.

    const couponInstruction = buyerGetsCouponDiscount ?
      // The coupon instruction is to send 5 coupons from the buyer to the shop
      createTransferCheckedInstruction(
        buyerCouponAccount.address, // source account (coupons)
        couponAddress, // token address (coupons)
        shopCouponAddress, // destination account (coupons)
        buyerPublicKey, // owner of source account
        5, // amount to transfer
        0, // decimals of the token - we know this is 0
      ) :
      // The coupon instruction is to send 1 coupon from the shop to the buyer
      createTransferCheckedInstruction(
        shopCouponAddress, // source account (coupon)
        couponAddress, // token address (coupon)
        buyerCouponAccount.address, // destination account (coupon)
        shopPublicKey, // owner of source account
        1, // amount to transfer
        0, // decimals of the token - we know this is 0
      )

    // Add the shop as a signer to the coupon instruction
    // If the shop is sending a coupon, it already will be a signer
    // But if the buyer is sending the coupons, the shop won't be a signer automatically
    // It's useful security to have the shop sign the transaction
    couponInstruction.keys.push({
      pubkey: shopPublicKey,
      isSigner: true,
      isWritable: false,
    })

    //Earlier we discussed how having the shop sign transactions gives us a nice way to verify each transaction -
    //-is as we expected because it stops anybody from changing it.
    // If a transaction has our signature then we know we created it with our API.
    // But our shop was only a required signer because of the coupon instruction where it sent a coupon to the buyer. 
    //It’s no longer a required signer in the case where the buyer is sending the coupons and receiving the discount 
    //because the shop isn’t sending anything to the buyer in that transaction. 
    //In this code, we add our shop as a signer on the coupon instruction.
    // So whichever instruction we end up using, the transaction can only be made with the shop’s signature.


    /* // Create the instruction to send the coupon from the shop to the buyer
    const couponInstruction = createTransferCheckedInstruction( // this is the instruction to send the coupon from the shop to the buyer
      shopCouponAddress, // source account (coupon)
      couponAddress, // token address (coupon)
      buyerCouponAddress, // destination account (coupon)
      shopPublicKey, // owner of source account
      1, // amount to transfer
      0, // decimals of the token - we know this is 0
    ) */

    // This is very similar to the instruction we use to send USDC from the buyer to the shop, 
    // but it sends exactly 1 coupon from the shop to the buyer. We add both instructions to the transaction.
    // Add the instruction to the transaction
    // once we have added the extra key, we can add the instruction to the transaction
    // and it have now two instruction
    transaction.add(transferInstruction, couponInstruction)

    // Sign the transaction as the shop, which is required to transfer the coupon
    // We must partial sign because the transfer instruction still requires the user
    transaction.partialSign(shopKeypair)
    //Since the shop is now sending a token to the user, 
    //it must sign this transaction for it to be allowed to take place. 
    //As the comment says, this is only a partial sign because the user will still need to sign it afterward!


    //So now our API is producing a transaction where the buyer sends us USDC and we send a coupon back. 
    // It’s signed by our shop, which actually gives us some nice extra protection. 
    // Nobody can modify this transaction without invalidating the shop’s signature, 
    // and if they do that then the transaction can’t be processed. 
    // So when we’re reviewing the e-commerce transactions we don’t need to go checking the transaction details anymore, 
    // we just need to check we’ve signed it!




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

    const message = buyerGetsCouponDiscount ? "50% Discount! 🍪" : "Thanks for your order! 🍪"
    // Return the serialized transaction
    res.status(200).json({
      transaction: base64,
      message,
    })
  } catch (err) {
    console.error(err);

    res.status(500).json({ error: 'error creating transaction', })
    return
  }
}


const handler = async (req: NextApiRequest, res: NextApiResponse<MakeTransactionGetResponse | MakeTransactionOutputData | ErrorOutput>) => { // handler function is checking the request method and calls either get or post
  if (req.method === "GET") { // if the request is a get request, call the get function
    return get(res) // return the response from the get function to the client side
  } else if (req.method === "POST") {
    return await post(req, res)
  } else {
    return res.status(405).json({ error: "Method not allowed" })
  }
}

export default handler;


// https://docs.solana.com/developing/clients/javascript-api


