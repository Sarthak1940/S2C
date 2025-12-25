import SubscriptionButton from '@/components/buttons/checkout'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Code, Download, Palette, Sparkles, Zap } from 'lucide-react'
import React from 'react'

type Props = {}

const Page = (props: Props) => {
  return (
    <div className='min-h-screen bg-background flex items-center justify-center'>
        <div className='w-full max-w-lg'>
          <div className='text-center mb-8'>
            <div className='inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-primary to-primary/60 rounded-full mb-4 shadow-lg'>
              <Sparkles className='w-6 h-6 text-primary-foreground'/>
            </div>
            <h1 className='text-2xl font-bold text-foreground mb-3'>
              Unlock S2C Premium
            </h1>

            <p className='text-muted-foreground text-sm max-w-sm mx-auto'>
              Transform your design workflow with AI-powered tools and unlimited creativity
            </p>
          </div>

          <Card className='backdrop-blur-xl bg-white/8 border border-white/12 shadow-xl saturate-150'>
            <CardHeader className='text-center pb-4'>
              <div className='flex items-center justify-center mb-3'>
                <Badge variant={"secondary"} 
                className='bg-primary/20 text-primary border-primary/30 px-3 py-1 text-xs font-medium rounded-full'>
                  Most Popular
                </Badge>
              </div>
              <CardTitle className='text-2xl font-bold text-foreground mb-2'>
                Standard Plan
              </CardTitle>

              <div className='flex items-baseline justify-center gap-2'>
                <span className='text-4xl font-bold text-foreground'>$9.99</span>
                <span className='text-base text-muted-foreground'>/month</span>
              </div>

              <CardDescription className='text-muted-foreground text-sm mt-2'>
                Get 10 credits every month to power your AI-assisted design workflow
              </CardDescription>
            </CardHeader>

            <CardContent className='space-y-4 px-6'>
              <div className='text-center'>
                <p className='text-muted-foreground text-sm leading-relaxed'>
                  Perfect for freelancers and creators who want reliable access to code generation, exports and other premium features without over-committing.
                </p>
                <p className='text-muted-foreground text-sm leading-relaxed mt-2'>
                  Each credit unlocks one full AI task - whether it&apos;s generating UI code from your sketches, exporting polished assets, or running advanced processing. Simple, predictable, and flexible. 
                </p>
              </div>

              <div className='space-y-3'>
                <h3 className='text-base font-semibold text-foreground text-center mb-3'>
                  What&apos;s Included
                </h3>
                <div className='grid gap-2'>
                  <div className='flex items-center gap-3 p-2 rounded-lg bg-white/5 border-white/8'>
                    <div className='w-6 h-6 bg-primary/20 rounded-md flex items-center justify-center shrink-0'>
                      <Palette className='h-3 w-3 text-primary'/>
                    </div>
                    <div>
                      <p className='text-foreground font-medium text-sm'>
                        AI powered Design Generation
                      </p>
                      <p className='text-muted-foreground text-xs'>
                        Transform sketches into production-ready code
                      </p>
                    </div>
                  </div>

                  <div className='flex items-center gap-3 p-2 rounded-lg bg-white/5 border border-white/8'>
                    <div className='w-6 h-6 bg-primary/20 rounded-md flex items-center justify-center shrink-0'>
                      <Download className='h-3 w-3 text-primary'/>
                    </div>

                    <div>
                      <p className='text-foreground font-medium text-sm'>
                        Premium Asset Exports
                      </p>
                      <p className='text-muted-foreground text-xs'>
                        High-quality exports in multiple formats
                      </p>
                    </div>
                  </div>

                  <div className='flex items-center gap-3 p-2 rounded-lg bg-white/5 border border-white/8'>
                    <div className='w-6 h-6 bg-primary/20 rounded-md flex items-center justify-center shrink-0'>
                      <Code className='h-3 w-3 text-primary'/>
                    </div>

                    <div>
                      <p className='text-foreground font-medium text-sm'>
                        Advanced Processing 
                      </p>
                      <p className='text-muted-foreground text-xs'>
                        Run complex design operation and transformations
                      </p>
                    </div>
                  </div>

                  <div className='flex items-center gap-3 p-2 rounded-lg bg-white/5 border border-white/8'>
                    <div className='w-6 h-6 bg-primary/20 rounded-md flex items-center justify-center shrink-0'>
                      <Zap className='h-3 w-3 text-primary'/>
                    </div>

                    <div>
                      <p className='text-foreground font-medium text-sm'>
                        10 monthly credits
                      </p>
                      <p className='text-muted-foreground text-xs'>
                        Flexible usage for design needs
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>

            <CardFooter className='flex flex-col gap-3 pt-4 px-6 pb-6'>
              <SubscriptionButton />
              <p className='text-muted-foreground text-xs text-center'>
                Cancel anytime. No commitment. No setup fees
              </p>
            </CardFooter>
          </Card>
        </div>
    </div>
  )
}

export default Page