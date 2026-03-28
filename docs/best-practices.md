# Best Practices - Velix v5

Best practices guide for developing with Velix.

## 🏗️ Project Structure

### Recommended Organization

```
my-velix-app/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── api/
│   │   └── users/
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/
│   └── shared/
├── server/
│   ├── actions/
│   └── services/
├── lib/
│   ├── db.ts
│   └── utils.ts
├── public/
├── velix.config.ts
└── tailwind.config.ts
```

## 🎯 Server Actions

### ✅ DO
- Validate all inputs
- Use unique IDs
- Return structured objects
- Use `revalidatePath()` after mutations

### ❌ DON'T
- Expose sensitive data
- Ignore errors
- Perform heavy operations without feedback

## 🔌 API Routes

### ✅ DO
- Use helpers (`json`, `text`, `redirect`)
- Validate inputs
- Handle errors properly
- Use appropriate status codes

### ❌ DON'T
- Expose sensitive data
- Ignore validation
- Put business logic in routes

## 🎨 Components

### ✅ DO
- Separate server and client components
- Use `'use client'` only when necessary
- Prefer server components by default

### ❌ DON'T
- Use `'use client'` everywhere
- Mix server and client logic

## 🔐 Security

- Always validate user inputs
- Use HTTPS in production
- Store secrets in environment variables
- Implement CORS correctly
- Use `httpOnly` for sensitive cookies

## ⚡ Performance

- Use prefetch for important links
- Implement caching with `revalidatePath()`
- Optimize images with `<Image>` component
- Minimize client components

## 📝 TypeScript

- Type all functions
- Use Velix types (`Metadata`, `PageProps`, etc.)
- Avoid `any` as much as possible

## 🧪 Testing

- Test server actions
- Test API routes
- Use end-to-end tests for critical flows
