export default function UiButton(props) {
    const classes = {
        'primary':          'items-center px-4 py-2 bg-gray-800 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-gray-700 active:bg-brand-800 focus:outline-none focus:ring focus:ring-brand-800 focus:ring-offset-2 transition ease-in-out duration-150 ',
        'secondary':        'items-center px-4 py-2 bg-white border border-gray-300 rounded-md font-semibold text-xs text-gray-700 uppercase tracking-widest shadow-sm hover:text-gray-500 focus:outline-none focus:border-blue-300 focus:shadow-outline-blue active:text-gray-800 active:bg-gray-50 transition ease-in-out duration-150 ',
        'danger':           'items-center px-4 py-2 bg-red-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-red-500 focus:outline-none focus:border-red-700 focus:shadow-outline-red active:bg-red-600 transition ease-in-out duration-150 ',
        'danger-secondary': 'items-center px-4 py-2 border border-red-300 rounded-md shadow-sm uppercase font-semibold text-xs tracking-widest text-red-500 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 ',
        'link':             'text-brand-600 hover:text-brand-900 text-center ',
    }

    const CustomComponent = props.href ? 'a' : 'button'

    const getType = function () {
        if(props.href)
            return null
        return props.type ?? 'button'
    }

    const getClasses = function(key) {
        let cls = classes[key] + props.className ?? '';

        if(CustomComponent === 'a')
            cls += ' inline-flex'
        return cls
    }

    return (
        <CustomComponent type={getType()} className={getClasses(props.visual ?? 'primary')} onClick={() => props.onClick ? props.onClick() : null}>
            {props.children}
        </CustomComponent>
    )
}