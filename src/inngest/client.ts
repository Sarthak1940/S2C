import { Inngest } from "inngest"
import { realtimeMiddleware } from "@inngest/realtime/middleware"

export const inngest = new Inngest({
    id: "s2c",
    eventKey: process.env.INNGEST_EVENT_KEY,
    middleware: [realtimeMiddleware()]
})