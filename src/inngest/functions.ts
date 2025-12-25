import { fetchMutation, fetchQuery } from "convex/nextjs";
import { inngest } from "./client";
import { api } from "../../convex/_generated/api";
import { PolarOrder, PolarSubscription, ReceivedEvent, isPolarWebhookEvent } from "@/types/polar";
import { extractOrderLike, extractSubsriptionLike, isEntitledStatus, toMs } from "@/lib/polar";
import { Id } from "../../convex/_generated/dataModel";

export const autosaveProjectWorkflow = inngest.createFunction(
    { id: "autosave-project-workflow" },
    { event: "project/autosave.requested" },
    async ({event}) => {
        const {projectId, shapesData, viewportData} = event.data

        try {
            await fetchMutation(api.projects.updateProjectsSketches, {
                projectId,
                sketchesData: shapesData,
                viewportData
            })

            return {success: true}
        } catch (error) {
            throw error
        }
    } 
)

const grantKey = (subId: string, periodEndMs?: number, eventId?: string | number): string => {
    return periodEndMs !== null ? 
        `${subId}:${periodEndMs}` :
        eventId !== null ? 
            `${subId}:evt:${eventId}` :
            `${subId}:first`
}

export const handlePolarEvent = inngest.createFunction(
    { id: "polar-webhook-handler" },
    { event: "polar/webhook.received" },
    async ({event, step}) => {
        if (!isPolarWebhookEvent(event.data)) {
            return 
        }

        const incoming = event.data as ReceivedEvent
        const type = incoming.type
        const dataUnknown = incoming.data

        const sub: PolarSubscription | null = extractSubsriptionLike(dataUnknown)
        const order: PolarOrder | null = extractOrderLike(dataUnknown)

        if (!sub && !order) return 

        const userId: Id<"users"> | null = await step.run(
            "resolve-user", 
            async () => {
                const metaUserId = 
                    (sub?.metadata?.userId as string | undefined) ??
                    (order?.metadata?.userId as string | undefined) 

                if (metaUserId) {
                    return metaUserId as unknown as Id<"users">
                }

                const email = sub?.customer?.email ?? order?.customer?.email ?? null

                if (email) {
                    try {
                        const foundUserId = await fetchQuery(api.user.getUserIdByEmail, {email})

                        return foundUserId
                    } catch (error) {
                        console.log("Error fetching user by email", error)
                        return null
                    }
                }
                console.log("No user found for email", email)
                return null
            }
        )

        if (!userId) {
            console.log("No user found for order", order)
            return
        }

        const polarSubscriptionId = sub?.id ?? order?.subscription_id ?? ""

        if (!polarSubscriptionId) return

        const currentPeriodEnd = toMs(sub?.current_period_end)

        const payload = {
            userId,
            polarCustomerId: 
                sub?.customer?.id ?? sub?.customer_id ?? order?.customer_id ?? "",
            polarSubscriptionId,
            productId: sub?.product_id ?? sub?.product?.id ?? undefined,
            priceId: sub?.prices?.[0].id ?? undefined,
            planCode: sub?.planCode ?? sub?.product?.name ?? undefined,
            status: sub?.status ?? "updated",
            currentPeriodEnd,
            trialEndsAt: toMs(sub?.trial_ends_at),
            cancelAt: toMs(sub?.cancel_at),
            canceledAt: toMs(sub?.canceled_at),
            seats: sub?.seats ?? undefined,
            metadata: dataUnknown,
            creditsGrantPerPeriod: 10,
            creditsRolloverLimit: 100            
        }

        const subscriptionId = await step.run(
            "upsert-subscription",
            async () => {
                try {
                    const result = await fetchMutation(api.subscription.upsertFromPolar, payload)
                    return result
                } catch (error) {
                    throw error
                }
            }
        )

        const looksCreate = /subscription\.created/i.test(type)
        const looksRenew = /subscription\.renew|order\.created\invoice\.paid|order\.paid/i.test(type)

        const entitled = isEntitledStatus(payload.status)

        const idk = grantKey(polarSubscriptionId, currentPeriodEnd, incoming.id)

        if (entitled && (looksCreate || looksRenew || true)) {
            const grant = await step.run(
                "grant-credits",
                async () => {
                    try {
                        const result = await fetchMutation(api.subscription.grantCreditsIfNeeded, {
                            subscriptionId,
                            idempotencyKey: idk,
                            amount: 10,
                            reason: looksCreate ? "initial-grant" : "periodic-grant"
                        })

                        return result
                    } catch (error) {
                        throw error
                    }
                }
            )

            if (grant.ok && !("skipped" in grant && grant.skipped)) {
                await step.sendEvent("credits-granted", {
                    name: "billing/credits.granted",
                    id: `credits-granted:${polarSubscriptionId}:${currentPeriodEnd ?? "first"}`,
                    data: {
                        userId,
                        amount: "granted" in grant ? (grant.granted ?? 10) : 10,
                        balance: "balance" in grant ? grant.balance : undefined,
                        periodEnd: currentPeriodEnd      
                    }
                })
            }
        }

        await step.sendEvent("sub-synced", {
            name: "billing/subscription.synced",
            id: `sub-synced:${polarSubscriptionId}:${currentPeriodEnd ?? "first"}`,
            data: {
                userId,
                polarSubscriptionId,
                status: payload.status,
                currentPeriodEnd
            }
        })

        if (currentPeriodEnd && currentPeriodEnd > Date.now()) {
            const runAt = new Date(
                Math.max(Date.now() + 5000, currentPeriodEnd - 3 * 24 * 60 * 60 * 1000)
            )

            await step.sleepUntil("wait-until-expiry", runAt)

            const stillEntitled = await step.run("check-entitlement", async () => {
                try {
                    const result = await fetchQuery(api.subscription.hasEntitlement, {
                        userId
                    })

                    return result
                } catch (error) {
                    throw error
                }
            })

            if (stillEntitled) {
                step.sendEvent("pre-expiry", {
                    name: "billing/subscription.pre_expiry",
                    data: {
                        userId,
                        runAt: runAt.toISOString(),
                        periodEnd: currentPeriodEnd
                    }
                })
            }
        }
    }
)