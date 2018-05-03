/**
 * Maintenance script that deletes generated
 * documents after 1 month.
 */

'use strict';
import fs from 'fs';
import cron from 'cron';
import config from '../server/config/environment';

function deleteFolderRecursive(path) {
  if(fs.existsSync(path)) {
    fs.readdirSync(path).forEach(file => {
      const curPath = `${path}/${file}`;
      if(fs.lstatSync(curPath).isDirectory()) { // recurse
        deleteFolderRecursive(curPath);
      } else { // delete file
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(path);
  }
}

const uploadDir = `${config.uploads.dir}/${config.uploads.docs}`;
const oneMonth = 1000 * 60 * 60 * 24 * 31;

function checkForDeleteGeneralDocument() {
  if(fs.existsSync(uploadDir)) {
    fs.readdirSync(uploadDir).forEach(file => {
      let fullDir = `${uploadDir}/${file}`;
      fs.stat(fullDir, (err, stats) => {
        if(err === null) {
          const birthtimeMs = stats.birthtimeMs;
          const timeStamp = Math.floor(Date.now());
          const durationByMonth = (timeStamp - birthtimeMs) / oneMonth;
          // deletes generated documents after 1 month
          if(durationByMonth >= 1) {
            if(stats.isFile()) {
              fs.unlinkSync(fullDir);
              console.log(`removed file: ${fullDir}`);
            } else {
              deleteFolderRecursive(fullDir);
              console.log(`removed folder: ${fullDir}`);
            }
          }
        }
      });
    });
  }
}

export default function cronJobForDeleteGeneralDocument() {
  const job = new cron.CronJob('0 0 0 * * *', () => {
    /*
     * Runs every day at 00:00:00 AM
     */
    console.log('cron job next time', job.nextDates()); // job1 status true
    checkForDeleteGeneralDocument();
  }, () => {
      /* This function is executed when the job stops */
  },
  true, /* Start the job right now */
  );
  console.log('cron job next time', job.nextDates()); // job1 status true
  checkForDeleteGeneralDocument();
}
