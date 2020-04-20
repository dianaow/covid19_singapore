import * as d3 from 'd3'

// set node, link, text color and dimensions
export const rootRadius = 30
export const nodeStrokeWidth = 2
export const nodeStroke = 'white'
export const nodeFill = '#011C54'
export const nodeOpacity = 1
export const nodeTextFill = 'white'
export const nodeTextOpacity = 0
export const childnodeTextOpacity = 0
export const nodeTextSize = 8

export const linkStrokeWidth = 0.6
export const linkStroke = 'white'
export const linkOpacity = 0.5
export const linkTextFill = 'white'
export const linkTextOpacity = 0
export const linkTextSize = 5
export const transitionDuration = 750

export const formatDate = d3.timeFormat("%d %b %Y")
export const parseDate = d3.timeParse("%d %b %Y")
export const currentDateString = '23 Mar 2020'
export const currentDate = parseDate(currentDateString)

export const mapping = {'node_shape_1': 'Singaporean/Singapore PR', 'node_shape_2': 'Foreigner'}

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

//wizlearn   lifechurch  cny       grace                       uk
//importedb4 wuhan30     unlinked(local-transmission imported  indonesia
//yth        wuhan9      safra     hyatt  seletar              usa
                        //boulder  church
export const clusterArrangement = ['Cluster4', 'Cluster3', 'Cluster11', 'Cluster5', 'Cluster10', 'Cluster1', 'Cluster2', 'Unlinked', 'Imported', 'X', 'Cluster8', 'Cluster6', 'Cluster7', 'Cluster9']
