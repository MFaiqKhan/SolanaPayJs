// A page to display Confirmed.tsx component after transaction is successful , this page will be be redirected from checkout.tsx page to confirmed.tsx page.

import { useEffect, useState } from 'react'
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar'
import BackLink from '../components/BackLink'
import Confirmed from '../components/Confirmed'
import PageHeading from '../components/PageHeading'

const ConfirmedPage = () => {
  return (
    <div className="flex flex-col items-center gap-8">
      <BackLink href="/">Home</BackLink>

      <PageHeading>Thankyou, enjoy your cookies!</PageHeading>

      <div className="h-1/2 w-96">
        <Confirmed />
      </div>
    </div>
  )
}

export default ConfirmedPage
