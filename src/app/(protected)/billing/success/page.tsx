"use client"
import { useQuery } from 'convex/react'
import { useRouter } from 'next/navigation'
import React, { useEffect, useRef, useState } from 'react'
import { api } from '../../../../../convex/_generated/api'
import { Id } from '../../../../../convex/_generated/dataModel'

const Page = () => {
    const router = useRouter()
    const redirected = useRef(false)
    const [timedOut, setTimedOut] = useState(false)

    const me = useQuery(api.user.getCurrentUser, {})

    const entitlement = useQuery(
        api.subscription.hasEntitlement, 
        me && me._id ? {userId: me._id as Id<"users">} : "skip"
    )

    useEffect(() => {
        if (redirected.current) return

        if (me === undefined) return

        if (me === null) {
            redirected.current = true
            router.replace("/auth/sign-in")
            return
        }

        if (entitlement === undefined) return

        if (entitlement) {
            redirected.current = true
            router.replace("/dashboard")
        }

    }, [me, entitlement, router])

    useEffect(() => {
        if (redirected.current) return
        if (!me || entitlement) return

        const t = setTimeout(() => {
            if (redirected.current) return
            setTimedOut(true)
            redirected.current = true
            router.replace(`/billing/${me.name}`)
        }, 45_000)

        return () => clearTimeout(t)
    }, [me, entitlement, router])

  return (
    <div className='mx-auto max-w-md p-8 text-center'>
        <div className='mb-3'>
            <span className='inline-block w-4 h-4 rounded-full animate-spin border-2 border-gray-300 border-t-transparent align-[-2px]' />
        </div>
        <div className='mb-1 text-lg'>Finalizing your subscription...</div>
        <div className='text-sm text-gray-500' aria-live='polite'>
            {me === undefined ? 
            "Checking your account..." : 
            entitlement === undefined ? 
            "Confirming your entitlement..." : 
            timedOut ? 
            "Taking longer than expected - redirecting to billing." : 
            "This should only take a few seconds."}
        </div>
    </div>
  )
}

export default Page