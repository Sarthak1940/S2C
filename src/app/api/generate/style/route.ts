import { ConsumeCreditsQuery, CreditsBalanceQuery, MoodBoardImagesQuery } from "@/convex/query.config";
import { MoodBoardImage } from "@/hooks/use-styles";
import { prompts } from "@/prompts";
import { NextRequest, NextResponse } from "next/server";
import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import z from "zod";
import { fetchMutation } from "convex/nextjs";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";

const ColorSwatchSchema = z.object({
    name: z.string(),
    hexColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color"),
    description: z.string().optional()
})

const PrimaryColorsSchema = z.object({
    title: z.literal("Primary Colors"),
    swatches: z.array(ColorSwatchSchema).length(4)
})

const SecondaryColorsSchema = z.object({
    title: z.literal("Secondary & Accent Colors"),
    swatches: z.array(ColorSwatchSchema).length(4)
})

const UIComponentColorsSchema = z.object({
    title: z.literal("UI Component Colors"),
    swatches: z.array(ColorSwatchSchema).length(6)
})

const UtilityColorsSchema = z.object({
    title: z.literal("Utility & Form Colors"),
    swatches: z.array(ColorSwatchSchema).length(3)
})

const StatusColorsSchema = z.object({
    title: z.literal("Status & Feedback Colors"),
    swatches: z.array(ColorSwatchSchema).length(2)
})

const TypographyStyleSchema = z.object({
    name: z.string(),
    fontFamily: z.string(),
    fontWeight: z.string(),
    fontSize: z.string(),
    lineHeight: z.string(),
    letterSpacing: z.string().optional(),
    description: z.string().optional()
})

const TypographySectionSchema = z.object({
    title: z.string(),
    styles: z.array(TypographyStyleSchema)
})

const StyleGuideSchema = z.object({
    theme: z.string(),
    description: z.string(),
    colorSection: z.tuple([
        PrimaryColorsSchema,
        SecondaryColorsSchema,
        UIComponentColorsSchema,
        UtilityColorsSchema,
        StatusColorsSchema
    ]),
    typographySection: z.array(TypographySectionSchema).length(3)
})

export async function POST(request: NextRequest) {
    const body = await request.json()
    const {projectId} = body

    if (!projectId) {
        return NextResponse.json({error: "Project ID is required"}, {status: 400})
    }

    try {
        const {ok: balanceOk, balance: balanceBalance} = await CreditsBalanceQuery()

        if (!balanceOk) {
            return NextResponse.json({error: "Failed to get credits balance"}, {status: 500})
        }

        if (balanceBalance === 0) {
            return NextResponse.json({error: "Not enough credits"}, {status: 400})
        }

        const moodBoardImages = await MoodBoardImagesQuery(projectId)

        if (!moodBoardImages || moodBoardImages.images._valueJSON.length === 0) {
            return NextResponse.json({error: "No images found. Please upload images to moodboard"}, {status: 400})
        }

        const images = moodBoardImages.images._valueJSON as unknown as MoodBoardImage[]
        const imageUrls = images.map(image => image.url).filter(Boolean)
        const systemPrompt = prompts.styleGuide.system

        const userPrompt = `Analyze these ${imageUrls.length} mood board images and generate a design system:
        Extract colors that work harmoniously together and create typography that matches the aesthetic. Return ONLY the JSON object matching the exact schema structure above.`

        const result = await generateObject({
            model: google("gemini-3-pro-preview"),
            schema: StyleGuideSchema,
            system: systemPrompt,
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: userPrompt
                        },
                        ...imageUrls.map((url) => ({
                            type: "image" as const,
                            image: url as string
                        }))
                    ]
                }
            ]
        })

        const {ok, balance} = await ConsumeCreditsQuery({amount: 1})

        if (!ok) {
            return NextResponse.json({error: "Failed to generate style guide"}, {status: 500})
        }

        await fetchMutation(
            api.projects.updateProjectStyleGuide,
            {
                projectId: projectId as Id<"projects">,
                styleGuideData: result.object
            },
            {token: await convexAuthNextjsToken()}
        )

        return NextResponse.json({
            success: true,
            styleGuide: result.object,
            message: "Style guide generated successfully",
            balance
        })
    } catch (error) {
        return NextResponse.json({error: "Failed to generate style guide"}, {status: 500})
    }

}