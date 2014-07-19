// test sl-runctl start/stop object tracking
var helper = require('./helper');

if (helper.skip()) return;

var rc = helper.runCtl;
var supervise = rc.supervise;
var expect = rc.expect;
var failon = rc.failon;
var waiton = rc.waiton;

var APP = require.resolve('./module-app');

// Cause metrics to be emitted 30 times faster, so we don't have to
// wait minutes for object metrics.
process.env.STRONGAGENT_INTERVAL_MULTIPLIER = 30;

helper.statsd(function(statsd) {
  var url = util.format('statsd://:%d', statsd.port);
  var run = supervise(APP, ['--metrics', url]);

  // supervisor should exit with 0 after we stop it
  run.on('exit', function(code, signal) {
    assert.equal(code, 0);
  });


  cd(path.dirname(APP));

  waiton('', /worker count: 0/);
  expect('set-size 1');
  waiton('status', /worker count: 1/);
  expect('status', /worker id 1:/);

  expect('start-tracking-objects 0');
  expect('start-tracking-objects 1');
  failon('start-tracking-objects 6', /6 not found/);

  console.log('Waiting for stats...');

  statsd.waitfor(/object.*count:/, function() {
    statsd.close();

    expect('stop-tracking-objects 0');
    expect('stop-tracking-objects 1');
    failon('stop-tracking-objects 6', /6 not found/);

    expect('stop');

    helper.pass = true;
  });
});
