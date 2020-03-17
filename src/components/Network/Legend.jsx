import React, { useContext } from "react"

import { PanelContext } from "../contexts/PanelContext"

import * as Consts from "../consts"

const Legend = () => {

  const { status, gender, nationality, age, days, nodeRadius } = Consts.scales
  const { panelState } = useContext(PanelContext)
  const attribute = panelState.clicked

  const legendRenderer = (attribute) => {
    if(attribute === 'node_color_1'){
      return drawCategoryLegend(status)
    } else if(attribute === 'node_color_2'){
      return drawLinearLegend(age)
    }
  } 

  return(
    <div className="Chart_legend_section">
      <p>LEGEND</p>  
      <div className='legend'>
        { drawRadiusLegend(nodeRadius) }
      </div>
      { legendRenderer(attribute) }
    </div>
  )

}


const drawCategoryLegend = (data) => {

  const { label, domain, scale } = data
  const size = 5

  return (
    <div className="Legend">
      <div className="Legend__color">
        <h4>{label}</h4>
        <svg height={domain.length*24}>
          {domain.map((d, i) => (
            <g className='legend__colorEle'>
              <circle
                cx={15}
                cy={15 + i*20}
                r={size}
                fill={scale(d)}
                stroke={scale(d)} />
              <text
                key={d}
                x={30}
                y={15 + i*20}
                fontSize={10}
                fill='white'
                alignmentBaseline='middle'
                textAnchor='left' >
                { d }
              </text> 
            </g>   
          ))} 
        </svg>
      </div>     
    </div>
  )

}

const drawLinearLegend = (data) => {

  const { label, domain, scale } = data
  const gridSize = 15
  const legendElementWidth = gridSize * 1.5

  return(
    <div className='legend-color'>
      <svg width='100%' height={legendElementWidth*3}>
        <g className='legend__score' transform="translate(0,20)">
          <text className='legend-header' x={data.domain.length / 2} y='10'>{ label }</text>
          {domain.map((d,i) => (
            <g className='legend__colorEle'>
              <rect
                x={legendElementWidth * i}
                y={legendElementWidth}
                width={legendElementWidth}
                height={legendElementWidth / 2}
                fill={scale(d)} />
              <text
                className='legend-content-text'
                x={(legendElementWidth * i) + (legendElementWidth / 2)}
                y={legendElementWidth * 2}
                textAnchor='middle'>
                { d }
              </text>
            </g>
          ))}
        </g>
      </svg>
    </div>
  )

}

const drawRadiusLegend = (data) => {

  const { label, domain, scale } = data

  return(
    <svg width='100%' height='100px'>
      <g className='legend__radius' transform="translate(0,10)">
        <text className='legend-header'>{ label }</text>
        {domain.map((d,i) => (
          <g className='legend__colorEle'>
            <circle 
              cx='45'
              cy={80 - scale(d)}
              r={scale(d)}
              fill='none'
              stroke='white' />
          </g>
        ))}
      </g>
    </svg>  
  )

}

export default Legend