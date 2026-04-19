---
title: "From OpenAPI Spec to Running API Tests in 2 Minutes"
published: true
tags: api, testing, openapi, typescript
cover_image: [ADD_COVER_IMAGE_URL]
series: "QAStarter"
---

## The Idea

You have an OpenAPI/Swagger spec for your API. You need test coverage. Writing test stubs for every endpoint manually is tedious.

What if you could paste your spec URL and get test files auto-generated?

## How It Works

1. Go to [qastarter.qatonic.com](https://qastarter.qatonic.com)
2. Select **API** testing type
3. Choose your stack (e.g., TypeScript + Supertest + Jest)
4. Paste your OpenAPI spec URL in the **OpenAPI Spec URL** field
5. Generate

QAStarter fetches the spec, parses all endpoints, and generates:
- A test file with one test case per endpoint
- Correct HTTP methods (GET, POST, PUT, DELETE, PATCH)
- Content-Type headers based on the spec
- Request body scaffolding for POST/PUT endpoints
- Endpoint descriptions from the spec as test names

## Real Example: Petstore API

I used the Swagger Petstore spec:
```
https://petstore3.swagger.io/api/v3/openapi.json
```

QAStarter generated **19 test cases** covering all endpoints:

```
tests/openapi.test.ts
  - POST /pet — Add a new pet to the store
  - PUT /pet — Update an existing pet
  - GET /pet/findByStatus — Finds Pets by status
  - GET /pet/findByTags — Finds Pets by tags
  - GET /pet/{petId} — Find pet by ID
  - POST /pet/{petId} — Updates a pet with form data
  - DELETE /pet/{petId} — Deletes a pet
  - POST /pet/{petId}/uploadImage — Uploads an image
  - GET /store/inventory — Returns pet inventories
  - POST /store/order — Place an order
  - GET /store/order/{orderId} — Find purchase order
  - DELETE /store/order/{orderId} — Delete order
  - POST /user — Create user
  - POST /user/createWithList — Create users from list
  - GET /user/login — Logs user in
  - GET /user/logout — Logs user out
  - GET /user/{username} — Get user by name
  - PUT /user/{username} — Update user
  - DELETE /user/{username} — Delete user
```

Each test is a real, runnable supertest call:

```typescript
test('GET /pet/findByStatus — Finds Pets by status.', async () => {
  const res = await request(BASE_URL)
    .get('/pet/findByStatus');

  expect(res.status).toBeGreaterThanOrEqual(200);
  expect(res.status).toBeLessThan(500);
});
```

## What You Do Next

The auto-generated tests are **contract smoke tests** — they verify each endpoint exists and returns a non-error response. Your job is to:

1. Replace `{petId}`, `{orderId}`, `{username}` with real values
2. Add meaningful request bodies to POST/PUT tests
3. Add specific assertions (response schema validation, field checks)
4. Add authentication headers where needed

But you start with a working test file for every endpoint, not a blank page.

## Supported API Stacks

| Framework | Language | Build Tool |
|-----------|----------|-----------|
| Supertest | TypeScript | npm |
| Supertest | JavaScript | npm |
| REST Assured | Java | Maven |
| REST Assured | Java | Gradle |
| Requests | Python | pip |
| RestSharp | C# | NuGet |
| Resty | Go | Go mod |

All of them support OpenAPI spec URL input.

## Try It

Paste any valid OpenAPI 3.x or Swagger 2.x spec URL:

- Petstore: `https://petstore3.swagger.io/api/v3/openapi.json`
- Your own API's `/api-docs` or `/swagger.json` endpoint

**Web**: [qastarter.qatonic.com](https://qastarter.qatonic.com)
**GitHub**: [github.com/QATonic/qastarter](https://github.com/QATonic/qastarter)
