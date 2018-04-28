/**
 * Maintenance script that deletes generated
 * documents after 1 month.
 */

'use strict';
const path = require('path');
const _ = require('lodash');
const fs = require('fs');

const rootDir = process.env.NODE_ENV === 'production' ? path.normalize(`${__dirname}/../../..`) : path.normalize(`${__dirname}/../..`);

// Expose app

const uploadDirs = [
  path.resolve(rootDir, 'products/assets/uploads/'), // uploads.dir in server/config/environment/index.js
  path.resolve(rootDir, 'products/assets/uploads/docx'), // uploads.docs in server/config/environment/shared.js
];
const oneMonth = 1000 * 60 * 60 * 24 * 31;

_.forEach(uploadDirs, function(uploadDir) {
  if(fs.existsSync(uploadDir)) {
    fs.readdirSync(uploadDir).forEach(file => {
      let fullDir = `${uploadDir}/${file}`;
      fs.stat(fullDir, (err, stats) => {
        if(err === null && stats.isFile()) {
          const birthtimeMs = stats.birthtimeMs;
          const timeStamp = Math.floor(Date.now());
          const durationByMonth = (timeStamp - birthtimeMs) / oneMonth;
          // deletes generated documents after 1 month
          if(durationByMonth >= 1) {
            fs.unlinkSync(fullDir);
            console.log(`removed file: ${fullDir}`);
          }
        }
      });
    });
  }
});
