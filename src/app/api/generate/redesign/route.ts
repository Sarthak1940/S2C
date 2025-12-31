import { ConsumeCreditsQuery, CreditsBalanceQuery, InspirationImagesQuery, StyleGuideQuery } from "@/convex/query.config";
import { prompts } from "@/prompts";
import { google } from "@ai-sdk/google";
import { streamText } from "ai";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const {generatedUUID, currentHTML, projectId, userMessage, wireframeSnapshot} = body

        if (!generatedUUID || !projectId || !userMessage) {
            return new Response(JSON.stringify({error: "Missing required fields"}), {
                status: 400
            })
        }

        const {ok: balanceOk, balance: balanceBalance} = await CreditsBalanceQuery()

        if (!balanceOk || balanceBalance === 0) {
            return new Response(JSON.stringify({error: "Not credits available"}), {
                status: 400
            })
        }

        const {ok} = await ConsumeCreditsQuery({amount: 1})

        if (!ok) {
            return new Response(JSON.stringify({error: "Failed to consume credits"}), {
                status: 400
            })
        }

        const styleGuide = await StyleGuideQuery(projectId)
        const styleGuideData = styleGuide.styleGuide._valueJSON as unknown as {
            colorSections: unknown[],
            typographySections: unknown[]
        }

        const inspirationResults = await InspirationImagesQuery(projectId)
        const images = inspirationResults.images._valueJSON as unknown as {
            url: string
        }[]

        const imageUrls = images.map((image) => image.url).filter(Boolean)

        const colors = styleGuideData.colorSections || []
        const typography = styleGuideData.typographySections || []

        let userPrompt = `Please redesign this UI based on my request: "${userMessage}"`;

        if (wireframeSnapshot) {
            userPrompt += `\n\nWireframe Context: I'm providing a wireframe image that shows the EXACT original design layout and structure that this UI was generated from. This wireframe represents the specific frame that was used to create the current design. Please use this as visual context to understand the intended layout, structure, and design elements when making improvements. The wireframe shows the original wireframe/mockup that the user drew or created.`;
        }

        if (currentHTML) {
            userPrompt += `\n\nCurrent HTML for reference:\n${currentHTML.substring(
            0,
            1000
            )}...`;
        }

        if (colors.length > 0) {
            userPrompt += `\n\nStyle Guide Colors:\n${(
                colors as Array<{
                swatches: Array<{
                    name: string;
                    hexColor: string;
                    description: string;
                }>;
                }>
            )
                .map((color) =>
                color.swatches
                    .map(
                    (swatch) =>
                        `${swatch.name}: ${swatch.hexColor}, ${swatch.description}`
                    )
                    .join(", ")
                )
                .join(", ")}`;
            }

        if (typography.length > 0) {
            userPrompt += `\n\nTypography:\n${(
                typography as Array<{
                styles: Array<{
                    name: string;
                    description: string;
                    fontFamily: string;
                    fontWeight: string;
                    fontSize: string;
                    lineHeight: string;
                }>;
                }>
            )
                .map((typo) =>
                typo.styles
                    .map(
                    (style) =>
                        `${style.name}: ${style.description}, ${style.fontFamily}, ${style.fontWeight}, ${style.fontSize}, ${style.lineHeight}`
                    )
                    .join(", ")
                )
                .join(", ")}`;
        }

        if (imageUrls.length > 0) {
            userPrompt += `\n\nInspiration Images Available: ${imageUrls.length} reference images for visual style and inspiration.`;
        }

        userPrompt += `\n\nPlease generate a completely new HTML design based on my request while following the style guide, maintaining professional quality, and considering the wireframe context for layout understanding.`

        const result = streamText({
            model: google("gemini-3-pro-preview"),
            system: prompts.generativeUi.system,
            temperature: 0.7,
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: userPrompt
                        },
                        {
                            type: "image",
                            image: wireframeSnapshot
                        },
                        ...imageUrls.map(url => ({
                            type: "image" as const,
                            image: url
                        }))
                    ]
                }
            ]
        })

        const stream = new ReadableStream({
            async start(controller) {
                try {
                    for await (const chunk of result.textStream) {
                        const encoder = new TextEncoder()
                        controller.enqueue(encoder.encode(chunk))
                    }
                    controller.close()
                } catch (error) {
                    controller.error(error)
                }
            }
        })

        return new Response(stream, {
            headers: {
                "Content-Type": "text/html; charset=utf-8",
                "Cache-Control": "no-cache",
                Connection: "keep-alive"
            }
        })
    } catch (error) {
        console.error(error)
        return NextResponse.json({message: "Error generating workflow page"}, {status: 500})
    }
}