// Requesting the Transaction.


import { useWallet ,useConnection} from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Keypair, Transaction } from "@solana/web3.js";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import BackLink from "../components/BackLink";
import Loading from "../components/Loading";
import { MakeTransactionInputData, MakeTransactionOutputData } from "./api/makeTransactions";
import { findTransactionSignature, FindTransactionSignatureError } from "@solana/pay";


export default function Checkout() {
  const router = useRouter(); 
  const { connection } = useConnection(); // this is the connection to the network, GETTING Solana network connection.
  const { publicKey, sendTransaction } = useWallet(); //This just reads the connected wallet from the home page. 
  // It’ll be null if there’s no connected wallet.
  // send transaction is a function that sends a transaction to the network using the connected wallet.
  // and send transaction is coming from connected wallet.

  // State to hold API response fields
  // our API returns a transaction + message . and we are setting it 
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Read the URL query (which includes our chosen products)
  // converting query params to URLSearchParams object, becuase its easier to work with
  // the products we selected are in the query params, and we need them in our API.

  const searchParams = new URLSearchParams(); // CONVERTING THE QUERY TO A URL SEARCH PARAMS OBJECT
  for (const [key, value] of Object.entries(router.query)) {  // LOOPING THROUGH THE QUERY OBJECT
    console.log(key, value);
    
    if (value) { // IF THE VALUE IS NOT NULL
      if (Array.isArray(value)) {  // IF THE VALUE IS AN ARRAY
        for (const v of value) { // LOOP THROUGH THE ARRAY
          searchParams.append(key, v); // ADD THE KEY AND v of every value TO THE URL SEARCH PARAMS OBJECT
        }
      } else { // IF THE VALUE IS NOT AN ARRAY
        searchParams.append(key, value); // ADD THE KEY AND whole value to the URL SEARCH PARAMS OBJECT
      }
    }
  }
  console.log(searchParams); // LOG THE URL SEARCH PARAMS OBJECT TO THE CONSOLE
  

  // Generate the unique reference which will be used for this transaction
  const reference = useMemo(() => Keypair.generate().publicKey, []); // useMemo is a React hook that only re-renders when the value it returns changes. It’s a performance optimization.
  // we will be creating a new keypair every time we render the page, so we can use the public key to generate a unique reference.
  // on every transaction, checkout page, we will be generating a new reference.

  // Add it to the params we'll pass to the API
  searchParams.append('reference', reference.toString());

  // Use our API to fetch the transaction for the selected items
  async function getTransaction() {
    console.log(publicKey);
    
    if (!publicKey) { // if there is no public key, we can't make a transaction
      return;
    }

    // account body
    const body: MakeTransactionInputData = { // creating body variable , type of MakeTransactionInputData which we have defined in api/transactions file
      account: publicKey.toString(),  // account is the public key of the connected wallet, converting to string as defined in type
    }

    const response = await fetch(`/api/makeTransactions?${searchParams.toString()}`, { // fetching reponse from the api/makeTransactions/searchParams.toString() which is the url with the query params
      method: 'POST',
      headers: {
        'Content-Type': 'application/json' // setting the content type to json
      },
      body: JSON.stringify(body), // converting body to json string
    })

    const json = await response.json() as MakeTransactionOutputData // converting the response to json and setting it to json variable. it should be of type MakeTransactionOutputData means containing the transaction and message.
    console.log(json); // logging the json to the console
    

    if (response.status !== 200) {
      console.error(json);
      return;
    }

    // Deserialize the transaction from the response
    const Deserializetransaction = Transaction.from(Buffer.from(json.transaction, 'base64')); // converting the transaction/ decoding from base64 and deserialize it to transaction object
    setTransaction(Deserializetransaction); // setting the transaction to the transaction state
    setMessage(json.message); // setting the message to the message state
    console.log(transaction); // logging the transaction to the console from the useState
    console.log(Deserializetransaction); // logging the deserialized transaction to the console from the useState
    
  }

  useEffect(() => { 
    getTransaction() // calling the getTransaction function
  }, [publicKey]) // only re-run the effect if the public key changes

  console.log(publicKey);
  


  // If we have a transaction, we can send it to the network
  // Send the fetched transaction to the connected wallet

  async function sendTransactionToNetwork() {
    if (!transaction) { // if there is no transaction
      return; // return nothing 
    } 
    try { // if there is a transaction
      await sendTransaction(transaction, connection); // send the transaction to the network using the connected wallet
    } catch (e) { 
      console.error(e); // if there is an error
    }
  }

  // Send the transaction once it's fetched
  useEffect(() => { 
    sendTransactionToNetwork() // calling the sendTransactionToNetwork function
  }, [transaction]) // only re-run the effect if the transaction changes or is present out there

  // When the transaction state gets updated (which we do when we call setTransaction) 
  // we send that transaction to the user’s wallet using sendTransaction


  // Check every 0.5s if the transaction is completed
  // We’ve added an interval that checks every 0.5s to see if there is any transaction using our reference. 
  // If there isn’t then findTransactionSignature will throw a FindTransactionSignatureError which we catch and ignore.
  // So now our checkout page will just keep polling in the background to see if the user has paid.

  // The call to findTransactionSignature will find any transaction using our reference, which is not secret.
  //  It doesn’t guarantee that the correct transaction has been made. 
  //  In this case it’s OK because we’re just showing feedback to the user
  useEffect(() => {
    const interval = setInterval( async () => { // setting an interval
      try { 
        // Check if there is any transaction for the reference
        const signatureInfo = await findTransactionSignature(connection, reference)  // finding the transaction using the reference and connection
        console.log(signatureInfo); 
        console.log('They Paid!!'); // if they paid, they paid, It will keep polling in the background to see if the user has paid and will show them they paid . means console log will show them they paid every 0.5 sec 
        router.push('/ConfirmedPage'); // users will be redirected to the confirmed page after their transaction successfully made
      } catch (e) {
        if (e instanceof FindTransactionSignatureError) { // if the error is a FindTransactionSignatureError
          // No transaction found yet, ignore this error
          return; 
        }
        console.error('Unknown error', e); 
      }
    }, 500); // every 0.5s
    return () => { // when the component is unmounted
      clearInterval(interval); // clear the interval
    } 
  }, []) // only re-run the effect if the connection changes


  if (!publicKey) {
    return (
      <div className='flex flex-col gap-8 items-center'>
        <div><BackLink href='/'>Cancel</BackLink></div>

        <WalletMultiButton />

        <p>You need to connect your wallet to make transactions</p>
      </div>
    )
  }

  return (
    <div className='flex flex-col gap-8 items-center'>
      <div><BackLink href='/'>Cancel</BackLink></div>

      <WalletMultiButton />

      {message ?
        <p>{message} Please approve the transaction using your wallet</p> :
        <p className="flex items-center justify-between"><span className="mr-4 font-semibold">Creating transaction...</span> <Loading /></p>
      }
    </div>
  )
}

// Our render is a bit more interesting now! First we handle the case where there isn’t a publicKey -
// we can’t create the transaction without that.
// We just show the wallet connect button and let the user know they’ll need to connect.

//Otherwise, we first show a little loading indicator while we fetch the transaction. 
//Once we have it, we show the message returned by the API. 
//If you refresh the page you should see the transaction fetched 