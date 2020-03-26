import React from "react"

import Chart from "../Shared/Chart"
import Timeline from "./Timeline"

import { useChartDimensions }  from "../utils"

const Main = () => {

  //const [ref, dms] = useChartDimensions()
  const dms = {width: 1800, height: 1000}

  return(
    <div className="Events">
    <h1>Events</h1>
      <Chart dimensions={dms}>
        <Timeline />
      </Chart>
    </div>
  )
}

export default Main