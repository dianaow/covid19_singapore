import React, { useEffect, useContext } from "react"
import * as d3 from "d3"

import { NetworkContext } from "../../NetworkPage"
import { ZoomContext } from "../contexts/ZoomContext"
import { initialTooltipState, TooltipContext } from "../contexts/TooltipContext"
import { maxScene, SceneContext } from "../contexts/SceneContext"
import { ChartContext } from "../Shared/Chart"

import * as Consts from "../consts"

let nodeTextOpacity = Consts.nodeTextOpacity
let linkTextOpacity = Consts.linkTextOpacity
const { colorAccessor, status, gender, nationality, age, days, nodeRadius } = Consts.scales

const simulation = d3.forceSimulation()
  .force("link", d3.forceLink()
    .distance(function(d) { return d.distance })
    .strength(function(d) { return d.strength })
  )
  .force("charge", d3.forceManyBody().strength(-80))
  .force("collide", d3.forceCollide(function(d){ return d.radius * 2 }))
  .alphaTarget(0.8)

// store states in a global variable as a hack to pass state values to helper functions placed outside the component
var Scene

const Graph = () => {
    
  const { current, dispatch } = useContext(NetworkContext)
  const { zoom, zoomState } = useContext(ZoomContext)
  const { setTooltip } = useContext(TooltipContext)
  const { sceneState, clicker } = useContext(SceneContext)
  const { dimensions } = useContext(ChartContext)

  Scene = sceneState.scene

  //console.log(Scene)
  // This object passes required variables to graph helper functions placed outside the component
  const graphWrapper = {width: dimensions.width/2, height: dimensions.height/2-60}
  const misc = {zoom, setTooltip, clicker, dimensions: graphWrapper } 

  ///////////////////////// Initial Graph Render //////////////////////////
  useEffect(() => {
    if(current.date === Consts.currentDate){
      if(dimensions.width>0 & dimensions.height>0){
        let modulePosition = findClusterCenter({width: dimensions.width, height: dimensions.height})
        misc.modulePosition = modulePosition
        updateGraph(current, misc) 
      }
    }
  }, [dimensions.width, dimensions.height])

  //////////////////////////////// Update Graph ///////////////////////////
  useEffect(() => {

    simulation.stop()
    let modulePosition = findClusterCenter(graphWrapper)
    misc.modulePosition = modulePosition
    let graph = updateGraph(current, misc) 
    dispatch({ type: 'SET_STATS', nodes: graph.nodes, links: graph.links })

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
      d3.selectAll('.parent-node-label').attr('opacity', nodeTextOpacity)
      d3.selectAll('.children-node-label').attr('opacity', nodeTextOpacity)

    } else {

      if(zoomState.k >= 1.4){
        nodeTextOpacity = 0
        linkTextOpacity = 0
      }

    }

  }, [zoomState])


  return(
    <g className='network' transform={`translate(${zoomState.x}, ${zoomState.y}) scale(${zoomState.k})`}>
      <g className='links'></g>
      <g className='nodes'></g>
    </g>
  )

}

export default Graph

///////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////// Graph Network: Create node and link elements ////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////
function draw(nodes, links, accessors, misc) {

  function nodeKey(n) {
    return n.id;
  }
  function linkKey(d) {
    return d.source.id + '-' + d.target.id;
  }

  let { zoom, setTooltip, clicker, dimensions } = misc

  let { root, parent, rootparent, berects } = accessors
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

  graphNodesEnter.filter(d=>!berects(d))
    .append("circle")
      .attr('class', 'node node-circle')
      .attr('id', function(d) { return 'node-' + d.id}) 
      .attr('stroke-width', function(d) {return d.strokeWidth})
      .attr('stroke', function(d) {return d.strokeColor})
      .attr('stroke-opacity', function(d) { return d.opacity})
      .attr('fill-opacity', function(d) { return d.opacity})
      .attr('fill', function(d) {return d.color})

  graphNodesEnter.filter(d=>berects(d))
    .append("rect")
      .attr('class', 'node node-rect')
      .attr('id', function(d) {return 'node-' + d.id}) 
      .attr('stroke-width', function(d) {return d.strokeWidth})
      .attr('stroke', function(d) {return Consts.nodeStroke })
      .attr('stroke-opacity', function(d) { return d.opacity})
      .attr('fill-opacity', function(d) { return d.opacity})
      .attr('fill', function(d) {return d.color})
  
   // DRAW NODE LABELS
  graphNodesEnter.filter(d=>parent(d))
    .append("text")
      .attr('class', 'parent-node-label')
      .attr("font-size", `${Consts.nodeTextSize}px`)
      .attr("text-anchor", "middle")
      .attr('fill', Consts.nodeTextFill)
      .attr('opacity', Consts.nodeTextOpacity)
      .attr('x', d => berects(d) ? d.radius : 0)
      .attr('y', d => (d.radius < Consts.nodeRadius) ? (berects(d) ? -6 : -d.radius-4) : 0 )
      .text(d => `${d.id}`)

  graphNodesEnter.filter(d=>!rootparent(d))
    .append("text")
      .attr('class', 'children-node-label')
      .attr("font-size", `${Consts.nodeTextSize/1.5}px`)
      .attr("text-anchor", "middle")
      .attr('fill', Consts.nodeTextFill)
      .attr('opacity', Consts.nodeTextOpacity)
      .attr('x', d => berects(d) ? d.radius : 0)
      .attr('y', d => (d.radius < Consts.nodeRadius) ? (berects(d) ? -6 : -d.radius-4) : 0 )
      .text(d => `${d.id}`)

  graphNodesEnter.filter(d=>root(d))
    .append("text")
      .attr('class', 'root-label')
      .attr("font-size", `${Consts.nodeTextSize*2}px`)
      .attr("text-anchor", "middle")
      .attr('fill', Consts.nodeTextFill)
      .attr('opacity', 1)
      .attr('x', d => berects(d) ? d.radius : 0)
      .attr('y', d => berects(d) ? -10 : -d.radius-10)
      .text(d => `${d.label}`)

  graphNodesData = graphNodesEnter.merge(graphNodesData)
  
  graphNodesData.transition().duration(Consts.transitionDuration)
    .attr("transform", function(d) { 
      if(berects(d)){
        if(d.type === 'parent'){
          return "translate(" + (d.x - d.radius + d.strokeWidth) + "," + (d.y - d.radius + d.strokeWidth) + ")";
        } else {
          return "translate(" + (d.x - d.radius) + "," + (d.y - d.radius) + ")";
        }
      } else {
        return "translate(" + d.x + "," + d.y + ")";
      }
    })

  graphNodesData.selectAll('.node-circle')
    .call(function(node) { node.transition()
      .attr('r', function(d) {return d.type === 'parent' ? d.radius - d.strokeWidth : d.radius}) 
      .attr('fill', d=>d.color)
      .attr('stroke', d=>d.strokeColor)
    })

  graphNodesData.selectAll('.node-rect')
    .call(function(node) { 
      node.transition()
        .attr('width', function(d) {return d.type === 'parent' ? d.radius*2 - d.strokeWidth : d.radius*2}) 
        .attr('height', function(d) {return d.type === 'parent' ? d.radius*2 - d.strokeWidth : d.radius*2}) 
        .attr('stroke', function(d) {return 'white'})
        .attr('fill', function(d) {return d.type === 'parent' ? 'transparent' :'white'})
    })

  graphNodesData.selectAll('.node')
    .filter(d=>!root(d))
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
      .attr('fill', Consts.linkTextFill)
      .attr('opacity', Consts.linkTextOpacity)
      .attr('dy', -2)
    .append('textPath')
      .attr('xlink:href', d => '#path-' + linkKey(d))
      .attr("startOffset", "50%")
      .text(d => `${d.label}`)

  graphLinksData = graphLinksEnter.merge(graphLinksData)

  graphLinksData.selectAll('.link').transition().duration(Consts.transitionDuration)
    //.attr("opacity", d => d.opacity)
    .attr("d", function(d) { 
      return generatePath({
          source: {x: d.source.x, y: d.source.y, r: d.source.radius},
          target: {x: d.target.x, y: d.target.y, r: d.target.radius}
        }, d.source.type === 'root' ? false : true) 
    }) 

  // graphLinksData.selectAll('text')
  //   .attr('dy', function(d,i){
  //     if (d.target.x<d.source.x){
  //       return d.type=='children' ? `${Consts.linkTextSize/2}px` : `${Consts.linkTextSize}px`
  //     } else {
  //       return d.type=='children' ? `${-Consts.linkTextSize/4}px` : `${-Consts.linkTextSize/2}px`
  //     }
  //   })
  //   .attr('transform', function(d,i){
  //     if (d.target.x<d.source.x){
  //       let bbox = this.getBBox()
  //       let rx = bbox.x+bbox.width/2;
  //       let ry = bbox.y+bbox.height/2;
  //       return 'rotate(180 '+rx+' '+ry+')' //auto rotate paths
  //       }
  //     else {
  //       return 'rotate(0)'
  //       }
  //   })

  // INTERACTIVITY
  function hoverOver(d) {

    let svg = d3.selectAll('.networkWrapper')

    // find the cluster root of the parent/child being hovered
    //let rootPos = getTranslation(svg.select('#node-group-' + d.root_id).attr('transform'))
    let nodePos = getTranslation(svg.select('#node-group-' + d.id).attr('transform'))
    let zoomedSvgPos = getTranslation(svg.select('.network').attr('transform'))
    let nodePosAfterZoomX = (nodePos[0] * zoomedSvgPos[2]) + (zoomedSvgPos[0])
    let nodePosAfterZoomY = (nodePos[1] * zoomedSvgPos[3]) + (zoomedSvgPos[1])
    //let rootPosAfterZoomX = (rootPos[0] * zoomedSvgPos[2]) + (zoomedSvgPos[0])

    if(Scene === 0){
      let hoverAttr = {hover_textOpacity: 0, hover_strokeOpacity: 0.2, hover_arrow: 'url(#arrowhead)'}
      highlightConnections(d, hoverAttr)
    }

    setTooltip({
      show: true,
      x: Scene !== 0 ? dimensions.width*2 : nodePosAfterZoomX,
      y: Scene !== 0 ? dimensions.height*2 : nodePosAfterZoomY+ (berects(d) ? d.radius : 0),
      //position: (nodePosAfterZoomX>rootPosAfterZoomX) ? 'right' : 'left',
      position: 'right',
      content: d, // pass down data attributes of selected node to tooltip
    })

  }

  function hoverOut(d) {
    if(Scene === 0){
      unhighlightConnections(d)
      setTooltip(initialTooltipState)
    }
  }

  function click(d) {
   
    var svg =  d3.selectAll('.networkWrapper')

    clicker(Scene, d.id)

    switch (Scene) {
      case 1: // zoom into singular graph

        let hoverAttr = {hover_textOpacity: 0, hover_strokeOpacity: 0, hover_arrow: 'url(#arrowheadTransparent)'}
        highlightConnections(d, hoverAttr)

        var thisX = dimensions.width - d.x*2
        var thisY = dimensions.height - d.y*2

        setTooltip(initialTooltipState)

        svg.transition().duration(350).delay(500).call(
          zoom.transform,
          d3.zoomIdentity.translate(thisX, thisY).scale(2)
        );

        graphLinksData.selectAll('.edge-label').attr('opacity', o => (o.source === d || o.target === d ? 0.5 : Consts.linkTextOpacity))
        break;

      case maxScene: // zoom out

        setTimeout(function(){
          unhighlightConnections(d)
        }, 1000)

        svg.transition().duration(350).delay(300).call(zoom.transform, d3.zoomIdentity)
        break;
    }

  }


  function highlightConnections(d, hoverAttr) {

    const { hover_textOpacity, hover_strokeOpacity, hover_arrow } = hoverAttr
    graphNodesData.selectAll('.node')
      .attr('stroke-opacity', function (o) {
        const thisOpacity =  isConnected(d, o) ? 1 : hover_strokeOpacity
        this.setAttribute('fill-opacity', thisOpacity)
        return thisOpacity
      })
      .style('pointer-events', o => (isConnected(d, o) ? 'auto' : 'none'))

    graphNodesData.selectAll('.root-label').attr('opacity', o => (isConnected(d, o) ? 1 : 0.4))
    graphNodesData.selectAll('.parent-node-label').attr('opacity', o => (isConnected(d, o) ? 1 : hover_textOpacity))
    graphNodesData.selectAll('.children-node-label').attr('opacity', o => (isConnected(d, o) ? 1 : hover_textOpacity))

    graphLinksData.selectAll('.link')
      .attr('opacity', o => (o.source === d || o.target === d ? 1 : hover_strokeOpacity))
      .attr('marker-mid', o => (o.source === d || o.target === d) ? 'url(#arrowheadOpaque)' : hover_arrow)
    graphLinksData.selectAll('.edge-label').attr('opacity', o => (o.source === d || o.target === d ? linkTextOpacity : hover_textOpacity))

  }

  function unhighlightConnections(d) {

    graphNodesData.selectAll('.node')
      .attr('stroke-opacity', Consts.nodeOpacity)
      .attr('fill-opacity', Consts.nodeOpacity)
      .style('pointer-events', 'auto')

    graphNodesData.selectAll('.root-label').attr('opacity', 1)
    graphNodesData.selectAll('.parent-node-label').attr('opacity', Consts.nodeTextOpacity)
    graphNodesData.selectAll('.children-node-label').attr('opacity', nodeTextOpacity)

    graphLinksData.selectAll('.link').attr('opacity', Consts.linkOpacity)
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

  // set up accessors
  const root = d => ROOT_IDs.indexOf(d.id) !== -1 
  const parent = d => parentIDs.indexOf(d.id) !== -1
  const rootparent = d => parentIDs.concat(ROOT_IDs).indexOf(d.id) !== -1
  const child = d => childIDs.indexOf(d.id) !== -1
  const imported = d => importedIDs.indexOf(d.id) !== -1
  const berects = imported // choose node types to be rendered as rectangles
  const accessors = { root, parent, child, rootparent, imported, berects }

  function findType(d){
    if(root(d)) {
      return 'root'
    } else if (parent(d)){
      return 'parent'
    } else if (child(d)) {
      return 'children'
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
    .range([1, 0.1])

  // create custom link distance scale based on node type
  var distanceScale = d3.scaleOrdinal()
    .domain(['root', 'parent', 'child'])
    .range([120, 80, 40])

  nodes.forEach((d,i) => {
    d.strokeWidth = Consts.nodeStrokeWidth
    d.opacity = Consts.nodeOpacity
  })

  links.forEach((d,i) => {
    d.strokeColor = Consts.linkStroke
    d.strokeWidth = Consts.linkStrokeWidth
    d.opacity = Consts.linkOpacity
  })

  nodes.forEach((d,i) => {
    d.type = findType(d)
  })

  links.forEach((d,i) => {
    d.type = nodes.find(el=>el.id === d.start_id).type
  })

  nodes.forEach((d,i) => {
    let conn = linkAllNodes.find(l=>l.key === d.id)
    d.radius = root(d) ? Consts.rootRadius : conn ? nodeRadius.scale(conn.value) : 1
    d.color = parent(d) ? Consts.nodeFill : colorAccessor(d)
    d.strokeColor = root(d) ? Consts.nodeStroke : colorAccessor(d)
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
function updateGraph(data, misc) {

  let { nodes, links, date } = data 
  const { dimensions, modulePosition} = misc

  function initNodesPos(d) {
    let mod = modulePosition.find(g=>g.group == d.root_id) 
    return {x: mod ? mod.coordinates.x : dimensions.width, y: mod ? mod.coordinates.y : dimensions.height}
  }

  let newEle = updateAttributes(nodes, links)
  nodes = newEle.nodes
  links = newEle.links

  links.forEach((d,i)=>{
    d.source = nodes.find(el=>el.id === d.start_id)
    d.target = nodes.find(el=>el.id === d.end_id)
  })

  links.forEach((d,i) => {
    Consts.linkedByIndex[`${d.source.id},${d.target.id}`] = 1;
  })

  nodes.forEach((d,i) => {
    let coords = initNodesPos(d)
    d.x  = d.x ? d.x : coords.x
    d.y  = d.y ? d.y : coords.y
    d.fx = d.node_type=='root' ? coords.x : undefined
    d.fy = d.node_type=='root' ? coords.y : undefined
    d.x0 = d.x
    d.y0 = d.y
  })

  simulation.force('center', d3.forceCenter(dimensions.width, dimensions.height))
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
  console.log(nodes, links)
  draw(nodes, links, newEle.accessors, misc)

  return {nodes: nodes, links: links}

} //updateGraph: things to do once marker on slider is moved

function findClusterCenter(graphWrapper) {

  //Specify module position for the 9 largest modules. This is the x-y center of the modules singletons and small modules will be handled as a whole
  var modsPerRow = 5
  var modsSize = graphWrapper.width / 5
  var modulePosition = []
  for(var i = 0; i < Consts.clusters.length ; i++) {
    var rowNumber = Math.floor(i / modsPerRow)
    modulePosition.push(
    { 
      "group": Consts.clusters[i],
      "coordinates" : { 
        x: ((i % modsPerRow) * modsSize) + modsSize,
        y: -(rowNumber + 1) * modsSize + graphWrapper.height
      }
    })
  }
  console.log(modulePosition)

  //Make the x-position equal to the x-position specified in the module positioning object or, if module not labeled, set it to center
  var forceX = d3.forceX(function (d) { 
    let mod = modulePosition.find(g=>g.group == d.root_id)
    return mod ? mod.coordinates.x : graphWrapper.width + Math.random()
  }).strength(0.5)

  //Same for forceY--these act as a gravity parameter so the different strength determines how closely the individual nodes are pulled to the center of their module position
  var forceY = d3.forceY(function (d) {
    let mod = modulePosition.find(g=>g.group == d.root_id)
    return mod ? mod.coordinates.y : graphWrapper.height + Math.random()
  }).strength(0.5)

  simulation
    .force("x", forceX)
    .force("y", forceY)

  return modulePosition

}

function isConnected(a, b) {
  return Consts.linkedByIndex[`${a.id},${b.id}`] || Consts.linkedByIndex[`${b.id},${a.id}`] || a.id === b.id;
}

function comparerLinks(otherArray){
  return function(current){
    return otherArray.filter(function(other){
      return other.source.id === current.source.id && other.target.id === current.target.id
    }).length === 0;
  }
}

function comparerNodes(otherArray){
  return function(current){
    return otherArray.filter(function(other){
      return other.id === current.id
    }).length === 0;
  }
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

function getTranslation(transform) {
  // Create a dummy g for calculation purposes only. This will never
  // be appended to the DOM and will be discarded once this function 
  // returns.
  var g = document.createElementNS('http://www.w3.org/2000/svg', "g");
  
  // Set the transform attribute to the provided string value.
  g.setAttributeNS(null, "transform", transform);
  
  // consolidate the SVGTransformList containing all transformations
  // to a single SVGTransform of type SVG_TRANSFORM_MATRIX and get
  // its SVGMatrix. 
  var matrix = g.transform.baseVal.consolidate().matrix;
  
  // As per definition values e and f are the ones for the translation.
  return [matrix.e, matrix.f, matrix.a, matrix.d];
}
