// tests/wideTableSupportTests.js
import { getWideTableState } from '../wideTableSupport.js';

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(
      `${message}: expected "${expected}", received "${actual}"`
    );
  }
}

function runWideTableStateTests() {
  const fits = getWideTableState({
    scrollWidth: 1000,
    clientWidth: 1000,
    scrollLeft: 0,
  });

  assertEqual(fits.wide, false, 'A fitting table should not be wide');
  assertEqual(
    fits.canScrollLeft,
    false,
    'A fitting table should not scroll left'
  );
  assertEqual(
    fits.canScrollRight,
    false,
    'A fitting table should not scroll right'
  );

  const start = getWideTableState({
    scrollWidth: 1800,
    clientWidth: 1000,
    scrollLeft: 0,
  });

  assert(start.wide, 'Overflowing table was not identified');
  assertEqual(
    start.canScrollLeft,
    false,
    'Wide table should not scroll left at the start'
  );
  assertEqual(
    start.canScrollRight,
    true,
    'Wide table should scroll right at the start'
  );

  const middle = getWideTableState({
    scrollWidth: 1800,
    clientWidth: 1000,
    scrollLeft: 400,
  });

  assert(
    middle.canScrollLeft && middle.canScrollRight,
    'Wide table should scroll both directions in the middle'
  );

  const end = getWideTableState({
    scrollWidth: 1800,
    clientWidth: 1000,
    scrollLeft: 800,
  });

  assertEqual(
    end.canScrollLeft,
    true,
    'Wide table should scroll left at the end'
  );
  assertEqual(
    end.canScrollRight,
    false,
    'Wide table should not scroll right at the end'
  );
}

const output = document.getElementById('testResults');

try {
  runWideTableStateTests();
  output.textContent = 'All wide-table support tests passed.';
  output.dataset.status = 'passed';
  console.log('All wide-table support tests passed.');
} catch (error) {
  output.textContent = `Wide-table support test failed: ${error.message}`;
  output.dataset.status = 'failed';
  console.error(error);
}
