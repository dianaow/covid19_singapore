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
export const transitionDuration = 750

export const linkedByIndex = {}

export const formatDate = d3.timeFormat("%d %b %Y")
export const parseDate = d3.timeParse("%d %b %Y")
export const currentDateString = '18 Mar 2020'
export const currentDate = parseDate(currentDateString)

export const mapping = {'node_shape_1': 'Foreigner', 'node_shape_2': 'Singaporean/Singapore PR'}

const gender = ['Male', 'Female']
const status = ['In hospital', 'Recovered']
const nationality = ['Singaporean/Singapore PR', 'Foreigner']
const case_type = ['Imported case', 'Local transmission']
const days_group = ['In hospital', '0 - 7 days', '8 - 15 days', '> 15 days']
//Cluster 1: Cases Imported From Overseas, => 23rd Jan 2020
//Cluster 2: Singaporeans evacuated from Wuhan on 30 January, => 1 Feb 2020
//Cluster 3: Singaporeans evacuated from Wuhan on 9 February
//Cluster 4: Lavender cluster case: Tour Group From Guangxi to Yong Thai Hang => 4th Feb 2020
//Cluster 5: Private Business Meeting at Grand Hyatt Singapore => 8 Feb 2020
//Cluster 6: The Life Church and Missions Singapore => 8 Feb 2020
//Cluster 7: CNY family gathering at Mei Hwan Drive => 27 Feb 2020
//Cluster 8: Seletar Aerospace Heights construction site  => 13 Feb 2020
//Cluster 9: Grace Assembly of God => 13 Feb 2020
//Cluster 10: Wizlearn Technologies Pte Ltd => 28th Feb 2020
//Cluster 11: Private dinner function at SAFRA Jurong => 5 March 2020
//unknown : unknown

//wizlearn lifechurch cny grace
//yth imported unknown wuhan30
//seletar wuhan9 hyatt safra

//wizlearn   lifechurch  cny       grace  
//importedb4 wuhan30     imported  unlinked(local-transmission
//yth        wuhan9      safra     hyatt  seletar  
                        //boulder  church

export const clusterArrangement = ['Cluster4', 'Cluster3', 'Cluster11', 'Cluster8', 'Cluster5', 'Cluster1', 'Cluster2', 'Unlinked', 'Imported', 'X', 'Cluster10', 'Cluster6', 'Cluster7', 'Cluster9']

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

const daysScale = d3.scaleOrdinal()
  .domain(days_group)
  .range(['white', '#4BE3AB', '#F9B219', '#F03713'])

export const scales = {
  colorAccessor: d => statusScale(d.status), // default color coding
  status: {'label': 'Status','domain': status, 'scale': statusScale},
  gender: {'label': 'Gender','domain': gender, 'scale': genderScale},
  nationality: {'label': 'Nationality','domain': nationality, 'scale': nationalityScale},
  age: {'label': 'Age','domain': [0, 20, 40, 60, 80, 100], 'scale': ageScale},
  daysGroup: {'label': 'Days to recovery','domain': days_group, 'scale': daysScale},
  nodeRadius: {'label': 'Number of connections','domain': [1, 5, 12], 'scale': nodeRadiusScale}
}