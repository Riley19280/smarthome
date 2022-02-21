import UiInput from "@/components/UiInput";
import UiSelect from "@/components/UiSelect";
import {MODES} from "@/js/networkInterface"
import {useState} from "react";


export default function ModeSelect(props) {

    const modeOptions = Object.entries(MODES)
        .map(x => x.reverse())
        .map(x => [x[0], x[1].split('_').map(y => y.charAt(0).toUpperCase() + y.slice(1).toLowerCase()).join(' ')])
        .reduce((a, x) => {
            a[x[0]] = x[1]
            return a
        }, {})

    const myOnChange = function (input) {
        if(props.onChange)
            props.onChange({
                ...props.headers,
                ...input
            })
    }

    return (
        <div>
            <p className="font-semibold">Properties</p>
            <div className='grid grid-cols-2 gap-2'>
                <UiSelect options={modeOptions} label={'Mode'} onChange={(val) => { myOnChange({mode: val}) }}/>
                <UiInput type='color' label={'Color'} onChange={(val) => { myOnChange({color: val}) }}/>
                <UiInput type='range' min={0} max={255} label={'Brightness'} onChange={(val) => { myOnChange({brightness: val}) }}/>
                <UiInput type='range' min={1} max={255} label={'Duration'} onChange={(val) => { myOnChange({duration: val}) }}/>
                <UiInput type='range' min={1} max={255} label={'Delay'} onChange={(val) => { myOnChange({delay: val}) }}/>
            </div>
        </div>
    )


}