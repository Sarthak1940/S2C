"use client"
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Toggle } from '@/components/ui/toggle'
import { Input } from '@/components/ui/input'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { cn } from '@/lib/utils'
import { TextShape, updateShape } from '@/redux/slice/shapes'
import { useAppDispatch, useAppSelector } from '@/redux/store'
import { 
    Bold, 
    Italic, 
    Underline, 
    Strikethrough, 
    AlignLeft, 
    AlignCenter, 
    AlignRight, 
    AlignJustify,
    Type,
    CaseLower,
    CaseUpper
} from 'lucide-react'
import React from 'react'

type Props = {
    isOpen: boolean
}

const TextSidebar = ({isOpen}: Props) => {
    const dispatch = useAppDispatch()
    const selectedShapes = useAppSelector((state) => state.shapes.selected)
    const shapesEntities = useAppSelector((state) => state.shapes.shapes.entities)

    const fontFamilies = [
        "Inter, sans-serif",
        "Arial, sans-serif",
        "Helvetica, sans-serif",
        "Times New Roman, serif",
        "Courier New, monospace",
        "Verdana, sans-serif",
        "Georgia, serif",
        "Monaco, monospace",
        "system-ui, sans-serif",
        "Palatino, serif",
    ]

    const selectedTextShape = Object.keys(selectedShapes).map((id) => shapesEntities[id])
        .find((shape) => shape?.type === "text") as TextShape | undefined

    const updateTextProperty = (property: keyof TextShape, value: any) => {
        if (!selectedTextShape) return

        dispatch(updateShape({
            id: selectedTextShape.id,
            patch: {
                [property]: value
            }
        }))
    }

    if (!isOpen || !selectedTextShape) return null

  return (
    <div
    className={cn(
        "fixed right-5 top-1/2 transform -translate-y-1/2 w-80 backdrop-blur-xl bg-white/8 border  border-white/12 gap-2 p-3 saturate-150 rounded-lg z-50 transition-transform duration-300",
        isOpen ? "translate-x-0" : "translate-x-full"
    )}
    >
        <div className='p-4 flex flex-col gap-6 overflow-y-auto max-h-[calc(100vh-8rem)]'>
            <div className='space-y-2'>
                <Label className='text-white/80'>Font Family</Label>
                <Select
                value={selectedTextShape?.fontFamily}
                onValueChange={(value) => updateTextProperty("fontFamily", value)}>
                    <SelectTrigger className='bg-white/5 border-white/10 w-full text-white'>
                        <SelectValue />
                    </SelectTrigger>

                    <SelectContent className='bg-black/90 border-white/10'>
                        {fontFamilies.map((font) => (
                            <SelectItem key={font} value={font} className='text-white hover:bg-white/10'>
                                <span style={{fontFamily: font}}>{font.split(",")[0]}</span>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className='space-y-2'>
                <label className='text-white/80'>Font Size: {selectedTextShape?.fontSize}px</label>
                <Slider 
                value={[selectedTextShape?.fontSize]}
                onValueChange={([value]) => updateTextProperty("fontSize", value)}
                min={8}
                max={128}
                step={1}
                className='w-full'/>
            </div>

            <div className='space-y-2'>
                <label className='text-white/80'>Font Weight: {selectedTextShape?.fontWeight}</label>
                <Slider 
                value={[selectedTextShape?.fontWeight]}
                onValueChange={([value]) => updateTextProperty("fontWeight", value)}
                min={100}
                max={900}
                step={100}
                className='w-full'/>
            </div>

            <div className='space-y-3'>
                <Label className='text-white/80'>Style</Label>
                <div className='flex gap-2'>
                    <Toggle 
                    pressed={selectedTextShape?.fontWeight >= 600}
                    onPressedChange={(pressed) => updateTextProperty("fontWeight", pressed ? 700 : 400)}
                    className='data-[state=on]:bg-blue-500 data-[state=on]:text-white'>
                        <Bold className='w-4 h-4'/>
                    </Toggle>
                    <Toggle 
                    pressed={selectedTextShape?.fontStyle === "italic"}
                    onPressedChange={(pressed) => updateTextProperty("fontStyle", pressed ? "italic" : "normal")}
                    className='data-[state=on]:bg-blue-500 data-[state=on]:text-white'>
                        <Italic className='w-4 h-4'/>
                    </Toggle>
                    <Toggle 
                    pressed={selectedTextShape?.textDecoration === "underline"}
                    onPressedChange={(pressed) => updateTextProperty("textDecoration", pressed ? "underline" : "none")}
                    className='data-[state=on]:bg-blue-500 data-[state=on]:text-white'>
                        <Underline className='w-4 h-4'/>
                    </Toggle>
                    <Toggle 
                    pressed={selectedTextShape?.textDecoration === "line-through"}
                    onPressedChange={(pressed) => updateTextProperty("textDecoration", pressed ? "line-through" : "none")}
                    className='data-[state=on]:bg-blue-500 data-[state=on]:text-white'>
                        <Strikethrough className='w-4 h-4'/>
                    </Toggle>
                </div>
            </div>

            <div className='space-y-2'>
                <Label className='text-white/80'>Color</Label>
                <div className='flex gap-2 items-center'>
                    <div className='w-full h-8 bg-white/5 border border-white/10 rounded-md relative overflow-hidden'>
                        <Input 
                            type="color"
                            value={String(selectedTextShape?.fill) || "#ffffff"}
                            onChange={(e) => updateTextProperty("fill", e.target.value)}
                            className='absolute -top-1/2 -left-1/2 w-[200%] h-[200%] p-0 border-0 cursor-pointer'
                        />
                    </div>
                    <Input 
                        value={String(selectedTextShape?.fill) || "#ffffff"}
                        onChange={(e) => updateTextProperty("fill", e.target.value)}
                        className='bg-white/5 border-white/10 text-white w-24'
                    />
                </div>
            </div>

            <div className='space-y-2'>
                <Label className='text-white/80'>Alignment</Label>
                <ToggleGroup 
                    type="single" 
                    value={selectedTextShape?.textAlign}
                    onValueChange={(value) => value && updateTextProperty("textAlign", value)}
                    className='bg-white/5 border border-white/10 rounded-md justify-start p-1'
                >
                    <ToggleGroupItem value="left" aria-label="Align left" className='data-[state=on]:bg-white/20 hover:bg-white/10 text-white w-8 h-8 p-0'>
                        <AlignLeft className="h-4 w-4" />
                    </ToggleGroupItem>
                    <ToggleGroupItem value="center" aria-label="Align center" className='data-[state=on]:bg-white/20 hover:bg-white/10 text-white w-8 h-8 p-0'>
                        <AlignCenter className="h-4 w-4" />
                    </ToggleGroupItem>
                    <ToggleGroupItem value="right" aria-label="Align right" className='data-[state=on]:bg-white/20 hover:bg-white/10 text-white w-8 h-8 p-0'>
                        <AlignRight className="h-4 w-4" />
                    </ToggleGroupItem>
                </ToggleGroup>
            </div>

            <div className='space-y-4'>
                <Label className='text-white/80'>Stroke</Label>
                <div className='space-y-2'>
                    <div className='flex gap-2 items-center'>
                        <div className='w-full h-8 bg-white/5 border border-white/10 rounded-md relative overflow-hidden'>
                            <Input 
                                type="color"
                                value={selectedTextShape?.stroke || "#ffffff"}
                                onChange={(e) => updateTextProperty("stroke", e.target.value)}
                                className='absolute -top-1/2 -left-1/2 w-[200%] h-[200%] p-0 border-0 cursor-pointer'
                            />
                        </div>
                        <Input 
                            value={selectedTextShape?.stroke || "#ffffff"}
                            onChange={(e) => updateTextProperty("stroke", e.target.value)}
                            className='bg-white/5 border-white/10 text-white w-24'
                        />
                    </div>
                    <div className='flex items-center gap-2'>
                         <label className='text-xs text-white/60 w-12'>Width</label>
                         <Slider 
                            value={[selectedTextShape?.strokeWidth || 0]}
                            onValueChange={([value]) => updateTextProperty("strokeWidth", value)}
                            min={0}
                            max={20}
                            step={0.5}
                            className='flex-1'
                        />
                         <span className='text-xs text-white/50 w-8 text-right'>{selectedTextShape?.strokeWidth}px</span>
                    </div>
                </div>
            </div>

             <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-2'>
                    <Label className='text-white/80'>Line Height</Label>
                     <Input 
                        type="number"
                        step="0.1"
                        value={selectedTextShape?.lineHeight}
                        onChange={(e) => updateTextProperty("lineHeight", parseFloat(e.target.value))}
                        className='bg-white/5 border-white/10 text-white'
                    />
                </div>
                <div className='space-y-2'>
                    <Label className='text-white/80'>Letter Spacing</Label>
                     <Input 
                        type="number"
                        step="0.1"
                        value={selectedTextShape?.letterSpacing}
                        onChange={(e) => updateTextProperty("letterSpacing", parseFloat(e.target.value))}
                        className='bg-white/5 border-white/10 text-white'
                    />
                </div>
            </div>

            <div className='space-y-2'>
                <Label className='text-white/80'>Transform</Label>
                <ToggleGroup 
                    type="single" 
                    value={selectedTextShape?.textTransform}
                    onValueChange={(value) => updateTextProperty("textTransform", value || "none")}
                    className='bg-white/5 border border-white/10 rounded-md justify-start p-1'
                >
                    <ToggleGroupItem value="none" aria-label="None" className='data-[state=on]:bg-white/20 hover:bg-white/10 text-white w-8 h-8 p-0'>
                        <span className='text-xs'>None</span>
                    </ToggleGroupItem>
                    <ToggleGroupItem value="uppercase" aria-label="Uppercase" className='data-[state=on]:bg-white/20 hover:bg-white/10 text-white w-8 h-8 p-0'>
                        <CaseUpper className="h-4 w-4" />
                    </ToggleGroupItem>
                    <ToggleGroupItem value="lowercase" aria-label="Lowercase" className='data-[state=on]:bg-white/20 hover:bg-white/10 text-white w-8 h-8 p-0'>
                        <CaseLower className="h-4 w-4" />
                    </ToggleGroupItem>
                    <ToggleGroupItem value="capitalize" aria-label="Capitalize" className='data-[state=on]:bg-white/20 hover:bg-white/10 text-white w-8 h-8 p-0'>
                        <Type className="h-4 w-4" />
                    </ToggleGroupItem>
                </ToggleGroup>
            </div>
        </div>
    </div>
  )
}

export default TextSidebar