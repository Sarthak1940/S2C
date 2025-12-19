
import MoodBoard from '@/components/style/moodboard'
import ThemeContent from '@/components/style/theme'
import StyleGuideTypography from '@/components/style/typography'
import { TabsContent } from '@/components/ui/tabs'
import { MoodBoardImagesQuery, StyleGuideQuery } from '@/convex/query.config'
import { MoodBoardImage } from '@/hooks/use-styles'
import { StyleGuide } from '@/redux/api/style-guide'
import { Palette } from 'lucide-react'
import React from 'react'

type Props = {
  searchParams: Promise<{
    project: string
  }>
}

const Page = async ({searchParams}: Props) => {
  const projectId = (await searchParams).project
  const existingStyleGuide = await StyleGuideQuery(projectId);

  const guide = existingStyleGuide.styleGuide?._valueJSON as unknown as StyleGuide

  const colourGuide = guide?.colorSelections || []
  const typographyGuide = guide?.typographySection || []

  const existingMoodboards = await MoodBoardImagesQuery(projectId);
  const guideImages = existingMoodboards.images
                      ._valueJSON as unknown as MoodBoardImage[]

  return (
    <div>
      <TabsContent
      value='colours'
      className='space-y-8'>
        {!guideImages.length ? (
          <div className='space-y-8'>
            <div className='text-center py-20'>
              <div className='w-16 h-16 mx-auto rounded-lg bg-muted flex items-center justify-center'>
                <Palette className='w-8 h-8 text-muted-foreground'/>
              </div>
              <h3 className='text-lg font-medium text-foreground mb-2'>
                No colours generated yet
              </h3>
              <p className='text-sm text-muted-foreground max-w-md mx-auto mb-6'>
                Upload images to your mood board and generate an AI-powered style guide with colours and typography.
              </p>
            </div>
          </div>
        ): (
          <ThemeContent colourGuide={colourGuide}/>
        )}
      </TabsContent>

      <TabsContent
      value='typography'>
        <StyleGuideTypography typographyGuide={typographyGuide}/>
      </TabsContent>

      <TabsContent
      value='moodboard'>
        <MoodBoard guideImages={guideImages}/>
      </TabsContent>
    </div>
  )
}

export default Page