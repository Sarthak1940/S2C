import { cn } from '@/lib/utils'
import React from 'react'
import ColourSwatch from '../swatch'

type Props = {
    colourGuide: any[]
}

type ColourThemeProps = {
    title: string
    swatches: Array<{
        name: string
        hexColour: string
        description?: string
    }>
    className?: string
}

export const ColourTheme = ({title, swatches, className}: ColourThemeProps) => {
    return (
        <div className={cn('flex flex-col gap-5', className)}>
            <div>
                <h3 className='text-lg font-medium text-foreground/50'>{title}</h3>
            </div>
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
                {swatches.map((swatch) => (
                    <div key={swatch.name}>
                        <ColourSwatch 
                        name={swatch.name}
                        value={swatch.hexColour}/>
                        {swatch.description && (
                            <p className='text-xs text-muted-foreground mt-2'>
                                {swatch.description}
                            </p>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}

export const ThemeContent = ({colourGuide}: Props) => {
  return (
    <div className='flex felx-col gap-10'>
        <div className='flex flex-col gap-10'>
            {colourGuide.map((section: any, index: number) => (
                <ColourTheme key={index} title={section.title} swatches={section.swatches}/>
            ))}
        </div>
    </div>
  )
}

export default ThemeContent