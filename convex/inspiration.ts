import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getInspirationImages = query({
    args: {
        projectId: v.id("projects")
    },
    handler: async (ctx, {projectId}) => {
        const userId = await getAuthUserId(ctx)

        if (!userId) {
            return []
        }

        const project = await ctx.db.get(projectId)

        if (!project || project.userId !== userId) {
            return []
        }

        const storageIds = project.inspirationImages || []

        // generate urls for all images
        const images = await Promise.all(
            storageIds.map(async (storageId, index) => {
                try {
                    const url = await ctx.storage.getUrl(storageId)
                    return {
                        id: `inspiration-${storageId}`,
                        storageId,
                        url,
                        uploaded: true,
                        uploading: false,
                        index
                    }
                } catch (error) {
                    return null
                }
            })
        )

        // filter out any failed urls and sort by index
        const validImages = images.filter((image): image is NonNullable<typeof image> => image !== null).sort((a, b) => a.index - b.index)

        return validImages
    }
})

export const generateUploadUrl = mutation({
    handler: async (ctx) => {
        const userId = await getAuthUserId(ctx)

        if (!userId) {
            throw new Error("Unauthenticated")
        }

        return ctx.storage.generateUploadUrl()
    }
})

export const addInspirationImage = mutation({
    args: {
        projectId: v.id("projects"),
        storageId: v.id("_storage")
    },
    handler: async (ctx, {projectId, storageId}) => {
        const userId = await getAuthUserId(ctx)

        if (!userId) {
            throw new Error("Unauthenticated")
        }

        const project = await ctx.db.get(projectId)

        if (!project || project.userId !== userId) {
            throw new Error("Unauthorized")
        }

        const currentImages = project.inspirationImages || []

        if (currentImages.includes(storageId)) {
            return {success: true, message: "Image already added"}
        }

        if (currentImages.length >= 6) {
            throw new Error("Maximum 6 images allowed")
        }

        const updatedImages = [...currentImages, storageId];

        await ctx.db.patch(projectId, {
            inspirationImages: updatedImages,
            lastModified: Date.now()
        })

        return {success: true, message: "Image added successfully", totalImages: updatedImages.length}
    }
})

export const removeInspirationImage = mutation({
    args: {
        projectId: v.id("projects"),
        storageId: v.id("_storage")
    },
    handler: async (ctx, {projectId, storageId}) => {
        const userId = await getAuthUserId(ctx)

        if (!userId) {
            throw new Error("Unauthenticated")
        }

        const project = await ctx.db.get(projectId)

        if (!project || project.userId !== userId) {
            throw new Error("Unauthorized")
        }

        const currentImages = project.inspirationImages || []

        if (!currentImages.includes(storageId)) {
            return {success: true, message: "Image not found"}
        }

        const updatedImages = currentImages.filter((image) => image !== storageId)

        await ctx.db.patch(projectId, {
            inspirationImages: updatedImages,
            lastModified: Date.now()
        })

        return {success: true, message: "Image removed successfully", remainingImages: updatedImages.length}
    }
})