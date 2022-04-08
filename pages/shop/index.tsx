// shop/page , is very similar to our main Homepage index.tsx but it's without Wallet
// because we just don’t want all that stuff about connecting a wallet 

//  We’ll put our point-of-sale shop interface at /shop


import Products from '../../components/Products'
import SiteHeading from '../../components/SiteHeading'

export default function ShopPage() {
  return (
    <div className="flex flex-col gap-8 max-w-4xl items-stretch m-auto pt-24">
      <SiteHeading>BAKERY CO.</SiteHeading>
      <Products submitTarget='/shop/checkout' enabled={true} />    
    </div>
  )
}