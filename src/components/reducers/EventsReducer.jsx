const reducer = (state, action) => {
  switch (action.type) {
    case 'SET_DATE':
      return {
        date: action.date,
        data: state.data,
      }
    case 'SET_STATS':
      return {
        date: state.date,
        data: action.data
      }
    default:
      return state
  }
}

export default reducer