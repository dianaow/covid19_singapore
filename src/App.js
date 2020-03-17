import React from "react"
import { BrowserRouter, Route } from "react-router-dom";
import NetworkPage from "./NetworkPage"

import 'semantic-ui-css/semantic.min.css'
import "./styles_network.scss"

const App = () => {

  return (
    <div className="App">
      <BrowserRouter>
        <Route path="/network" component={NetworkPage} />
      </BrowserRouter>
    </div>
  )

}

export default App

