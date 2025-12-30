import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react"

export interface TypographySection {
    title: string
    styles: TypographyStyle[]
}

export interface TypographyStyle {
    name: string
    fontFamily: string
    fontWeight: string
    fontSize: string
    lineHeight: string
    letterSpacing?: string
    description?: string
}

export interface ColorSection {
    title: 
        | "Primary Colours"
        | "Secondary & Accent Colours"
        | "UI Component Colours"
        | "Utility & Form Colours"
        | "Status & Feedback Colours"
    swatches: ColorSwatch[]
}

export interface ColorSwatch {
    name: string
    hexColor: string
    description?: string
}

export interface StyleGuide {
    theme: string
    description: string
    colorSelections: [
        ColorSection,
        ColorSection,
        ColorSection,
        ColorSection,
        ColorSection
    ]
    typographySection: [TypographySection, TypographySection, TypographySection]

}

export interface GenerateStyleGuideRequest {
    projectId: string
}

export interface GenerateStyleGuideResponse {
    success: boolean
    message: string
    styleGuide: StyleGuide
}

export const StyleGuideApi = createApi({
    reducerPath: "StyleGuideApi",
    baseQuery: fetchBaseQuery({
        baseUrl: "/api/generate"
    }),
    tagTypes: ["StyleGuide"],
    endpoints: (builder) => ({
        generateStyleGuide: builder.mutation<
        GenerateStyleGuideResponse,
        GenerateStyleGuideRequest
        >({
            query: ({projectId}) => ({
                url: "/style",
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: {projectId}
            }),
            invalidatesTags: ["StyleGuide"]
        })
    })
})

export const { useGenerateStyleGuideMutation } = StyleGuideApi