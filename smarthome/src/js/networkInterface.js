import * as serializer from "@/js/payloadSerializer"
import {createHeader} from "@/js/payloadSerializer";

let iotac = 0
function iota(reset=false) {
    return iotac++
}


export const MODES = {
    DEFAULT:     iota(),
    STATIC:      iota(),
    SAVE_LAST:   iota(),
    LIVE_UPDATE: iota(),
    RANDOM:      iota(),
    PONG:        iota(),
    MATRIX:      iota(),
    RAINBOW:     iota(),
    RANDOM_MODE: iota(),
}

function send(bytes) {
    let xhr = new XMLHttpRequest();

    let params = (new URLSearchParams({
        device_id: 'bookshelf-esp8266'
    })).toString()

    if(params !== '')
        params = '?' + params

    xhr.open('POST', window.location.protocol + '//' +window.location.hostname + ':10000/update' + params);
    xhr.setRequestHeader('Content-Type', 'application/octet-stream');
    xhr.setRequestHeader('Access-Control-Allow-Origin', '*');
    xhr.send(bytes);

}

export function sendFrame(headers, frame) {

    let payload = serializer.bookshelfFrameSerializer(frame)

    let header = createHeader(headers.mode, headers.brightness, headers.color, headers.duration, headers.delay, payload.length)

    let bytesArray = new Uint8Array([...header, ...payload]);

    send(bytesArray)
}

export function sendHeaders(headers) {

    let header = createHeader(headers.mode, headers.brightness, headers.color, headers.duration, headers.delay, 0)

    let bytesArray = new Uint8Array(header);
    send(bytesArray)
}