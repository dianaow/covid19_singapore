import React, { useContext } from "react"
import { Icon } from 'semantic-ui-react'

import { PanelContext } from "../contexts/PanelContext"
import { ThemeContext } from "../contexts/ThemeContext"

const Legend = ({...props}) => {

  const { panelState } = useContext(PanelContext)
  const { themeState, scales } = useContext(ThemeContext)
  const { status, gender, nationality, age, daysGroup, nodeRadius } = scales

  let activeFilter = Object.keys(panelState).filter(id=>panelState[id])
  let toColor = activeFilter[0].indexOf('color') !== -1

  //////////////////// styles ////////////////////
  const chart_legend_section = {
    background:  themeState.primary
  }

  const legend_header = {
    fill: themeState.secondary,
    fontSize: "0.85em",
    fontWeight: "bold",
  }

  const legend_content_text = {
    fill: themeState.secondary,
    fontSize: '0.75em',
    alignmentBaseline: 'middle',
    textAnchor: 'left'
  }

  const title = {
    color: themeState.secondary,
    borderBottom: `1px solid ${themeState.secondary}`, 
    padding: "5px"
  }

  ////////////////////////////////////////////////

  const legendRenderer = (attribute) => {

    if(attribute === 'node_color_1'){
      return drawCategoryLegend(status)
    } else if(attribute === 'node_color_2'){
      return drawLinearLegend(age)
    } else if(attribute === 'node_color_3'){
      return drawCategoryLegend(daysGroup)
    } 
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
                  style={legend_content_text}
                  key={d}
                  x={30}
                  y={15 + i*20}
                  fontSize={11}
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

  const drawIconLegend = () => {

    const label = ['Building', 'Home', 'Imported', 'Unlinked']
    const domain = ['building', 'home', 'plane', 'question']

    return (
      <div className="Legend">
        <div className="Legend__color">
          <svg height={domain.length*24}>
            {label.map((d, i) => (
              <g className='legend__colorEle'>
                <foreignObject
                  x={15}
                  y={15 + i*20}
                  width={50}
                  height={50}
                  transform={`translate(-10, -10)`}>
                  <div class='legend-icon'>
                    <Icon name={domain[i]} />
                  </div>
                </foreignObject>
                <text
                  style={legend_content_text}
                  key={d}
                  x={30}
                  y={15 + i*20}
                  fontSize={11}
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
            <text x={data.domain.length / 2} y='10' style={legend_header}>{ label }</text>
            {domain.map((d,i) => (
              <g className='legend__colorEle'>
                <rect
                  x={legendElementWidth * i}
                  y={legendElementWidth}
                  width={legendElementWidth}
                  height={legendElementWidth / 2}
                  fill={scale(d)} />
                <text
                  style={legend_content_text}
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

    var xCircle = 20
    var xLabel = 80
    var yCircle = 30

    return(
      <svg width='100%' height='50px'>
        <g className='legend__radius' transform="translate(0,10)">
          <text x='50' y='5' style={legend_header}>{ label }</text>
          <text x='50' y='20' style={legend_header}>for each case</text>
          {domain.map((d,i) => (
            <g className='legend__colorEle'>
              <circle 
                cx={xCircle}
                cy={yCircle - scale(d)}
                r={scale(d)}
                fill='none'
                stroke= {themeState.secondary} />
            </g>
          ))}
        </g>
      </svg>  
    )

  }

  const drawShapeLegend = () => {

    const size = 5

    return(
      <svg width='100%' height='60px'>
        <g className='legend__category' transform="translate(0,10)">
          <circle 
            cx={15-size} 
            cy='15' 
            r={size}
            fill='none'
            stroke={themeState.secondary}/>
          <text
            style={legend_content_text}
            x='20' 
            y='15'>
            Singaporean
          </text>
          <text
            style={legend_content_text}
            x='20' 
            y='35' 
            fill={themeState.secondary}>
            Singapore PR
          </text>
          <rect
            x='115' 
            y={15-size} 
            width={size*2}
            height={size*2}
            fill='none'
            stroke={themeState.secondary}/>
          <text
            style={legend_content_text}
            x={110+size+20} 
            y='15'>
            Foreigner
          </text>
        </g>
      </svg>  
    )
  }

  return(
    <div className="Chart_legend_section" style={chart_legend_section}>
      <div style={title}>LEGEND</div>  
      <div className='legend'>
        { drawShapeLegend() }
        { drawRadiusLegend(nodeRadius) }
        { drawIconLegend() }
      </div>
      { toColor ? legendRenderer(activeFilter[0]) : <div/> } 
    </div>
  )

}

export default Legend