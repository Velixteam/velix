
import { getTemplateFiles } from './packages/create-flexireact/src/templates/index.js';

console.log('Import successful');
const files = getTemplateFiles('default', 'test');
console.log('Files generated:', Object.keys(files).length);
