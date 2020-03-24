import React, { useContext, useRef, useState, useEffect } from "react"
import * as d3 from "d3"

import { EventContext } from "../../EventsPage"

import * as Consts from "../consts"

const Timeline = () => {

  const ref = useRef()
  const { current, dispatch } = useContext(EventContext)
  const [dataset, setDataset] = useState(current.data)

  const gridSize = 12
  const bufferCol = 15
  const bufferRow = 30

  const hours = d3.range(0, 23)
  const days = getDates(current.date.start, current.date.end)
  const caseIDs = dataset.map(d=>d.id)
  console.log(days)
  const tags = ['flight', 'work/accommodation', 'clinic', 'hospital', 'places', 'symptomatic', 'confirmed']
  ////////////////////////////////////////////////////////////// 
  /////////////////// Set up scales based on data //////////////
  ////////////////////////////////////////////////////////////// 
  var eleLimit = 30
  var yScaleOuter = d3.scaleBand()
    .range([0, 700])
    .domain(days)

  var xScaleOuter = d3.scaleBand()
    .range([0, (gridSize*caseIDs.length+30)])
    .domain(caseIDs)

  var colorScale = d3.scaleOrdinal()
    .range(['white', '#4BE3AB', '#F9B219', '#F03713', 'aqua', 'fucshia', 'yellow'])
    .domain(tags)

  //////////////////////////////////////////////////////////////////////
  //////////////////////////// Draw Timeline ///////////////////////////
  //////////////////////////////////////////////////////////////////////
  useEffect(() => {

    var dataNested = d3.nest()
      .key(d=>d.id)
      .entries(dataset)

    // create a wrapper for each column
    //const eventsGroup = d3.select('.Events').select('.timeline')
    const eventsGroup = d3.select(ref.current)
 
    const eventsData = eventsGroup.selectAll('g').data(dataNested, d=>d.key)

    const person = eventsData.enter().append("g")
        .attr("class", (d,i) => "timeline-" + d.key)
        .attr("transform", (d,i) => "translate(" + xScaleOuter(d.key) + "," + 0 + ")")

    person.each(function(D,I){
      console.log(D)
      d3.select(this).selectAll('rect')
        .data(D.values)
        .enter().append("rect")
          .attr("x", 0)
          .attr("y", d => yScaleOuter(d.date) )
          .attr("id", (d,i) => "element-" + d.id + '-' + i)
          .attr("width", xScaleOuter.bandwidth())
          .attr("height", yScaleOuter.bandwidth())
          .style("stroke", "none")
          .style("fill", d => colorScale(d.tag) )
          .style("fill-opacity", 1)

    })

   }, [dataset])


  return(
    <g className="timeline" ref={ref}>
    </g>
  )

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