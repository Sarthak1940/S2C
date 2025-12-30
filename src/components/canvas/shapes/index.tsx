import { Shape } from '@/redux/slice/shapes'
import React from 'react'
import { Frame } from './frame'
import { Rectangle } from './rectangle'
import { Stroke } from './stroke'
import { Arrow } from './arrow'
import { Line } from './line'
import { Text } from './text'
import { Ellipse } from './ellipse'
import GeneratedUI from './generatedui'

type Props = {
    shape: Shape
    toggleInspiration: () => void
    toggleChat: (generatedUUId: string) => void
    generateWorkflow: (generatedUUId: string) => void
    exportDesign: (generatedUUId: string, element: HTMLElement | null) => void
}

const ShapeRenderer = ({shape, toggleInspiration, toggleChat, generateWorkflow, exportDesign}: Props) => {
  
    switch (shape.type) {
        case "frame":
            return <Frame shape={shape} toggleInspiration={toggleInspiration}/>
        case "rect":
            return <Rectangle shape={shape}/>
        case "ellipse":
            return <Ellipse shape={shape}/>
        case "freedraw":
            return <Stroke shape={shape}/>
        case "arrow":
            return <Arrow shape={shape}/>
        case "line":
            return <Line shape={shape}/>
        case "text":
            return <Text shape={shape}/>
        case "generatedui":
            return <GeneratedUI 
                    shape={shape}
                    toggleChat={toggleChat}
                    generateWorkflow={generateWorkflow}
                    exportDesign={exportDesign}
                    />
        default:
            return null
    }
}

export default ShapeRenderer