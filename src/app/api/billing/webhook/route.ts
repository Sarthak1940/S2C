import { NextRequest, NextResponse } from "next/server";
import { validateEvent, WebhookVerificationError } from "@polar-sh/sdk/webhooks"
import { inngest } from "@/inngest/client";
import { PolarWebhookEvent, isPolarWebhookEvent } from "@/types/polar";

export async function POST(request: NextRequest): Promise<NextResponse> {
    const secret = process.env.POLAR_WEBHOOK_SECRET ?? ""
    if (!secret) {
        return NextResponse.json({error: "Webhook secret not found"}, {status: 500})
    }
    
    const raw = await request.arrayBuffer()
    const headersObject = Object.fromEntries(request.headers)

    let verified: unknown

    try {
        verified = validateEvent(Buffer.from(raw), headersObject, secret)
    } catch (error) {
        if (error instanceof WebhookVerificationError) {
            return new NextResponse("Invalid signature", {status: 403})
        }

        throw error
    }

    if (!isPolarWebhookEvent(verified)) {
        return new NextResponse("Invalid event", {status: 400})
    }

    const evt: PolarWebhookEvent = verified
    const id = String(evt.id ?? Date.now())

    try {
        await inngest.send({
            name: "polar/webhook.received",
            id,
            data: evt
        })
    } catch (error) {
        console.error("Failed to send webhook to Inngest", error)
        return NextResponse.json({error: "Failed to send webhook to Inngest"}, {status: 500})
    }

    return NextResponse.json({ok: true})
}