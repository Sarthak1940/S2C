"use client"
import { downloadBlob, exportGeneratedUiAsPNG, generateFrameSnapshot } from "@/lib/frame-snapshot";
import { useGenerateWorkflowMutation } from "@/redux/api/generation";
import { addErrorMessage, addUserMessage, clearChat, finishStreamingResponse, initializeChat, startStreamingResponse, updateStreamingContent } from "@/redux/slice/chat";
import { FrameShape, Shape, Tool, addArrow, addEllipse, addFrame, addFreeDrawShape, addGeneratedUI, addLine, addRect, addText, clearSelection, removeShape, selectShape, setTool, updateShape } from "@/redux/slice/shapes";
import { Point, handToolDisable, handToolEnable, panEnd, panMove, panStart, screenToWorld, wheelPan, wheelZoom } from "@/redux/slice/viewport";
import { useAppDispatch, useAppSelector } from "@/redux/store"
import { nanoid } from "@reduxjs/toolkit";
import React, { PointerEventHandler, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface TouchPointer {
    id: number
    p: Point
}

interface DraftShape {
    type: "frame" | "rect" | "line" | "ellipse" | "arrow"
    startWorld: Point
    currentWorld: Point
}

const RAF_INTERVAL_MS = 8

export const useInfinityCanvas = () => {
    const dispatch = useAppDispatch();
    const viewport = useAppSelector(state => state.viewport)
    const entityState = useAppSelector(state => state.shapes.shapes)

    const shapeList: Shape[] = entityState.ids
                            .map((id: string) => entityState.entities[id])
                            .filter((s: Shape | undefined): s is Shape => Boolean(s))

    const currentTool = useAppSelector(state => state.shapes.tool);
    const selectedShapes = useAppSelector(state => state.shapes.selected)

    const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false)
    const shapeEntities = useAppSelector(state => state.shapes.shapes.entities) 

    const hasSelectedText = Object.keys(selectedShapes).some((id) => {
        const shape = shapeEntities[id];
        return shape?.type === "text";
    })

    useEffect(() => {
        if (hasSelectedText && !isSidebarOpen) {
            setIsSidebarOpen(true);
        } else if (!hasSelectedText) {
            setIsSidebarOpen(false);
        }
    }, [hasSelectedText, isSidebarOpen])


    const canvasRef = useRef<HTMLDivElement | null>(null);
    const touchMapRef = useRef<Map<number, TouchPointer>>(new Map());

    const draftShapeRef = useRef<DraftShape | null>(null);
    const freeDrawPointsRef = useRef<Point[]>([]);
    const isSpacePressed = useRef(false);
    const isDrawingRef = useRef(false);
    const isMovingRef = useRef(false);
    const moveStartRef = useRef<Point | null>(null);

    const initialShapePositionsRef = useRef<
    Record<string, {
        x?: number
        y?: number
        points?: Point[]
        startX?: number
        startY?: number
        endX?: number
        endY?: number
    }>
    >({})

    const isErasingRef = useRef(false)
    const erasedShapesRef = useRef<Set<string>>(new Set())
    const isResizingRef = useRef(false)
    const resizeDataRef = useRef<{
        shapeId: string
        corner: string
        initialBounds: {x: number, y: number, w: number, h: number}
        startPoint: {x: number, y: number}
    } | null>(null)

    const lastFreehandFrameRef = useRef(0)
    const freehandRafRef = useRef<number | null>(null)
    const panRafRef = useRef<number | null>(null)
    const pendingPanPointRef = useRef<Point | null>(null)

    // force re-render the screen
    const [, force] = useState(0)
    const requestRender = (): void => force(prev => (prev + 1) | 0)

    const localPointFromClient = (clientX: number, clientY: number): Point => {
        const el = canvasRef.current;
        if (!el) return {x: clientX, y: clientY}

        const r = el.getBoundingClientRect();
        return {x: clientX - r.left, y: clientY - r.top}
    }

    const blurActiveTextInput = () => {
        const activeElement = document.activeElement;
        if (activeElement && activeElement.tagName === "INPUT") {
            (activeElement as HTMLInputElement).blur()
        }
    }

    type WithClientXY = {clientX: number, clientY: number}
    const getLocalPointFromPtr = (e: WithClientXY): Point => localPointFromClient(e.clientX, e.clientY)

    const getShapeAtPoint = (worldPoint: Point): Shape | null => {
        for (let i = shapeList.length - 1; i >= 0; i--) {
            const shape = shapeList[i]
            if (isPointInShape(worldPoint, shape)) {
                return shape;
            }
        }
        return null
    }

    const isPointInShape = (point: Point, shape: Shape): boolean => {
        switch (shape.type) {
            case "frame":
            case "rect":
            case "generatedui":
            case "ellipse":
                return (
                    point.x >= shape.x &&
                    point.x <= shape.x + shape.w &&
                    point.y >= shape.y &&
                    point.y <= shape.y + shape.h
                )
            case "freedraw":
                const threshold = 5
                for (let i = 0; i < shape.points.length - 1; i++) {
                    const p1 = shape.points[i]
                    const p2 = shape.points[i + 1]

                    if (distanceToLineSegment(point, p1, p2) < threshold) {
                        return true;
                    }
                }
                return false;
            case "arrow":
            case "line":
                const lineThreshold = 8;
                return (
                    distanceToLineSegment(
                        point, 
                        {x: shape.startX, y: shape.startY},
                        {x: shape.endX, y: shape.endY}
                    ) <= lineThreshold
                )
            case "text":
                const textWidth = Math.max(
                    shape.text.length * (shape.fontSize * 0.6),
                    100
                )

                const textHeight = shape.fontSize * 1.2
                const padding = 8

                return (
                    point.x >= shape.x - 2 &&
                    point.x <= shape.x + textWidth + padding + 2 &&
                    point.y >= shape.y - 2 &&
                    point.y <= shape.y + textHeight + padding + 2
                )
            default:
                return false
        }
    }

    const distanceToLineSegment = (point: Point, lineStart: Point, lineEnd: Point): number => {
        const A = point.x - lineStart.x
        const B = point.y - lineStart.y
        const C = lineEnd.x - lineStart.x
        const D = lineEnd.y - lineStart.y

        const dot = A * C + B * D
        const lenSquare = C * C + D * D
        let param = -1
        if (lenSquare !== 0) param = dot / lenSquare

        let xx, yy
        if (param < 0) {
            xx = lineStart.x
            yy = lineStart.y
        } else if (param > 1) {
            xx = lineEnd.x
            yy = lineEnd.y
        } else {
            xx = lineStart.x + param * C
            yy = lineStart.y + param * D
        }

        const dx = point.x - xx
        const dy = point.y - yy
        return Math.sqrt(dx * dx + dy * dy)
    }

    const schedulePanMove = (p: Point) => {
        pendingPanPointRef.current = p
        if (panRafRef.current != null) return
        
        panRafRef.current = window.requestAnimationFrame(() => {
            panRafRef.current = null;
            const next = pendingPanPointRef.current;
            if (next) dispatch(panMove(next));
        })
    }

    const freeHandTickRef = useRef<() => void>(null!)
    
    useEffect(() => {
        freeHandTickRef.current = () => {
            const now = typeof performance !== 'undefined' ? performance.now() : Date.now()

            if (now - lastFreehandFrameRef.current >= RAF_INTERVAL_MS) {
                if (freeDrawPointsRef.current.length > 0) requestRender()
                lastFreehandFrameRef.current = now
            }

            if (isDrawingRef.current) {
                freehandRafRef.current = window.requestAnimationFrame(freeHandTickRef.current)
            }
        }
    }, [])

    const onWheel = (e: WheelEvent) => {
        e.preventDefault()
        const originScreen = localPointFromClient(e.clientX, e.clientY);

        if (e.ctrlKey || e.metaKey) {
            dispatch(wheelZoom({deltaY: e.deltaY, originScreen}))
        } else {
            const dx = e.shiftKey ? e.deltaY : e.deltaX
            const dy = e.shiftKey ? e.deltaX : e.deltaY
            dispatch(wheelPan({dx: -dx, dy: -dy}))
        }
    }

    const onPointerDown: PointerEventHandler<HTMLDivElement> = (e) => {
        const target = e.target as HTMLElement;
        const isButton = 
            target.tagName === "BUTTON" || 
            target.closest("button") ||
            target.classList.contains("pointer-events-auto") || 
            target.closest(".pointer-events-auto")

        if (!isButton) {
            e.preventDefault()
        } else {
            return // don't handle canvas interaction when clicked on interactive elements
        }

        const local = getLocalPointFromPtr(e.nativeEvent);
        const world = screenToWorld(local, viewport.translate, viewport.scale);

        if (touchMapRef.current.size <= 1) {
            canvasRef.current?.setPointerCapture(e.pointerId)
            const isPanButton = e.button === 1 || e.button === 2
            const panByShift = isSpacePressed.current && e.button === 0

            if (isPanButton || panByShift) {
                const mode = isSpacePressed.current ? "shiftPanning" : "panning"
                dispatch(panStart({screen: local, mode}))
                return
            }

            if (e.button === 0) {
                if (currentTool === "select") {
                    const hitShape = getShapeAtPoint(world)

                    if (hitShape) {
                        const isAlreadySelected = selectedShapes[hitShape.id]
                        if (!isAlreadySelected) {
                            if (!e.shiftKey) dispatch(clearSelection());
                            dispatch(selectShape(hitShape.id))
                        }
                        isMovingRef.current = true
                        moveStartRef.current = world;

                        initialShapePositionsRef.current = {}
                        Object.keys(selectedShapes).forEach((id) => {
                            const shape = entityState.entities[id]
                            if (shape) {
                                if (
                                    shape.type === "frame" ||
                                    shape.type === "rect" ||
                                    shape.type === "ellipse" ||
                                    shape.type === "generatedui"
                                ) {
                                    initialShapePositionsRef.current[id] = {
                                        x: shape.x,
                                        y: shape.y,
                                    }
                                } else if (shape.type === "freedraw") {
                                    initialShapePositionsRef.current[id] = {
                                        points: [...shape.points]
                                    }
                                } else if (shape.type === "arrow" || shape.type === "line") {
                                    initialShapePositionsRef.current[id] = {
                                        startX: shape.startX,
                                        startY: shape.startY,
                                        endX: shape.endX,
                                        endY: shape.endY
                                    }
                                } else if (shape.type === "text") {
                                    initialShapePositionsRef.current[id] = {
                                        x: shape.x,
                                        y: shape.y,
                                    }
                                }
                            }
                        })

                        if (
                            hitShape.type === "frame" ||
                            hitShape.type === "rect" ||
                            hitShape.type === "ellipse" ||
                            hitShape.type === "generatedui"
                        ) {
                            initialShapePositionsRef.current[hitShape.id] = {
                                x: hitShape.x,
                                y: hitShape.y,
                            }
                        } else if (hitShape.type === "freedraw") {
                            initialShapePositionsRef.current[hitShape.id] = {
                                points: [...hitShape.points]
                            }
                        } else if (hitShape.type === "arrow" || hitShape.type === "line") {
                            initialShapePositionsRef.current[hitShape.id] = {
                                startX: hitShape.startX,
                                startY: hitShape.startY,
                                endX: hitShape.endX,
                                endY: hitShape.endY
                            }
                        } else if (hitShape.type === "text") {
                            initialShapePositionsRef.current[hitShape.id] = {
                                x: hitShape.x,
                                y: hitShape.y,
                            }
                        }
                    } else {
                        // clicked on empty space
                        if (!e.shiftKey) {
                            dispatch(clearSelection())
                            blurActiveTextInput()
                        }
                    }
                } else if (currentTool === "eraser") {
                    isErasingRef.current = true
                    erasedShapesRef.current.clear();

                    const hitShape = getShapeAtPoint(world);
                    if (hitShape) {
                        dispatch(removeShape(hitShape.id))
                        erasedShapesRef.current.add(hitShape.id)
                    } else {
                        blurActiveTextInput()
                    }
                } else if (currentTool === "text") {
                    dispatch(addText({x: world.x, y: world.y}))
                    dispatch(setTool("select"))
                } else {
                    isDrawingRef.current = true;
                    if (
                        currentTool === "frame" ||
                        currentTool === "rect" ||
                        currentTool === "ellipse" || 
                        currentTool === "arrow" ||
                        currentTool === "line"
                    ) {
                        draftShapeRef.current = {
                            type: currentTool,
                            startWorld: world,
                            currentWorld: world
                        }
                        requestRender()
                    } else if (currentTool === "freedraw") {
                        freeDrawPointsRef.current = [world]
                        lastFreehandFrameRef.current = performance.now()
                        freehandRafRef.current = window.requestAnimationFrame(freeHandTickRef.current)

                        requestRender()
                    }
                }
            }
        }
        
    }

    const onPointerMove: PointerEventHandler<HTMLDivElement> = (e) => {
        const local = getLocalPointFromPtr(e.nativeEvent)
        const world = screenToWorld(local, viewport.translate, viewport.scale)

        if (viewport.mode === "panning" || viewport.mode === "shiftPanning") {
            schedulePanMove(local)
            return;
        }

        if (isErasingRef.current && currentTool === "eraser") {
            const hitShape = getShapeAtPoint(world);
            if (hitShape && !erasedShapesRef.current.has(hitShape.id)) {
                dispatch(removeShape(hitShape.id))
                erasedShapesRef.current.add(hitShape.id)
            }
        }

        if (isMovingRef.current && moveStartRef.current && currentTool === "select") {
            const deltaX = world.x - moveStartRef.current.x
            const deltaY = world.y - moveStartRef.current.y

            Object.keys(initialShapePositionsRef.current).forEach((id) => {
                const initialPos = initialShapePositionsRef.current[id];
                const shape = entityState.entities[id];

                if (!shape || !initialPos) return;

                if (
                    shape.type === "frame" ||
                    shape.type === "rect" ||
                    shape.type === "ellipse" ||
                    shape.type === "text" ||
                    shape.type === "generatedui"
                ) {
                    if (typeof initialPos.x === "number" && typeof initialPos.y === "number") {
                        dispatch(updateShape({
                            id, patch: {
                                x: initialPos.x + deltaX,
                                y: initialPos.y + deltaY
                            }
                        }))
                    }
                } else if (shape.type === "freedraw") {
                    const initialPoints = initialPos.points;
                    if (initialPoints) {
                        const newPoints = initialPoints.map(point => ({
                            x: point.x + deltaX,
                            y: point.y + deltaY
                        }))
                        dispatch(updateShape({
                            id, patch: {
                                points: newPoints
                            }
                        }))
                    }
                } else if (shape.type === "line" || shape.type === "arrow") {
                    if (typeof initialPos.startX === "number" && 
                        typeof initialPos.startY === "number" && 
                        typeof initialPos.endX === "number" && 
                        typeof initialPos.endY === "number") {

                        dispatch(updateShape({
                            id, patch: {
                                startX: initialPos.startX + deltaX,
                                startY: initialPos.startY + deltaY,
                                endX: initialPos.endX + deltaX,
                                endY: initialPos.endY + deltaY
                            }
                        }))
                    }
                }
            })
        }

        if (isDrawingRef.current) {
            if (draftShapeRef.current) {
                draftShapeRef.current.currentWorld = world;
                requestRender();
            } else if (currentTool === "freedraw") {
                freeDrawPointsRef.current.push(world);
            }
        }
    }

    const finalizeDrawingIfAny = (): void => {
        if (!isDrawingRef.current) return;

        isDrawingRef.current = false

        if (freehandRafRef.current) {
            window.cancelAnimationFrame(freehandRafRef.current)
            freehandRafRef.current = null
        }

        const draft = draftShapeRef.current;
        if (draft) {
            const x = Math.min(draft.startWorld.x, draft.currentWorld.x);
            const y = Math.min(draft.startWorld.y, draft.currentWorld.y);
            const w = Math.abs(draft.startWorld.x - draft.currentWorld.x);
            const h = Math.abs(draft.startWorld.y - draft.currentWorld.y);

            if (w > 1 && h > 1) {
                if (draft.type === "frame") {
                    dispatch(addFrame({x, y, w, h}))
                } else if (draft.type === "rect") {
                    dispatch(addRect({x, y, w, h}))
                } else if (draft.type === "ellipse") {
                    dispatch(addEllipse({x, y, w, h}))
                } else if (draft.type === "arrow") {
                    dispatch(addArrow({
                        startX: draft.startWorld.x,
                        startY: draft.startWorld.y,
                        endX: draft.currentWorld.x,
                        endY: draft.currentWorld.y
                    }))
                } else if (draft.type === "line") {
                    dispatch(addLine({
                        startX: draft.startWorld.x,
                        startY: draft.startWorld.y,
                        endX: draft.currentWorld.x,
                        endY: draft.currentWorld.y
                    }))
                }
            }
            draftShapeRef.current = null;
        } else if (currentTool === "freedraw") {
            const pts = freeDrawPointsRef.current;
            if (pts.length > 1) dispatch(addFreeDrawShape({points: pts}))
            freeDrawPointsRef.current = [];
        }

        requestRender()
    }

    const onPointerUp: PointerEventHandler<HTMLDivElement> = (e) => {
        canvasRef.current?.releasePointerCapture(e.pointerId)

        if (viewport.mode === "panning" || viewport.mode === "shiftPanning") {
            dispatch(panEnd())
        }

        if (isMovingRef.current) {
            isMovingRef.current = false
            moveStartRef.current = null
            initialShapePositionsRef.current = {}
        }

        if (isErasingRef.current) {
            isErasingRef.current = false
            erasedShapesRef.current.clear()
        }

        finalizeDrawingIfAny()
    }

    const onPointerCancel: PointerEventHandler<HTMLDivElement> = (e) => {
        onPointerUp(e)
    }

    const onKeyDown = (e: KeyboardEvent): void => {
        if ((e.code === "ShiftLeft" || e.code === "ShiftRight") && !e.repeat) {
            e.preventDefault()
            isSpacePressed.current = true
            dispatch(handToolEnable())
        }
    }

    const onKeyUp = (e: KeyboardEvent): void => {
        if ((e.code === "ShiftLeft" || e.code === "ShiftRight") && !e.repeat) {
            e.preventDefault()
            isSpacePressed.current = false
            dispatch(handToolDisable())
        }
    }


    useEffect(() => {
        document.addEventListener("keydown", onKeyDown)
        document.addEventListener("keyup", onKeyUp)

        return () => {
            document.removeEventListener("keydown", onKeyDown)
            document.removeEventListener("keyup", onKeyUp)

            if (freehandRafRef.current) window.cancelAnimationFrame(freehandRafRef.current)
            if (panRafRef.current) window.cancelAnimationFrame(panRafRef.current)
        }
    }, [])

    useEffect(() => {
        const handleResizeStart = (e: CustomEvent) => {
            const {shapeId, corner, bounds} = e.detail
            isResizingRef.current = true
            resizeDataRef.current = {
                shapeId,
                corner,
                initialBounds: bounds,
                startPoint: {x: e.detail.clientX || 0, y: e.detail.clientY || 0}
            }
        }

        const handleResizeMove = (e: CustomEvent) => {
            if (!isResizingRef.current || !resizeDataRef.current) return

            const {shapeId, corner, initialBounds} = resizeDataRef.current
            const {clientX, clientY} = e.detail

            const canvasEl = canvasRef.current
            if (!canvasEl) return

            const rect = canvasEl.getBoundingClientRect()
            const localX = clientX - rect.left
            const localY = clientY - rect.top

            const world = screenToWorld({x: localX, y: localY}, viewport.translate, viewport.scale)

            const shape = entityState.entities[shapeId]
            if (!shape) return

            const newBounds = { ...initialBounds }

            switch (corner) {
                case "nw":
                    newBounds.w = Math.max(
                        10,
                        initialBounds.w + (initialBounds.x - world.x)
                    )

                    newBounds.h = Math.max(
                        10,
                        initialBounds.h + (initialBounds.y - world.y)
                    )

                    newBounds.x = world.x
                    newBounds.y = world.y
                    break;
                case "ne":
                    newBounds.w = Math.max(
                        10,
                        world.x - initialBounds.x
                    )

                    newBounds.h = Math.max(
                        10,
                        initialBounds.h + (initialBounds.y - world.y)
                    )

                    newBounds.y = world.y
                    break;
                case "sw" :
                    newBounds.w = Math.max(
                        10,
                        initialBounds.w + (initialBounds.x - world.x)
                    )

                    newBounds.h = Math.max(
                        10,
                        world.y - initialBounds.y
                    )

                    newBounds.x = world.x
                    break;
                case "se" :
                    newBounds.w = Math.max(
                        10,
                        world.x - initialBounds.x
                    )

                    newBounds.h = Math.max(
                        10,
                        world.y - initialBounds.y
                    )

                    break;
            }

            if (
                shape.type === "rect" || 
                shape.type === "frame" ||
                shape.type === "ellipse"
            ) {
                dispatch(updateShape({
                    id: shapeId,
                    patch: {
                        x: newBounds.x,
                        y: newBounds.y,
                        w: newBounds.w,
                        h: newBounds.h
                    }
                }))
            } else if (shape.type === "freedraw") {
                const xs = shape.points.map((p: Point) => p.x)
                const ys = shape.points.map((p: Point) => p.y)
                const actualMinX = Math.min(...xs)
                const actualMinY = Math.min(...ys)
                const actualMaxX = Math.max(...xs)
                const actualMaxY = Math.max(...ys)
                const actualWidth = actualMaxX - actualMinX
                const actualHeight = actualMaxY - actualMinY

                const newActualX = newBounds.x + 5
                const newActualY = newBounds.y + 5
                const newActualWidth = Math.max(10, newBounds.w - 10)
                const newActualHeight = Math.max(10, newBounds.h - 10)

                const scaleX = actualWidth > 0 ? newActualWidth / actualWidth : 1
                const scaleY = actualHeight > 0 ? newActualHeight / actualHeight : 1
                
                const scaledPoints = shape.points.map((p: Point) => ({
                    x: (p.x - actualMinX) * scaleX + newActualX,
                    y: (p.y - actualMinY) * scaleY + newActualY
                }))

                dispatch(updateShape({
                    id: shapeId,
                    patch: {
                        points: scaledPoints
                    }
                }))
            } else if (shape.type === "line" || shape.type === "arrow") {
                const actualMinX = Math.min(shape.startX, shape.endX)
                const actualMinY = Math.min(shape.startY, shape.endY)
                const actualMaxX = Math.max(shape.startX, shape.endX)
                const actualMaxY = Math.max(shape.startY, shape.endY)
                const actualWidth = actualMaxX - actualMinX
                const actualHeight = actualMaxY - actualMinY

                const newActualX = newBounds.x + 5
                const newActualY = newBounds.y + 5
                const newActualWidth = Math.max(10, newBounds.w - 10)
                const newActualHeight = Math.max(10, newBounds.h - 10)

                let newStartX, newStartY, newEndX, newEndY

                if (actualWidth === 0) {
                    newStartX = newActualX + newActualWidth / 2
                    newEndX = newActualX + newActualWidth / 2

                    newStartY = 
                        shape.startY < shape.endY ? 
                        newActualY : 
                        newActualY + newActualHeight
                    
                    newEndY = 
                        shape.startY < shape.endY ? 
                        newActualY + newActualHeight : 
                        newActualY
                } else if (actualHeight === 0) {
                    newStartY = newActualY + newActualHeight / 2
                    newEndY = newActualY + newActualHeight / 2

                    newStartX = 
                        shape.startX < shape.endX ? 
                        newActualX : 
                        newActualX + newActualWidth
                    
                    newEndX = 
                        shape.startX < shape.endX ? 
                        newActualX + newActualWidth : 
                        newActualX
                } else {
                    const scaleX = newActualWidth / actualWidth
                    const scaleY = newActualHeight / actualHeight

                    newStartX = newActualX + (shape.startX - actualMinX) * scaleX
                    newStartY = newActualY + (shape.startY - actualMinY) * scaleY
                    newEndX = newActualX + (shape.endX - actualMinX) * scaleX
                    newEndY = newActualY + (shape.endY - actualMinY) * scaleY
                }

                dispatch(updateShape({
                    id: shapeId,
                    patch: {
                        startX: newStartX,
                        startY: newStartY,
                        endX: newEndX,
                        endY: newEndY
                    }
                }))
            }

        }

        const handleResizeEnd = () => {
            isResizingRef.current = false
            resizeDataRef.current = null
        }

        window.addEventListener(
            "shape-resize-start",
            handleResizeStart as EventListener
        )

        window.addEventListener(
            "shape-resize-move",
            handleResizeMove as EventListener
        )

        window.addEventListener(
            "shape-resize-end",
            handleResizeEnd as EventListener
        )

        return () => {
            window.removeEventListener(
                "shape-resize-start",
                handleResizeStart as EventListener
            )

            window.removeEventListener(
                "shape-resize-move",
                handleResizeMove as EventListener
            )

            window.removeEventListener(
                "shape-resize-end",
                handleResizeEnd as EventListener
            )
        }

    }, [dispatch, entityState.entities, viewport.translate, viewport.scale])

    const attachCanvasRef = (ref: HTMLDivElement | null): void => {
        if (canvasRef.current) {
            canvasRef.current.removeEventListener("wheel", onWheel)
        }

        canvasRef.current = ref

        if (ref) {
            ref.addEventListener("wheel", onWheel, {passive: false})
        }
    }

    const selectTool = (tool: Tool): void => {
        dispatch(setTool(tool))
    }

    const getDraftShape = (): DraftShape | null => draftShapeRef.current
    const getFreeDrawPoints = (): ReadonlyArray<Point> => freeDrawPointsRef.current

    return {
        viewport,
        shapes: shapeList,
        currentTool,
        selectedShapes,

        onPointerDown,
        onPointerMove,
        onPointerUp,
        onPointerCancel,
        
        attachCanvasRef,
        selectTool,
        getDraftShape,
        getFreeDrawPoints,
        isSidebarOpen,
        hasSelectedText,
        setIsSidebarOpen
        
    }
}


export const useFrame = (shape: FrameShape) => {
    const dispatch = useAppDispatch()
    const [isGenerating, setIsGenerating] = useState<boolean>(false)

    const allShapes = useAppSelector((state) => 
        Object.values(state.shapes.shapes?.entities || {}).filter(
            (shape): shape is Shape => shape !== undefined
        )
    )

    const handleGenerateDesign = async () => {
        try {
            setIsGenerating(true)
            const snapshot = await generateFrameSnapshot(shape, allShapes)

            downloadBlob(snapshot, `frame-${shape.frameNumber}-snapshot.png`)

            const formData = new FormData()
            formData.append("image", snapshot, `frame-${shape.frameNumber}-snapshot.png`)
            formData.append("frameNumber", shape.frameNumber.toString())
            
            const urlParams = new URLSearchParams(window.location.search)
            const projectId = urlParams.get("project")

            if (projectId) {
                formData.append("projectId", projectId)
            }

            const response = await fetch("/api/generate", {
                method: "POST",
                body: formData
            })

            if (!response.ok) {
                throw new Error("Failed to generate design")
            }

            const generatedUIPosition = {
                x: shape.x + shape.w + 50,
                y: shape.y,
                w: Math.max(400, shape.w),
                h: Math.max(300, shape.h)
            }

            const generatedUUID = nanoid()

            dispatch(addGeneratedUI({
                ...generatedUIPosition,
                id: generatedUUID,
                uiSpecData: null,
                sourceFrameId: shape.id   
            }))

            const reader = response.body?.getReader()
            const decoder = new TextDecoder("utf-8")
            let accumulatedMarkup = ""

            let lastUpdateTime = 0
            const UPDATE_THROTTLE_MS = 200

            if (reader) {
                try {
                    while (true) {
                        const {done, value} = await reader.read()
                        if (done) {
                            dispatch(updateShape({
                                id: generatedUUID,
                                patch: {
                                    uiSpecData: accumulatedMarkup
                                }
                            }))
                            break;
                        }

                        const chunk = decoder.decode(value, {stream: true})
                        accumulatedMarkup += chunk

                        const now = Date.now()
                        if (now - lastUpdateTime >= UPDATE_THROTTLE_MS) {
                            dispatch(updateShape({
                                id: generatedUUID,
                                patch: {
                                    uiSpecData: accumulatedMarkup
                                }
                            }))
                            lastUpdateTime = now
                        } 
                    }
                } finally {
                    reader.releaseLock()
                }
            }

        } catch (error) {
            console.error("Failed to generate frame snapshot:", error)
        } finally {
            setIsGenerating(false)
        }
    }

    return {isGenerating, handleGenerateDesign}
}

export const useInspiration = () => {
    const [isInspirationOpen, setIsInspirationOpen] = useState<boolean>(false)

    const toggleInspiration = () => {
        setIsInspirationOpen(!isInspirationOpen)
    }

    const closeInspiration = () => {
        setIsInspirationOpen(false)
    }

    const openInspiration = () => {
        setIsInspirationOpen(true)
    }

    return {isInspirationOpen, toggleInspiration, closeInspiration, openInspiration}
}

export const useWorkflowGeneration = () => {
    const dispatch = useAppDispatch()

    const [, {isLoading: isGeneratingWorkflow}] = useGenerateWorkflowMutation()

    const allShapes = useAppSelector(state => 
        Object.values(state.shapes.shapes?.entities || {}).filter(
            (shape): shape is Shape => shape !== undefined
        )
    )

    const generateWorkflow = async (generatedUUID: string) => {
        try {
            const currentShape = allShapes.find(shape => shape.id === generatedUUID)

            if (!currentShape || currentShape.type !== "generatedui") {
                toast.error("generated ui not found")
                return
            }

            if (!currentShape.uiSpecData) {
                toast.error("generated ui data not found")
                return
            }

            const urlParams = new URLSearchParams(window.location.search)
            const projectId = urlParams.get("project")

            if (!projectId) {
                toast.error("project id not found")
                return
            }

            const pageCount = 4
            toast.loading("Generating workflow pages...", {
                id: "workflow-generation"
            })

            const baseX = currentShape.x + currentShape.w + 100
            const spacing = Math.max(450, currentShape.w + 50)
            
            const workflowPromises = Array.from({length: pageCount}).map(
            async (_, index) => {
                try {
                    const response = await fetch("/api/generate/workflow", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            generatedUUID,
                            currentHTML: currentShape.uiSpecData,
                            projectId,
                            pageIndex: index
                        })
                    })

                    if (!response.ok) {
                        throw new Error("Failed to generate workflow")
                    }

                    const workflowPosition = {
                        x: baseX + spacing * index,
                        y: currentShape.y,
                        w: Math.max(450, currentShape.w),
                        h: Math.max(300, currentShape.h)
                    }

                    const workflowId = nanoid()

                    dispatch(addGeneratedUI({
                        ...workflowPosition,
                        id: workflowId,
                        uiSpecData: null,
                        sourceFrameId: currentShape.sourceFrameId,
                        isWorkflowPage: true
                    }))

                    const reader = response.body?.getReader()
                    const decoder = new TextDecoder("utf-8")
                    let accumulatedMarkup = ""

                    if (reader) {
                        try {
                            while (true) {
                                const {done, value} = await reader.read()
                                if (done) break

                                const chunk = decoder.decode(value, {stream: true})
                                accumulatedMarkup += chunk

                                dispatch(updateShape({
                                    id: workflowId,
                                    patch: {
                                        uiSpecData: accumulatedMarkup
                                    }
                                }))
                            }
                        } finally {
                            reader.releaseLock()
                        }
                    }
                    
                   return {pageIndex: index, success: true}
                } catch (error) {
                    console.error("Failed to generate workflow page", error)
                    return {pageIndex: index, success: false, error}
                }
            }
            )

            const results = await Promise.all(workflowPromises)
            const successCount = results.filter(result => result.success).length
            const failureCount = results.length - successCount

            if (successCount === 4) {
                toast.success("All 4 Workflow pages generated successfully", {id: "workflow-generation"})
            } else if (successCount > 0) {
                toast.success(`${successCount}/4 Workflow pages generated successfully`, {id: "workflow-generation"})

                if (failureCount > 0) {
                    toast.error(`${failureCount}/4 Workflow pages failed to generate`, {id: "workflow-generation"})
                }
            } else {
                toast.error("Failed to generate workflow pages", {id: "workflow-generation"})
            } 
        } catch (error) {
            console.error("Failed to generate workflow pages", error)
            toast.error("Failed to generate workflow pages", {id: "workflow-generation"})
        }
    }

    return {generateWorkflow, isGeneratingWorkflow}
}

export const useGlobalChat = () => {
    const [isChatOpen, setIsChatOpen] = useState(false)
    const [activeGeneratedUUID, setActiveGeneratedUUID] = useState<string | null>(null)
    const {generateWorkflow} = useWorkflowGeneration()

    const exportDesign = async (generatedUUID: string, element: HTMLElement | null) => {
        if (!element) {
            toast.error("No design element found for export")
            return
        }

        try {
            const filename = `generated-ui-${generatedUUID.slice(0, 8)}.png`
            await exportGeneratedUiAsPNG(element, filename)
            toast.success("Design exported successfully")
        } catch (error) {
            console.error("Failed to export design", error)
            toast.error("Failed to export design")
        }
    }

    const openChat = (generatedUUID: string) => {
        setActiveGeneratedUUID(generatedUUID)
        setIsChatOpen(true)
    }

    const closeChat = () => {
        setIsChatOpen(false)
        setActiveGeneratedUUID(null)
    }

    const toggleChat = (generatedUUID: string) => {
        if (isChatOpen && activeGeneratedUUID === generatedUUID) {
            closeChat()
        } else {
            openChat(generatedUUID)
        }
    }

    return {
        isChatOpen,
        activeGeneratedUUID,
        generateWorkflow,
        toggleChat,
        openChat,
        closeChat,
        exportDesign
    }
}

export const useChatWindow = (generatedUUID: string, isOpen: boolean) => {
    const [inputValue, setInputValue] = useState("")
    const scrollAreaRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    const dispatch = useAppDispatch()

    const chatState = useAppSelector(state => state.chat.chats[generatedUUID])
    const currentShape = useAppSelector(
        state => state.shapes.shapes.entities[generatedUUID]
    )

    const allShapes = useAppSelector(
        state => state.shapes.shapes.entities
    )

    const getSourceFrame = (): FrameShape | null => {
        if (!currentShape || currentShape.type !== "generatedui") return null

        const sourceFrameId = currentShape.sourceFrameId
        if (!sourceFrameId) return null

        const sourceFrame = allShapes[sourceFrameId]
        if (!sourceFrame || sourceFrame.type !== "frame") return null

        return sourceFrame as FrameShape
    }

    useEffect(() => {
        if (isOpen) {
            dispatch(initializeChat(generatedUUID))
        }
    }, [dispatch, isOpen, generatedUUID])

    useEffect(() => {
        if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
        }
    }, [chatState?.messages])

    useEffect(() => {
        if (isOpen && inputRef.current) {
            setTimeout(() => inputRef.current?.focus(), 100)
        }
    }, [isOpen])

    const handleSendMessage = async () => {
        if (!inputValue.trim() || chatState?.isStreaming) return

        const message = inputValue.trim()
        setInputValue("")

        try {
            dispatch(addUserMessage({
                generatedUUID,
                content: message
            }))

            const responseId = `response-${Date.now()}`
            dispatch(startStreamingResponse({
                generatedUUID,
                messageId: responseId
            }))

            const isWorkflowPage = 
                currentShape?.type === "generatedui" && currentShape?.isWorkflowPage

            const searchParams = new URLSearchParams(window.location.search)
            const projectId = searchParams.get("projectId")

            if (!projectId) {
                throw new Error("Project ID not found")
            }

            const baseRequestData = {
                userMessage: message,
                generatedUUID: generatedUUID,
                currentHTML: currentShape?.type === "generatedui" ? currentShape.uiSpecData : null,
                projectId
            }

            let apiEndpoint = '/api/generate/redesign'
            let wireframeSnapshot: string | null = null

            if (isWorkflowPage) {
                apiEndpoint = '/api/generate/workflow-redesign'
            } else {
                const sourceFrame = getSourceFrame()
                if (sourceFrame && sourceFrame.type === "frame") {
                    try {
                        const allShapesArray = Object.values(allShapes).filter(Boolean) as Shape[]

                        const snapshot = await generateFrameSnapshot(sourceFrame, allShapesArray)

                        const arrayBuffer = await snapshot.arrayBuffer()
                        const uint8Array = new Uint8Array(arrayBuffer)
                        const base64 = btoa(String.fromCharCode(...uint8Array))
                        wireframeSnapshot = base64
                        
                    } catch (error) {
                        console.error("Failed to generate wireframe snapshot", error)
                    }
                } else {
                    console.warn("Source frame not found")
                }
            }

            const requestData = isWorkflowPage ? baseRequestData : {
                ...baseRequestData,
                wireframeSnapshot
            }

            const response = await fetch(apiEndpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(requestData)
            })

            if (!response.ok) {
                throw new Error("Failed to generate redesign")
            }

            const reader = response.body?.getReader()
            const decoder = new TextDecoder("utf-8")
            let accumulatedHTML = ""

            if (reader) {
                while (true) {
                    const {done, value} = await reader.read()
                    if (done) break

                    const chunk = decoder.decode(value, {stream: true})
                    accumulatedHTML += chunk

                    dispatch(updateStreamingContent({
                        generatedUUID,
                        messageId: responseId,
                        content: "Regenerating your design..."
                    }))

                    dispatch(updateShape({
                        id: generatedUUID,
                        patch: {uiSpecData: accumulatedHTML}
                    }))

                }
            }

            dispatch(finishStreamingResponse({
                generatedUUID,
                messageId: responseId,
                finalContent: "Design regenerated successfully!"
            }))
 
        } catch (error) {
            console.error("Failed to regenerate design", error)
            dispatch(addErrorMessage({
                generatedUUID,
                error: error instanceof Error ? error.message : "Failed to regenerate design"
            }))
            toast.error("Failed to regenerate design")
        }
    }

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            handleSendMessage()
        }
    }

    const handleClearChat = () => {
        dispatch(clearChat(generatedUUID))
    }

    return {
        inputValue,
        setInputValue,
        scrollAreaRef,
        inputRef,
        handleSendMessage,
        handleKeyPress,
        handleClearChat,
        chatState
    }
}