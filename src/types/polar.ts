
export interface PolarWebhookEvent<TData = unknown> {
    id: string | number
    type: string
    data: TData
}

export const isPolarWebhookEvent = (x: unknown): x is PolarWebhookEvent => {
    return (
        !!x &&
        typeof x === "object" &&
        "type" in (x as Record<string, unknown>) &&
        "data" in (x as Record<string, unknown>)
    )
}

export type ReceivedEvent = PolarWebhookEvent<unknown>

export interface PolarCustomer {
    id: string
    email: string | null
    
}

export interface PolarProduct {
    id?: string | null
    name?: string | null
    
}

export interface PolarPrice {
    id?: string | null
    recurring_interval?: string | null
    
}

export interface PolarSubscription {
    id: string
    status: string
    current_period_end?: string | null
    trial_ends_at?: string | null
    cancel_at?: string | null
    canceled_at?: string | null
    customer?: PolarCustomer | null
    customer_id?: string | null
    product_id?: string | null
    product?: PolarProduct | null
    prices?: PolarPrice[] | null
    seats?: number | null
    planCode?: string | null
    metadata?: Record<string, unknown> | null
}

export interface PolarOrder {
    id: string
    billing_reason?: string | null
    subscription_id?: string | null
    customer?: PolarCustomer | null
    customer_id?: string | null
    metadata?: Record<string, unknown> | null
}
    