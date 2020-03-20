import React, { useContext } from "react"
import cx from 'classnames';

import { NetworkContext } from "../../NetworkPage"
import { initialTooltipState, TooltipContext } from "../contexts/TooltipContext"
import { SceneContext } from "../contexts/SceneContext"

import "./card.css"
import './tooltip.scss'

const TooltipEvent = (data) => {

  console.log(data)
  return( 
    <div className='Tooltip'>
      <div style={{border:0, textAlign:'center', fontWeight: 900, padding: '4px'}}>{data.patient}</div>
        <div className='table-row-contents'>
          <div className="row">
            <div className="cell-header">PLACES VISITED</div>
            <div className="value">{data.places}</div>
          </div>
          <div className="row">
            <div className="cell-header">WORKS AT</div>
            <div className="value">{data.works_at}</div>
          </div>
          <div className="row">
            <div className="cell-header">LIVES AT</div>
            <div className="value">{data.lives_at}</div>
          </div>
        </div>  
    </div>   
  )

}

const TooltipEntity = (d) => {

  return(
    <div className='Tooltip'>
      <div className="name wordwrap">{d.patient}</div>
      <div className='tooltipContent_grid'>
        <div className="cell cell-50">
          <div className="title">ID</div>
          <div className="value">{d.id}</div>
        </div>
        <div className="cell cell-50">
          <div className="title">Confirmed at</div>
          <div className="value">{d.confirmed_at}</div>
        </div>
        <div className="cell cell-50">
          <div className="title">Days to recover</div>
          <div className="value">{`${d.days_to_recover} days`}</div>
        </div>
        <div className="cell cell-50 cell-wrapped">
          <div className="title">Symptomatic to Confirmation</div>
          <div className="value">{`${d.days_to_confirmation} days`}</div>
        </div>
      </div>
    </div>   
  )

}

const Tooltip = () => {

  const { current } = useContext(NetworkContext)
  const { sceneState } = useContext(SceneContext)
  const { tooltipState, setTooltip } = useContext(TooltipContext)
  const { x, y, position, show, content } = tooltipState
  const radius = content.radius ? content.radius : 0

  let xNew, yNew, width, height
  if(sceneState.scene === 0){
    width = 250
    height = 150
    if(position==='left'){
      xNew = x-width-10-radius
    } else {
      xNew = x+10+radius 
    }
    yNew = y-height/2  
  } else {
    width = 500
    height = 240
    xNew = x-width
    yNew = y-height-20
  }

  return(
    <g
      transform={`translate(${xNew}, ${yNew})`}
      style={{ visibility: show ? 'visible' : 'hidden' }} >
      <foreignObject width={width} height={height} className='tooltipFO'>
        <div className={cx('tooltipContent', position)}>
            { (sceneState.scene !== 0) ? <span className="close" onClick={()=>setTooltip(initialTooltipState)}>X</span> : <span className="arrow"></span> }
            { (sceneState.scene !== 0 ) ? TooltipEvent(content) : TooltipEntity(content) }
        </div>
      </foreignObject>
    </g>
  )

}

export default Tooltip;