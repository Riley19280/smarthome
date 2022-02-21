import {MODES} from "@/js/networkInterface"

const toUint8 = function(val) {
    if(Array.isArray(val)){
        return val.map(x => toUint8(x))
    } else {
        return val & 0xFF
    }
}

const toUint16 = function (val) {
    if(Array.isArray(val)){
        return val.map(x => toUint16(x))
    } else {
        return [((val >> 8) & 0xFF), (val & 0xFF)]
    }
}

const padTo = function(arr, len) {
    while(arr.length !== 16)
        arr.push(0)
    return arr
}

const hexToGRB = function(hex) {
    let c = hexToRGB(hex)
    return [c[1],c[0],c[2]];
}

const hexToBRG = function(hex) {
    let c = hexToRGB(hex)
    return [c[2], c[0], c[1]];
}

const hexToRGB = function(hex) {
    if(hex[0] === '#')
        hex = hex.substr(1)
    let bigint = parseInt(hex, 16);
    let r = (bigint >> 16) & 255;
    let g = (bigint >> 8) & 255;
    let b = bigint & 255;

    return [r,g,b];
}

export function bookshelfFrameSerializer(frame) {

    let data = []

    { // Handle group 1
        let reg = frame.pixels['group-1']

        // Parse from bottom right to top left

        for(let y = reg.length - 1; y >= 0; y--) {
            let row = []
            for(let x = 0; x < reg[0].length; x++) {
                row.push(hexToRGB(reg[y][x].color))
            }
            if(y % 2 === 0)
                data.push(...row.reverse().flat())
            else
                data.push(...row.flat().flat())
        }
    }

    { // Handle Group 2
        let reg = frame.pixels['group-2']

        for(let y = reg.length - 1; y >= 0; y--) {
            let row = []
            for(let x = 0; x < reg[0].length; x++) {
                row.push(hexToRGB(reg[y][x].color))
            }
            if(y % 2 === 0)
                data.push(...row.flat())
            else
                data.push(...row.reverse().flat())
        }
    }

    { // Handle Group 3
        let reg = frame.pixels['group-3']

        for(let y = 0; y < reg.length; y++) {
            for(let x = 0; x < reg[0].length; x++) {
                data.push(...hexToRGB(reg[y][x].color).flat())
            }
        }
    }


    return data
}


export function createHeader(mode, brightness, color, duration, delay, size) {
    return padTo([toUint8(mode), toUint8(brightness), ...toUint8(hexToGRB(color)), ...toUint16(duration), ...toUint16(size), toUint8(delay)], 16)
}


