import fs from 'fs';

// Update package.jsons
const pkgPaths = [
  'package.json',
  'packages/create-velix-app/package.json',
  'packages/velix/package.json',
  'packages/velix-cli/package.json',
  'packages/velix-core/package.json',
  'packages/velix-presentation/package.json',
  'packages/velix-react/package.json',
  'website/package.json'
];

pkgPaths.forEach(p => {
  if (fs.existsSync(p)) {
    const data = JSON.parse(fs.readFileSync(p, 'utf8'));
    data.version = '5.2.1';
    if (data.dependencies) {
      for (const dep in data.dependencies) {
        if (dep.startsWith('@teamvelix/') || dep === 'velix' || dep === 'create-velix-app') {
          if (data.dependencies[dep] !== 'workspace:*') {
             data.dependencies[dep] = '5.2.1';
          }
        }
      }
    }
    if (data.devDependencies) {
      for (const dep in data.devDependencies) {
        if (dep.startsWith('@teamvelix/') || dep === 'velix' || dep === 'create-velix-app') {
          if (data.devDependencies[dep] !== 'workspace:*') {
             data.devDependencies[dep] = '5.2.1';
          }
        }
      }
    }
    fs.writeFileSync(p, JSON.stringify(data, null, 2) + '\n');
    console.log('Updated ' + p);
  }
});

// Update version.ts
const versionPaths = [
  'packages/velix/version.ts',
  'packages/velix-cli/version.ts',
  'packages/velix-core/src/version.ts'
];

versionPaths.forEach(p => {
  if (fs.existsSync(p)) {
    let content = fs.readFileSync(p, 'utf8');
    content = content.replace(/export const VERSION = '.*';/g, "export const VERSION = '5.2.1';");
    fs.writeFileSync(p, content);
    console.log('Updated ' + p);
  }
});
