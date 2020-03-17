import * as d3 from 'd3'

// set node, link, text color and dimensions
export const rootRadius = 30
export const nodeRadius = 40
export const nodeStrokeWidth = 2
export const nodeStroke = 'white'
export const nodeFill = '#011C54'
export const nodeOpacity = 1
export const nodeTextFill = 'white'
export const nodeTextOpacity = 0.5
export const childnodeTextOpacity = 0
export const nodeTextSize = 6

export const linkStrokeWidth = 0.6
export const linkStroke = 'white'
export const linkOpacity = 0.5
export const linkTextFill = 'white'
export const linkTextOpacity = 0
export const linkTextSize = 5
export const transitionDuration = 1000

export const linkedByIndex = {}

export const formatDate = d3.timeFormat("%d %b %Y")
export const parseDate = d3.timeParse("%d %b %Y")
export const currentDateString = '14 Mar 2020'
export const currentDate = parseDate(currentDateString)

export const mapping = {'node_shape_1': 'Imported case', 'node_shape_2': 'Local transmission'}

const gender = ['Male', 'Female']
const status = ['In hospital', 'Recovered']
const nationality = ['Singaporean', 'Non-Singaporeans']
const case_type = ['Imported case', 'Local transmission']

//Cluster 1: Cases Imported From Overseas,
//Cluster 2: Singaporeans evacuated from Wuhan on 30 January,
//Cluster 3: Singaporeans evacuated from Wuhan on 9 February
//Cluster 4: Lavender cluster case: Tour Group From Guangxi to Yong Thai Hang
//Cluster 5: Private Business Meeting at Grand Hyatt Singapore
//Cluster 6: The Life Church and Missions Singapore
//Cluster 7: CNY family gathering at Mei Hwan Drive
//Cluster 8: Seletar Aerospace Heights constructionn site
//Cluster 9: Grace Assembly of God
//Cluster 10: Wizlearn Technologies Pte Ltd
//Cluster 11: Private dinner function at SAFRA Jurong
//unknown : unknown
//undefined

export const clusters = ['Cluster4', 'Cluster8', 'Cluster10', 'Cluster5', 'Cluster1', 'Cluster2', 'Cluster3', 'Cluster4', 'unknown', 'Cluster11', 'Cluster6', 'Cluster7', 'Cluster9']
//export const clusters = ['unknown', 'Cluster1', 'Cluster4', 'Cluster6', 'Cluster7', 'Cluster9', 'Cluster10', 'Cluster8', 'Cluster10', 'Cluster11', 'Cluster5']

// node radius size is scaled based on total number of connections to node (only applied to root or parent nodes)
const nodeRadiusScale = d3.scaleSqrt()
  .domain([1, 50])
  .range([4, nodeRadius])

const genderScale = d3.scaleOrdinal()
  .domain(gender)
  .range(['aqua', 'fuchsia'])
  
const statusScale = d3.scaleOrdinal()
  .domain(status)
  .range(['gold', 'white'])

const nationalityScale = d3.scaleOrdinal()
  .domain(nationality)
  .range(['fuchsia', 'white'])

const ageScale = d3.scaleLinear()
  .domain([0, 45, 90])
  .range(['aqua', 'white', 'fuchsia'])

const daysScale = d3.scaleLinear()
  .domain([0, 100])
  .range(['white', '#60E2A0'])

export const scales = {
  colorAccessor: d => statusScale(d.status), // default color coding
  status: {'label': 'Status','domain': status, 'scale': statusScale},
  gender: {'label': 'Gender','domain': gender, 'scale': genderScale},
  nationality: {'label': 'Nationality','domain': nationality, 'scale': nationalityScale},
  age: {'label': 'Age','domain': [0, 20, 40, 60, 80, 100], 'scale': ageScale},
  days: {'label': 'Days','domain': [0, 20, 40, 60, 80, 100], 'scale': daysScale},
  nodeRadius: {'label': 'Amount of connections','domain': [2, 10, 30], 'scale': nodeRadiusScale}
}