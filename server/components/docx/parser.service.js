'use strict';

import JSZip from 'jszip';
import Docxtemplater from 'docxtemplater';
import expressions from 'angular-expressions';
import fs from 'fs';
import path from 'path';
import mkdirp from 'mkdirp';
import crypto from 'crypto';
import os from 'os';
import config from '../../config/environment';
import cheerio from 'cheerio';
import cProcess from 'child_process';
import gTranslate from '@google-cloud/translate';
/**
 * Converts the docx file to image
 * @param {String} inputFile path to file
 * @param {String} output path to file output
 * @param {Function} callback the callback function
 */
const convertToImage = (inputFile, output, callback) => {
  let hash = crypto.createHash('sha512');
  hash.update(Math.random().toString());
  hash = hash.digest('hex');

  let tempFolder = path.join(os.tmpdir(), `${hash}`);
  const imageBaseName = path.basename(inputFile, '.docx');
  const fileName = path.basename(inputFile);
  const fullPDFPath = `${path.join(tempFolder, imageBaseName)}.pdf`;

  try {
    let args = ['--headless', '--convert-to', 'pdf', '--outdir', `${tempFolder}`, inputFile];
    cProcess.execFileSync('soffice', args);
  } catch(err) {
    console.error('[spawn] stderr: ', err);
    return callback(err);
  }
  let convertOtherArgs = [fullPDFPath, output];
  convertOtherArgs.splice(0, 0, '-quality', 1);
  convertOtherArgs.splice(0, 0, '-scene', 1);
  convertOtherArgs.splice(0, 0, '-blur', '0x6');
  cProcess.execFile('convert', convertOtherArgs, error => {
    if(error) return callback(error);
    let pageCountOptions = ['-format', '%n', fullPDFPath];
    cProcess.execFile('identify', pageCountOptions, (error1, stdout) => {
      if(error1) return callback(error1);
      const pageCount = parseInt(stdout.toString(), 10);
      const previews = {
        pageCount,
        images: []
      };
      if(pageCount > 1) {
        for(let pageNumber = 1; pageNumber <= pageCount; pageNumber++) {
          const imageName = `${fileName}-${pageNumber}.png`;
          previews.images.push(imageName);
        }
      } else {
        previews.images.push(`${fileName}.png`);
      }
      console.log(fullPDFPath);
      fs.unlink(fullPDFPath, errorUn => {
        if(errorUn) return callback(errorUn);
        return callback(null, previews);
      });
    });
  });
};

/**
 * asZip Convert text to zip
 * @param  {text} content
 * @return {JSZip}
 */
const asZip = content => new JSZip(content);

/**
 * change the font and size according to the user preference.
 * @param {JSZip}  zipData zipdata
 * @param {object} fontPref font user preference.
 */
const changeFont = (zipData, fontPref) => {
  let xml = zipData.file('word/document.xml').asText();
  let $xml = cheerio.load(xml, { xmlMode: true });

  let fontSize = fontPref && fontPref.standardFontSize ? fontPref.standardFontSize.slice(0, -2) : undefined;
  let fontFamily = fontPref && fontPref.standardFontName ? fontPref.standardFontName : undefined;

  if(fontFamily) {
    $xml('w\\:rFonts').remove();
    let fontStr = `<w:rFonts w:ascii="${fontFamily}" w:hAnsi="${fontFamily}" w:cs="${fontFamily}"/>`;
    $xml('w\\:rPr').prepend(fontStr);
  }

  if(fontSize) {
    $xml('w\\:sz').remove();
    $xml('w\\:szCs').remove();

    let size = parseInt(fontSize, 10);
    let sizeStr = `w:val="${size * 2}"`;

    $xml('w\\:rPr').prepend(`<w:sz ${sizeStr}/>`);
    $xml('w\\:rPr').prepend(`<w:szCs ${sizeStr}/>`);
  }

  zipData.file('word/document.xml', $xml.xml());
  return zipData;
};

/**
 * readDocFile Read specified file and return the zipped content
 * @param  {string} Path to file
 * @return {JSZip}
 */
const readDocFile = filePath =>
  new Promise((resolve, reject) => {
    fs.readFile(path.resolve(__dirname, filePath), 'binary', (err, data) => {
      if(err) {
        console.error('Error while reading docfile', filePath, err);
        return reject(err);
      }

      resolve(asZip(data));
    });
  });

/**
 * parseDoc Parse provided doc template, fill with provided data
 * @param  {JSZip} The template to be parsed
 * @param  {{parser?, data?}} Options for the document parser
 * @return {JSZip}
 */
const parseDoc = (zippedContent, opts = {}) =>
  new Promise((resolve, reject) => {
    try {
      let doc = new Docxtemplater();
      doc.loadZip(zippedContent);

      opts.parser && doc.setOptions({ parser: opts.parser });
      opts.data && doc.setData(opts.data);

      doc.render();

      resolve(doc.getZip());
    } catch(e) {
      return reject(e);
    }
  });

/**
 * replaceIfTags Parser that replaces {if=""}...{endif} with {# }...{/}
 */
const replaceIfTags = tag => ({
  get: () => {
    tag = tag.replace(/\s/g, '');

    tag = tag.replace(/int\((.*)\)/i, '($1|int)');

    if(tag.indexOf('if') === 0) {
      return `{# ${tag.match(/"(.*?)"/)[1]}}`;
    }

    tag = tag === 'endif' ? '/' : tag;
    return `{${tag}}`;
  }
});

// add int filter to ngExpressions
expressions.filters.int = input => parseInt(input, 10);

/**
 * exprParser Angular Expressions parser
 */
export const exprParser = (expr, data) => {
  let out = expressions.compile(expr)(data);
  return out === undefined ? '' : out;
};

/**
 * The main document parser, extending the angular expressions
 */
const mainParser = tag => ({
  get: tag === '.' ? s => s : exprParser.bind(0, tag)
});

/**
 * Check if provided path is valid
 * If it isn't, create it
 */
const checkPath = dirPath =>
  new Promise((resolve, reject) => {
    mkdirp(dirPath, err => {
      if(err) {
        console.log(`An error occurred when checking directory path ${dirPath}`);
        return reject(err);
      }
      resolve();
    });
  });

const generatePreview = (input, outPath) =>
  new Promise((resolve, reject) => {
    console.log('Generating preview');
    convertToImage(`${input}`, `${outPath}.png`, (error, previews) => {
      if(error) {
        console.log('An error occurred during file preview generation');
        return reject(error);
      }
      resolve(previews);
    });
  });
const translate = (zipFile, isTranslate) =>
  new Promise((resolve, reject) => {
    if(isTranslate === true) {
      const translator = new gTranslate({
        projectId: config.GOOGLE_TRANSLATE_PROJECT_ID
      });
      console.log('translating documents');
      let xml = zipFile.file('word/document.xml').asText();
      let $xml = cheerio.load(xml, { xmlMode: true });
      const texts = [];
      $xml('w\\:p').each((i, elm) => {
        texts.push(
          $xml(elm)
            .text()
        );
      });
      translator
        .translate(texts, {
          from: 'de',
          to: 'en',
          format: 'text'
        })
        .then(results => {
          let translations = results[0];
          translations = Array.isArray(translations) ? translations : [translations];
          $xml('w\\:p').each((i, elm) => {
            $xml(elm)
              .find('w\\:r')
              .first()
              .find('w\\:t')
              .text(translations[i]);
            $xml(elm)
              .find('w\\:r')
              .slice(1)
              .remove();
          });
          zipFile.file('word/document.xml', $xml.xml());
          resolve(zipFile);
        })
        .catch(err => {
          console.error('Translate Error: ', err);
          return reject(err);
        });
    } else {
      console.log('translation is not needed');
      resolve(zipFile); // no translation needed
    }
  });

export const tmplToDocx = (params = {}) =>
  new Promise((resolve, reject) => {
    let { data } = params;
    let outDir = path.resolve(config.uploads.dir, params.outDir || '');
    const isTranslated = data.TRANSLATION === 'j';
    let outputFilePath = path.resolve(outDir, params.outFile);

    if(isTranslated) {
      let fileName = path.basename(outputFilePath, '.docx');
      fileName += '_en.docx';
      outputFilePath = path.join(path.dirname(outputFilePath), fileName);
    }

    checkPath(outDir)
      .then(() => readDocFile(params.input))
      .then(zipContent => {
        console.log('Path checked and document file read');
        // convert custom tags to angular expressions
        return parseDoc(zipContent, { parser: replaceIfTags });
      })
      .then(zip => {
        console.log('Replaced if tags');
        // parse angular expressions
        return parseDoc(zip, { parser: mainParser, data });
      })
      .then(zip => translate(zip, isTranslated))
      .then(zip => {
        console.log('Replaced data');
        zip = changeFont(zip, params.preferences);
        console.log('Font changed');
        const buf = zip.generate({ type: 'nodebuffer' });
        console.log('Node buffer generated');

        // write the document
        fs.writeFile(outputFilePath, buf, writeError => {
          if(writeError) {
            console.error('couldn\'t write output document', outputFilePath, writeError);
            return reject(writeError);
          }
          console.log('Document written');
          generatePreview(outputFilePath, outputFilePath)
            .then(previews => {
              console.log('Preview Generated');
              resolve({
                file: path.basename(outputFilePath),
                previewImage: previews.images,
                fileBuffer: buf,
                numOfPages: previews.pageCount,
                size: buf.byteLength
              });
            })
            .catch(err => reject(err));
        });
      })
      .catch(error => reject(error));
  });
