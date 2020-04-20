import React, { createContext, useState } from "react"
import * as d3 from 'd3'

export const ThemeContext = createContext()

const gender = ['Male', 'Female']
const status = ['In hospital', 'Recovered', 'Deceased']
const nationality = ['Singaporean/Singapore PR', 'Foreigner']
const case_type = ['Imported case', 'Local transmission']
const days_group = ['In hospital', '0 - 7 days', '8 - 15 days', '> 15 days', 'Deceased']
const nodeRadius = 40

export function ThemeProvider(props) {

  const theme = {
    light: {
      type: 'light',
      primary: '#f5f5f5',
      secondary: '#333333',
      status: ['mediumblue', 'gray', 'black'],
      age: ['fuchsia', 'darkgray', 'navy'],
      days: ['mediumblue', 'teal', '#F9B219', '#F03713', 'black']
    },
    dark:{
      type: 'dark',
      primary: '#333333',
      secondary: 'white',
      status: ['white', '#FDD43C', '#49A3E2'],
      age: ['aqua', 'white', 'fuchsia'],
      days: ['white', '#3FF59E', '#FAC979', '#FB9D96', '#49A3E2']
    },
  }

  const setTheme = type => {
    setState(type === 'dark' ? theme.light : theme.dark)
  }

  const [themeState, setState] = useState(theme.dark)

  // node radius size is scaled based on total number of connections to node (only applied to root or parent nodes)
  const nodeRadiusScale = d3.scaleSqrt()
    .domain([1, 50])
    .range([4, nodeRadius])

  const genderScale = d3.scaleOrdinal()
    .domain(gender)
    .range(['aqua', 'fuchsia'])
  
  const nationalityScale = d3.scaleOrdinal()
    .domain(nationality)
    .range(['orangered', 'white'])

  const statusScale = d3.scaleOrdinal()
    .domain(status)
    .range(themeState.status)

  const ageScale = d3.scaleLinear()
    .domain([0, 45, 90])
    .range(themeState.age)

  const daysScale = d3.scaleOrdinal()
    .domain(days_group)
    .range(themeState.days)

  const scales = {
    colorAccessor: d => statusScale(d.status), // default color coding
    status: {'label': 'Status','domain': status, 'scale': statusScale},
    gender: {'label': 'Gender','domain': gender, 'scale': genderScale},
    nationality: {'label': 'Nationality','domain': nationality, 'scale': nationalityScale},
    age: {'label': 'Age','domain': [0, 20, 40, 60, 80, 100], 'scale': ageScale},
    daysGroup: {'label': 'Days to recovery','domain': days_group, 'scale': daysScale},
    nodeRadius: {'label': 'Number of connections','domain': [1, 5, 12], 'scale': nodeRadiusScale}
  }

  return (
    <ThemeContext.Provider value={{ themeState, setTheme, scales }}>
      {props.children}
    </ThemeContext.Provider>
  )

}