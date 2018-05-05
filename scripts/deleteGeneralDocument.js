/**
 * Maintenance script that deletes generated
 * documents after 1 month.
 */

'use strict';
import fs from 'fs';
import cron from 'cron';
import rmdir from 'rimraf';
import config from '../server/config/environment';

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
          if(durationByMonth >= 1) {
            rmdir(fullDir, () => {});
            console.log(`removed : ${fullDir}`);
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
