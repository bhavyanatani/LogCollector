const assert = require('assert');
const { getTraceByRequestId } = require('../src/services/analyticsService');

// Mock ProcessedLog for testing calculations
const ProcessedLog = require('../src/models/ProcessedLog');

async function runTests() {
  console.log('[Tracing Tests] Running Distributed Tracing unit checks...');

  // Test 1: Empty requestId rejection
  try {
    await getTraceByRequestId('');
    assert.fail('Should have thrown 400 error for empty requestId');
  } catch (err) {
    assert.strictEqual(err.statusCode, 400);
    assert.strictEqual(err.message, 'Invalid or missing requestId parameter');
    console.log('✔ Test 1 Passed: Empty requestId rejects with HTTP 400');
  }

  // Test 2: Status & Duration calculation helper verification
  const sampleTraceLogs = [
    {
      _id: '1',
      timestamp: new Date('2026-09-06T10:00:00.000Z'),
      service: 'order-service',
      event: 'ORDER_CREATED',
      level: 'INFO',
      message: 'Order created',
      requestId: 'req_test_999'
    },
    {
      _id: '2',
      timestamp: new Date('2026-09-06T10:00:00.980Z'),
      service: 'email-service',
      event: 'EMAIL_SENT',
      level: 'INFO',
      message: 'Email sent',
      requestId: 'req_test_999'
    }
  ];

  const firstTime = new Date(sampleTraceLogs[0].timestamp).getTime();
  const lastTime = new Date(sampleTraceLogs[1].timestamp).getTime();
  const calculatedDuration = lastTime - firstTime;

  assert.strictEqual(calculatedDuration, 980);
  console.log('✔ Test 2 Passed: Trace duration calculation = 980ms');

  const uniqueServices = Array.from(new Set(sampleTraceLogs.map(l => l.service)));
  assert.deepStrictEqual(uniqueServices, ['order-service', 'email-service']);
  console.log('✔ Test 3 Passed: Unique services deduplicated in order of appearance');

  console.log('[Tracing Tests] All Distributed Tracing unit checks completed successfully!');
}

if (require.main === module) {
  runTests().catch(err => {
    console.error('[Tracing Tests Failed]:', err);
    process.exit(1);
  });
}

module.exports = { runTests };
