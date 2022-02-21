import {useLocalStorage} from "@/js/useLocalStorage";
import {color} from "tailwindcss/lib/util/dataTypes";
import UiButton from "@/components/UiButton";
import UiInput from "@/components/UiInput";
import cx from "classnames";

export default function ColorSelection(props) {
    const [colors, setColors] = useLocalStorage('color_history', [])
    const [selectedColor, setSelectedColor] = useLocalStorage('selected_color', '#FFFFFF')

    const changeColor = function(val) {
        setSelectedColor(val)
        if(props.onChange)
            props.onChange(val)
    }

    return (
        <div>
            <div className="flex items-center gap-2">
                <p className="font-semibold">Color</p>
                <UiInput value={selectedColor} onChange={val => changeColor(val)}
                    className="flex-1 min-w-[50px]" type="color"/>
                <UiButton onClick={() => {
                    colors.unshift(selectedColor)
                    setColors(colors.slice(0, 10))
                }} visual="secondary">Save</UiButton>
            </div>
            <div className="flex gap-2 mt-2" suppressHydrationWarning={true}>
                {colors.map((color, i) => {
                    return (<button key={i} style={{backgroundColor: color}} className={cx("h-6 w-6 cursor-pointer")} >&nbsp;</button>)
                })}
            </div>
        </div>
    )
}