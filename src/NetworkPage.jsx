import React, { useState, useEffect, useReducer, createContext, useContext } from "react"
import { Dimmer, Loader, Image, Segment, Checkbox } from 'semantic-ui-react'
import * as d3 from "d3"
import { Icon } from 'semantic-ui-react'

import graphNodes from './data/covid19_graph.json';
import cases from './data/covid19_case_details.json';
import clusters from './data/covid19_cluster_details.json';

import Main from "./components/Network/Main"

import reducer from "./components/reducers/NetworkReducer"

import * as Consts from "./components/consts"
import { hexToRgbA } from "./components/utils"

import { ThemeContext } from "./components/contexts/ThemeContext"

export const NetworkContext = createContext()

var T, index
const showLoader = () => (
  <div className='Loading'>
    <Dimmer active>
      <Loader size='huge'>Loading</Loader>
    </Dimmer>
  </div>
)

const NetworkPage = () => {

  const { themeState, setTheme } = useContext(ThemeContext)
  const [data, setData] = useState({})
  const [loading, setLoading] = useState(true)
  const [timerun, setTimeRun] = useState({playing: false, status: 'play', initial: true })
  const processedCases = processCases(cases)
  const timeline = processTimeline(processedCases)

  //////////////////// styles ////////////////////
  const app_wrapper = {
    backgroundColor: themeState.primary,
    color: themeState.secondary
  }

  const chart_info_section = {
    backgroundColor: hexToRgbA(themeState.primary, 0.85),
    color: themeState.secondary
  }
  ////////////////////////////////////////////////

  const initialState = {
    date: Consts.currentDate, 
    nodes: [], 
    links: [],
    rendered: false
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
      d.id = 'Case' + d.ID.toString()
      d.age = +d.age
      d.case_type = d.type
      d.status = d.STATUS // this property is dynamic and will be overwritten with each change of date (STATUS: the current status of patient)
      d.singaporean = d.nationality === 'Singaporean' ? 'Singaporean/Singapore PR' : 'Foreigner'
      d.days_to_confirmation = Number.isInteger(+d['symptomatic to confirmation']) ? +d['symptomatic to confirmation'] : 0
      d.confirmed_at = d['confirmed at'].split(",")[0].slice(0, -2) + d['confirmed at'].split(",")[1]
      d.recovered_at = d['recovered at']===undefined | d['recovered at']==='-' ? '1 Jan 2021' : d['recovered at'].split(",")[0].slice(0, -2) + d['recovered at'].split(",")[1] //if patient has not recovered, set a dummy date of 1 Jan 2021 
      d.days_to_recover = d.STATUS === 'Deceased' ? 'Deceased' : Number.isInteger(+d['days to recover']) ? +d['days to recover'] :  '-'
      d.days_to_recover_group = groupDays(d.days_to_recover)
    })

    return cases
  }

  function processNodes(nodes, cases) {

    nodes.forEach((d,i) => {
      d.secondary_root_id = d['secondary_root_id'] ? d['secondary_root_id'] : []
      d.connections = d.connections ? d.connections.toString().split(",") : []
      d['link type'] = d['link type'] ? d['link type'].split(",") : []
      if(d.id.substring(0, 4) !== 'Case'){
        d.case_type = 'Cluster'
        d.confirmed_at = clusters.find(el=>el.id === d.id).confirmed_at // assign date cluster was discovered and announced on MOH press release
      }
    })

    let nodesNew = []
    nodes.map((d,i) => {
      let C = cases.find(ele=>ele.id === d.id)
      nodesNew.push({...d, ...C})
    })
    return nodesNew

  }

  function processLinks(nodes) {

    let links = []
    let nodesCases = nodes.filter(d=>d.case_type !== 'Cluster')
    let nodesClusters = nodes.filter(d=>d.case_type === 'Cluster')

    nodesCases.forEach((d,i) => {
      if(d.connections.length > 0){
        d.connections.map((ele,I)=>{ // case-case connection
          let a = parseInt(ele)
          let b = parseInt(d.id.replace(/[^0-9\.]+/g, ""))
          if(a < b){
            links.push({
              start_id : 'Case' + ele.toString().trim(), // strip whitespaces (if any)
              end_id : d.id,
              label : d['link type'][I] ? d['link type'][I].trim() : '' // some edges may not have labels, strip whitespaces (if any)
            })
          } else if(a !== b){ // avoid possible typos of start and end id being the same as it is not possible
            links.push({
              start_id : d.id,
              end_id : 'Case' + ele.match(/\d+/),
              label : d['link type'][I] ? d['link type'][I].trim() : ''
            })        
          }
        })
      }
    })

    nodesClusters.forEach((d,i) => {
      if(d.connections.length > 0){
        d.connections.map((ele,I)=>{
          if(ele.includes('FROM')){ // some people are directly attributed to starting a new cluster (case-cluster connection)
            links.push({
              start_id : 'Case' + ele.match(/\d+/),
              end_id : d.id,
              label : d['link type'][I] ? d['link type'][I].trim() : ''
            })
          } else if (ele.includes('Cluster')){ // cluster-cluster connection 
            links.push({
              start_id : d.id,
              end_id : ele.trim(),
              label : d['link type'][I] ? d['link type'][I].trim() : ''
            })
          } else {
            links.push({ // cluster-case conection
              start_id : d.id,
              end_id : 'Case' + ele.match(/\d+/),
              label : d['link type'][I] ? d['link type'][I].trim() : ''
            })        
          }
        })
      }
    })

    links.forEach((d,i)=>{
      d.id = i
      // this should actually be the date the relationship between 2 people was discovered (node will be attached to unknown until it moves to another cluster)
      // but I will just assign date as case confirmed_at date of the end node
      d.confirmed_at = nodes.find(el=>el.id === d.end_id).confirmed_at
    })

    return links

  }

  function groupDays(d) {
    if(d === '-') {
      return 'In hospital'
    } else if(+d >= 0 & +d <= 7) {
      return '0 - 7 days'
    } else if(+d > 7 & +d <= 15) {
      return '8 - 15 days'
    } else if(+d > 15) {
      return '> 15 days'
    } else if(d === 'Deceased') {
      return 'Deceased'
      //console.log(d)
    }
  }
  useEffect(() => {
    if(current.rendered){
      //setTimeout(function(){
        setLoading(false)
      //}, 350)
    }
  }, [current.rendered])

  useEffect(() => {

    const nodes = processNodes(graphNodes, processedCases)
    const links = processLinks(nodes)
    //console.log(nodes, links)

    nodes.forEach(d=>{
      if (d.case_type === 'Imported case' & d.root_id === 'unknown'){
        if(d["country of origin"] === "United kingdom"){
           d.root_id = 'UK'
        } else if(d["country of origin"] === "Indonesia"){
          d.root_id = 'Indonesia'
        } else if(d["country of origin"] === "United states"){
          d.root_id = 'US'
        } else {
          d.root_id = 'Imported'
        }
      } else if (d.case_type === 'Local transmission' & d.root_id === 'unknown'){
        d.root_id = 'Unlinked'
      } 

      let edge = links.find(el=>el.end_id === d.id)
      if(edge){
        let fromNode = nodes.find(d=>d.id === edge.start_id)
        if(fromNode.case_type === 'Imported case'){ //imported-local transmission
          d.root_id = fromNode.root_id
        }
      }
    
      if(d.id === 'Case143' | d.id === 'Case252'){
        d.root_id = 'Imported'
      }
      d.original_root = d.root_id
    })

    setData({ nodes, links })
    dispatch({ type: 'SET_STATS', nodes, links })

  }, [])

  useEffect(() => {
    let dates = timeline.map(d=>d.key.getTime())
    if(timerun.initial){
      index = 0
    } else {
      index = dates.indexOf(current.date.getTime()) // restart animation from date last stopped at
    }

    if(timerun.playing){
      T = setInterval(step, 1000)
    } 
   
    function step() {
      dispatch({ type: 'SET_DATE', date: timeline[index].key }) 
      index++
      if(index > dates.length-1){
        clearInterval(T)
        setTimeRun({playing: false, status: 'end', initial: true})
      }
    } 

    if(timerun.playing === false & timerun.status === 'pause'){
      //setTimeout(function() {clearInterval(T); }, 350);
      clearInterval(T)
      dispatch({ type: 'SET_DATE', date: timeline[index].key }) 
    }

    if(timerun.playing === false & timerun.status === 'end'){
      clearInterval(T)
      dispatch({ type: 'SET_DATE', date: timeline[dates.length-1].key }) 
    }

  }, [timerun])

  // currentStage: stage before button click
  // nextStage: stage upon button click
  return(
    <div className='App__wrapper' style={app_wrapper}>
      <div className="Entity__Right">

        <div className='Chart_info_section' style={chart_info_section}>

          <div type="button" onClick={ () => {setTimeRun({playing: !timerun.playing, status: 'play', initial: timerun.initial})} }>
            <Icon className={ timerun.playing ? 'big play circle disabled' : 'big play circle'} />
          </div>
          <div type="button" onClick={ () => setTimeRun({playing: false, status: 'pause', initial: false}) }>
            <Icon className={ timerun.playing ? 'big pause circle' : 'big pause circle disabled'} />
          </div>
          <div type="button" onClick={ () => setTimeRun({playing: false, status: 'end', initial: true}) }>
            <Icon className={ timerun.playing | timerun.status === 'pause' ? 'big stop circle' : 'big stop circle disabled'} />
          </div>    

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
                <div className='edges_stats_total'><h2>{ current.nodes.filter(d=>d.case_type !== 'Cluster' & d.status === "In hospital").length }</h2></div>
                <p>IN HOSPITAL</p>
              </div>
            </div>
            <div className='chart-statistics-breakdown'></div>
          </div>
        </div>

        <div className='theme'>
          <span style={{padding: '5px 20px 5px 0px'}}>CHANGE THEME</span>
          <Checkbox toggle onClick={ () => setTheme(themeState.type) } />
        </div>

        { loading && showLoader() }

        <NetworkContext.Provider value={{ current, dispatch }}>
          <Main data={data} timeline={timeline} /> 
        </NetworkContext.Provider>

      </div>
    </div>
  )
}

export default NetworkPage
