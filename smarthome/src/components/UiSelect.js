export default function UiSelect(props) {
    return (
        <div>
            {props.label && <label className="block text-sm font-medium text-gray-700 mb-1">
                {props.label}
            </label>}
            <select
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                defaultValue={props.default}
                onChange={(evt) => props.onChange ? props.onChange(evt.target.value) : ''}
            >
                {Array.isArray(props.options) && props.options.map((o, i) =>
                    (<option key={i}>{o}</option>)
                )}

                {!Array.isArray(props.options) && Object.entries(props.options).map(([k, v], i) => {
                    return (<option key={i} value={k}>{v}</option>)
                }
                )}

            </select>
        </div>
    )
}