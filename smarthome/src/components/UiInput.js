import cx from "classnames";

export default function UiInput(props) {
    return (
        <div className={props.className}>
            <div className="flex justify-between">
                <label className="block text-sm font-medium text-gray-700">
                    {props.label}
                </label>
                <span className="text-sm text-gray-500">
                    {props.hint}
                </span>
            </div>
            <div className={cx(props.label || props.hint ? 'mt-2' : '')}>
                <input
                    value={props.value}
                    disabled={props.disabled}
                    type={props.type ?? 'text'}
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    placeholder={props.placeholder}
                    onChange={(evt) => props.onChange ? props.onChange(evt.target.value) : ''}
                    min={props.min}
                    max={props.max}
                    step={props.step}
                />
            </div>
        </div>
    )
}
