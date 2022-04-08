// _app.tsx/js is component heirarchy , here we will wrap our app in context providers.
// This code is pretty much the same in any app using these Solana libraries.

import '../styles/globals.css'
import type { AppProps } from 'next/app'
import Layout from '../components/Layout'
import Head from 'next/head'
import {
  ConnectionProvider,
  WalletProvider,
} from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base'
import { clusterApiUrl } from '@solana/web3.js'
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from '@solana/wallet-adapter-wallets'

require('@solana/wallet-adapter-react-ui/styles.css') // this is the default styles of the wallet adapter, we can override it in our app by adding a new styles.css file

function MyApp({ Component, pageProps }: AppProps) {

  // creating a new connection to the devnet solana network
  const network = WalletAdapterNetwork.Devnet // we can change it to other networks like testnet, mainnet-beta or devnet
  const endpoint = clusterApiUrl(network) // can also provide custom endpoint (RPC)




  // @solana/wallet-adapter-wallets includes all the adapters but supports tree shaking and lazy loading --
  // Only the wallets you configure here will be compiled into your application, and only the dependencies
  // of wallets that your users connect to will be loaded.
  // Tree Shaking : https://developer.mozilla.org/en-US/docs/Glossary/Tree_shaking
  // Lazy Loading: https://developer.mozilla.org/en-US/docs/Web/Performance/Lazy_loading
  // defining the wallets that we want to use, we can add more wallets adaptars
  const wallets = [ // all the adaptars are coming from @solana/wallet-adapter-wallets
    // we can add multiple wallets
    new PhantomWalletAdapter(), // It's a wallet adapter for the Phantom Wallet
    new SolflareWalletAdapter({ network }), // It's a wallet adapter for the Solflare Wallet ,and it's using the same network as the rest of the adapters
  ]

  return (
    <ConnectionProvider endpoint={endpoint}> {/* // we are providing the connection to the wallet adapter */}
      <WalletProvider wallets={wallets} autoConnect> {/* // we are providing the wallets to the wallet adapter and we are auto connecting to the wallets */}
      <WalletModalProvider> {/* // wallet modal provider is used to show the wallet modal */}
          <Layout>
            <Head>
              <title>Bakery Co.</title>
            </Head>
            <Component {...pageProps} />
          </Layout>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}

export default MyApp

// An RPC (remote procedure call) endpoint is like a node's address
// it's a URL which requests for blockchain data can be sent to.
// The Ethereum JSON-RPC spec defines the methods which you can use to retrieve data from a node.
