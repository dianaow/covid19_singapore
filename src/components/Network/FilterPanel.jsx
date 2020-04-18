import React, { useEffect, useContext } from "react"
import * as d3 from "d3"

import { NetworkContext } from "../../NetworkPage"
import { PanelContext } from "../contexts/PanelContext"
import { SceneContext } from "../contexts/SceneContext"
import { ThemeContext } from "../contexts/ThemeContext"

import * as Consts from "../consts"
import { linkedByIndex, graphEle, isConnected } from "./Graph"

const FilterPanel = () => {

  const { current } = useContext(NetworkContext)
  const { sceneState } = useContext(SceneContext)
  const { panelState, setPanelState } = useContext(PanelContext)
  const { themeState, scales } = useContext(ThemeContext)
  const { status, gender, nationality, age, daysGroup, nodeRadius } = scales

  //////////////////// styles ////////////////////
  const chart_color_section = {
    background: themeState.primary
  }
  const btn = {
    color: themeState.secondary,
    background: themeState.primary,  
    border: `1px solid ${themeState.secondary}`
  }
  ////////////////////////////////////////////////

  const graphEle = {
    nodeFill : themeState.primary,
    nodeStroke : themeState.secondary,
    nodeTextFill : themeState.secondary,
    linkStroke : themeState.secondary,
    linkTextFill : themeState.secondary
  }

  let graphNodesGroup = d3.select('.Network').select('.nodes')
  let graphLinksGroup = d3.select('.Network').select('.links')
 
  //////////////// Control panel logic and set initial setting /////////////
  useEffect(() => {

    let val = panelState.clicked
    if(val !== 'node_color_1'){
      let nodesVisible
      let linksVisible
      if(sceneState.id) {
        nodesVisible = current.nodes.filter(o => isConnected(sceneState.id, o.id))
        linksVisible = current.links.filter(o => o.source.id === sceneState.id || o.target.id === sceneState.id)
      } else {
        nodesVisible = current.nodes
        linksVisible = current.links
      }

      // find all nodes in selected category except for the root node which can never be changed
      let nodesToRemove = nodesVisible.filter(d=>d.singaporean === Consts.mapping[val])
      let linksToRemove = []
      nodesToRemove.map(d=>{
        // find links connected to any node to be changed
        linksToRemove.push(...linksVisible.filter(o => o.source.id === d.id || o.target.id === d.id))
        graphNodesGroup.select('#node-' + d.id)
          .attr('fill-opacity', panelState[val] ? Consts.nodeOpacity : 0.2) // change opacity
          .attr('stroke-opacity', panelState[val] ? Consts.nodeOpacity : 0.2)
      })

      linksToRemove.map(d=>{
        graphLinksGroup.select('#path-' + d.source.id + "-" + d.target.id)
          .attr('opacity', panelState[val] ? 1 : 0.1)
          .attr('marker-mid', o => panelState[val] ? 'url(#arrowheadOpaque)' : 'url(#arrowheadTranparent)')
          
        graphLinksGroup.select('#path-' + d.source.id + "-" + d.target.id)
          .attr('opacity', panelState[val] ? 1 : 0.1)
          .attr('marker-mid', o => panelState[val] ? 'url(#arrowheadOpaque)' : 'url(#arrowheadTranparent)')
      })
    }

  }, [panelState.node_shape_1, panelState.node_shape_2])

  const checkActiveBtn = (name) => {
    let activeFilter = Object.keys(panelState).filter(id=>panelState[id])
    return (activeFilter.indexOf(name) !== -1) ? "btn active" : "btn";
  }

  function updateGraphManually(colorAccessor) {

    graphNodesGroup.selectAll("circle")
      .transition().duration(350)
      .attr('stroke', d => d.type === 'root' ? graphEle.nodeStroke : colorAccessor(d))
      .attr('fill', d => (d.type === 'parent' | d.type === 'root') ? graphEle.nodeFill : colorAccessor(d))

    graphNodesGroup.selectAll("rect")
      .transition().duration(350)
      .attr('stroke', d => d.type === 'root' ? graphEle.nodeStroke : colorAccessor(d))
      .attr('fill', d => (d.type === 'parent' | d.type === 'root') ? graphEle.nodeFill : colorAccessor(d))
    
  }

  return(
    <div className='Chart_color_section' style={chart_color_section}>
      <p>Color nodes by:</p>
      <input name="color_scale" 
             type="button" 
             style={btn}
             className={checkActiveBtn('node_color_1')}
             onClick={() => {
              setPanelState({'node_color_1': true, 'node_color_2': false, 'node_color_3': false, 'node_shape_1': panelState.node_shape_1, 'node_shape_2': panelState.node_shape_2, 'clicked': 'node_color_1'})
              let colorAccessor =  d => status.scale(d.status)
              updateGraphManually(colorAccessor)
             }}
             value="Status"/>
      <input name="color_scale" 
             type="button"
             style={btn}
             className={checkActiveBtn('node_color_2')} 
             onClick={() => {
              setPanelState({'node_color_1': false, 'node_color_2': true, 'node_color_3': false, 'node_shape_1': panelState.node_shape_1, 'node_shape_2': panelState.node_shape_2, 'clicked': 'node_color_2'})
              let colorAccessor =  d => age.scale(d.age)
              updateGraphManually(colorAccessor)
             }}
             value="Age"/>
      <input name="color_scale" 
             type="button"
             style={btn}
             className={checkActiveBtn('node_color_3')} 
             onClick={() => {
              setPanelState({'node_color_1': false, 'node_color_2': false, 'node_color_3': true, 'node_shape_1': panelState.node_shape_1, 'node_shape_2': panelState.node_shape_2, 'clicked': 'node_color_3'})
              let colorAccessor =  d => daysGroup.scale(d.days_to_recover_group)
              updateGraphManually(colorAccessor)
             }}
             value="Recovery Days"/>
      <p>Only show:</p>
      <input name="entity_filter" 
             type="button" 
             style={btn}
             className={checkActiveBtn('node_shape_1')}
             onClick={() => setPanelState({'node_color_1': panelState.node_color_1, 'node_color_2': panelState.node_color_2,  'node_color_3': panelState.node_color_3, 'node_shape_1': !panelState.node_shape_1, 'node_shape_2': panelState.node_shape_2, 'clicked': 'node_shape_1'})}
             value="Singaporean / PR"/>
      <input name="entity_filter" 
             type="button" 
             style={btn}
             className={checkActiveBtn('node_shape_2')}
             onClick={() => setPanelState({'node_color_1': panelState.node_color_1, 'node_color_2': panelState.node_color_2,  'node_color_3': panelState.node_color_3, 'node_shape_1': panelState.node_shape_1, 'node_shape_2': !panelState.node_shape_2, 'clicked': 'node_shape_2'})}
             value="Foreigner"/>
    </div>
  )

}

export default FilterPanel