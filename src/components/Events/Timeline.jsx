import React, { useContext, useRef, useState, useEffect } from "react"
import * as d3 from "d3"

import { EventContext } from "../../EventsPage"
import { ThemeContext } from "../contexts/ThemeContext"

import * as Consts from "../consts"
import { getTranslation, onlyUnique } from "../utils"

const Timeline = () => {

  const ref = useRef()
  const { current, dispatch } = useContext(EventContext)
  const [dataset, setDataset] = useState(current.data)
  const scheme = useContext(ThemeContext)

  const chart = {
    fill: scheme.theme.primary,
    color: scheme.theme.text,
    stroke: scheme.theme.text
  }

  const gridSize = 30
  const hours = d3.range(0, 23)
  const days = getDates(current.date.start, current.date.end)
  const caseIDs = dataset.map(d=>d.id).filter(onlyUnique)
  console.log(caseIDs)
  const tags = ['travel', 'work/accommodation', 'places', 'clinic', 'hospital', 'symptomatic', 'confirmed']

  ////////////////////////////////////////////////////////////// 
  /////////////////// Set up scales based on data //////////////
  ////////////////////////////////////////////////////////////// 
  const height = 600
  const topBuffer = 30
  const leftBuffer = 60
  const yScaleOuter = d3.scaleBand()
    .range([0, height])
    .domain(days)

  const xScaleOuter = d3.scaleBand()
    .range([0, gridSize*caseIDs.length])
    .domain(caseIDs)
    .padding(0.3)

  const colorScale = d3.scaleOrdinal()
    .range(['black', 'aqua', 'yellow', 'fuchsia', 'transparent', 'red', 'white'])
    .domain(tags)

  const strokeScale = d3.scaleOrdinal()
    .range(['black', 'aqua', 'yellow', 'fuchsia', 'white', 'red', 'white'])
    .domain(tags)

  //////////////////////////////////////////////////////////////////////
  //////////////////////////// Draw Timeline ///////////////////////////
  //////////////////////////////////////////////////////////////////////
  useEffect(() => {

    var dataNested = d3.nest()
      .key(d=>d.id)
      .entries(dataset)

    draw(dataNested)

   }, [dataset])

  return(
    <g className="timeline" ref={ref}>
    </g>
  )

  function click(D) {

    d3.select('#background-' + D.key)
      .transition().duration(750)
      .attr('width', xScaleOuter.bandwidth() * 6 + 2) // expand the width of the clicked on rectangle

    d3.range(parseInt(D.key)+1, 28).map(d=>{
      d3.select('.timeline-' + d) // locate rectanges placed after this rect
        .transition().duration(750)
        .attr("transform", function(d,i){ 
          let groupPos = getTranslation(d3.select(this).attr('transform'))
          return shiftRight(groupPos)
        })
      d3.select('.header-' + d) // locate titles placed after this rect
        .transition().duration(750)
        .attr("transform", function(d,i){ 
          let groupPos = getTranslation(d3.select(this).attr('transform'))
          return shiftRight(groupPos)
        })   
    })
    
    function shiftRight(groupPos) {
      let X = groupPos[0] + xScaleOuter.bandwidth() * 5 + 2 // shove the other rectangles aside (shift right by the amount of width expanded)
      let Y = groupPos[1]
      return "translate(" + X + "," + Y + ")"    
    }
  }

  function draw(dataNested) {
    // create a wrapper for each column
    //const eventsGroup = d3.select('.Events').select('.timeline')
    const eventsGroup = d3.select(ref.current)

    const eventsData = eventsGroup.selectAll('g').data(dataNested, d=>d.key)

    const xAccessor = d => xScaleOuter(d.key) + leftBuffer + xScaleOuter.bandwidth()
    const yAccessor = (d,i) => yScaleOuter(days[i]) + topBuffer + yScaleOuter.bandwidth()

    const header = eventsData.enter().append("g")
        .attr("class", (d,i) => "header-" + d.key)
        .attr("transform", (d,i) => `translate(${xAccessor(d)},0)`)
        .append('text')
          .attr('y', 20)
          .attr('text-anchor', 'middle')
          .attr('fill', chart.color)
          .text(d => d.key)

    const yaxis = eventsData.enter().append("g")
        .attr("class", (d,i) => "yaxis-" + d.key)
        .attr("transform", (d,i) => `translate(0,${yAccessor(d,i)})`)
        .append('text')
          .attr('x', 20)
          .attr('font-size', '8px')
          .attr('alignment-baseline', 'middle')
          .attr('fill', chart.color)
          .text((d,i) => Consts.formatDate(days[i]))

    const person = eventsData.enter().append("g")
        .attr("class", (d,i) => "timeline-" + d.key)
        .attr("transform", (d,i) => `translate(${xAccessor(d)},${topBuffer})`)

    person.each(function(D,I){

      const bgRect = d3.select(this).append('rect')
          .attr('class', 'background')
          .attr('id', 'background-' + D.key)
          .attr('width', xScaleOuter.bandwidth() + 2)
          .attr('height', height)
          .attr('fill', 'transparent')
          .attr('stroke', chart.stroke)
          .attr('stroke-opacity', 0.2)
          .style('pointer-events', 'auto')

      bgRect.on('click', () => click(D))

      const dataTagged = d3.nest()
        .key(d=>d.date)
        .key(d=>d.tag)
        .entries(D.values)

      d3.select(this).selectAll('rect.cells')
        .data(D.values)
        .enter().append("rect")
          .attr("x", function(d) { 
            let xScaleInner = updateXScale(dataTagged, d.date.toString())
            return xScaleInner(d.tag) + 1
          })
          .attr("y", d => yScaleOuter(d.date) )
          .attr("class", 'cells')
          .attr("id", (d,i) => "element-" + d.id + '-' + Consts.formatDate(d.date) + '-' + d.tag)
          .attr("width", function(d) { 
            let xScaleInner = updateXScale(dataTagged, d.date.toString())
            return xScaleInner.bandwidth()  - 1
          })
          .attr("height", yScaleOuter.bandwidth() - 1)
          .style("stroke", d => strokeScale(d.tag))
          .style('stroke-width', '1px')
          .style("fill", d => colorScale(d.tag) )
          .style("fill-opacity", 1)

    })
    
  }

  function updateXScale(dataTagged, date) {

    let dailyTags = dataTagged.find(el=>el.key === date).values.map(d=>d.key)
    let xScaleInner = d3.scaleBand()
      .range([0, xScaleOuter.bandwidth()])
      .domain(dailyTags)
    return xScaleInner

  }

}

Date.prototype.addDays = function(days) {
    var date = new Date(this.valueOf());
    date.setDate(date.getDate() + days);
    return date;
}

function getDates(startDate, stopDate) {
    var dateArray = new Array();
    var currentDate = startDate;
    while (currentDate <= stopDate) {
        dateArray.push(new Date (currentDate));
        currentDate = currentDate.addDays(1);
    }
    return dateArray;
}

export default Timeline