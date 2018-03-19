'use strict';

const _ = require('lodash');
const debug = require('debug')('sheit:main');
const Promise = require('bluebird');
const EventEmitter = require('events');
const GoogleSpreadsheet = require('google-spreadsheet');

module.exports = config => new Promise((resolve, reject) => {

    if(!_.isPlainObject(config) || !_.isPlainObject(config.auth) || !_.isString(config.sheetId)) {
        try {
            return reject(new Error(`Incorrect configuration: ${_.isObject(config) ? JSON.stringify(config) : config}`));
        } catch(err) {
            return reject(new Error(err))
        }
    }

    let lastUpdated;

    const assignedField = _.isString(config.assignedField) ? config.assignedField : 'assigned';
    const descriptionField = _.isString(config.descriptionField) ? config.descriptionField : 'hed';
    const pollInterval = _.isFinite(config.pollInterval) ? config.pollInterval : 20000;

    const doc = new GoogleSpreadsheet(config.sheetId);

    class API extends EventEmitter  {
        complete(email, description) {
            return setAssignedStatus(email, description, 'completed');
        }

        reject(email, description) {
            return setAssignedStatus(email, description, 'rejected');
        }
    }

    const api = new API();

    // Authenticate, return interface, set up change poll
    //
    doc.useServiceAccountAuth(config.auth, err => {

        err ? reject(new Error(err)) : resolve(api);

        doc.addWorksheet({
            title: 'Log'
        }, (err, sheet) => {

            // Expect "EXISTS" errors; TODO: unexepected errors?
            //
            if(err) {
                return;
            }

            sheet.resize({colCount: 50});
            sheet.setHeaderRow(['date', assignedField, 'status', descriptionField]); //async
        });

        setImmediate(read);
    });

    // The main polling mechanism. When there is new data grab any assigned
    // rows (which must also have a description field value) and attempt to
    // mark them as `started` in the log.
    //
    function read() {
        return fetchSheet().then((data={}) => {

            if(data.updated && (data.updated !== lastUpdated)) {
                lastUpdated = data.updated;

                api.emit('updated', data);

                data.rows.forEach((row, idx) => {
                    let email = (row[assignedField] || '').trim();
                    let desc = (row[descriptionField] || '').trim();
                    email && desc && setAssignedStatus(email, desc, 'started');
                });
            }

            setTimeout(read, pollInterval);
        });
    }

    // Update the status of a row matching #assignedField && #descriptionField
    //
    // @param {string} email    The email address of assignee
    // @param {string} description  The #descriptionField value
    // @param {string} status   One of [started | completed | rejected]
    //
    function setAssignedStatus(email, description, status) {

        if(!_.isString(email) || !_.isString(description) || !_.isString(status)) {
            let err = new Error(`Missing arguments. Received email:${email} description:${description} and status:${status}`);
            api.emit('error', err);
            return Promise.reject(err);
        }

        email = email.trim();
        description = description.trim();

        // (1) === `Log` sheet
        //
        return fetchSheet(1).then((data={}) => {

            if(!data.rows)  {
                debug(`Call to #fetchSheet returned no rows`);
                return;
            }

            // Find a row with <email,description> matching sent arguments,
            // update #status field in `Log` and exit.
            //
            if(data.rows.some(row => {
                let af = (row[assignedField] || '').trim();
                let df = (row[descriptionField] || '').trim();
                if(af === email && df === description) {
                    row.status = status;
                    row.save();
                    return true;
                }
            })) {
                return;
            }

            // If can't find existing row, create a new entry in `Log` worksheet.
            //
            let row = {
                [assignedField] : email,
                [descriptionField] : description,
                date: new Date().toUTCString(),
                status
            };

            // Oddly, indexing for #addRow begins at 1; 2 = Log worksheet.
            //
            doc.addRow(2, row, err => {
                if(err) {
                    return api.emit('error', err);
                }
                api.emit(status, row);
            });
        });
    }

    // @param {number} [idx]    Grab a worksheet. Default 0. Begins at 0 index; 0 = main sheet.
    //
    function fetchSheet(idx=0) {
        return new Promise((resolve, reject) => doc.getInfo((err, info) => {

            if(err) {
                return reject(err);
            }

            if(!_.isPlainObject(info) || !_.isArray(info.worksheets) || !_.isObject(info.worksheets[idx])) {
                return reject(new Error(`Can't fetch worksheet at index: ${idx}`))
            }

            try {
                let sheet = info.worksheets[idx];
                sheet.getRows({}, (err, rows) => err ? reject(err) : resolve(Object.assign({
                    title: info.title,
                    updated: info.updated,
                    author : info.author,
                    sheet
                }, { rows })));
            } catch(err) {
                return reject(err);
            }

        })).catch(err => {
            debug(err);
            api.emit('error', err);
        });
    }

    return null;
});
