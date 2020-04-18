import React, { useState, useEffect, useReducer, createContext } from "react"
import { Dimmer, Loader, Image, Segment } from 'semantic-ui-react'
import * as d3 from "d3"
import { Icon } from 'semantic-ui-react'

import cases from './data/covid19_events.json';

import Main from "./components/Events/Main"

import reducer from "./components/reducers/EventsReducer"

import * as Consts from "./components/consts"

import "./styles_event.scss"

export const EventContext = createContext()

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

function processCases(cases) {

  cases.forEach((d,i) => {
    d.flight_date = Consts.parseDate(d['flight date'])
    d.symptomatic_at = Consts.parseDate(d['symptomatic at'].split(",")[0].slice(0, -2) + d['symptomatic at'].split(",")[1])
    d.hospital_admission_date = Consts.parseDate(d['hospital admission date'])
    d.confirmed_at = Consts.parseDate(d['confirmed at'].split(",")[0].slice(0, -2) + d['confirmed at'].split(",")[1])
    d.places_visited =  d.places.split(",")
    d.places_visited_dates =  d['places dates'].split(",")
    d.clinics_visited =  d.clinics.split(",")
    d.clinics_visited_dates =  d['clinics dates'].split(",")
  })

  let events = []
  cases.forEach((d,i) => {
    if(d.flight_date){
      events.push({tag: 'travel', location: d['travel country'], date: d.flight_date, id: d.id})
    }
    if(d['lives at']){
      if(d.flight_date){
        events.push({tag: 'work/accommodation', location: d['lives at'], date: d.flight_date, id: d.id}) // assume that foreign travellers will stay in their accomodations on same day they arrive in Singapore
      } else {
        events.push({tag: 'work/accommodation', location: d['lives at'], date: d.symptomatic_at, id: d.id})
      }
    }
    if(d['works at']){
      events.push({tag: 'work/accommodation', location: d['works at'], date: d.symptomatic_at, id: d.id}) // dummy date of start of first day of the year
    }
    if(d.places_visited[0] !== ""){
      d.places_visited.map((el,i)=>{
        events.push({tag: 'places', location: el, date: Consts.parseDate(d.places_visited_dates[i].trim()), id: d.id})
      })
    }
    if(d.clinics_visited[0] !== ""){ // some people may have visited more than one clinic at various dates
      d.clinics_visited.map((el,i)=>{
        events.push({tag: 'clinic', location: d.location, date: Consts.parseDate(d.clinics_visited_dates[i].trim()), id: d.id})
      })
    }
    if(d.hospital_admission_date){ // some people may have moved hospitals at various dates, but only the final admission is important 
      events.push({tag: 'hospital', location: d['admitted to'], date: d.hospital_admission_date, id: d.id})
    }
    if(d.symptomatic_at){
      if(d.flight_date >= d.symptomatic_at){
        events.push({tag: 'symptomatic', location: d['travel country'], date: d.symptomatic_at, id: d.id}) // people who exhibited symptoms before arriving in Singapore
      } else {
        events.push({tag: 'symptomatic', location: 'Singapore', date: d.symptomatic_at, id: d.id})
      }
    }
    if(d.confirmed_at){
      events.push({tag: 'confirmed', location: 'Singapore', date: d.confirmed_at, id: d.id})
    }
  })

  return events

}

const EventsPage = () => {

  const [data, setData] = useState({})
  const [loading, setLoading] = useState(true)
  const events = processCases(cases)

  const initialState = {
    date: {start: Consts.parseDate('18 Jan 2020'), end: Consts.parseDate('29 Feb 2020')}, 
    data: []
  }

  const [current, dispatch] = useReducer(reducer, initialState)

  useEffect(() => {
    //setTimeout(function(){
      setLoading(false)
    //}, 1000)
  }, [data])

  useEffect(() => {
    console.log(events)
    setData({ data: events })
    dispatch({ type: 'SET_STATS', data: events })

  }, [])

  return(
    <div className='App__wrapper'>
      <div className="Section__Left">
        
      </div>
      <div className="Section__Right">

        { loading && showLoader() }

        <EventContext.Provider value={{ current, dispatch }}>
          { loading === false && <Main /> }
        </EventContext.Provider>

      </div>
    </div>
  )
}

export default EventsPage