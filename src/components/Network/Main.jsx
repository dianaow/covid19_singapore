import React from "react"

import Chart from "../Shared/Chart"
import Graph from "./Graph"
import Timeline from "./Timeline"
import Tooltip from "./Tooltip";
import Legend from "./Legend"
import FilterPanel from "./FilterPanel"
import ZoomPanel from "./ZoomPanel"

import { TooltipProvider } from "../contexts/TooltipContext"
import { PanelProvider } from "../contexts/PanelContext"
import { ZoomProvider } from "../contexts/ZoomContext"
import { SceneProvider } from "../contexts/SceneContext"

import { useChartDimensions }  from "../utils"

const Main = ({data, timeline}) => {

  const [ref, dms] = useChartDimensions()

  return(
    <div className="Network" ref={ref}>
      <TooltipProvider>
        <PanelProvider>
          <ZoomProvider>
            <Legend />
            <SceneProvider>
              <ZoomPanel />
              <FilterPanel />
              <Chart dimensions={dms}>
                <Graph data={data} />
                <Timeline timeline={timeline} />   
                <Tooltip />
              </Chart>
            </SceneProvider>
          </ZoomProvider>
        </PanelProvider>
      </TooltipProvider>
    </div>
  )
}

export default Main