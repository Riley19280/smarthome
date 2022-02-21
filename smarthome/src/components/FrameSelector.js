import UiButton from "@/components/UiButton";
import UiInput from "@/components/UiInput";
import cx from "classnames";
import {ChevronDownIcon, ChevronUpIcon, DuplicateIcon, XIcon} from "@heroicons/react/outline";
import {useEffect, useState} from "react";

export default function FrameSelector(props) {

    function recalculatePositions(f) {
        let yOffset = 200
        return f.map((frame, i) => {
            frame.x = 0
            frame.y = i * yOffset
            return frame
        })
    }

    function cloneFrames() {
        return props.frames.map(x => Object.assign({}, x))
    }

    function frameNew() {
        let f = [...props.frames, {name: '', pixels: {}, x: 0, y: 0}]
        finish(f)
    }

    function frameUp(index) {
        if(index === 0)
            return

        let f = cloneFrames()

        let a = f[index - 1]
        f[index - 1] = f[index]
        f[index] = a
        finish(f)
    }

    function frameDown(index) {
        if(index === frames.length - 1)
            return

        let f = cloneFrames()

        let a = f[index + 1]
        f[index + 1] = f[index]
        f[index] = a

        finish(f)
    }

    function frameDuplicate(index) {
        let f = cloneFrames()
        let n = JSON.parse(JSON.stringify(f[index]))
        n.name += ' Copy'

        f = [...f, n]

        finish(f)
    }

    function frameRemove(index) {
        let f = cloneFrames()
        f.splice(index, 1)

        finish(f)
    }

    function frameUpdate(index, frame) {
        let f = cloneFrames()
        f[index] = frame

        finish(f)
    }

    function finish(f) {
        f = recalculatePositions(f)
        if(props.onChange)
            props.onChange(f)
    }

    return (
        <div>
            <UiButton visual="secondary" className="w-full mb-2" onClick={frameNew}>Add New</UiButton>

            {props.frames.map((frame, i) => {
                return (
                    <div key={i} className="flex gap-2 mt-1">
                        <UiInput value={frame.name} className="w-1/2" onChange={(val) => {
                            frame.name = val
                            frameUpdate(i, frame)
                        }}/>
                        <div className="w-1/2 flex justify-between items-center">
                            <button className={cx(i === 0 ? 'invisible' : '', 'hover:text-gray-500 h-6 w-6')} onClick={() => frameUp(i)}>
                                <ChevronUpIcon/>
                            </button>
                            <button className={cx( i === props.frames.length - 1 ? 'invisible' : '', 'hover:text-gray-500 h-6 w-6')} onClick={() => frameDown(i)}>
                                <ChevronDownIcon/>
                            </button>
                            <button className="hover:text-gray-500 h-6 w-6" onClick={() => frameDuplicate(i)}>
                                <DuplicateIcon/>
                            </button>
                            <button className="hover:text-red-500 h-6 w-6" onClick={() => frameRemove(i)}>
                                <XIcon/>
                            </button>
                        </div>
                    </div>
                )
            })}
        </div>
    )

}