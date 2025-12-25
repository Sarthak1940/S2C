"use client"
import { useAutosaveProjectMutation } from '@/redux/api/project'
import { useAppSelector } from '@/redux/store'
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import React, { useEffect, useRef, useState } from 'react'


const Autosave = () => {
    const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">('idle') 

    const [autosaveProject, { isLoading: isSaving }] = useAutosaveProjectMutation()

    const searchParams = useSearchParams()
    const projectId = searchParams.get("project")
    const user = useAppSelector(state => state.profile)
    const shapesStates = useAppSelector(state => state.shapes)
    const viewportState = useAppSelector(state => state.viewport)

    const abortRef = useRef<{ abort: () => void } | null>(null)
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const lastSaveRef = useRef<string>("")
    const isReady = Boolean(projectId && user?.id)

    useEffect(() => {
        if (!isReady) return 

        const stateString = JSON.stringify({
            shapes: shapesStates,
            viewport: viewportState
        })

        if (stateString === lastSaveRef.current) return 

        if (debounceRef.current) clearTimeout(debounceRef.current)

        debounceRef.current = setTimeout(async () => {
            lastSaveRef.current = stateString
            if (abortRef.current) abortRef.current.abort()
            
            setSaveStatus("saving")
            
            try {
                const promise = autosaveProject({
                    projectId: projectId as string,
                    userId: user?.id as string,
                    shapesData: shapesStates,
                    viewportData: {
                        scale: viewportState.scale,
                        translate: viewportState.translate
                    }
                })
                abortRef.current = promise
                await promise.unwrap()

                setSaveStatus("saved")

                setTimeout(() => setSaveStatus("idle"), 2000)
            } catch (error) {
                // Ignore errors caused by aborting the request
                if ((error as any)?.name === "AbortError") return
                setSaveStatus("error")
                setTimeout(() => setSaveStatus("idle"), 3000)
            }
        }, 3000)

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current)
        } 
    }, [
        isReady,
        autosaveProject,
        projectId,
        user?.id,
        shapesStates,
        viewportState
    ])

    useEffect(() => {
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current)
            if (abortRef.current) abortRef.current.abort()
        }
    }, [])

    if (!isReady) return null

    if (isSaving) return (
        <div className='flex items-center'>
            <Loader2 className='w-4 h-4 animate-spin'/>
        </div>
    )


  switch (saveStatus) {
    case "saved":
        return (
            <div className='flex items-center'>
                <CheckCircle className='w-4 h-4'/>
            </div>
        )
    case "error":
        return (
            <div className='flex items-center'>
                <AlertCircle className='w-4 h-4'/>
            </div>
        )
    default:
        return <></>
  }
}

export default Autosave