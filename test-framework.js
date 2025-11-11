/**
 * Lightweight Testing Framework for Countdown Timer
 */

class TestFramework {
    constructor() {
        this.tests = [];
        this.results = {
            passed: 0,
            failed: 0,
            total: 0
        };
    }

    describe(suiteName, testFn) {
        console.log(`\n📦 ${suiteName}`);
        testFn();
    }

    it(testName, testFn) {
        this.results.total++;
        try {
            testFn();
            this.results.passed++;
            this.logResult('✓', testName, 'passed');
        } catch (error) {
            this.results.failed++;
            this.logResult('✗', testName, 'failed', error.message);
        }
    }

    logResult(icon, testName, status, message = '') {
        const color = status === 'passed' ? 'green' : 'red';
        console.log(`  ${icon} ${testName}`);
        if (message) {
            console.log(`    ↳ ${message}`);
        }

        // Also add to DOM if test results element exists
        const resultsEl = document.getElementById('test-results');
        if (resultsEl) {
            const testItem = document.createElement('div');
            testItem.className = `test-item ${status}`;
            testItem.innerHTML = `
                <span class="icon">${icon}</span>
                <span class="test-name">${testName}</span>
                ${message ? `<div class="error-msg">${message}</div>` : ''}
            `;
            resultsEl.appendChild(testItem);
        }
    }

    getReport() {
        const passRate = ((this.results.passed / this.results.total) * 100).toFixed(1);
        return {
            ...this.results,
            passRate
        };
    }

    printReport() {
        const report = this.getReport();
        console.log('\n' + '='.repeat(50));
        console.log('📊 TEST REPORT');
        console.log('='.repeat(50));
        console.log(`Total Tests: ${report.total}`);
        console.log(`✓ Passed: ${report.passed}`);
        console.log(`✗ Failed: ${report.failed}`);
        console.log(`Pass Rate: ${report.passRate}%`);
        console.log('='.repeat(50) + '\n');

        // Update DOM summary
        const summaryEl = document.getElementById('test-summary');
        if (summaryEl) {
            summaryEl.innerHTML = `
                <h3>Test Summary</h3>
                <div class="summary-stats">
                    <div class="stat">Total: ${report.total}</div>
                    <div class="stat passed">Passed: ${report.passed}</div>
                    <div class="stat failed">Failed: ${report.failed}</div>
                    <div class="stat">Pass Rate: ${report.passRate}%</div>
                </div>
            `;
        }

        return report;
    }

    // Assertion methods
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
}

// Create global test instance
const test = new TestFramework();
