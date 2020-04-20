import React, { useState, useContext } from "react"
import * as d3 from "d3"

import Axis from "../Shared/Axis"
import { NetworkContext } from "../../NetworkPage"
import { ChartContext } from "../Shared/Chart"
import { SceneContext } from "../contexts/SceneContext"
import { ThemeContext } from "../contexts/ThemeContext"

import * as Consts from "../consts"

const Timeline = ({timeline}) => {

    // state for single vertical line representing marker to indicate hover position 
    //const [current, setCurrent] = useState({date: Consts.currentDate, score: Math.round(data.find(d=>d.type=='present').value * 100)/10})
    const { current, dispatch } = useContext(NetworkContext)
    const { dimensions } = useContext(ChartContext)
    const { sceneState } = useContext(SceneContext)
    const { themeState } = useContext(ThemeContext)

    //////////////////// styles ////////////////////
    const slider = {
      color: themeState.secondary,
      fill: themeState.secondary,
      visibility: sceneState.scene === 0 ? 'visible' : 'hidden'
    }
    ////////////////////////////////////////////////

    const { width, height } = dimensions
    const targetValue = width - 160
    const sliderPosX = 80
    const sliderPosY = height - 40
    const sliderHeight = 90

    const xScale = d3.scaleTime()
      .domain([new Date(2020, 1, 1), new Date(2020, 6, 1)])
      .range([sliderPosX, targetValue])

    const yScale = d3.scaleLinear()
        .domain([0, 60])
        .range([sliderHeight, 0])

    const line = d3.line()
        .x(function(d) { return xScale(d.key) }) 
        .y(function(d) { return yScale(d.value) })
 
    const marker = (current) => {

      const { date } = current
      const count = timeline.find(d=>d.key.getTime() === date.getTime()).value
      const currentX = xScale(date) 

      return(
        <g className='marker' transform={`translate(0, ${sliderHeight})`}>
          <rect 
            className='handle'
            width='2'
            height={sliderHeight+30}
            x={currentX}
            y={-sliderHeight-30}
            strokeWidth='0'
          />
          <text
            className='label'
            x={currentX+10}
            y={-sliderHeight-20}
            textAnchor='left'
            fontSize='12px'
          >
            { "Number of cases: " + count }
          </text>
          <text
            className='label_2'
            x={currentX+10}
            y={-sliderHeight-8}
            textAnchor='left'
            fontSize='11px'
          >
            { "Confirmed at: " + Consts.formatDate(date) }
          </text>  
        </g>
      )

    }

    return(
      <g transform={`translate(${sliderPosX}, ${sliderPosY})`} style={slider}>
        <g className='line-group' transform={`translate(0, ${-sliderHeight})`}>
          <rect 
            width={targetValue}
            height={sliderHeight + 50}
            fill={themeState.primary}
            fillOpacity='0.85'
          />
          {[timeline].map(d=>(
            <path 
              className='line'
              d={line(d)}
              stroke={themeState.secondary}
              strokeWidth='1'
              fill='none' 
            />
          ))}
          {timeline.map(d=>(
            <line 
              className='line-hover'
              x1={xScale(d.key)}
              y1={sliderHeight}
              x2={xScale(d.key)}
              y2={0}
              fill='none'
              stroke={themeState.secondary}
              strokeWidth='5'
              strokeOpacity='0'
              pointerEvents='all'
              onMouseEnter={ () => dispatch({ type: 'SET_DATE', date: d.key }) }
            />
          ))}
          <Axis
            dimension='x'
            dimensions={{'boundedWidth': targetValue, 'boundedHeight': sliderHeight}}
            scale={xScale}
            formatTick={Consts.formatDate}
            theme={themeState}
          />
          <Axis
            dimension='y'
            dimensions={{'boundedWidth': 0, 'boundedHeight': sliderHeight}}
            scale={yScale}
            theme={themeState}
          />
          { marker(current) }
        </g>
      </g>
    )
}

export default Timeline