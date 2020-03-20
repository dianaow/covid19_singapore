import React, { useState, useEffect, useReducer, createContext } from "react"
import { Dimmer, Loader, Image, Segment } from 'semantic-ui-react'
import * as d3 from "d3"

import graphNodes from './data/covid19_graph_nodes.json';
import graphEdges from './data/covid19_graph_edges.json';
import graph from './data/covid19_graph.json';

import cases from './data/covid19_case_details.json';
import clusters from './data/covid19_cluster_details.json';

import Network from "./components/Network/NetworkSection"

import reducer from "./components/reducers/NetworkReducer"

import * as Consts from "./components/consts"

export const NetworkContext = createContext()

const showLoader = () => (
  <div className='Loading'>
    <Segment>
      <Dimmer active>
        <Loader size='huge'>Loading</Loader>
      </Dimmer>

      <Image src='https://react.semantic-ui.com/images/wireframe/short-paragraph.png' />
    </Segment>

  </div>
)

const NetworkPage = () => {

  const [data, setData] = useState({})
  const [loading, setLoading] = useState({ loading: true })
  const processedCases = processCases(cases)
  const timeline = processTimeline(processedCases)

  const initialState = {
    date: Consts.currentDate, 
    nodes: [], 
    links: []
  }

  const [current, dispatch] = useReducer(reducer, initialState)

  function processTimeline(cases) {

    const timeline = d3.nest()
      .key(function(d) { return d.confirmed_at })
      .rollup(function(leaves) { return leaves.length })
      .entries(cases)

    timeline.forEach(d=>{
      d.key = Consts.parseDate(d.key)
    })
    return timeline

  }

  function processCases(cases) {

    cases.forEach((d,i) => {
      d.id = 'Case ' + d.id
      d.age = +d.age
      d.days_to_recover = Number.isInteger(+d['days to recover']) ? +d['days to recover'] : '-'
      d.days_to_confirmation = Number.isInteger(+d['SYMPTOMATIC TO\nCONFIRMATION']) ? +d['SYMPTOMATIC TO\nCONFIRMATION'] : 0
      d.confirmed_at = d['confirmed at'].split(",")[0].slice(0, -2) + d['confirmed at'].split(",")[1]
      d.recovered_at = (d['recovered at']===undefined | d['recovered at']==='-') ? '01 Jan 2021' : d['recovered at'].split(",")[0].slice(0, -2) + d['recovered at'].split(",")[1] //if patient has not recovered, set a dummy date of 1 Jan 2021 
    })
    return cases

  }

  function processNodes(nodes, cases) {

    nodes.forEach((d,i) => {
      let D = cases.find(el=>el.id === d.id) // find corresponding case details of node and match
      if(D){
        d.id = d.id.replace(/\s/g,'')
        d.patient = D.patient
        d.age =  D.age
        d.gender =  D.gender
        d.nationality = D.nationality
        d.singaporean = D.nationality === 'Singaporean' ? 'Singaporean/Singapore PR' : 'Foreigner'
        d.status = D.status
        d.case_type = D.type
        d.days_to_recover = D.days_to_recover
        d.days_to_recover_group = groupDays(D.days_to_recover)
        d.days_to_confirmation = D.days_to_confirmation
        d.confirmed_at = D.confirmed_at
        d.recovered_at = D.recovered_at
        d.places = D['places visited']
        d.works_at = D['works at']
        d.lives_at = D['lives at']
      } else {
        d.id = d.id.replace(/\s/g,'')
        d.case_type = 'Cluster'
        //console.log(d.id, clusters.find(el=>el.id === d.id))
        // a cluster is established when 2 or more people are found linked to the location. Date the cluster is made known to the public through MOH press release
        d.confirmed_at = clusters.find(el=>el.id === d.id).confirmed_at 
      }
    })
    return nodes

  }

  function processLinks(links) {

    links.forEach((d,i) => {
      // if(parseInt(d.from.match(/[0-9]+/g)) > parseInt(d.to.match(/[0-9]+/g))){
      //   d.from = d.to
      //   d.to = d.from
      // }
      d.id = i
      d.start_id = d.from.replace(/\s/g,'')
      d.end_id = d.to.replace(/\s/g,'')
    })

    links = links.filter(d=>d.from !== 'unknown')

    return links

  }

  function groupDays(d) {
    if(d === '-') {
      return 'In hospital'
    } else if(d >= 0 & d <= 7) {
      return '0 - 7 days'
    } else if(d > 7 & d <= 15) {
      return '8 - 15 days'
    } else if(d > 15) {
      return '> 15 days'
    } else {
      //console.log(d)
    }
  }

  useEffect(() => {
    //setTimeout(function(){
      setLoading({ loading: false })
    //}, 500)
  }, [data])

  useEffect(() => {
    let nodes = processNodes(graphNodes, processedCases)
    let links = processLinks(graphEdges)

    links.forEach(d=>{
      // this should actually be the date the relationship between 2 people was discovered (node will be attached to unknown until it moves to another cluster)
      // but I will just assign date as case confirmed_at date of the end node
      d.confirmed_at = nodes.find(el=>el.id === d.end_id).confirmed_at
    })

    nodes.forEach(d=>{
      if (d.case_type === 'Imported case' & d.root_id === 'unknown'){
        d.root_id = 'Imported'
      } else if (d.case_type === 'Local transmission' & d.root_id === 'unknown'){
        d.root_id = 'Unlinked'
      } 

      let fromNode = links.find(el=>el.end_id === d.id)
      if(fromNode){
        if(nodes.find(d=>d.id === fromNode.start_id).root_id === 'Imported'){
          d.root_id = 'Imported'
        }
      }
    
      if(d.id === 'Case143' | d.id === 'Case252'){
        d.root_id = 'Imported'
      }
      d.original_root = d.root_id
    })
    console.log(nodes, links)
    setData({ nodes, links })
    dispatch({ type: 'SET_STATS', nodes, links })

  }, [])

  return(
    <div className='App__wrapper'>
      <div className="Entity__Right">

        <div className='Chart_info_section'>
          <div className='time'>
            <h2>{ Consts.formatDate(current.date) }</h2>
          </div>
          <div className='chart-statistics'>
            <div className='chart-statistics-total'>
              <div className='nodes_stats'>
                <div className='nodes_stats_total'><h2>{ current.nodes.filter(d=>d.case_type !== 'Cluster').length }</h2></div>
                <p>CASES</p>
              </div>
              <div className='edges_stats'>
                <div className='edges_stats_total'><h2>{ current.links.length }</h2></div>
                <p>CONNECTIONS</p>
              </div>
            </div>
            <div className='chart-statistics-breakdown'></div>
          </div>
        </div>

        { loading.loading && showLoader() }

        <NetworkContext.Provider value={{ current, dispatch }}>
          { loading.loading === false && <Network data={data} timeline={timeline} /> }
        </NetworkContext.Provider>

      </div>
    </div>
  )
}

export default NetworkPage
