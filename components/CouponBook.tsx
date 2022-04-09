// component for Displaying the user’s coupon balance

import { getAssociatedTokenAddress, getAccount, TokenAccountNotFoundError } from "@solana/spl-token"
import { useConnection, useWallet } from "@solana/wallet-adapter-react"
import { useState, useEffect } from "react"
import { couponAddress } from "../lib/addresses"

export default function CouponBook() {
  const { connection } = useConnection()
  const { publicKey } = useWallet()
  const [couponBalance, setCouponBalance] = useState(0) // this is the coupon balance of the user in the wallet initially set to 0


  async function getCouponBalance() { // this function gets the coupon balance of the user in the wallet
    if (!publicKey) { // if there is no public key in the wallet means wallet ain't connected, then we can't get the coupon balance
      setCouponBalance(0) // so we set the coupon balance to 0
      return
    }

    try {
      const userCouponAddress = await getAssociatedTokenAddress(couponAddress, publicKey) // this is the address associated with of the user's coupon account.
      console.log("userCouponAddress", userCouponAddress);
      const userCouponAccount = await getAccount(connection, userCouponAddress) // this is the account of the user's coupon account, means token account
      console.log("userCouponAccount", userCouponAccount);
      const coupons = userCouponAccount.amount > 5 ? 5 : Number(userCouponAccount.amount)  // if the user's coupon account has more than 5 coupons, then we set the coupon balance to 5, otherwise we set the coupon balance to the number of coupons in the user's coupon account.

      console.log("balance is", coupons)
      setCouponBalance(coupons)

    } catch (e) {
      if (e instanceof TokenAccountNotFoundError) { // initially token account(user coupon account) is not created, so we set the coupon balance to 0
        // This is ok, the API will create one when they make a payment
        console.log(`User ${publicKey} doesn't have a coupon account yet!`)
        setCouponBalance(0)
      } else {
        console.error('Error getting coupon balance', e)
      }
    }
  }

  useEffect(() => {
    getCouponBalance()
  }, [publicKey]) // will always run on different public key, so we can get the coupon balance of the user in the wallet

  const notCollected = 5 - couponBalance // this is the number of coupons that the user has not collected yet.

  console.log("couponBalance", couponBalance); // each element is an empty string and we are mapping over it
  console.log([...Array(couponBalance)]); //each element is an empty string and we are mapping over it
  
  console.log("notCollected", notCollected);
  console.log([...Array(notCollected)]); //each element is an empty string and we are mapping over it
  
  

  return (
    <>
      <div className="flex flex-col bg-gray-900 text-white rounded-md p-1 items-center">
        <p>Collect 5 cookies to receive a 50% discount on your next purchase!</p>

        <p className="flex flex-row gap-1 place-self-center">
          {[...Array(couponBalance)].map((_, i) => <span key={i}>🍪</span>)}  {/* // [...Array(couponBalance)] is an array of couponBalance number of elements, each element is an empty string and we are mapping over it and returning a span element for each element. */}
          {[...Array(notCollected)].map((_, i) => <span key={i}>⚪</span>)}
        </p>
      </div>
    </>
  )
}

// what is [...Array(couponBalance)].map((_, i)?
// [...Array(couponBalance)] is an array of couponBalance number of elements, each element is an empty string and we are mapping over it and returning a span element for each element.

// what is [...Array]?
// [...Array] is a spread operator, it spreads the elements of an array into a new array.