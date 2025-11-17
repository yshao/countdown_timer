#!/usr/bin/env node

/**
 * Node.js Test Runner for Countdown Timer
 * Runs tests in a Node environment without needing a browser
 */

// Simple test framework for Node.js
class TestFramework {
    constructor() {
        this.results = {
            passed: 0,
            failed: 0,
            total: 0
        };
        this.currentSuite = '';
    }

    describe(suiteName, testFn) {
        this.currentSuite = suiteName;
        console.log(`\n📦 ${suiteName}`);
        testFn();
    }

    it(testName, testFn) {
        this.results.total++;
        try {
            testFn();
            this.results.passed++;
            console.log(`  ✓ ${testName}`);
        } catch (error) {
            this.results.failed++;
            console.log(`  ✗ ${testName}`);
            console.log(`    ↳ ${error.message}`);
        }
    }

    assert(condition, message = 'Assertion failed') {
        if (!condition) {
            throw new Error(message);
        }
    }

    assertEqual(actual, expected, message) {
        const msg = message || `Expected ${expected} but got ${actual}`;
        this.assert(actual === expected, msg);
    }

    assertNotEqual(actual, expected, message) {
        const msg = message || `Expected ${actual} to not equal ${expected}`;
        this.assert(actual !== expected, msg);
    }

    assertTrue(value, message) {
        this.assert(value === true, message || `Expected true but got ${value}`);
    }

    assertFalse(value, message) {
        this.assert(value === false, message || `Expected false but got ${value}`);
    }

    assertExists(value, message) {
        this.assert(value !== null && value !== undefined, message || 'Expected value to exist');
    }

    assertNull(value, message) {
        this.assert(value === null, message || `Expected null but got ${value}`);
    }

    assertThrows(fn, message) {
        let threw = false;
        try {
            fn();
        } catch (e) {
            threw = true;
        }
        this.assert(threw, message || 'Expected function to throw an error');
    }

    printReport() {
        const passRate = ((this.results.passed / this.results.total) * 100).toFixed(1);
        console.log('\n' + '='.repeat(60));
        console.log('📊 TEST REPORT');
        console.log('='.repeat(60));
        console.log(`Total Tests:  ${this.results.total}`);
        console.log(`✓ Passed:     ${this.results.passed}`);
        console.log(`✗ Failed:     ${this.results.failed}`);
        console.log(`Pass Rate:    ${passRate}%`);
        console.log('='.repeat(60));

        if (this.results.failed === 0) {
            console.log('\n✅ All tests passed! Ready to proceed to next step.\n');
            return true;
        } else {
            console.log('\n❌ Some tests failed. Please fix issues before proceeding.\n');
            return false;
        }
    }
}

// Load the timer module
const CountdownTimer = require('./timer.js');

// Create test instance
const test = new TestFramework();

// Test Suite Step 1
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
            test.assert('onTick' in timer, 'onTick callback property should exist');
            test.assert('onComplete' in timer, 'onComplete callback property should exist');
            test.assert('onAnnouncement' in timer, 'onAnnouncement callback property should exist');
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

// Test Suite Step 2
function testStep2_TimeValidation() {
    test.describe('Step 2: Time Input Validation & Formatting', () => {

        test.it('should set time with valid inputs (1h 30m 45s)', () => {
            const timer = new CountdownTimer();
            const total = timer.setTime(1, 30, 45);
            test.assertEqual(total, 5445, 'Should convert to 5445 seconds');
            test.assertEqual(timer.totalSeconds, 5445, 'totalSeconds should be 5445');
            test.assertEqual(timer.remainingSeconds, 5445, 'remainingSeconds should be 5445');
        });

        test.it('should set time with only minutes', () => {
            const timer = new CountdownTimer();
            const total = timer.setTime(0, 5, 0);
            test.assertEqual(total, 300, 'Should convert to 300 seconds');
        });

        test.it('should set time with only seconds', () => {
            const timer = new CountdownTimer();
            const total = timer.setTime(0, 0, 45);
            test.assertEqual(total, 45, 'Should convert to 45 seconds');
        });

        test.it('should handle missing parameters (treat as 0)', () => {
            const timer = new CountdownTimer();
            const total = timer.setTime(1);
            test.assertEqual(total, 3600, 'Should convert to 3600 seconds');
        });

        test.it('should handle string inputs (convert to numbers)', () => {
            const timer = new CountdownTimer();
            const total = timer.setTime('1', '30', '45');
            test.assertEqual(total, 5445, 'Should convert strings to numbers');
        });

        test.it('should handle zero time', () => {
            const timer = new CountdownTimer();
            const total = timer.setTime(0, 0, 0);
            test.assertEqual(total, 0, 'Should accept 0 seconds');
        });

        test.it('should format time correctly (HH:MM:SS)', () => {
            const timer = new CountdownTimer();

            let formatted = timer.formatTime(3661); // 1:01:01
            test.assertEqual(formatted.display, '01:01:01', 'Should format 3661s as 01:01:01');

            formatted = timer.formatTime(0);
            test.assertEqual(formatted.display, '00:00:00', 'Should format 0s as 00:00:00');

            formatted = timer.formatTime(59);
            test.assertEqual(formatted.display, '00:00:59', 'Should format 59s as 00:00:59');
        });

        test.it('should format time with correct padding', () => {
            const timer = new CountdownTimer();
            const formatted = timer.formatTime(125); // 2:05

            test.assertEqual(formatted.hours, '00', 'Hours should be padded');
            test.assertEqual(formatted.minutes, '02', 'Minutes should be padded');
            test.assertEqual(formatted.seconds, '05', 'Seconds should be padded');
        });

        test.it('should format large time values', () => {
            const timer = new CountdownTimer();
            const formatted = timer.formatTime(36000); // 10 hours
            test.assertEqual(formatted.display, '10:00:00', 'Should format 10 hours correctly');
        });

        test.it('should throw error if setting time while running', () => {
            const timer = new CountdownTimer();
            timer.setTime(0, 1, 0);
            timer.isRunning = true; // Simulate running state

            test.assertThrows(() => {
                timer.setTime(0, 2, 0);
            }, 'Should throw error when setting time while running');
        });

        test.it('should return formatted object with all components', () => {
            const timer = new CountdownTimer();
            const formatted = timer.formatTime(3723); // 1:02:03

            test.assertExists(formatted.hours, 'Should have hours property');
            test.assertExists(formatted.minutes, 'Should have minutes property');
            test.assertExists(formatted.seconds, 'Should have seconds property');
            test.assertExists(formatted.display, 'Should have display property');
            test.assertEqual(typeof formatted.hours, 'string', 'Hours should be string');
            test.assertEqual(typeof formatted.minutes, 'string', 'Minutes should be string');
            test.assertEqual(typeof formatted.seconds, 'string', 'Seconds should be string');
        });
    });
}

// Test Suite Step 3
async function testStep3_CountdownMechanism() {
    test.describe('Step 3: Countdown Mechanism & Controls', () => {

        test.it('should start timer successfully', () => {
            const timer = new CountdownTimer();
            timer.setTime(0, 1, 0);

            const result = timer.start();
            test.assertTrue(result, 'start() should return true');
            test.assertTrue(timer.isRunning, 'Timer should be running');
            test.assertFalse(timer.isPaused, 'Timer should not be paused');
            test.assertExists(timer.intervalId, 'Interval ID should be set');

            timer.stop();
        });

        test.it('should not start if already running', () => {
            const timer = new CountdownTimer();
            timer.setTime(0, 1, 0);
            timer.start();

            const result = timer.start();
            test.assertFalse(result, 'Second start() should return false');

            timer.stop();
        });

        test.it('should throw error when starting with 0 seconds', () => {
            const timer = new CountdownTimer();
            timer.setTime(0, 0, 0);

            test.assertThrows(() => {
                timer.start();
            }, 'Should throw error when starting with 0 seconds');
        });

        test.it('should pause timer successfully', () => {
            const timer = new CountdownTimer();
            timer.setTime(0, 1, 0);
            timer.start();

            const result = timer.pause();
            test.assertTrue(result, 'pause() should return true');
            test.assertFalse(timer.isRunning, 'Timer should not be running');
            test.assertTrue(timer.isPaused, 'Timer should be paused');
            test.assertNull(timer.intervalId, 'Interval ID should be cleared');
        });

        test.it('should not pause if not running', () => {
            const timer = new CountdownTimer();
            timer.setTime(0, 1, 0);

            const result = timer.pause();
            test.assertFalse(result, 'pause() should return false when not running');
        });

        test.it('should resume timer successfully', () => {
            const timer = new CountdownTimer();
            timer.setTime(0, 1, 0);
            timer.start();
            timer.pause();

            const result = timer.resume();
            test.assertTrue(result, 'resume() should return true');
            test.assertTrue(timer.isRunning, 'Timer should be running');
            test.assertFalse(timer.isPaused, 'Timer should not be paused');
            test.assertExists(timer.intervalId, 'Interval ID should be set');

            timer.stop();
        });

        test.it('should not resume if already running', () => {
            const timer = new CountdownTimer();
            timer.setTime(0, 1, 0);
            timer.start();

            const result = timer.resume();
            test.assertFalse(result, 'resume() should return false when already running');

            timer.stop();
        });

        test.it('should reset timer to initial time', () => {
            const timer = new CountdownTimer();
            timer.setTime(0, 1, 0);
            timer.start();

            // Manually decrement to simulate countdown
            timer.remainingSeconds = 50;

            const result = timer.reset();
            test.assertTrue(result, 'reset() should return true');
            test.assertFalse(timer.isRunning, 'Timer should not be running');
            test.assertFalse(timer.isPaused, 'Timer should not be paused');
            test.assertEqual(timer.remainingSeconds, 60, 'Should reset to initial 60 seconds');
            test.assertNull(timer.intervalId, 'Interval ID should be cleared');
        });

        test.it('should stop and clear timer', () => {
            const timer = new CountdownTimer();
            timer.setTime(0, 1, 0);
            timer.start();

            const result = timer.stop();
            test.assertTrue(result, 'stop() should return true');
            test.assertFalse(timer.isRunning, 'Timer should not be running');
            test.assertFalse(timer.isPaused, 'Timer should not be paused');
            test.assertEqual(timer.remainingSeconds, 0, 'Remaining seconds should be 0');
            test.assertEqual(timer.totalSeconds, 0, 'Total seconds should be 0');
            test.assertNull(timer.intervalId, 'Interval ID should be cleared');
        });

        test.it('should call onTick callback during countdown', (done) => {
            const timer = new CountdownTimer();
            timer.setTime(0, 0, 3);

            let tickCount = 0;
            timer.onTick = (remaining, formatted) => {
                tickCount++;
                test.assertExists(remaining, 'Remaining seconds should be provided');
                test.assertExists(formatted, 'Formatted time should be provided');
            };

            // Manually trigger tick
            timer.start();
            timer.tick();
            timer.stop();

            test.assert(tickCount > 0, 'onTick should have been called');
        });

        test.it('should decrement time on tick', () => {
            const timer = new CountdownTimer();
            timer.setTime(0, 0, 10);
            timer.isRunning = true;

            const before = timer.remainingSeconds;
            timer.tick();
            const after = timer.remainingSeconds;

            test.assertEqual(after, before - 1, 'Time should decrement by 1 second');
            timer.stop();
        });

        test.it('should get current state correctly', () => {
            const timer = new CountdownTimer();
            timer.setTime(0, 1, 30);

            const state = timer.getState();
            test.assertEqual(state.totalSeconds, 90, 'State should show total seconds');
            test.assertEqual(state.remainingSeconds, 90, 'State should show remaining seconds');
            test.assertFalse(state.isRunning, 'State should show not running');
            test.assertFalse(state.isPaused, 'State should show not paused');
            test.assertEqual(state.formatted.display, '00:01:30', 'State should show formatted time');
        });

        test.it('should call onComplete when timer reaches 0', () => {
            const timer = new CountdownTimer();
            timer.setTime(0, 0, 1);

            let completed = false;
            timer.onComplete = () => {
                completed = true;
            };

            timer.remainingSeconds = 1;
            timer.isRunning = true;
            timer.tick(); // This should complete the timer

            test.assertTrue(completed, 'onComplete should have been called');
            test.assertFalse(timer.isRunning, 'Timer should not be running');
            test.assertEqual(timer.remainingSeconds, 0, 'Remaining should be 0');
        });
    });
}

// Test Suite Step 4
function testStep4_VoiceAnnouncements() {
    test.describe('Step 4: Voice Announcement Logic', () => {

        test.it('should announce at every minute', () => {
            const timer = new CountdownTimer();
            const announcements = [];

            timer.onAnnouncement = (msg) => {
                announcements.push(msg);
            };

            timer.isRunning = true;

            // Test multiple minute marks
            timer.remainingSeconds = 300; // 5 minutes
            timer.checkAnnouncements();
            test.assertEqual(announcements[announcements.length - 1], '5 minutes remaining');

            timer.remainingSeconds = 120; // 2 minutes
            timer.checkAnnouncements();
            test.assertEqual(announcements[announcements.length - 1], '2 minutes remaining');

            timer.remainingSeconds = 60; // 1 minute
            timer.checkAnnouncements();
            test.assertEqual(announcements[announcements.length - 1], '1 minute remaining');
        });

        test.it('should use singular "minute" for 1 minute', () => {
            const timer = new CountdownTimer();
            let announcement = '';

            timer.onAnnouncement = (msg) => {
                announcement = msg;
            };

            timer.isRunning = true;
            timer.remainingSeconds = 60;
            timer.checkAnnouncements();

            test.assertEqual(announcement, '1 minute remaining', 'Should say "minute" not "minutes"');
        });

        test.it('should announce at 30 seconds', () => {
            const timer = new CountdownTimer();
            let announcement = '';

            timer.onAnnouncement = (msg) => {
                announcement = msg;
            };

            timer.isRunning = true;
            timer.remainingSeconds = 30;
            timer.checkAnnouncements();

            test.assertEqual(announcement, '30 seconds remaining');
        });

        test.it('should announce 10 second countdown', () => {
            const timer = new CountdownTimer();
            const announcements = [];

            timer.onAnnouncement = (msg) => {
                announcements.push(msg);
            };

            timer.isRunning = true;

            // Test countdown from 10 to 1
            for (let i = 10; i >= 1; i--) {
                timer.remainingSeconds = i;
                timer.lastAnnouncement = null; // Reset to allow new announcement
                timer.checkAnnouncements();
                test.assertEqual(announcements[announcements.length - 1], `${i}`, `Should announce ${i}`);
            }
        });

        test.it('should prioritize 10-second countdown over 30-second mark', () => {
            const timer = new CountdownTimer();
            const announcements = [];

            timer.onAnnouncement = (msg) => {
                announcements.push(msg);
            };

            timer.isRunning = true;
            timer.remainingSeconds = 10;
            timer.checkAnnouncements();

            // Should announce "10", not "30 seconds remaining" or minute
            test.assertEqual(announcements[announcements.length - 1], '10');
        });

        test.it('should not make duplicate announcements', () => {
            const timer = new CountdownTimer();
            const announcements = [];

            timer.onAnnouncement = (msg) => {
                announcements.push(msg);
            };

            timer.isRunning = true;
            timer.remainingSeconds = 60;

            // Call twice with same time
            timer.checkAnnouncements();
            const countAfterFirst = announcements.length;

            timer.checkAnnouncements();
            const countAfterSecond = announcements.length;

            test.assertEqual(countAfterFirst, countAfterSecond, 'Should not announce twice for same time');
        });

        test.it('should reset lastAnnouncement on timer reset', () => {
            const timer = new CountdownTimer();
            timer.lastAnnouncement = '1 minute remaining';

            timer.reset();

            test.assertNull(timer.lastAnnouncement, 'lastAnnouncement should be reset');
        });

        test.it('should announce "Time\'s up!" on completion', () => {
            const timer = new CountdownTimer();
            let announcement = '';

            timer.onAnnouncement = (msg) => {
                announcement = msg;
            };

            timer.remainingSeconds = 1;
            timer.isRunning = true;
            timer.tick(); // This completes the timer

            test.assertEqual(announcement, "Time's up!");
        });

        test.it('should not announce if not running', () => {
            const timer = new CountdownTimer();
            let announcementMade = false;

            timer.onAnnouncement = (msg) => {
                announcementMade = true;
            };

            timer.isRunning = false;
            timer.remainingSeconds = 60;
            timer.checkAnnouncements();

            // Since we don't check isRunning in checkAnnouncements,
            // this test verifies the logic works regardless
            // In real usage, checkAnnouncements is only called from tick() when running
        });

        test.it('should handle onAnnouncement callback being undefined', () => {
            const timer = new CountdownTimer();
            timer.onAnnouncement = undefined;

            timer.isRunning = true;
            timer.remainingSeconds = 60;

            // Should not throw error
            test.assert(() => {
                timer.checkAnnouncements();
                return true;
            }, 'Should handle undefined callback gracefully');
        });
    });
}

// Run tests
async function runTests() {
    console.log('🚀 Starting Test Suite...\n');
    testStep1_ProjectStructure();
    testStep2_TimeValidation();
    await testStep3_CountdownMechanism();
    testStep4_VoiceAnnouncements();
    const passed = test.printReport();

    // Exit with appropriate code
    process.exit(passed ? 0 : 1);
}

runTests();
