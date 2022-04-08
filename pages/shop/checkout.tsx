// shop/checkout.tsx page 

import { useRouter } from "next/router"; 
import { useMemo } from "react";
import BackLink from "../../components/BackLink";
import PageHeading from "../../components/PageHeading";
import calculatePrice from "../../lib/calculatePrice";

export default function Checkout() {
  const router = useRouter()

  console.log(router.query); // this is actually coming from the form data, which is the products component
  
  const amount = useMemo(() => calculatePrice(router.query), [router.query])  // calculate price based on query params
  // We’re calculating the amount we want to charge the user
  console.log(amount);
  
  return (
    <div className="flex flex-col gap-8 items-center">
      <BackLink href='/shop'>Cancel</BackLink>
      <PageHeading>Checkout ${amount.toString()}</PageHeading>
    </div>
  )
}