let http = require('http');
const urlparser = require('url');
let fs = require('fs');

const CONCURRENT_CONNECTION_COUNT = 1;
const PAYLOAD_QUEUE_MAX = 1;

let connections = [];

let updateQueue = {}

function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', '*');

    // If we get our custom header, do streaming, if not, return the html file.
    if (req.headers['x-stream'] === 'polling') {
        return handleStream(req, res);
    }
    handleStatic(req, res);
}

const handleStatic = function (req, res) {
    try {
        let fnName = req.url.split('?')[0]
        fnName = fnName.replace(/^\/|\/$/g, '').replace(/\W/g, '-')

        if(req.method === 'OPTIONS') {
            res.statusCode = 200
            res.end();
            return ;
        }

        eval(`${fnName}(req, res)`)
    } catch (e) {
        console.error(e)
        res.statusCode = 500
        return res.end('Invalid Route');
    }
}

const testing = function (req, res) {
    fs.readFile('./polling.html', 'utf8', function (err, data) {
        if (err) throw err;

        // If there is no error, send the contents of the html file as the HTTP body
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.end(data);
    });
}


const update = function(req, res) {
    const {device_id} = urlparser.parse(req.url, true).query;
    const chunks = []

    connections = connections.filter(x => !x.res.writableEnded)

    req.on('data', chunk => {
        chunks.push(chunk)
    });

    req.on('end', () => {
        connections
            .filter((conn) => conn.req.headers['x-device-id'] === device_id || conn.req.headers['x-device-id'] === 'logger')
            .map(conn => {
                console.info(`sending response to ${conn.req.headers['x-device-id']}`)
                conn.res.end(Buffer.concat(chunks))
            })

        // if there are still device connections with this device id, then we did not deliver the payload
        // so we will save it for later to deliver
        if(connections.filter((conn) => !conn.res.writableEnded && conn.req.headers['x-device-id'] === device_id).length !== 0) {
            if(!updateQueue[conn.req.headers['x-device-id']])
                updateQueue[conn.req.headers['x-device-id']] = []

            updateQueue[conn.req.headers['x-device-id']].push(Buffer.concat(chunks))
            while(updateQueue[conn.req.headers['x-device-id']].length > PAYLOAD_QUEUE_MAX)
                updateQueue[conn.req.headers['x-device-id']].shift()
        }

    });

    res.end('success');
}

const favicon = (req, res) => res.end();

const handleStream = function (req, res) {
    console.log('received stream connection ' + req.socket.remoteAddress)

    let deviceConnectionCount = {}

    connections = connections.filter(x => !x.res.writableEnded)

    connections.map((conn) => {
        if(!deviceConnectionCount[conn.req.headers['x-device-id']])
            deviceConnectionCount[conn.req.headers['x-device-id']] = 1
        else
            deviceConnectionCount[conn.req.headers['x-device-id']] += 1
    })

    // TODO: Implement this check
    // console.log(deviceConnectionCount)
    // // if(deviceConnectionCount['logger'] > 5)
    // console.log(connections.map(x => x.res.socket._writableState.closed))

    // remove multiple pending connections
    for(let deviceId of Object.keys(connections)) {
        while (deviceConnectionCount[deviceId] > CONCURRENT_CONNECTION_COUNT - 1) {
            for (let conn of connections) {
                if (conn.req.headers['x-device-id'] == deviceId) {
                    console.log('ending ' + deviceId)
                    conn.res.end()
                    break;
                }
            }
        }
    }
    // clear out connections we just ended
    connections = connections.filter(x => !x.res.writableEnded)

    // If we have pending data to send to the device, then return a response immediately instead of waiting for update data
    if(updateQueue[req.headers['x-device-id']] && updateQueue[req.headers['x-device-id']].length > 0) {
        conn.res.end(updateQueue[conn.req.headers['x-device-id']].shift())
    } else {
        connections.push({req, res});
    }

}

// When input on stdin is observed, send it to each of the connected clients.
process.stdin.resume();
process.stdin.setEncoding('utf8');
process.stdin.on('data', function (data) {
    while(connections.length) {
        let {req, res} = connections.shift()
        res.writeHead(200, {'Content-Type': 'text/plain'});
        res.end(data);
    }
});

let server = http.createServer(handler);

server.listen(10000, '0.0.0.0', function () {
    console.log('Server Started!');
});