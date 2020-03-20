import React, { createContext, useState } from "react"

export const PanelContext = createContext()

export function PanelProvider(props) {

  const initialPanelState = {'node_color_1': true, 'node_color_2': false,  'node_color_3': false, 'node_shape_1': true, 'node_shape_2': true, 'clicked': 'node_color_1'}

  const [panelState, setPanelState] = useState(initialPanelState)

  return(
    <PanelContext.Provider value={{ panelState, setPanelState }}>
      { props.children }
    </PanelContext.Provider>
  )

} 