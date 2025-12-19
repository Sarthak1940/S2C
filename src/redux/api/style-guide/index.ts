
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
    swacthes: ColorSwatch[]
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