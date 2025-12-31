"use client"
import React, { useState } from 'react'
import { makeStore } from './store'
import { RootState } from './store'
import { Provider } from 'react-redux'

type Props = {
    children: React.ReactNode
    preloadedState?: Partial<RootState>
}

const ReduxProvider = ({children, preloadedState}: Props) => {
  const [store] = React.useState(() => makeStore(preloadedState))

  return <Provider store={store}>{children}</Provider>
}

export default ReduxProvider