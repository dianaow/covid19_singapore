import React, { useEffect, useContext } from "react"
import * as d3 from "d3"
import { forceManyBodyReuse } from "d3-force-reuse"

import { NetworkContext } from "../../NetworkPage"
import { ZoomContext } from "../contexts/ZoomContext"
import { ThemeContext } from "../contexts/ThemeContext"
import { PanelContext } from "../contexts/PanelContext"
import { initialTooltipState, TooltipContext } from "../contexts/TooltipContext"
import { maxScene, SceneContext } from "../contexts/SceneContext"
import { ChartContext } from "../Shared/Chart"

import clusters from '../../data/covid19_cluster_details.json';

import * as Consts from "../consts"
import { getTranslation } from "../utils"

let nodeTextOpacity = Consts.nodeTextOpacity
let linkTextOpacity = Consts.linkTextOpacity

let bool = d => ['Imported', 'UK', 'US', 'Indonesia'].indexOf(d.root_id) !== -1 | d.root_id ==='Unlinked'
let bool_1 = d => ['Imported', 'UK'].indexOf(d.root_id) !== -1 | d.root_id ==='Unlinked'

const simulation = d3.forceSimulation()
  .force("link", d3.forceLink()
    .distance(function(d) { return d.distance })
    .strength(function(d) { return d.strength })
  )
  //.alphaTarget(0.8)

// store states in a global variable as a hack to pass state values to helper functions placed outside the component
var Scene
export const linkedByIndex = []

const Graph = ({data}) => { 

  const { current, dispatch } = useContext(NetworkContext)
  const { zoom, zoomState } = useContext(ZoomContext)
  const { setTooltip } = useContext(TooltipContext)
  const { sceneState, clicker } = useContext(SceneContext)
  const { panelState } = useContext(PanelContext)
  const { dimensions } = useContext(ChartContext)
  const { themeState, setTheme, scales } = useContext(ThemeContext)
  const { colorAccessor, status, gender, nationality, age, daysGroup, nodeRadius } = scales

  Scene = sceneState.scene

  let graphEle = {
    nodeFill : themeState.primary,
    nodeStroke : themeState.secondary,
    nodeTextFill : themeState.secondary,
    linkStroke : themeState.secondary,
    linkTextFill : themeState.secondary
  }

  // This object passes required variables to graph helper functions placed outside the component
  const graphWrapper = {width: dimensions.width, height: dimensions.height * 0.7}
  const modulePosition = findClusterCenter(graphWrapper)

  ///////////////////////// Initial Graph Render //////////////////////////
  useEffect(() => {
    if(current.date === Consts.currentDate){
      if(dimensions.width>0 & dimensions.height>0){
        updateGraph(data, current) 
        dispatch({ type: 'SET_RENDERED', rendered: true})
      }
    }
  }, [dimensions.width, dimensions.height])

  //////////////////////////////// Update Graph ///////////////////////////
  useEffect(() => {
    if(dimensions.width>0 & dimensions.height>0){
      simulation.stop()
      let graph = updateGraph(data, current) 
      dispatch({ type: 'SET_STATS', nodes: graph.nodes, links: graph.links })
    }

  }, [current.date])

  //////////////// Create a zoom and set initial zoom level /////////////
  const svg = d3.selectAll('.networkWrapper')
  svg.call(zoom).on("dblclick.zoom", null);

  useEffect(() => {

    if(Scene === 0){

      setTooltip(initialTooltipState)

      if(zoomState.k >= 1.4){
        nodeTextOpacity = 1
        linkTextOpacity = 0.5
      } else {
        nodeTextOpacity = Consts.nodeTextOpacity
        linkTextOpacity = Consts.linkTextOpacity
      }
      d3.selectAll('.edge-label').attr('opacity', linkTextOpacity)
      d3.selectAll('.node-label').attr('opacity', nodeTextOpacity)

    } else {

      if(zoomState.k >= 1.4){
        nodeTextOpacity = 0
        linkTextOpacity = 0
      }

    }

  }, [zoomState])


  //////////////////////////////// Update Theme ///////////////////////////
  useEffect(() => {

    let colorAccessor 
    if(panelState.clicked === 'node_color_1'){
      colorAccessor =  d => status.scale(d.status)
    } else if (panelState.clicked === 'node_color_2') {
      colorAccessor =  d => age.scale(d.age)
    } else if (panelState.clicked === 'node_color_3') {
      colorAccessor =  d => daysGroup.scale(d.days_to_recover_group)
    }

    svg.selectAll(".node-circle")
      .transition().duration(350)
      .attr('stroke', d => d.type === 'root' ? graphEle.nodeStroke : colorAccessor(d))
      .attr('fill', d => (d.type === 'parent' | d.type === 'root') ? graphEle.nodeFill : colorAccessor(d))

    svg.selectAll(".node-rect")
      .transition().duration(350)
      .attr('stroke', d => d.type === 'root' ? graphEle.nodeStroke : colorAccessor(d))
      .attr('fill', d => (d.type === 'parent' | d.type === 'root') ? graphEle.nodeFill : colorAccessor(d))

    svg.selectAll(".node-label")
      .attr('fill', graphEle.nodeTextFill)

    svg.selectAll(".root-label")
      .attr('fill', graphEle.nodeTextFill)

    svg.selectAll(".link")
      .transition().duration(350)
      .attr('stroke', graphEle.linkStroke)

    svg.selectAll(".edge-label")
      .transition().duration(350)
      .attr('fill', graphEle.linkTextFill)

  }, [themeState])

  return(
    <React.Fragment>
      <defs>
        <marker id="arrowheadTransparent" viewBox="-0 -5 10 10" refX="0" refY="0" orient="auto" markerWidth="7" markerHeight="10">
          <path d="M 0,-5 L 10 ,0 L 0,5" fill={graphEle.linkStroke} fillOpacity="0" stroke="none"></path>
        </marker>
      </defs>
      <defs>
        <marker id="arrowhead" viewBox="-0 -5 10 10" refX="0" refY="0" orient="auto" markerWidth="7" markerHeight="10">
          <path d="M 0,-5 L 10 ,0 L 0,5" fill={graphEle.linkStroke} fillOpacity="0.5" stroke="none"></path>
        </marker>
      </defs>
      <defs>
        <marker id="arrowheadOpaque" viewBox="-0 -5 10 10" refX="0" refY="0" orient="auto" markerWidth="7" markerHeight="10">
          <path d="M 0,-5 L 10 ,0 L 0,5" fill={graphEle.linkStroke} fillOpacity="1" stroke="none"></path>
        </marker>
      </defs> 
      <g className='network' transform={`translate(${zoomState.x}, ${zoomState.y}) scale(${zoomState.k})`}>
        <g className='links'></g>
        <g className='nodes'></g>
      </g>
    </React.Fragment>
  )

  ///////////////////////////////////////////////////////////////////////////////////////////////////////////
  ///////////////////////////////// Graph Network: Create node and link elements ////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////
  function draw(nodes, links, accessors) {

    function nodeKey(n) {
      return n.id;
    }
    function linkKey(d) {
      return d.source.id + '-' + d.target.id;
    }

    let { root, parent, rootparent, berects, linkOpacityAccessor } = accessors
    let graphNodesGroup = d3.select('.Network').select('.nodes')
    let graphLinksGroup = d3.select('.Network').select('.links')

    // DRAW NODES
    let graphNodesData = graphNodesGroup.selectAll("g").data(nodes, d => nodeKey(d))

    graphNodesData.exit().select("circle")
      .transition().duration(Consts.transitionDuration)
      .attr("r", 0)
      .remove()

    graphNodesData.exit().select("rect")
      .transition().duration(Consts.transitionDuration)
      .attr("width", 0)
      .attr("height", 0)
      .remove()

    graphNodesData.exit().select("text").remove()

    graphNodesData.exit()
      .transition().duration(Consts.transitionDuration)
      .remove()

    let graphNodesEnter = graphNodesData.enter().append("g")
      .attr('id', d => 'node-group-' + nodeKey(d))

    graphNodesEnter
      .attr("transform", function(d) { 
        if(berects(d)){
          if(d.type === 'parent'){ 
            return "translate(" + (d.x0 - d.radius + d.strokeWidth) + "," + (d.y0 - d.radius + d.strokeWidth) + ")";
          } else {
            return "translate(" + (d.x0 - d.radius) + "," + (d.y0 - d.radius) + ")";
          }
        } else {
          return "translate(" + d.x0 + "," + d.y0 + ")";
        }
      })

    graphNodesEnter.filter(d=>root(d))
      .append('foreignObject')
        .attr('class', 'node nodeFO')
        .attr('opacity', function(d) { return d.opacity})
        .append("xhtml:div")
          .attr('class', 'node-icon')
          .append("i")
            .attr('class', d=> d.icon + ' large icon')
            .attr('id', function(d) { return 'node-' + d.id}) 
            .attr('fill', function(d) {return d.color})

    graphNodesEnter.filter(d=>!berects(d))
      .append("circle")
        .attr('class', 'node node-circle')
        .attr('id', function(d) { return 'node-' + d.id}) 
        .attr('stroke-width', function(d) {return d.strokeWidth})
        .attr('stroke', function(d) {return d.strokeColor})
        .attr('opacity', function(d) { return d.opacity})
        .attr('fill', function(d) {return d.color})

    graphNodesEnter.filter(d=>berects(d))
      .append("rect")
        .attr('class', 'node node-rect')
        .attr('id', function(d) {return 'node-' + d.id}) 
        .attr('stroke-width', function(d) {return d.strokeWidth})
        .attr('stroke', function(d) {return graphEle.nodeStroke })
        .attr('opacity', function(d) { return d.opacity})
        .attr('fill', function(d) {return d.color})

     // DRAW NODE LABELS
    graphNodesEnter.filter(d=>!root(d))
      .append("text")
        .attr('class', 'node-label')
        .attr("font-size", `${Consts.nodeTextSize}px`)
        .attr("text-anchor", "middle")
        .attr('fill', graphEle.nodeTextFill)
        .attr('opacity', Consts.nodeTextOpacity)
        .attr('x', d => berects(d) ? d.radius : 0)
        .attr('y', d => (berects(d) ? -10 : -d.radius-4) )
        .text(d => `${d.id}`)

    graphNodesEnter.filter(d=>root(d))
      .append("text")
        .attr('class', 'root-label')
        .attr("font-size", `${Consts.nodeTextSize*2}px`)
        .attr("text-anchor", "middle")
        .attr('fill', graphEle.nodeTextFill)
        .attr('opacity', 1)
        .attr('x', d => berects(d) ? d.radius : 0)
        .attr('y', d => berects(d) ? -10 : -d.radius-10)
        .text(d => `${d.label}`)

    graphNodesData = graphNodesEnter.merge(graphNodesData)
    
    graphNodesData.transition().duration(Consts.transitionDuration)
      .attr("transform", function(d) { 
        if(berects(d)){
          return "translate(" + (d.x - d.radius) + "," + (d.y - d.radius) + ")";
        } else {
          return "translate(" + d.x + "," + d.y + ")";
        }
      })

    graphNodesData.selectAll('.node-circle')
      .call(function(node) { node.transition()
        .attr('r', function(d) {return d.radius}) 
        .attr('fill', d=>d.color)
        .attr('stroke', d=>d.strokeColor)
      })

    graphNodesData.selectAll('.node-rect')
      .call(function(node) { 
        node.transition()
          .attr('width', function(d) {return d.radius*2}) 
          .attr('height', function(d) {return d.radius*2}) 
          .attr('fill', d=>d.color)
          .attr('stroke', d=>d.strokeColor)
      })

    graphNodesData.selectAll('.nodeFO')
      .call(function(node) { 
        node.transition()
          .attr('x', 0)
          .attr('y', 0)
          .attr('width', d => d.radius*2 - d.strokeWidth) 
          .attr('height', d => d.radius*2 - d.strokeWidth) 
          .attr("transform", function(d) { 
            return "translate(" + (- d.radius) + "," + (- d.radius) + ")";
          })
      })

    graphNodesData.selectAll('.node')
      .on('mouseover.fade', d => hoverOver(d))
      .on('mouseout.fade', d => hoverOut(d))

    graphNodesData.selectAll('.node') // only root and parent nodes are clickable
      .filter(d=>rootparent(d))
      .on('click', d => click(d))

    // DRAW LINKS
    let graphLinksData = graphLinksGroup.selectAll("g").data(links, d=>linkKey(d))

    graphLinksData.exit().select("path")
      .transition().duration(Consts.transitionDuration)
      .attr("d", d => generatePath({
        source: {x: d.source.x, y: d.source.y, r: 0},
        target: {x: d.source.x, y: d.source.y, r: 0}
      }, d.source.type === 'root' ? false : true))
      .attr("opacity", 0)
      .remove()

    graphLinksData.exit()
      .transition().duration(Consts.transitionDuration)
      .remove()

    let graphLinksEnter = graphLinksData.enter().append("g").attr('id', d => 'path-group-' + linkKey(d))

    graphLinksEnter
      .append('path')
        .attr('class', 'link')
        .attr('id', function(d) { return 'path-' + linkKey(d)})
        .attr('marker-mid', 'url(#arrowhead)')
        .attr('stroke-width', function(d) {return d.strokeWidth})
        .attr('stroke', function(d) {return d.strokeColor})
        .attr("opacity", d => d.opacity)
        .attr("d", d => generatePath({
          source: {x: d.source.x0, y: d.source.y0, r: d.source.radius},
          target: {x: d.target.x0, y: d.target.y0, r: d.target.radius}
        }, d.source.type === 'root' ? false : true))

    // DRAW LINK LABELS
    graphLinksEnter
      .append("text")
        .attr('class', 'edge-label')
        .attr("font-size", `${Consts.linkTextSize}px`)
        .attr("text-anchor", "middle")
        .attr('fill', graphEle.linkTextFill)
        .attr('opacity', Consts.linkTextOpacity)
        .attr('dy', -2)
      .append('textPath')
        .attr('xlink:href', d => '#path-' + linkKey(d))
        .attr("startOffset", "50%")
        .text(d => `${d.label}`)

    graphLinksData = graphLinksEnter.merge(graphLinksData)

    graphLinksData.selectAll('.link').transition().duration(Consts.transitionDuration)
      .attr("opacity", d => d.opacity)
      .attr("d", function(d) { 
        return generatePath({
            source: {x: d.source.x, y: d.source.y, r: d.source.radius},
            target: {x: d.target.x, y: d.target.y, r: d.target.radius}
          }, d.source.type === 'root' ? false : true) 
      }) 

    // INTERACTIVITY
    function hoverOver(d) {

      // find the cluster root of the parent/child being hovered
      //let rootPos = getTranslation(svg.select('#node-group-' + d.root_id).attr('transform'))
      let nodePos = getTranslation(svg.select('#node-group-' + d.id).attr('transform'))
      let zoomedSvgPos = getTranslation(svg.select('.network').attr('transform'))
      let nodePosAfterZoomX = (nodePos[0] * zoomedSvgPos[2]) + (zoomedSvgPos[0])
      let nodePosAfterZoomY = (nodePos[1] * zoomedSvgPos[3]) + (zoomedSvgPos[1])
      //let rootPosAfterZoomX = (rootPos[0] * zoomedSvgPos[2]) + (zoomedSvgPos[0])

      if(Scene === 0){
        let hoverAttr = {hover_textOpacity: 0.5, hover_strokeOpacity: 0.2, hover_arrow: 'url(#arrowhead)'}
        highlightConnections(graphNodesData, graphLinksData, d, hoverAttr)
      }

      if(!root(d)){
        setTooltip({
          show: true,
          x: graphWrapper.width,
          y: graphWrapper.height,
          //x: Scene !== 0 ? dimensions.width : nodePosAfterZoomX,
          //y: Scene !== 0 ? dimensions.height : nodePosAfterZoomY+ (berects(d) ? d.radius : 0),
          //position: (nodePosAfterZoomX>rootPosAfterZoomX) ? 'right' : 'left',
          position: 'right',
          content: d, // pass down data attributes of selected node to tooltip
        })
      }

    }

    function hoverOut(d) {
      if(Scene === 0){
        unhighlightConnections(graphNodesData, graphLinksData, d)
        setTooltip(initialTooltipState)
      }
    }

    function click(d) {
     
      clicker(Scene, d.id)

      switch (Scene) {
        case 1: // zoom into singular graph

          let hoverAttr = {hover_textOpacity: 0, hover_strokeOpacity: 0, hover_arrow: 'url(#arrowheadTransparent)'}
          highlightNetwork(d, hoverAttr)

          var thisX = graphWrapper.width/2 - d.x*2
          var thisY = graphWrapper.height/2 - d.y*2

          setTooltip(initialTooltipState)

          svg.transition().duration(350).delay(500).call(
            zoom.transform,
            d3.zoomIdentity.translate(thisX, thisY).scale(2)
          );

          break;

        case maxScene: // zoom out

          setTimeout(function(){
            unhighlightConnections(graphNodesData, graphLinksData, d)
          }, 1000)

          svg.transition().duration(350).delay(300).call(zoom.transform, d3.zoomIdentity)
          break;
      }

    }

    function highlightNetwork(d, hoverAttr) {

      const { hover_textOpacity, hover_strokeOpacity, hover_arrow } = hoverAttr

      function isNetwork(d, o) {
        return o.root_id === d.id | o.secondary_root_id.indexOf(d.id) !== -1
      }

      function isNetworkEdge(o){
        return nodesHighlighted.indexOf(o.source.id) !== -1 & nodesHighlighted.indexOf(o.target.id) !== -1
      }

      let nodesHighlighted = []
      graphNodesData.selectAll('.node')
        .attr('opacity', function (o) {
          if(isNetwork(d, o)){ nodesHighlighted.push(o.id) }
          const thisOpacity =  isNetwork(d, o) ? 1 : hover_strokeOpacity
          return thisOpacity
        })
        .style('pointer-events', o => isNetwork(d, o) ? 'auto' : 'none')

      graphNodesData.selectAll('.root-label').attr('opacity', o => (isNetwork(d, o) ? 1 : hover_textOpacity))
      graphNodesData.selectAll('.node-label').attr('opacity', o => (isNetwork(d, o) ? 1 : hover_textOpacity))

      graphLinksData.selectAll('.link')
        .attr('opacity', o => isNetworkEdge(o) ? o.opacity : hover_strokeOpacity)
        .attr('marker-mid', o => isNetworkEdge(o) ? 'url(#arrowheadOpaque)' : hover_arrow)
      graphLinksData.selectAll('.edge-label').attr('opacity', o => isNetworkEdge(o) ? 0.5 : hover_textOpacity)

      let networkNodes = graphNodesData.filter(o=>isNetwork(d, o))
      let networkLinks = graphLinksData.filter(o=>isNetworkEdge(o))

      networkNodes.selectAll('.node')
        .on('mouseover', ele => {
          let hoverAttr = {hover_textOpacity: 0, hover_strokeOpacity: 0.2, hover_arrow: 'url(#arrowhead)'}
          highlightConnections(networkNodes, networkLinks, ele, hoverAttr)
        })
        .on('mouseout', ele => {
          unhighlightConnections(networkNodes, networkLinks, ele)
        })


    }

    function highlightConnections(graphNodesData, graphLinksData, d, hoverAttr) {

      const { hover_textOpacity, hover_strokeOpacity, hover_arrow } = hoverAttr

      function isDirectConn(d, o) {
        if(d.root_id === 'Unknown' | d.root_id === 'Unlinked'){
          return isConnected(d, o) | o.root_id === d.id
        } else {
          return isConnected(d, o)
        }
      }

      graphNodesData.selectAll('.node')
        .attr('opacity', function (o) {
          const thisOpacity =  isDirectConn(d, o) ? 1 : hover_strokeOpacity
          //this.setAttribute('fill-opacity', thisOpacity)
          return thisOpacity
        })
        .style('pointer-events', o => (isDirectConn(d, o) ? 'auto' : 'none'))

      graphNodesData.selectAll('.root-label').attr('opacity', o => (isDirectConn(d, o) ? 1 : hover_textOpacity))
      graphNodesData.selectAll('.node-label-').attr('opacity', o => (isDirectConn(d, o) ? 1 : hover_textOpacity))

      graphLinksData.selectAll('.link')
        .attr('opacity', o => (o.source === d || o.target === d ? 1 : hover_strokeOpacity))
        .attr('marker-mid', o => (o.source === d || o.target === d) ? 'url(#arrowheadOpaque)' : hover_arrow)
      graphLinksData.selectAll('.edge-label').attr('opacity', o => (o.source === d || o.target === d ? 0.5 : hover_textOpacity))

    }

    function unhighlightConnections(graphNodesData, graphLinksData, d) {

      graphNodesData.selectAll('.node')
        .attr('opacity', Consts.nodeOpacity)
        .style('pointer-events', 'auto')

      graphNodesData.selectAll('.root-label').attr('opacity', 1)
      graphNodesData.selectAll('.node-label').attr('opacity', nodeTextOpacity)

      graphLinksData.selectAll('.link').attr('opacity', o => linkOpacityAccessor(o))
      graphLinksData.selectAll('.edge-label').attr('opacity', linkTextOpacity)

    }

  }//draw: update nodes and edges of graph

  ///////////////////////////////////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////// Graph Network: Update node and link styles ////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////
  function updateAttributes(nodes, links){

    const ROOT_IDs = nodes.filter(d=>d.case_type === 'Cluster').map(d=>d.id)
    let parentIDs = []
    let childIDs = []
    nodes.map(el=>{
      let connections = links.filter(d=>d.start_id === el.id).map(d=>d.end_id)
      if(connections.length === 0){
        childIDs.push(el.id) // a child node has no other nodes extending from it
      } else if(ROOT_IDs.indexOf(el.id) === -1) { 
        parentIDs.push(el.id) // everyone else is a parent node if not a cluster root or child node (a node is only considered to be a parent node if it has other nodes extending from it)
      }
    })

    const importedIDs = nodes.filter(d=>d.case_type === 'Imported case').map(d=>d.id)
    const foreignerIDs = nodes.filter(d=>d.singaporean === 'Foreigner').map(d=>d.id)

    // set up accessors
    const root = d => ROOT_IDs.indexOf(d.id) !== -1 
    const parent = d => parentIDs.indexOf(d.id) !== -1
    const rootparent = d => parentIDs.concat(ROOT_IDs).indexOf(d.id) !== -1
    const child = d => childIDs.indexOf(d.id) !== -1
    const imported = d => importedIDs.indexOf(d.id) !== -1
    const foreigners = d => foreignerIDs.indexOf(d.id) !== -1
    const berects = foreigners // choose node types to be rendered as rectangles

    const linkOpacityAccessor = d => d.start_id.includes('Cluster') ? 1 : Consts.linkOpacity
    const accessors = { root, parent, child, rootparent, imported, berects, linkOpacityAccessor }

    function findType(d){
      if(root(d)) {
        return 'root'
      } else if (parent(d)) {
        return 'parent'
      } else if (child(d)) {
        return 'children'
      }
    }

    function findIcon(d){
      if(d.id === 'Unlinked') {
        return 'question'
      } else if (['Cluster1', 'Cluster2', 'Cluster3', 'Imported', 'UK', 'US', 'Indonesia'].indexOf(d.id) != -1){
        return 'plane'
      } else if (d.id === 'Cluster7') {
        return 'home'
      } else {
        return 'building'
      }
    }

    var linksTarget_nested = d3.nest()
      .key(function(d) { return d.end_id })
      .rollup(function(leaves) { return leaves.length; })
      .entries(links) 

    var linksSource_nested = d3.nest()
      .key(function(d) { return d.start_id })
      .rollup(function(leaves) { return leaves.length; })
      .entries(links)

    var linksNested = []
    linksTarget_nested.map(function(d,i) {
      linksNested.push({key: d.key, value: d.value})
    })
    linksSource_nested.map(function(d,i) {
      linksNested.push({key: d.key, value: d.value})
    })

    var linkAllNodes = d3.nest()
      .key(function(d) { return d.key })
      .rollup(function(leaves) { return d3.sum(leaves, d=>d.value) })
      .entries(linksNested)

    // create custom link strength scale based on total number of connections to node (node could be either a source or target)
    var strengthScale = d3.scaleLinear()
      .domain(d3.extent(linkAllNodes, d=>d.value))
      .range([0.4, 0.3])

    // create custom link distance scale based on node type
    var distanceScale = d3.scaleOrdinal()
      .domain(['root', 'parent', 'child'])
      .range([150, 40, 30])

    nodes.forEach((d,i) => {
      d.strokeWidth = Consts.nodeStrokeWidth
      d.opacity = Consts.nodeOpacity
    })

    links.forEach((d,i) => {
      d.strokeColor = graphEle.linkStroke
      d.strokeWidth = Consts.linkStrokeWidth
      d.opacity = linkOpacityAccessor(d)
    })

    nodes.forEach((d,i) => {
      d.type = findType(d)
    })

    links.forEach((d,i) => {
      d.type = nodes.find(el=>el.id === d.start_id).type
    })

    nodes.forEach((d,i) => {
      let conn = linkAllNodes.find(l=>l.key === d.id)
      d.radius = root(d) ? Consts.rootRadius : conn ? nodeRadius.scale(conn.value) : 4
      d.color = rootparent(d) ? graphEle.nodeFill : colorAccessor(d)
      d.strokeColor = root(d) ? graphEle.nodeStroke : colorAccessor(d)
      d.icon = findIcon(d)
    })

    links.forEach((d,i) => {
      let conn = linkAllNodes.find(l=>l.key === d.end_id).value
      d.strength = strengthScale(conn)
      d.distance = distanceScale(d.type)
    })

    return { 'nodes': nodes, 'links': links, 'accessors': accessors }
  } //updateAttributes: update attribute values assigned to nodes and edges

  ///////////////////////////////////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////// Graph Network: Update graph layout ////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////
  function updateGraph(OrigData, data) {

    simulation.stop()
    let { nodes, links, date } = data 

    // when slider moves, these elements are to disappear on screen because they are cases confirmed after the selected date ('future' cases cannot be shown)
    var nodesRemove = OrigData.nodes.filter(d=>Consts.parseDate(d.confirmed_at).getTime() > date.getTime())
    var linksRemove = OrigData.links.filter(d=>Consts.parseDate(d.confirmed_at).getTime() > date.getTime())

    // snapshot of all confirmed cases up until selected date
    // elements remain unchanged on screen if these cases are existing before the selected date
    nodes = OrigData.nodes.filter(d=>nodesRemove.map(el=>el.id).indexOf(d.id) == -1)
    links = OrigData.links.filter(d=>linksRemove.map(el=>el.id).indexOf(d.id) == -1)
    //links = links.filter(d=>d.start_id !== 'unknown')

    var linksAdd = []
    nodes.forEach(d=>{
      // originally unlinked: at selected time, cluster does not exist (ie. cluster node is not rendered yet). They should belong in 'Unknown'
      // overwrite their node's root_id to 'unknown'. Do not create new nodes so that existing node will move towards its found cluster
      //console.log(d.root_id, d.original_root, d.id)
      let no_cluster = Consts.parseDate(clusters.find(el=>el.id === d.original_root).confirmed_at).getTime() > date.getTime()
      if(no_cluster){
        d.root_id = 'Unlinked'
      } else { // if cluster already exists, but node has been discovered yet to belong to it (eg. unlinked initially /unknown -> discovered to belong to a cluster)
        //console.log(d.id, OrigData.nodes.find(el=>el.id === d.id).root_id)
        d.root_id = OrigData.nodes.find(el=>el.id === d.id).original_root
      }

    })
    // remove links that do not have either a start or end node in nodes variable
    let nodeIDs = nodes.map(d=>d.id)
    links = links.filter(d=>nodeIDs.indexOf(d.start_id) !== -1)
    links = links.filter(d=>nodeIDs.indexOf(d.end_id) !== -1)

    function initNodesPos(d) {
      let mod = modulePosition.find(g=>g.group == d.root_id) 
      return {x: mod ? mod.coordinates.x : graphWrapper.width/2, y: mod ? mod.coordinates.y : graphWrapper.height/2}
    }

    // for the timeline, if patient has not recovered yet on the selected date, overwrite recovery status so color of nodes accurately reflects situation
    // amongst all the attributes, only recovery status is dynamic
    nodes.forEach(d=>{
      if(d.case_type !== 'Cluster'){
        let in_hospital = Consts.parseDate(d.recovered_at).getTime() > date.getTime() 
        let death = d.died_at ? Consts.parseDate(d.died_at).getTime() <= date.getTime() : false
        d.status =  death ? "Deceased" : in_hospital ? 'In hospital' : 'Recovered'
      }
    })
    
    let newEle = updateAttributes(nodes, links)
    nodes = newEle.nodes
    links = newEle.links

    links.forEach((d,i)=>{
      d.source = nodes.find(el=>el.id === d.start_id)
      d.target = nodes.find(el=>el.id === d.end_id)
    })

    links.forEach((d,i) => {
      linkedByIndex[`${d.source.id},${d.target.id}`] = 1;
    })

    nodes.forEach((d,i) => {
      let coords = initNodesPos(d)
      d.x  = d.x ? d.x : coords.x
      d.y  = d.y ? d.y : coords.y
      d.fx = (d.type=='root' & bool_1(d)) ? coords.x : undefined
      d.fy = (d.type=='root' & bool_1(d)) ? coords.y : undefined
      d.x0 = d.x
      d.y0 = d.y
    })

    simulation.nodes(nodes)
    simulation.force("link").links(links)
    simulation.alpha(0.3).restart()
    for (var i = 0, n = 300; i < n; ++i) {
      simulation.tick()
    }

    nodes.forEach((d,i) => {
      d.x0 = d.x
      d.y0 = d.y    
    })

    draw(nodes, links, newEle.accessors)

    return {nodes: nodes, links: links}

  } //updateGraph: things to do once marker on slider is moved

}

export default Graph


function findClusterCenter(graphWrapper) {

  //Specify module position for the 9 largest modules. This is the x-y center of the modules singletons and small modules will be handled as a whole
  var modsPerRow = 5
  var modsSize = (graphWrapper.width * 0.95) / 5
  var modulePosition = []
  for(var i = 0; i < Consts.clusterArrangement.length ; i++) {
    var rowNumber = Math.floor(i / modsPerRow)
    modulePosition.push(
    { 
      "group": Consts.clusterArrangement[i],
      "coordinates" : { 
        x: ((i % modsPerRow) * modsSize) + modsSize,
        y: -(rowNumber + 1) * modsSize + graphWrapper.height
      }
    })
  }

  let safra = modulePosition.find(g=>g.group == 'Cluster11').coordinates
  modulePosition.push(
  { 
    "group": 'Cluster13',
    "coordinates" : { 
      x: safra.x - 420,
      y: safra.y + 330
    }
  })

  modulePosition.push(
  { 
    "group": 'Cluster12',
    "coordinates" : { 
      x: safra.x + 200,
      y: safra.y + 220
    }
  })

  let imported = modulePosition.find(g=>g.group == 'Imported').coordinates
  imported.x = imported.x + 50
  modulePosition.push(
  { 
    "group": 'UK',
    "coordinates" : { 
      x: imported.x + 200,
      y: imported.y - 300
    }
  })
  modulePosition.push(
  { 
    "group": 'US',
    "coordinates" : { 
      x: imported.x + 250,
      y: imported.y - 80
    }
  })
  modulePosition.push(
  { 
    "group": 'Indonesia',
    "coordinates" : { 
      x: imported.x + 500,
      y: imported.y + 60
    }
  })

  // let us = modulePosition.find(g=>g.group == 'US').coordinates
  // us.y = us.y - 50

  let c7 = modulePosition.find(g=>g.group == 'Cluster7').coordinates
  c7.x = c7.x - 100
  c7.y = c7.y + 200

  //let c4 = modulePosition.find(g=>g.group == 'Cluster4').coordinates
  //c4.y = c4.y - 20

  //Make the x-position equal to the x-position specified in the module positioning object or, if module not labeled, set it to center
  var forceX = d3.forceX(function (d) { 
    let mod = modulePosition.find(g=>g.group == d.root_id)
    return mod ? mod.coordinates.x : graphWrapper.width - 100
  }).strength(d => bool_1(d) ? 0.38 : 0.3)

  //Same for forceY--these act as a gravity parameter so the different strength determines how closely the individual nodes are pulled to the center of their module position
  var forceY = d3.forceY(function (d) {
    let mod = modulePosition.find(g=>g.group == d.root_id)
    return mod ? mod.coordinates.y : graphWrapper.height - 300
  }).strength(d => bool_1(d) ? 0.4 : 0.3)

  var forceCharge = forceManyBodyReuse().strength(-120)
  var forceCollide = d3.forceCollide(function(d){ return bool(d) ? d.radius * 2 : d.radius * 2.7 })

  simulation
    .force("x", forceX)
    .force("y", forceY)
    .force("charge", forceCharge)
    .force("collide", forceCollide)

  return modulePosition

}

export function isConnected(a, b) {
  return linkedByIndex[`${a.id},${b.id}`] || linkedByIndex[`${b.id},${a.id}`] || a.id === b.id;
}

function generatePath(d, exclude_radius=false) {

  var sourceNewX, sourceNewY, targetNewX, targetNewY
  var dx = d.target.x - d.source.x;
  var dy = d.target.y - d.source.y;
  var gamma = Math.atan2(dy,dx); // Math.atan2 returns the angle in the correct quadrant as opposed to Math.atan

  if(exclude_radius){

    sourceNewX = d.source.x + (Math.cos(gamma) * d.source.r);
    sourceNewY = d.source.y + (Math.sin(gamma) * d.source.r);
    targetNewX = d.target.x - (Math.cos(gamma) * d.target.r);
    targetNewY = d.target.y - (Math.sin(gamma) * d.target.r);

  } else {

    sourceNewX = d.source.x;
    sourceNewY = d.source.y;
    targetNewX = d.target.x - (Math.cos(gamma) * d.target.r);
    targetNewY = d.target.y - (Math.sin(gamma) * d.target.r);

  }

  // Coordinates of mid point on line to add new vertex.
  let midX = (targetNewX - sourceNewX) / 2 + sourceNewX   
  let midY = (targetNewY - sourceNewY) / 2 + sourceNewY
  return "M" + 
      sourceNewX + "," + sourceNewY + "L" + 
      midX + ',' + midY + 'L' +
      targetNewX + "," + targetNewY
  }
