import Products from '../components/Products'
import SiteHeading from '../components/SiteHeading'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'

export default function HomePage() {
  const { publicKey } = useWallet() // this is the public key of the wallet for the connected wallet , if there is one connected!.

  return (
    <div className="m-auto flex max-w-4xl flex-col items-stretch gap-8 pt-24">
      <SiteHeading>BAKERY CO.</SiteHeading>
      <div className="basis-1/4">
        <WalletMultiButton className="!bg-gray-900 hover:scale-105" />
        {/*  ability to connect to multiple wallets from the homepage to our homepage */}
      </div>

      {/* We disable checking out without a connected wallet */}
      {/* Also the submitTarget is /buy/transaction instead of /checkout */}
      <Products submitTarget="/checkout" enabled={publicKey !== null} />
      {/* // if there is a public key in the wallet, then we can enable the checkout button */}
    </div>
  )
}

// what are SiteHeading?
// SiteHeading is a component that renders a heading with a subtitle.
