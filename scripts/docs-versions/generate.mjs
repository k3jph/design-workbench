import {readFile} from 'node:fs/promises';
import {createManifest} from './contract.mjs';

// Writes only to stdout. Persisting a manifest or archive is a separate action.
const [metadataPath,archiveRoot]=process.argv.slice(2);
if(!metadataPath || !archiveRoot)throw Error('Usage: node generate.mjs metadata.json archive-root');
const metadata=JSON.parse(await readFile(metadataPath,'utf8'));
console.log(JSON.stringify(await createManifest(archiveRoot,metadata),null,2));
