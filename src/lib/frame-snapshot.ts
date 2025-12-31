import { FrameShape, Shape } from "@/redux/slice/shapes"

export const isShapeInsideFrame = (shape: Shape, frame: FrameShape): boolean => {
    const frameLeft = frame.x
    const frameRight = frame.x + frame.w
    const frameTop = frame.y
    const frameBottom = frame.y + frame.h

    switch (shape.type) {
        case "rect":
        case "ellipse":
        case "frame":
            const centerX = shape.x + shape.w / 2
            const centerY = shape.y + shape.h / 2

            return (
                centerX >= frameLeft &&
                centerX <= frameRight &&
                centerY >= frameTop &&
                centerY <= frameBottom
            )
        case "text":
            return (
                shape.x >= frameLeft &&
                shape.x <= frameRight &&
                shape.y >= frameTop &&
                shape.y <= frameBottom
            )
        case "freedraw":
            return (
                shape.points.some(
                    (point) => (
                        point.x >= frameLeft &&
                        point.x <= frameRight &&
                        point.y >= frameTop &&
                        point.y <= frameBottom
                    )
                )
            )
        case "line":
        case "arrow":
            const startInside = 
                shape.startX >= frameLeft &&
                shape.startX <= frameRight &&
                shape.startY >= frameTop &&
                shape.startY <= frameBottom
            const endInside = 
                shape.endX >= frameLeft &&
                shape.endX <= frameRight &&
                shape.endY >= frameTop &&
                shape.endY <= frameBottom
            return startInside || endInside
        default:
            return false
    }
}

export const getShapesInsideFrame = (allShapes: Shape[], frame: FrameShape): Shape[] => {
    const shapesInFrame = allShapes.filter(
        (shape) => shape.id !== frame.id && isShapeInsideFrame(shape, frame))

    return shapesInFrame
}

const renderShapeOnCanvas = (ctx: CanvasRenderingContext2D, shape: Shape, frameX: number, frameY: number) => {
    ctx.save()

    switch (shape.type) {
        case "rect":
        case "ellipse":
        case "frame":
            const relativeX = shape.x - frameX
            const relativeY = shape.y - frameY

            if (shape.type === "rect" || shape.type === "frame") {
                ctx.strokeStyle = 
                    shape.stroke && shape.stroke !== "transparent"
                        ? shape.stroke
                        : "#ffffff"
                
                ctx.lineWidth = shape.strokeWidth || 2

                const borderRadius = shape.type === "rect" ? 8 : 0
                ctx.beginPath()
                ctx.roundRect(relativeX, relativeY, shape.w, shape.h, borderRadius)
                ctx.stroke()
            } else if (shape.type === "ellipse") {
                ctx.strokeStyle = 
                    shape.stroke && shape.stroke !== "transparent"
                        ? shape.stroke
                        : "#ffffff"
                
                ctx.lineWidth = shape.strokeWidth || 2

                ctx.beginPath()
                ctx.ellipse(
                    relativeX + shape.w / 2,
                    relativeY + shape.h / 2,
                    shape.w / 2,
                    shape.h / 2,
                    0,
                    0,
                    Math.PI * 2
                )
                ctx.stroke()
            }
            break
        case "text":
            const textRelativeX = shape.x - frameX
            const textRelativeY = shape.y - frameY

            ctx.fillStyle = shape.fill || "#ffffff"
            ctx.font = `${shape.fontSize}px ${shape.fontFamily || "Inter, sans-serif"}`
            ctx.textBaseline = "top"
            ctx.fillText(shape.text, textRelativeX, textRelativeY)
            break
        case "freedraw":
            if (shape.points.length > 1) {
                ctx.strokeStyle = shape.stroke || "ffffff"
                ctx.lineWidth = shape.strokeWidth || 2
                ctx.lineCap = "round"
                ctx.lineJoin = "round"
                ctx.beginPath()
                ctx.moveTo(shape.points[0].x - frameX, shape.points[0].y - frameY)

                for (let i = 1; i < shape.points.length; i++) {
                    ctx.lineTo(shape.points[i].x - frameX, shape.points[i].y - frameY)
                }
                ctx.stroke()
            }
            break
        case "line":
            ctx.strokeStyle = shape.stroke || "ffffff"
            ctx.lineWidth = shape.strokeWidth || 2
            ctx.beginPath()
            ctx.moveTo(shape.startX - frameX, shape.startY - frameY)
            ctx.lineTo(shape.endX - frameX, shape.endY - frameY)
            ctx.stroke()
            break
        case "arrow":
            ctx.strokeStyle = shape.stroke || "ffffff"
            ctx.lineWidth = shape.strokeWidth || 2
            ctx.beginPath()
            ctx.moveTo(shape.startX - frameX, shape.startY - frameY)
            ctx.lineTo(shape.endX - frameX, shape.endY - frameY)
            ctx.stroke()

            const headLength = 10
            const angle = Math.atan2(shape.endY - shape.startY, shape.endX - shape.startX)

            ctx.beginPath()
            ctx.moveTo(shape.endX - frameX, shape.endY - frameY)
            ctx.lineTo(
                shape.endX - frameX - headLength * Math.cos(angle - Math.PI / 6), 
                shape.endY - frameY - headLength * Math.sin(angle - Math.PI / 6)
            )
            ctx.lineTo(
                shape.endX - frameX - headLength * Math.cos(angle + Math.PI / 6), 
                shape.endY - frameY - headLength * Math.sin(angle + Math.PI / 6)
            )

            ctx.closePath()
            ctx.fill()
            break
    }

    ctx.restore()
}

export const generateFrameSnapshot = async (frame: FrameShape, allShapes: Shape[]): Promise<Blob> => {
    const shapesInFrame = getShapesInsideFrame(allShapes, frame)

    const canvas = document.createElement("canvas")
    canvas.height = frame.h
    canvas.width = frame.w

    const ctx = canvas.getContext("2d")

    if (!ctx) throw new Error("Failed to get canvas context")

    ctx.fillStyle = "#000000"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    ctx.save()
    ctx.beginPath()
    ctx.rect(0, 0, canvas.width, canvas.height)
    ctx.clip()

    shapesInFrame.forEach((shape) => {
        renderShapeOnCanvas(ctx, shape, frame.x, frame.y)
    })

    ctx.restore()

    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (blob) resolve(blob)
            else {
                reject(new Error("Failed to create image blob"))
            }
        }, 'image/png', 1.0)
    })

}

export const downloadBlob = (blob: Blob, fileName: string) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
}

export const captureVisualContent = async (ctx: CanvasRenderingContext2D, element: HTMLElement, width: number, height: number) => {
    const {toPng} = await import("html-to-image")
    const dataUrl = await toPng(element, {
        width,
        height,
        backgroundColor: "#ffffff",
        pixelRatio: 1,
        cacheBust: true,
        includeQueryParams: false,
        skipAutoScale: true,
        skipFonts: true,
        filter: (node) => {
            if (node.nodeType === Node.TEXT_NODE) return true
            if (node.nodeType === Node.ELEMENT_NODE) {
                const element = node as Element
                return ![
                    "SCRIPT",
                    "STYLE",
                    "BUTTON",
                    "INPUT",
                    "SELECT",
                    "TEXTAREA"
                ].includes(element.tagName)
            }
            return true
        }
    })

    const img = new Image()
    await new Promise((resolve, reject) => {
        img.onload = () => {
            ctx.drawImage(img, 0, 0, width, height)
            resolve(void 0)
        }
        img.onerror = () => {
            reject(new Error("Failed to load image"))
        }
        img.src = dataUrl
    })
}

export const exportGeneratedUiAsPNG = async (element: HTMLElement, filename: string) => {
    try {
        const rect = element.getBoundingClientRect()
        const canvas = document.createElement("canvas")
        canvas.width = rect.width
        canvas.height = rect.height

        const ctx = canvas.getContext("2d")
        if (!ctx) throw new Error("Failed to get canvas context")

        ctx.fillStyle = "#ffffff"
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        const contentDiv = element.querySelector(
            'div[style*="pointer-events: auto"]'
        ) as HTMLElement

        if (contentDiv) {
            await captureVisualContent(ctx, contentDiv, rect.width, rect.height)
        } else {
            throw new Error("Failed to find content div")
        }

        canvas.toBlob(
            (blob) => {
                if (blob) {
                    downloadBlob(blob, filename)
                }
            },
            "image/png",
            1.0
        )
    } catch (error) {
        const {toast} = await import("sonner")
        toast.error("Failed to export generated UI as PNG")
        console.error("Failed to export generated UI as PNG", error)
    }
}