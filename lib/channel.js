var cluster = require('cluster');
var debug = require('debug')('strong-supervisor:channel');
var master = require('strong-cluster-control');
var server = require('strong-control-channel/server').create(onRequest);

// FIXME ctrl-C the supervisor leaves runctl pipe

exports.start = start;
exports.onRequest = onRequest; // For testing

function start(options) {
  var logger = options.logger;

  server.listen(options.channel);

  server.on('error', function(er) {
    logger.error('control channel failed to listen on `%s`: %s',
                 options.channel, er);
    // XXX exit? probably, they asked, but did not get a channel
  });
  // server.on('listening', ...)


  master.on('stop', function() {
    server.close();
  });
  return server;
};

// XXX all the usual problems to check for:
//   start/stop callbacks
//   exit on failure
//   etc.

function onRequest(req, callback) {
  debug('request', req);

  var cmd = req.cmd;
  var rsp = {
  };

  if(cmd === 'status') {
    rsp = master.status();
  } else if(cmd === 'set-size') {
    try {
      master.setSize(req.size);
    } catch(er) {
      rsp.error = er.message;
    }

  } else if(cmd === 'stop') {
    try {
      master.stop();
    } catch(er) {
      rsp.error = er.message;
    }

  } else if(cmd === 'restart') {
    try {
      master.restart();
    } catch(er) {
      rsp.error = er.message;
    }

  } else if(cmd === 'disconnect') {
    cluster.disconnect();

  } else if(cmd === 'fork') {
    cluster.fork();

  } else {
    rsp.error = 'unsupported command ' + req.cmd;
  }

  if(callback) {
    process.nextTick(callback.bind(null, rsp));
  }
}