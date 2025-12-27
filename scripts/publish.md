
# Publishing FlexiReact to npm

## Prerequisites

1. Create an npm account at https://www.npmjs.com/signup
2. Login to npm in your terminal:
   ```bash
   npm login
   ```

## Publishing the Framework (flexireact)

From the root directory:

```bash
# Check what will be published
npm pack --dry-run

# Publish to npm
npm publish
```

## Publishing the CLI (create-flexireact)

From the packages/create-flexireact directory:

```bash
cd packages/create-flexireact

# Check what will be published
npm pack --dry-run

# Publish to npm
npm publish
```

## After Publishing

Users can now use:

```bash
# Create a new app
npx create-flexireact@latest my-app

# Or install globally
npm install -g create-flexireact
create-flexireact my-app
```

## Version Updates

To update versions:

```bash
# For flexireact
npm version patch  # 1.0.0 -> 1.0.1
npm version minor  # 1.0.0 -> 1.1.0
npm version major  # 1.0.0 -> 2.0.0

# Then publish
npm publish
```

## Verify Publication

Check your packages at:
- https://www.npmjs.com/package/flexireact
- https://www.npmjs.com/package/create-flexireact
