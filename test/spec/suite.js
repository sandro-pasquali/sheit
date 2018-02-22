'use strict';

const sheit = require('../../lib');

module.exports = (test, Promise) => Promise.try(() => {
    test.deepEqual(1, 1, '1 == 1');
    test.deepEqual(1, `1`, `1 === '1'`);
});