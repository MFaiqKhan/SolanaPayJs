// shop/checkout.tsx page

import { createQR, encodeURL, EncodeURLComponents, findTransactionSignature, FindTransactionSignatureError, validateTransactionSignature, ValidateTransactionSignatureError } from '@solana/pay'
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base'
import { clusterApiUrl, Connection, Keypair } from '@solana/web3.js'
import { useRouter } from 'next/router'
import { useEffect, useMemo, useRef } from 'react'
import BackLink from '../../components/BackLink'
import PageHeading from '../../components/PageHeading'
import { shopAddress, usdcAddress } from '../../lib/addresses'
import calculatePrice from '../../lib/calculatePrice'

export default function Checkout() {
  const router = useRouter()
  console.log(router.query) // this is actually coming from the form data, which is the products component

  const qrRef = useRef<HTMLDivElement>(null) // ref to a div where we will render the QR code
  // <HTMLDivElement> is a type definition for a div element will be using in useRef
  // This is important because React.useRef can only be null, or the element object.
  console.log(qrRef) // this is null because we haven't rendered the QR code yet);
  

  const amount = useMemo(() => calculatePrice(router.query), [router.query]) // calculate price based on query params
  // We’re calculating the amount we want to charge the user, will run when the query params change
  console.log(amount)

  // Unique address that we can listen for payments to
  const reference = useMemo(() => Keypair.generate().publicKey, [])
  console.log(reference)

  // Get a connection to Solana devnet
  const network = WalletAdapterNetwork.Devnet
  const endpoint = clusterApiUrl(network)
  const connection = new Connection(endpoint)

  // Solana Pay transfer params
  //code that generates that solana:... URL is:
  const urlParams: EncodeURLComponents = {
    recipient: shopAddress,
    splToken: usdcAddress, // If you want to charge in SOL with Solana Pay that’s super easy: just remove splToken from EncodeURLComponents. It’s an optional field and if it’s missing then everything will use SOL.
    amount,
    reference,
    label: 'Cookies Inc',
    message: 'Thanks for your order! 🍪',
  }

  //At a high level, we generate a QR code that encodes a URL. That URL will be something like this:
  // solana:EXWr1Go8UyfA39U1dfRkcH8uUvqunbRhQEUQNm36UsyQ?amount=15&spl-token=Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr&reference=25hRCjMFz46o9cEmNNwguNKTMXt2rCj7cEqAjW3w4gU8&label=Cookies%20Inc&message=Thanks%20for%20your%20order!%20%F0%9F%8D%AA

  //It starts with solana: and that’s followed by the recipient’s public key (our shop).
  //Then there are optional params: the amount, the SPL token, the reference, the label, and the message.
  //These parameters define the transaction that we want to create: the buyer should pay 15 USDC to the shop.
  //It also includes some display parameters - like label and message
  //which the user’s mobile wallet should show them to help understand the transaction.

  console.log(urlParams)

  // Encode the params into the format shown
  const url = encodeURL(urlParams)
  console.log({ url })

  //EncodeURLComponents is provided by Solana Pay and gives us a type to define the parameters.
  //encodeURL encodes these parameters into the solana:... URL format.

  // We use useEffect to render the QR code, this will run every rendering
  useEffect(() => {
    const qr = createQR(url, 512, 'transparent', '#E7B885') // create a QR code
    if (qrRef.current && amount.isGreaterThan(0)) { // if the ref is not null and the amount is greater than 0
      qrRef.current.innerHTML = '' // clear the div
      qr.append(qrRef.current) // append the QR code to the div
    }
  })

    // Check every 0.5s if the transaction is completed
    useEffect(() => {
      const interval = setInterval(async () => {
        try {
          // Check if there is any transaction for the reference
          //This is the same function we used before, except I’ve added an extra argument of confirmed. 
          //Solana transactions are very quickly confirmed, but take a little longer (up to a few seconds) 
          //to get finalized. If you’re dealing with really big transactions you might prefer to use finalized, 
          //but confirmed is usually enough! It’s also super fast!
          // ! It’s much more noticeable with Solana Pay than a browser wallet though.

          const signatureInfo = await findTransactionSignature(connection, reference, {}, 'confirmed')

          // In our ecommerce homepage , we are using  findTransactionSignature will find any transaction with the reference. 
          //In that case it wasn’t a big deal, we were just showing the user that we’d accepted their transaction. 
          //We’d be going through payments before dispatching orders!

          //But in our shop(with solana pay), we’re going to give them the cookies as soon as they’ve paid. 
          //So we need to be a bit more sure! Imagine somebody wrote an app that scans our QR code, 
          //extracts the reference, and then makes its own random Solana transaction that isn’t paying us. 
          //Or maybe it does pay us, but only $0.01. findTransactionSignature will dutifully report that a -
          //-transaction with our reference has been made, because it has! But it’s not the transaction we wanted.

          //That’s where validateTransactionSignature comes in. 
          //It will fetch the transaction that findTransactionSignature identified, 
          //and check that it matches the parameters we expect. 
          //If it didn’t pay us, or it paid us the wrong amount, 
          //it won’t validate and we won’t show the confirmed page!


          // Validate that the transaction has the expected recipient, amount and SPL token
          await validateTransactionSignature(connection, signatureInfo.signature, shopAddress, amount, usdcAddress, reference, 'confirmed')
          router.push('/shop/ConfirmedPage')
        } catch (e) {
          if (e instanceof FindTransactionSignatureError) {
            // No transaction found yet, ignore this error
            return;
          }
          if (e instanceof ValidateTransactionSignatureError) { // if the error is a ValidateTransactionSignatureError
            // Transaction is invalid
            console.error('Transaction is invalid', e)
            return;
          }
          console.error('Unknown error', e)
        }
      }, 500)
      return () => {
        clearInterval(interval) // clear the interval when the component is unmounted, cleanup function
      }
    }, [])

  return (
    <div className="flex flex-col items-center gap-8">
      <BackLink href="/shop">Cancel</BackLink>

      <PageHeading>Checkout ${amount.toString()}</PageHeading>

      {/* div added to display the QR code */}
      <div ref={qrRef} />
    </div>
  )
}

//So far Solana Pay is able to do exactly what our makeTransaction API is doing: it’s just transferring USDC from the buyer to the shop. This is called a transfer request