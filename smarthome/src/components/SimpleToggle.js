import {forwardRef, useEffect, useImperativeHandle, useState} from 'react'
import { Switch } from '@headlessui/react'
import dynamic from "next/dynamic";


function classNames(...classes) {
    return classes.filter(Boolean).join(' ')
}

const SimpleToggle = forwardRef((props, ref) => {
    const [enabled, setEnabled] = useState(props.value ?? false)

    const changed = function(value) {
        setEnabled(value)

        if(props.onChange)
            props.onChange(value)
    }

    useImperativeHandle(ref, () => ({
        toggle: () => {
            setEnabled(!enabled)
        }
    }));

    return (
        <Switch
            checked={enabled}
            onChange={changed}
            className={classNames(
                enabled ? (props.enableColor ?? 'bg-indigo-600') : (props.disableColor ?? 'bg-gray-200'),
                'relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
            )}
        >
            <span
                aria-hidden="true"
                className={classNames(
                    enabled ? 'translate-x-5' : 'translate-x-0',
                    'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200'
                )}
            />
        </Switch>
    )
})

SimpleToggle.displayName = 'SimpleToggle'

export default SimpleToggle
