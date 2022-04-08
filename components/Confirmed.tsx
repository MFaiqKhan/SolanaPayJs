// This is a component if the user has paid, we will show them , this component in a ConfirmedPage.tsx page pushing to router.
// This lets us animate a circular progress bar 'npm install react-circular-progressbar'.
// The progress bar library has animation built in, but it only animates on state changes -
//so if we just create a progress bar with 100% progress then it won’t animate.
//And the animation is nice! So we create it with 0% and then animate it to 100%

// we can customize it as we want .


import { useEffect, useState } from 'react'
import {
  buildStyles,
  CircularProgressbarWithChildren,
} from 'react-circular-progressbar'

export default function Confirmed() {
  const [percentage, setPercentage] = useState(0)
  const [text, setText] = useState('🍪')
  const [pathColor, setPathColor] = useState('#E7B885')

  useEffect(() => {
    const t1 = setTimeout(() => setPercentage(100), 100)
    const t2 = setTimeout(() => {setText('✅'); setPathColor("#00AB00")  }, 800)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [])

  return (
    <div style={{ display: "flex", justifyContent: "center", height: "100%", width: "28rem"}} className="font-medium">
      <div style={{ height: "100%", width: "100%" }}>
        <CircularProgressbarWithChildren
          value={percentage}
          styles={buildStyles({
            pathColor,
            pathTransitionDuration: 0.8,
          })}
        >
          <div style={{ textAlign: 'center', fontSize: 20 }}>
            <p style={{ fontSize: 20 }}>
              Thankyou for Purchasing, Your Order is Confirmed
            </p>
            <p style={{ fontSize: 27 }} className="mt-4">{text}</p>
          </div>
        </CircularProgressbarWithChildren>
      </div>
    </div>
  )
}
