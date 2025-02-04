import { Parser } from 'csv-parse';
import { Transform } from 'stream';
import { isEmail } from './validators.js';

export const processCSV = async (fileBuffer: Buffer): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    const emails: string[] = [];
    const parser = new Parser({ columns: true });
    
    const transformer = new Transform({
      objectMode: true,
      transform(row, _encoding, callback) {
        const email = row.email?.trim();
        if (email && isEmail(email)) {
          emails.push(email);
        }
        callback();
      }
    });

    parser.on('error', reject);
    transformer.on('error', reject);
    transformer.on('finish', () => resolve(emails));

    parser.pipe(transformer);
    parser.write(fileBuffer);
    parser.end();
  });
};