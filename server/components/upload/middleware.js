import fs from 'fs';
import multiparty from 'multiparty';
import compose from 'composable-middleware';

export default function onUpload() {
  return compose()
    // check if there are any files to be uploaded
    .use((req, res, next) => {
      req.isUploading = (req.get('content-type') || '').indexOf('multipart/form-data') > -1;
      next();
    })

    // if uploads available, load the files in req.uploads and fields in req.body
    .use((req, res, next) => {
      if(!req.isUploading) {
        return next();
      }

      let form = new multiparty.Form();

      form.parse(req, (err, fields, files) => {
        // handle err
        if(err) {
          console.error(err);
        }

        req.body = Object.keys(fields).reduce((bod, key) => {
          bod[key] = fields[key][0];
          return bod;
        }, {});

        req.uploads = Object.keys(files).reduce((upl, fileKey) =>
          upl.concat(files[fileKey]), []
        )
          .reduce((upl, file) => {
            upl[file.fieldName] = file;
            return upl;
          }, {});

        next();
      });
    })

    // unlink all upload temp files
    .use((req, res, next) => {
      let unlinkTempUploads = () => Object.keys(req.uploads).forEach(key => {
        let file = req.uploads[key];

        fs.unlink(file.path, err => {
          if(err) {
            console.error('couldn\'t unlink the upload temp file', file.path);
          }
        });
      });

      if(req.uploads) {
        res.on('finish', unlinkTempUploads);
      }

      next();
    });
}
