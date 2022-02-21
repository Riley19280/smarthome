import Head from 'next/head'
import UiInput from '@/components/UiInput'
import UiButton from '@/components/UiButton'
import SimpleToggle from '@/components/SimpleToggle'
import {ChevronDownIcon, ChevronUpIcon, DuplicateIcon, XIcon} from '@heroicons/react/outline'
import cx from 'classnames';
import {useEffect, useRef, useState} from "react";
import {useLocalStorage} from "@/js/useLocalStorage";
import ColorSelection from "@/components/ColorSelection";
import FrameSelector from "@/components/FrameSelector";
import BookshelfFrame from "@/components/BookshelfFrame";
import ModeSelect from "@/components/ModeSelect";
import SvgDrawing from "@/components/SvgDrawing";
import {MODES, sendFrame, sendHeaders} from "@/js/networkInterface";

const ACTION_MODE_DRAW = 'draw'
const ACTION_MODE_DRAG = 'drag'
const DRAW_MODE_BOX    = 'box'
const DRAW_MODE_CURSOR = 'cursor'

export default function Home() {

    const [actionMode,    setActionMode]    = useLocalStorage('action_mode', ACTION_MODE_DRAG)
    const [drawingMode,   setDrawingMode]   = useLocalStorage('drawing_mode', DRAW_MODE_CURSOR)
    const [selectedColor, setSelectedColor] = useLocalStorage('selected_color', '#000000')
    const [cursorSize,    setCursorSize]    = useLocalStorage('cursor_size', 25)
    const [dragging,      setDragging]      = useState(false)

    const [gMode, setGMode] = useState(MODES.LIVE_UPDATE)
    const [gBrightness, setGBrightness] = useState(128)
    const [gColor, setGColor] = useState('#000000')
    const [gDuration, setGDuration] = useState(10)
    const [gDelay, setGDelay] = useState(30)

    const [clientOnly, setClientOnly]       = useState(false)

    let [frames, setFrames] = useState([{name: 'First', pixels: {}, x: 0, y: 0}])

    function updateFrame(index, frame) {
        let f = frames.map(x => Object.assign({}, x))
        f[index] = frame
        setFrames(f);
    }

    const modeToggleRef = useRef()
    useEffect(() => setClientOnly(true))
    useEffect(() => document.addEventListener('keyup', onKeyUp))
    useEffect(() => {return () => {document.removeEventListener('keyup', onKeyUp)}})
    function onKeyUp(evt) {
        if (evt.key === 'm') {
            if(actionMode === ACTION_MODE_DRAG)
                setActionMode(ACTION_MODE_DRAW)
            else if (actionMode === ACTION_MODE_DRAW)
                setActionMode(ACTION_MODE_DRAG)
            modeToggleRef.current.toggle()
        }
    }

    return (
        <div>
            <Head>
                {/* eslint-disable-next-line @next/next/no-sync-scripts */}
                <script src="https://cdnjs.cloudflare.com/ajax/libs/d3/7.3.0/d3.js"
                    integrity="sha512-nkC97gUNsbPjaWQm5GVpreTVy9IJO+z13y1M8mM+1BJRjfp9sz+1ixWu4+1mOMUzIt72pVD9rwjxJKV8LdlvjA=="
                    crossOrigin="anonymous" referrerPolicy="no-referrer"/>
                <title>Bookshelf</title>
            </Head>

            <div className="flex justify-center gap-6 m-2">
                <div className="rounded-md bg-white shadow-md p-2">
                    <ModeSelect onChange={(val) => {
                        setGMode(val.mode)
                        setGBrightness(val.brightness)
                        setGColor(val.color)
                        setGDuration(val.duration)
                        setGDelay(val.delay)
                        sendHeaders(val)
                    }}
                    headers={{mode:gMode, brightness: gBrightness, duration: gDuration, color: gColor, delay: gDelay}}
                    />
                    <UiButton className='hidden mt-2 w-full' onClick={() => {
                        sendFrame({mode:gMode, brightness: gBrightness, duration: gDuration, color: gColor, delay: gDelay}, frames[0])
                    }}>Update</UiButton>
                </div>

                <div className="rounded-md bg-white shadow-md p-2">
                    <p className="font-semibold">Drag Mode</p>
                    <div className="flex items-center gap-2 mt-2">
                        <p>Pan & Zoom</p>
                        {clientOnly && <SimpleToggle
                            ref={modeToggleRef}
                            onChange={val => setActionMode(val ? ACTION_MODE_DRAW : ACTION_MODE_DRAG)}
                            value={actionMode === ACTION_MODE_DRAW}
                            enableColor='bg-indigo-300'
                            disableColor='bg-indigo-300'
                        />}
                        <p>Drawing</p>
                    </div>
                </div>
                <div className="rounded-md bg-white shadow-md p-2">
                    <p className="font-semibold">Selection Tool</p>
                    <div className="flex items-center gap-2 mt-2">
                        <p>Box</p>
                        {clientOnly && <SimpleToggle
                            onChange={val => setDrawingMode(val ? DRAW_MODE_CURSOR : DRAW_MODE_BOX)}
                            value={drawingMode === DRAW_MODE_CURSOR}
                            enableColor='bg-indigo-300'
                            disableColor='bg-indigo-300'
                        />}
                        <p>Cursor</p>
                    </div>
                    {drawingMode === DRAW_MODE_CURSOR &&
                     <UiInput onChange={(val) => setCursorSize(val)} value={cursorSize}
                         type="number" min="1" max="100" className='mt-2'
                     />
                    }
                </div>
                <div className="rounded-md bg-white shadow-md p-2">
                    <ColorSelection onChange={(val) => setSelectedColor(val)}/>
                </div>
                <div className="rounded-md bg-white shadow-md p-2">
                    <FrameSelector frames={frames} onChange={(val) => setFrames(val)}/>
                </div>
            </div>

            {clientOnly && <div className="p-4">
                <SvgDrawing
                    actionMode={actionMode}
                    drawingMode={drawingMode}
                    frames={frames}
                    cursorSize={cursorSize}
                    selectedColor={selectedColor}
                    headers={{mode: gMode, brightness: gBrightness, duration: gDuration, color: gColor, delay: gDelay}}
                    onChange={(fs) => setFrames(fs)}
                >
                    {frames.map((frame, i) => {
                        return <BookshelfFrame
                            key={i}
                            index={i}
                            selectedColor={selectedColor}
                            frame={frame}
                            x={frame.x}
                            y={frame.y}
                            onChange={(frame) => updateFrame(frame, i)}
                        />
                    })}
                </SvgDrawing>
            </div>}
        </div>
    )
}
