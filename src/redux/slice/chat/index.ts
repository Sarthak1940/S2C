import { PayloadAction, createSlice } from "@reduxjs/toolkit";

export interface ChatMessage {
    id: string
    role: "user" | "assistant"
    content: string
    timestamp: string
    isStreaming?: boolean
}

export interface GeneratedUiChat {
    generatedUUID: string
    messages: ChatMessage[]
    isStreaming: boolean
    streamingMessageId: string | null
}

interface ChatState {
    chats: Record<string, GeneratedUiChat>
}

const initialState: ChatState = {
    chats: {}
}

const chatSlice = createSlice({
    name: "chat",
    initialState,
    reducers: {
        initializeChat: (state, action: PayloadAction<string>) => {
            const generatedUUID = action.payload
            if (!state.chats[generatedUUID]) {
                state.chats[generatedUUID] = {
                    generatedUUID,
                    messages: [],
                    isStreaming: false,
                    streamingMessageId: null
                }
            }
        },
        addUserMessage: (state, action: PayloadAction<{generatedUUID: string, content: string}>) => {
            const {generatedUUID, content} = action.payload
            const chat = state.chats[generatedUUID]
            if (chat) {
                chat.messages.push({
                    id: `user-${Date.now()}`,
                    role: "user",
                    content,
                    timestamp: new Date().toISOString()
                })
            }
        },
        startStreamingResponse: (state, action: PayloadAction<{generatedUUID: string, messageId: string}>) => {
            const {generatedUUID, messageId} = action.payload
            const chat = state.chats[generatedUUID]

            if (chat) {
                chat.isStreaming = true
                chat.streamingMessageId = messageId
                chat.messages.push({
                    id: messageId,
                    role: "assistant",
                    content: "",
                    timestamp: new Date().toISOString(),
                    isStreaming: true
                })
            }
        },
        updateStreamingContent: (state, action: PayloadAction<{generatedUUID: string, messageId: string, content: string}>) => {
            const {generatedUUID, messageId, content} = action.payload
            const chat = state.chats[generatedUUID]

            if (chat) {
                const messageIndex = chat.messages.findIndex(m => m.id === messageId)
                if (messageIndex !== -1) {
                    chat.messages[messageIndex].content = content
                }
            }
        },
        finishStreamingResponse: (state, action: PayloadAction<{generatedUUID: string, messageId: string, finalContent: string}>) => {
            const {generatedUUID, messageId, finalContent} = action.payload
            const chat = state.chats[generatedUUID]

            if (chat) {
                chat.isStreaming = false
                chat.streamingMessageId = null

                const messageIndex = chat.messages.findIndex(m => m.id === messageId)
                if (messageIndex !== -1) {
                    chat.messages[messageIndex].content = finalContent
                    chat.messages[messageIndex].isStreaming = false
                }
            }
        },
        addErrorMessage: (state, action: PayloadAction<{generatedUUID: string, error: string}>) => {
            const {generatedUUID, error} = action.payload
            const chat = state.chats[generatedUUID]

            if (chat) {
                chat.isStreaming = false
                chat.streamingMessageId = null

                chat.messages.push({
                    id: `error-${Date.now()}`,
                    role: "assistant",
                    content: `Sorry, I encountered an error: ${error}`,
                    timestamp: new Date().toISOString(),
                })
            }
        },
        clearChat: (state, action: PayloadAction<string>) => {
            const generatedUUID = action.payload
            if (state.chats[generatedUUID]) {
                state.chats[generatedUUID].messages = []
                state.chats[generatedUUID].isStreaming = false
                state.chats[generatedUUID].streamingMessageId = null
            }
        },
        removeChat: (state, action: PayloadAction<string>) => {
            const generatedUUID = action.payload
            delete state.chats[generatedUUID]
        }
    } 
})

export const {
    initializeChat,
    addUserMessage,
    startStreamingResponse,
    updateStreamingContent,
    finishStreamingResponse,
    addErrorMessage,
    clearChat,
    removeChat
} = chatSlice.actions

export default chatSlice.reducer
