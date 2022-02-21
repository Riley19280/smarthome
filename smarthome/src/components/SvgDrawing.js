import BookshelfFrame from "@/components/BookshelfFrame";
import cx from "classnames";
import {useEffect, useRef, useState} from "react";
import {sendFrame} from "@/js/networkInterface";



const ACTION_MODE_DRAW = 'draw'
const ACTION_MODE_DRAG = 'drag'
const DRAW_MODE_BOX    = 'box'
const DRAW_MODE_CURSOR = 'cursor'


function parseTransform(a) {
    let b = {};
    for (let i in a = a.match(/(\w+)\(([^,)]+),?([^)]+)?\)/gi)) {
        let c = a[i].match(/[\w\.\-]+/g);
        b[c.shift()] = c.length > 1 ? c.map(x => isNaN(parseFloat(x)) ? x : parseFloat(x)) : isNaN(parseFloat(c)) ? c : parseFloat(c);
    }
    return b;
}

function unscaleEvent(evt, svgPosition, transform) {
    evt = evt.nativeEvent
    return [
        (evt.x - svgPosition.x - transform.translate[0]) / transform.scale,
        (evt.y - svgPosition.y - transform.translate[1]) / transform.scale
    ]
}

export default function SvgDrawing(props) {


    const zoomGroup   = useRef()
    const svg         = useRef()
    const [dragFrame, setDragFrame]     = useState({x: 0, y: 0, width: 1, height: 1})
    const [cursorFrame, setCursorFrame] = useState({cx: 0, cy: 0, r: 1})

    const [dragStartPos, setDragStartPos] = useState({})
    const [isDragging, setIsDragging] = useState(false)

    let d3Zoom;
    if (typeof window !== 'undefined') {
        d3Zoom = d3.zoom().on('zoom', (e) => d3.select('#svg g').attr('transform', e.transform))
    }
    useEffect(() => {
        if (props.actionMode === ACTION_MODE_DRAG) {
            d3.select('#svg').call(d3Zoom)
        } else {
            d3.select('#svg').on('.zoom', null)
        }
    }, [props.actionMode, d3Zoom])

    //--------------------------------------------------------------//

    const handleMouseDown = function (evt) {
        if (props.actionMode === ACTION_MODE_DRAW) {
            setIsDragging(true)

            let transform = parseTransform(zoomGroup.current.getAttribute('transform'))
            let svgPos = svg.current.getBoundingClientRect()

            const [svgX, svgY] = unscaleEvent(evt, svgPos, transform)

            if (props.drawingMode === DRAW_MODE_CURSOR) {
                doCursorDraw(svgX, svgY, props.cursorSize)
            } else {
                setDragStartPos({x: svgX, y: svgY})

                setDragFrame({
                    x: svgX,
                    y: svgY,
                    width: 1,
                    height: 1,
                })
            }
        }
    }

    const handleMouseMove = function(evt) {
        if (props.actionMode === ACTION_MODE_DRAW) {
            let transform = parseTransform(zoomGroup.current.getAttribute('transform'))
            let svgPos = svg.current.getBoundingClientRect()

            const [svgX, svgY] = unscaleEvent(evt, svgPos, transform)

            if (props.drawingMode === DRAW_MODE_CURSOR) {
                setCursorFrame({
                    cx: svgX,
                    cy: svgY,
                    r:  props.cursorSize,
                })

                if (isDragging) {
                    doCursorDraw(svgX, svgY, props.cursorSize)
                }
            } else {
                if (isDragging) {
                    let newX, newY;
                    if (svgX - dragStartPos.x < 0 && svgY - dragStartPos.y < 0) {
                        newX = svgX
                        newY = svgY
                    } else if (svgX - dragStartPos.x < 0) {
                        newX = dragStartPos.x - Math.abs(dragStartPos.x - svgX)
                        newY = dragStartPos.y
                    } else if (svgY - dragStartPos.y < 0) {
                        newX = dragStartPos.x
                        newY = dragStartPos.y - Math.abs(dragStartPos.y - svgY)
                    } else {
                        newX = dragStartPos.x
                        newY = dragStartPos.y
                    }

                    setDragFrame({
                        x: newX,
                        y: newY,
                        width: Math.abs(dragStartPos.x - svgX),
                        height: Math.abs(dragStartPos.y - svgY),
                    })
                }
            }
        }
    }

    const handleMouseUp = function(evt) {
        if (!isDragging)
            return
        setIsDragging(false)

        let svgPos = svg.current.getBoundingClientRect()
        let transform = parseTransform(zoomGroup.current.getAttribute('transform'))

        const [svgX, svgY] = unscaleEvent(evt, svgPos, transform)

        let selectable = []

        if (props.drawingMode === DRAW_MODE_BOX) {
            let boundingRect;

            let width = Math.abs(dragStartPos.x - svgX)
            let height = Math.abs(dragStartPos.y - svgY)

            if (svgX - dragStartPos.x < 0 && svgY - dragStartPos.y < 0) {
                boundingRect = [
                    svgX,
                    svgY,
                    dragStartPos.x,
                    dragStartPos.y,
                ]
            } else if (svgX - dragStartPos.x < 0) {
                boundingRect = [
                    dragStartPos.x - width,
                    dragStartPos.y,
                    svgX + width,
                    svgY,
                ]
            } else if (svgY - dragStartPos.y < 0) {
                boundingRect = [
                    dragStartPos.x,
                    dragStartPos.y - height,
                    svgX,
                    svgY + height,
                ]
            } else {
                boundingRect = [
                    dragStartPos.x,
                    dragStartPos.y,
                    svgX,
                    svgY,
                ]
            }

            let fs = [...props.frames]
            fs.map(frame => {
                Object.keys(frame.pixels).map(key => {
                    frame.pixels[key].flat().map(pixel => {
                        if ((pixel.x + pixel.size / 2) > boundingRect[0] && (pixel.x + pixel.size / 2) < boundingRect[2] && (pixel.y + pixel.size / 2) > boundingRect[1] && (pixel.y + pixel.size / 2) < boundingRect[3]) {
                            pixel.color = props.selectedColor
                        }
                    })
                })
            })

            if(props.onChange)
                props.onChange(fs)
        }

        if(props.actionMode === ACTION_MODE_DRAW)
            sendFrame(props.headers, props.frames[0])
    }

    const handleMouseOut = function(evt) {
        if (!isDragging)
            return;
        let svgPos = svg.current.getBoundingClientRect()

        evt = evt.nativeEvent
        if (!(evt.x > svgPos.x && evt.y > svgPos.y && evt.x < svgPos.x + svgPos.width && evt.y < svgPos.y + svgPos.height)) {
            setIsDragging(false)
        }
    }

    const doCursorDraw = function(cx, cy, rx) {
        let fs = [...props.frames]
        fs.map(frame => {
            Object.keys(frame.pixels).map(key => {
                frame.pixels[key].flat().map(pixel => {
                    if (((pixel.x + frame.x - cx + (pixel.size / 2)) ** 2) + ((pixel.y + frame.y - cy + (pixel.size / 2)) ** 2) < rx ** 2) {
                        pixel.color = props.selectedColor
                    }
                })
            })
        })

        if(props.onChange)
            props.onChange(fs)
    }

    return (
        <svg id="svg" ref={svg} className="w-full border border-black h-64" style={{height: 600}}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseOut={handleMouseOut}
        >
            <g id="zoomGroup" ref={zoomGroup} transform='translate(0,0) scale(1)'>
                {props.children}
                <g>
                    <circle id="cursorFrame" className={cx(props.actionMode === ACTION_MODE_DRAW && props.drawingMode === DRAW_MODE_CURSOR ? 'block' : 'hidden')}
                        cx={cursorFrame.cx}
                        cy={cursorFrame.cy}
                        r={cursorFrame.r}
                        fill="none"
                        stroke="#000000"
                    />
                    <rect id="dragFrame" className={cx((props.actionMode === ACTION_MODE_DRAW) && (props.drawingMode === DRAW_MODE_BOX) && isDragging ? 'block' : 'hidden')}
                        x={dragFrame.x}
                        y={dragFrame.y}
                        width={dragFrame.width}
                        height={dragFrame.height}
                        fill="none"
                        stroke="#000000"
                    />
                </g>
            </g>
        </svg>
    )
}