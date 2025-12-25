import { useQuery } from "convex/react"
import { api } from "../../convex/_generated/api"
import { useLazyGetCheckoutQuery } from "@/redux/api/billing"
import { useAppSelector } from "@/redux/store"
import { toast } from "sonner"

export const useSubscriptionPlan = () => {
    const [trigger, { isFetching }] = useLazyGetCheckoutQuery()

    const {id} = useAppSelector(state => state.profile)

    const onSubscribe = async () => {
        try {
            const res = await trigger(id).unwrap()
            window.location.href = res.url
        } catch (error) {
            console.log(error)
            toast.error("Could not start checkout")
        }
    }

    return {onSubscribe, isFetching}
}