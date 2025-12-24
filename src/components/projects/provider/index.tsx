"use client"
import { loadProject } from '@/redux/slice/shapes'
import { restoreViewport } from '@/redux/slice/viewport'
import { useAppDispatch } from '@/redux/store'
import React, { useEffect } from 'react'

type Props = {
    children: React.ReactNode
    initialProject: any
}

const ProjectProvider = ({children, initialProject}: Props) => {
    const dispatch = useAppDispatch()

    useEffect(() => {
        if (initialProject?._valueJSON?.sketchedData) {
            const projectData = initialProject._valueJSON

            dispatch(loadProject(projectData.sketchedData))

            if (projectData.viewportData) {
                dispatch(restoreViewport(projectData.viewportData))
            }
        }
    }, [dispatch, initialProject])

  return (
    <>{children}</>
  )
}

export default ProjectProvider