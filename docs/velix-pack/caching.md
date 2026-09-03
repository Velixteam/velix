# Velix Pack Caching

Velix Pack implements persistent module-level caching under `.velix/cache/pack/`.

## How It Works

1. **Hash Generation**: Content hash (MD5) is generated for each file.
2. **Lookup**: Before transforming a file, Velix Pack checks the memory & filesystem cache.
3. **Invalidation**: On file modification, only the modified file and its affected dependents are invalidated.
