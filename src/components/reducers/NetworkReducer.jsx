const reducer = (state, action) => {
  switch (action.type) {
    case 'SET_DATE':
      return {
        date: action.date,
        nodes: state.nodes,
        links: state.links,
        timeline: state.timeline,
        rendered: state.rendered
      }
    case 'SET_STATS':
      return {
        date: state.date,
        nodes: action.nodes,
        links: action.links,
        timeline: state.timeline,
        rendered: state.rendered
      }
    case 'SET_RENDERED':
      return {
        date: state.date,
        nodes: state.nodes,
        links: state.links,
        timeline: state.timeline,
        rendered: action.rendered
      }
    default:
      return state
  }
}

export default reducer