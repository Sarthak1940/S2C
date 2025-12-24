import InfiniteCanvas from '@/components/canvas'
import ProjectProvider from '@/components/projects/provider'
import { ProjectQuery } from '@/convex/query.config'
import React from 'react'

type Props = {
  searchParams: Promise<{project?: string}>
}

const Page = async ({searchParams}: Props) => {
  const params = await searchParams
  const projectId = params.project

  if (!projectId) {
    return <div className='w-full h-screen flex items-center justify-center'>
      <p className='text-muted-foreground'>
        No project Selected
      </p>
    </div>
  }

  const {project, profile} = await ProjectQuery(projectId)

  if (!profile) {
    return <div className='w-full h-screen flex items-center justify-center'>
      <p className='text-muted-foreground'>
        Authentication Required
      </p>
    </div>
  }

  if (!project) {
    return <div className='w-full h-screen flex items-center justify-center'>
      <p className='text-red-500'>
        Project Not Found or access denied
      </p>
    </div>
  }

  return (
    <ProjectProvider initialProject={project}>
      <InfiniteCanvas />
    </ProjectProvider>
  )
}

export default Page