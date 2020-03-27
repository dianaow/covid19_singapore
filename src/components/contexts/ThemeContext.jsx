import React, { createContext, useState } from "react"

export const ThemeContext = createContext()

export const ThemeContextProvider = props => {
  const theme = {
    light: {
      type: 'light',
      primary: 'whitesmoke',
      text: '#333333'
    },
    dark:{
      type: 'dark',
      primary: '#011C54',
      text: 'white'
    },
  }

  const setTheme = type => {
    setState({ ...state, theme: type === 'dark' ? theme.light : theme.dark })
  }

  const initState = {
    theme: theme.dark,
    setTheme: setTheme
  }

  const [state, setState] = useState(initState)

  return (
    <ThemeContext.Provider value={state}>
      {props.children}
    </ThemeContext.Provider>
  )
}