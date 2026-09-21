import fs from 'fs';

const VERSION = '5.3.6';

const pkgPaths = [
  'package.json',
  'packages/create-velix-app/package.json',
  'packages/velix/package.json',
  'packages/velix-cli/package.json',
  'packages/velix-core/package.json',
  'packages/velix-react/package.json',
  'packages/cache-redis/package.json',
  'packages/velix-pack/package.json',
  'website/package.json'
];

pkgPaths.forEach(p => {
  if (fs.existsSync(p)) {
    const data = JSON.parse(fs.readFileSync(p, 'utf8'));
    data.version = VERSION;

    if (data.dependencies) {
      for (const dep in data.dependencies) {
        if (dep.startsWith('@teamvelix/') || dep === 'velix' || dep === 'create-velix-app') {
          data.dependencies[dep] = `^${VERSION}`;
        }
      }
    }
    if (data.devDependencies) {
      for (const dep in data.devDependencies) {
        if (dep.startsWith('@teamvelix/') || dep === 'velix' || dep === 'create-velix-app') {
          data.devDependencies[dep] = `^${VERSION}`;
        }
      }
    }
    fs.writeFileSync(p, JSON.stringify(data, null, 2) + '\n');
    console.log(`Updated ${p} -> v${VERSION}`);
  }
});

const versionPaths = [
  'packages/velix/version.ts',
  'packages/velix-cli/version.ts',
  'packages/velix-core/src/version.ts'
];

versionPaths.forEach(p => {
  if (fs.existsSync(p)) {
    let content = fs.readFileSync(p, 'utf8');
    content = content.replace(/export const VERSION = '.*';/g, `export const VERSION = '${VERSION}';`);
    fs.writeFileSync(p, content);
    console.log(`Updated ${p} -> VERSION '${VERSION}'`);
  }
});
