
import {useEffect, useState} from "react";

export default function BookshelfFrame(props) {
    const dimensions = {
        left: 64,
        center: 87,
        right: 54,
    }

    const SIZE = 10
    const SPACING = 5


    const setColor = function(key, idx) {
        let f = Object.assign({}, props.frame)

        let w = f.pixels[key][0].length

        f.pixels[key][Math.floor(   idx / w)][idx % w].color = props.selectedColor

        if(props.onChange)
            props.onChange(f)
    }

    const [initFrame, _] = useState(Object.assign({}, props.frame))

    const initPixels = function(name, offsetX, offsetY, rows, columns) {
        initFrame.pixels[name] = []
        for(let y = 0; y < rows; y++) {
            initFrame.pixels[name][y] = []
            for(let x = 0; x < columns; x++) {
                initFrame.pixels[name][y][x] = {
                    color: '#000000',
                    x: offsetX + x * (SIZE + SPACING) + SPACING,
                    y: offsetY + y * (SIZE + SPACING) + SPACING + (y * SPACING * 3),
                    size: SIZE,
                }

            }
        }
    }

    useEffect(() => {
        if(!initFrame.pixels['group-1'])
            initPixels('group-1', 0, 0, 5, dimensions.left)
        if(!initFrame.pixels['group-2'])
            initPixels('group-2', ((dimensions.left + dimensions.center) * (SIZE + SPACING)), 0, 5, dimensions.right)
        if(!initFrame.pixels['group-3'])
            initPixels('group-3', (dimensions.left * (SIZE + SPACING)), (5 - 1) * (SIZE + SPACING), 1, dimensions.center)

        if(props.onChange)
            props.onChange(initFrame)
    }, [])

    return (
        <g x={props.x} y={props.y}>
            <g>
                <text fontWeight="500" fontSize="12" transform="translate(0, -3)" x={props.x} y={props.y}>{ props.frame.name }</text>
                <rect
                    width={((dimensions.left + dimensions.center + dimensions.right) * (SIZE + SPACING)) + SPACING}
                    height={5 * (SIZE + SPACING) + SPACING + ((5 - 1) * SPACING * 3)}
                    x={props.x}
                    y={props.y}
                    fill="none" stroke="red" strokeWidth="1"
                />
            </g>
            <g>
                {Object.keys(props.frame.pixels).reduce((acc, key) => {
                    return acc.concat(props.frame.pixels[key].flat().map((pixel, i) => {
                        return (<rect
                            onClick={() => setColor(key, i)}
                            key={props.index + key + i}
                            fill={pixel.color}
                            x={props.x + pixel.x}
                            y={props.y + pixel.y}
                            width={SIZE}
                            height={SIZE}
                        />)
                    }))
                }, [])}
            </g>
        </g>
    )
}