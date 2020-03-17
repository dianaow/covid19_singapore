import React, { useState, useEffect, useReducer, createContext } from "react"
import { Dimmer, Loader, Image, Segment } from 'semantic-ui-react'

import graph from './data/covid19_graph.json';
import cases from './data/covid19_case_details.json';

import Network from "./components/Network/NetworkSection"

import reducer from "./components/reducers/NetworkReducer"

import * as Consts from "./components/consts"

export const NetworkContext = createContext()

var linkedToID = {},
    nodeByID = {},
    linkedByIndex = {}
var connectionsLooper


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
  
  const initialState = {
    date: Consts.currentDate, 
    nodes: [], 
    links: []
  }

  const [current, dispatch] = useReducer(reducer, initialState)

  function processCases(cases) {

    cases.forEach((d,i) => {
      d.id = 'Case ' + d.id
      d.patient = d.patient
      d.age = +d.age
      d.gender =  d.gender
      d.nationality = d.nationality
      d.status = d.status
      d.type = d.type
      d.days_to_recover = Number.isInteger(+d['days to recover']) ? +d['days to recover'] : 0
      d.confirmed_at = d['confirmed at'].split(",")[0].slice(0, -2) + d['confirmed at'].split(",")[1]
      d.recovered_at = d['recovered at'].split(",")[0].slice(0, -2) + d['recovered at'].split(",")[1]
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
        d.status = D.status
        d.case_type = D.type
        d.days_to_recover = D.days_to_recover
        d.confirmed_at = D.confirmed_at
        d.recovered_at = D.recovered_at
      } else {
        d.id = d.id.replace(/\s/g,'')
        d.case_type = 'Cluster'
      }
    })
    return nodes

  }

  function processLinks(links) {

    links.forEach((d,i) => {
      d.start_id = d.from.replace(/\s/g,'')
      d.end_id = d.to.replace(/\s/g,'')
    })
    links.forEach((d,i) => {
      if(!linkedToID[d.start_id]) linkedToID[d.start_id] = [];
      if(!linkedToID[d.end_id]) linkedToID[d.end_id] = [];
      linkedToID[d.start_id].push(d.end_id); 
      linkedToID[d.end_id].push(d.start_id);
    })
    return links

  }

  useEffect(() => {
    //setTimeout(function(){
      setLoading({ loading: false })
    //}, 500)
  }, [data])

  useEffect(() => {
    let processedCases = processCases(cases)
    let nodes = processNodes(graph.nodes, processedCases)
    let links = processLinks(graph.edges)
    let counter = 0

    findAllConnections(Consts.clusters) 
    setData({ nodes, links })
    dispatch({ type: 'SET_STATS', nodes, links })

    // callback to ensure connection search completes before rendering force layout
    function findAllConnections(ROOT_IDS) {
      ROOT_IDS.map(d=>{
        initiateConnectionSearch(d)
      })
    }

    function initiateConnectionSearch(d) {

      var selectedNodes = {},
          selectedNodeIDs = [],
          oldLevelSelectedNodes

      selectedNodes[d] = 0;
      selectedNodeIDs = [d];
      oldLevelSelectedNodes = [d];
      counter = 0    

      findConnections(selectedNodes, selectedNodeIDs, oldLevelSelectedNodes, counter);
      
    }

    function findConnections(selectedNodes, selectedNodeIDs, oldLevelSelectedNodes, counter) {
      //console.log(selectedNodeIDs)
      // with each iteration, nodes that are now connected because of this hop may have its colour overwritten
      // to get a sense of the connectivity, store linked group labels 
      nodes.filter(function(d) { return selectedNodeIDs.indexOf(d.id) > -1 })

      if( counter == 2 ) {
        nodes
          .filter(function(d) { return selectedNodeIDs.indexOf(d.id) > -1 })
          .forEach((d,i) => {
            d.root_id = selectedNodeIDs[0] // final belonged group based on number of hops
          })

        links
          .filter(function(d) { return selectedNodeIDs.indexOf(d.start_id) > -1 || selectedNodeIDs.indexOf(d.end_id) > -1 })
          .forEach((d,i) => {
            d.root_id = selectedNodeIDs[0] // final belonged group based on number of hops
          })

      }

      if( counter < 3 ) {
        var levelSelectedNodes = [];
        for(var k = 0; k < oldLevelSelectedNodes.length; k++) {
          //Request all the linked nodes
          var connectedNodes = linkedToID[oldLevelSelectedNodes[k]];

          //Take out all nodes already in the data
          connectedNodes = connectedNodes.filter(function(n) {
            return selectedNodeIDs.indexOf(n) === -1
          });
          //Place the left nodes in the data
          for(var l = 0; l < connectedNodes.length; l++) {
            var id = connectedNodes[l];
            selectedNodes[id] = counter+1;
            selectedNodeIDs.push(id);
            levelSelectedNodes.push(id);
          }//for l
        }//for k

        //Small timeout to leave room for a mouseout to run
        counter += 1;

        oldLevelSelectedNodes = uniq(levelSelectedNodes);
        connectionsLooper = findConnections(selectedNodes, selectedNodeIDs, oldLevelSelectedNodes, counter)
      } 

      nodes.forEach(d=>{
        d.root_id = d.root_id === undefined ? 'undefined' : d.root_id
      })
    
    }

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
                <div className='nodes_stats_total'><h2>{ current.nodes.length }</h2></div>
                <p>NODES</p>
              </div>
              <div className='edges_stats'>
                <div className='edges_stats_total'><h2>{ current.links.length }</h2></div>
                <p>RELATIONSHIPS</p>
              </div>
            </div>
            <div className='chart-statistics-breakdown'></div>
          </div>
        </div>

        { loading.loading && showLoader() }

        <NetworkContext.Provider value={{ current, dispatch }}>
          { loading.loading === false && <Network /> }
        </NetworkContext.Provider>

      </div>
    </div>
  )
}

export default NetworkPage

function uniq(a) {
  return a.sort().filter(function(item, pos, ary) {
      return !pos || item != ary[pos - 1];
  })
}
