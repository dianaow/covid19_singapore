import React from "react"

import Chart from "../Shared/Chart"
import Timeline from "./Timeline"

import { useChartDimensions }  from "../utils"

const Main = () => {

  //const [ref, dms] = useChartDimensions()
  const dms = {width: 1000, height: 1000}

  return(
    <div className="Events">
      <Chart dimensions={dms}>
        <Timeline />
      </Chart>
    </div>
  )
}

export default Main