// Same as ecommerce main homepage store

import BackLink from '../../components/BackLink'
import Confirmed from '../../components/Confirmed'
import PageHeading from '../../components/PageHeading'

const ConfirmedPage = () => {
  return (
    <div className="flex flex-col items-center gap-8">
      <BackLink href="/">Home</BackLink>

      <PageHeading>Thankyou for USING SolanaPay, enjoy your cookies!</PageHeading>

      <div className="h-1/2 w-96">
        <Confirmed />
      </div>
    </div>
  )
}

export default ConfirmedPage