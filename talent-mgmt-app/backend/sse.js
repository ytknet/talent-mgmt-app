// simple SSE broadcaster
const clients = [];

function registerClient(res) {
  // res is the express response
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive'
  });
  res.write('\n');
  clients.push(res);
  // remove when closed
  reqOnClose(res);
}

function reqOnClose(res) {
  res.on('close', () => {
    const idx = clients.indexOf(res);
    if (idx !== -1) clients.splice(idx, 1);
  });
}

function broadcast(event, data) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  clients.forEach((res) => res.write(payload));
}

module.exports = { registerClient, broadcast };