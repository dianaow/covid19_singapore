const reducer = (state, action) => {
  switch (action.type) {
    case 'SET_DATE':
      return {
        date: action.date,
        nodes: state.nodes,
        links: state.links,
        timeline: state.timeline
      }
    case 'SET_STATS':
      return {
        date: state.date,
        nodes: action.nodes,
        links: action.links,
        timeline: action.timeline
      }
    default:
      return state
  }
}

export default reducer