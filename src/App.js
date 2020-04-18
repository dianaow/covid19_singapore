import React from "react"
import { BrowserRouter, Route } from "react-router-dom";
import NetworkPage from "./NetworkPage"
import EventsPage from "./EventsPage"

import { ThemeProvider } from "./components/contexts/ThemeContext"

import 'semantic-ui-css/semantic.min.css'
import "./styles_network.scss"

const App = () => {
 
  return (
    <ThemeProvider>
      <div className="App">
        <BrowserRouter>
          <Route path="/network" component={NetworkPage} />
          <Route path="/event" component={EventsPage} />
        </BrowserRouter>
      </div>
    </ThemeProvider>
  )

}

export default App

