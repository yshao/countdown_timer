/**
 * Test Suite for Countdown Timer
 */

function runAllTests() {
    // Clear previous results
    document.getElementById('test-results').innerHTML = '';
    document.getElementById('test-summary').innerHTML = '';

    // Reset test framework
    test.results = { passed: 0, failed: 0, total: 0 };

    console.clear();
    console.log('🚀 Starting Test Suite...\n');

    // Run all test suites
    testStep1_ProjectStructure();

    // Print final report
    const report = test.printReport();

    // Enable/disable next step based on results
    if (report.failed === 0) {
        console.log('✅ All tests passed! Ready to proceed to next step.');
    } else {
        console.log('❌ Some tests failed. Please fix issues before proceeding.');
    }

    return report;
}

/**
 * STEP 1: Test Project Structure and Basic Setup
 */
function testStep1_ProjectStructure() {
    test.describe('Step 1: Project Structure & Testing Framework', () => {

        test.it('should have CountdownTimer class defined', () => {
            test.assert(typeof CountdownTimer === 'function', 'CountdownTimer class should exist');
        });

        test.it('should create new CountdownTimer instance', () => {
            const timer = new CountdownTimer();
            test.assertExists(timer, 'Timer instance should be created');
            test.assertEqual(typeof timer, 'object', 'Timer should be an object');
        });

        test.it('should initialize with default values', () => {
            const timer = new CountdownTimer();
            test.assertEqual(timer.totalSeconds, 0, 'totalSeconds should be 0');
            test.assertEqual(timer.remainingSeconds, 0, 'remainingSeconds should be 0');
            test.assertFalse(timer.isRunning, 'isRunning should be false');
            test.assertFalse(timer.isPaused, 'isPaused should be false');
            test.assertNull(timer.intervalId, 'intervalId should be null');
        });

        test.it('should have required methods', () => {
            const timer = new CountdownTimer();
            test.assertEqual(typeof timer.setTime, 'function', 'setTime method should exist');
            test.assertEqual(typeof timer.formatTime, 'function', 'formatTime method should exist');
            test.assertEqual(typeof timer.start, 'function', 'start method should exist');
            test.assertEqual(typeof timer.pause, 'function', 'pause method should exist');
            test.assertEqual(typeof timer.resume, 'function', 'resume method should exist');
            test.assertEqual(typeof timer.reset, 'function', 'reset method should exist');
            test.assertEqual(typeof timer.stop, 'function', 'stop method should exist');
            test.assertEqual(typeof timer.getState, 'function', 'getState method should exist');
        });

        test.it('should have callback properties', () => {
            const timer = new CountdownTimer();
            test.assertExists(timer.onTick, 'onTick callback should exist');
            test.assertExists(timer.onComplete, 'onComplete callback should exist');
            test.assertExists(timer.onAnnouncement, 'onAnnouncement callback should exist');
        });

        test.it('should return state object with correct structure', () => {
            const timer = new CountdownTimer();
            const state = timer.getState();
            test.assertExists(state, 'State should exist');
            test.assertExists(state.totalSeconds, 'State should have totalSeconds');
            test.assertExists(state.remainingSeconds, 'State should have remainingSeconds');
            test.assertExists(state.isRunning, 'State should have isRunning');
            test.assertExists(state.isPaused, 'State should have isPaused');
            test.assertExists(state.formatted, 'State should have formatted time');
        });
    });
}

// Auto-run tests on page load (optional)
// window.addEventListener('load', runAllTests);
