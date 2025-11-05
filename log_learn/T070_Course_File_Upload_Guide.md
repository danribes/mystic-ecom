# T070: Course File Upload - Learning Guide

**Task:** Add file upload functionality for course images and materials
**Difficulty:** Intermediate
**Topics:** File Uploads, Security, Validation, Storage
**Date:** 2025-11-04

---

## What We Built

A secure file upload system for course materials that allows admins and instructors to upload:
- **Images** (JPEG, PNG, WebP, GIF) - up to 10MB
- **Videos** (MP4, MOV) - up to 100MB
- **Documents** (PDF, ZIP, EPUB) - up to 50MB
- **Audio** (MP3, WAV) - up to 50MB

All uploads are validated, authenticated, rate-limited, and organized by file type and course.

---

## Why We Built It This Way

### 1. Dedicated Endpoint vs Generic Upload

**What We Did:**
Created `/api/courses/upload` specifically for course files

**Why:**
- Course-specific business logic (folders, permissions)
- Better organization and maintainability
- Can add course-specific features later
- Clearer intent and usage

**Alternative Approach:**
Use generic `/api/upload` for everything

**Trade-offs:**
| Dedicated Endpoint | Generic Endpoint |
|-------------------|------------------|
| ✅ Clear purpose | ✅ Less code duplication |
| ✅ Course-specific features | ✅ Simpler architecture |
| ❌ More endpoints | ❌ Mixed responsibilities |

---

### 2. Session-Based Auth vs JWT

**What We Did:**
Session-based authentication with cookies

**Why:**
```typescript
const session = await getSessionFromRequest(context.cookies);
// Session stored server-side, only ID in cookie
```

**Benefits:**
- ✅ Server can revoke sessions instantly
- ✅ No token expiry issues
- ✅ Simpler client code
- ✅ More secure (can't decode cookie)

**JWT Alternative:**
```typescript
const token = request.headers.get('Authorization');
// Token contains all data, signed
```

**When to use JWT:**
- Stateless architecture needed
- Microservices
- Mobile apps

---

### 3. Magic Byte Validation

**What We Did:**
Check actual file content, not just extension

**Why It Matters:**

**Without Magic Byte Validation:**
```
User uploads: virus.exe renamed to image.jpg
Server checks: filename ends with .jpg ✓
MIME type: image/jpeg ✓
Result: Malware uploaded! ❌
```

**With Magic Byte Validation:**
```
User uploads: virus.exe renamed to image.jpg
Server checks:
  - Filename: image.jpg ✓
  - MIME type: image/jpeg ✓
  - Magic bytes: MZ 90 00 (EXE signature) ✗
Result: REJECTED ✅
```

**How It Works:**
```typescript
const arrayBuffer = await file.arrayBuffer();
const validation = await validateFile({
  buffer: arrayBuffer,
  mimeType: file.type,
  name: file.name,
});
// Reads first few bytes: FF D8 FF = JPEG
```

**Magic Bytes Examples:**
- JPEG: `FF D8 FF`
- PNG: `89 50 4E 47`
- PDF: `25 50 44 46` (%PDF)
- ZIP: `50 4B 03 04`
- EXE: `4D 5A` (MZ)

---

### 4. Different Size Limits Per File Type

**What We Did:**
```typescript
function getMaxFileSizeMB(mimeType: string): number {
  if (ALLOWED_IMAGE_TYPES.includes(mimeType)) return 10;
  if (ALLOWED_VIDEO_TYPES.includes(mimeType)) return 100;
  if (ALLOWED_DOCUMENT_TYPES.includes(mimeType)) return 50;
  return 10;
}
```

**Why:**
- **Images:** 10MB is plenty (4K photos ~5MB)
- **Videos:** 100MB for short preview clips
- **Documents:** 50MB for comprehensive PDFs
- **Trade-off:** User experience vs storage costs

**Single Size Limit Alternative:**
```typescript
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB for everything
```

**Problem:**
- Images would allow wasteful uploads
- Videos would be too limited

---

### 5. Rate Limiting

**What We Did:**
```typescript
const rateLimitResult = await rateLimit(context, RateLimitProfiles.UPLOAD);
// 10 uploads per 10 minutes per IP
```

**Why It's Critical:**

**Without Rate Limiting:**
```
Attacker uploads 10,000 files in 1 minute
Result: 50GB storage consumed, server overwhelmed
```

**With Rate Limiting:**
```
Attacker uploads 10 files
11th upload: 429 Too Many Requests
Result: Attack prevented ✅
```

**Rate Limit Strategies:**

1. **Per IP Address** (What we use)
   - Prevents automated attacks
   - Issue: Shared IPs (schools, offices)

2. **Per User ID**
   - More fair
   - Requires authentication

3. **Per IP + User ID** (Best)
   - Double protection
   - Most secure

---

## How It Works

### File Upload Flow

```
┌─────────────────────────────────────────────────┐
│ 1. User selects file in browser                │
│    - FileUpload component                       │
│    - Drag & drop or click to browse            │
└──────────────┬──────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────┐
│ 2. JavaScript sends file to server             │
│    fetch('/api/courses/upload', {              │
│      method: 'POST',                            │
│      body: formData                             │
│    })                                           │
└──────────────┬──────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────┐
│ 3. Authentication Check                         │
│    - Get session from cookies                   │
│    - Verify user is logged in                   │
│    - Check role (admin/instructor)              │
│    ❌ Not logged in → 401                       │
│    ❌ Wrong role → 403                          │
└──────────────┬──────────────────────────────────┘
               │ ✅ Authorized
               ▼
┌─────────────────────────────────────────────────┐
│ 4. Rate Limit Check (Redis)                    │
│    - Check IP upload count                      │
│    - 10 uploads per 10 minutes                  │
│    ❌ Limit exceeded → 429                      │
└──────────────┬──────────────────────────────────┘
               │ ✅ Under limit
               ▼
┌─────────────────────────────────────────────────┐
│ 5. Basic Validation                             │
│    - Content-Type is multipart/form-data?       │
│    - File exists in FormData?                   │
│    - File type in whitelist?                    │
│    - File size under limit?                     │
│    ❌ Any fail → 400                            │
└──────────────┬──────────────────────────────────┘
               │ ✅ Basic checks pass
               ▼
┌─────────────────────────────────────────────────┐
│ 6. Magic Byte Validation                        │
│    - Read file header (first 8-20 bytes)        │
│    - Compare to known file signatures           │
│    - Check MIME type matches content            │
│    - Check extension matches content            │
│    ❌ Mismatch → 400 (potential malware)        │
└──────────────┬──────────────────────────────────┘
               │ ✅ File is legitimate
               ▼
┌─────────────────────────────────────────────────┐
│ 7. Upload to Storage                            │
│    - Generate unique filename (UUID)            │
│    - Determine folder path                      │
│      courses/images/[courseId]/file-uuid.jpg    │
│    - Call storage service                       │
│      • Local: Save to disk                      │
│      • S3: Upload to cloud                      │
│    ❌ Storage error → 500                       │
└──────────────┬──────────────────────────────────┘
               │ ✅ Upload successful
               ▼
┌─────────────────────────────────────────────────┐
│ 8. Return Success Response (201)                │
│    {                                             │
│      success: true,                             │
│      data: {                                     │
│        url: "http://.../uploads/.../file.jpg",  │
│        key: "courses/images/.../file-uuid.jpg", │
│        size: 5120,                              │
│        category: "images"                       │
│      }                                           │
│    }                                             │
└──────────────┬──────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────┐
│ 9. Client Updates Form                          │
│    - Sets hidden input value to URL             │
│    - Shows preview (for images)                 │
│    - User can submit form with file URL         │
└─────────────────────────────────────────────────┘
```

---

## Key Concepts

### 1. Multipart Form Data

**What is it?**
HTTP format for uploading files

**Example:**
```http
POST /api/courses/upload
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary

------WebKitFormBoundary
Content-Disposition: form-data; name="file"; filename="image.jpg"
Content-Type: image/jpeg

[binary file data here]
------WebKitFormBoundary--
```

**Why use it?**
- Can send binary data (files)
- Can mix text and files in one request
- Standard for file uploads

---

### 2. File Storage Strategies

**Option 1: Local File System (Development)**
```typescript
// Save to: ./uploads/courses/images/file.jpg
await writeFile(filepath, buffer);
```

✅ Pros:
- Simple
- No external service
- Free

❌ Cons:
- Not scalable
- Lost if server restarts (Docker)
- No redundancy

---

**Option 2: S3/Cloud Storage (Production)**
```typescript
// Upload to AWS S3 or Cloudflare R2
const client = new S3Client(config);
await client.send(new PutObjectCommand({
  Bucket: 'my-bucket',
  Key: 'courses/images/file.jpg',
  Body: buffer,
}));
```

✅ Pros:
- Scalable (unlimited storage)
- Redundant (automatic backups)
- CDN integration (fast global delivery)
- Survives server restarts

❌ Cons:
- Costs money
- Requires configuration
- Slightly more complex

---

### 3. UUID in Filenames

**Why?**
```typescript
// Bad: Use original filename
filename = "image.jpg"
// Problem: Multiple users upload "image.jpg" → collision

// Good: Add UUID
filename = "image-a3f5d9c2-4b7e-11ec-8e5d-0242ac130003.jpg"
// Unique, no collisions, harder to guess
```

**Benefits:**
- ✅ Prevents filename collisions
- ✅ Can't guess other users' files
- ✅ Can trace back to upload event
- ✅ Can include metadata (timestamp, user)

---

### 4. Folder Organization

**Flat Structure (Bad):**
```
uploads/
├── file1.jpg
├── file2.mp4
├── file3.pdf
├── ... (10,000 more files)
```

❌ Hard to browse
❌ Slow to list
❌ Can't organize by type

**Hierarchical Structure (Good):**
```
uploads/
└── courses/
    ├── images/
    │   ├── course-uuid-1/
    │   │   ├── main-image.jpg
    │   │   └── thumbnail.jpg
    │   └── course-uuid-2/
    ├── videos/
    │   └── course-uuid-1/
    │       └── preview.mp4
    └── documents/
        └── course-uuid-1/
            └── syllabus.pdf
```

✅ Easy to browse
✅ Fast to list
✅ Organized by type and course
✅ Easy to delete course files

---

## Security Best Practices

### 1. Defense in Depth

**Multiple layers of security:**
```
Layer 1: Authentication (is user logged in?)
   ↓
Layer 2: Authorization (is user admin/instructor?)
   ↓
Layer 3: Rate limiting (too many requests?)
   ↓
Layer 4: File type validation (allowed type?)
   ↓
Layer 5: File size validation (too large?)
   ↓
Layer 6: Magic byte validation (is file real?)
   ↓
Layer 7: Storage security (safe location?)
```

**Why multiple layers?**
If one layer fails, others still protect

---

### 2. Never Trust Client Data

**Bad:**
```typescript
// Trust what client says
const fileType = file.type; // "image/jpeg"
await saveFile(file); // What if it's actually malware?
```

**Good:**
```typescript
// Verify everything
const claimed = file.type; // Client says: "image/jpeg"
const actual = detectFileType(buffer); // We check: actually "image/jpeg"
if (claimed !== actual) {
  throw new Error('File type mismatch');
}
```

---

### 3. Fail Securely

**Bad:**
```typescript
try {
  uploadFile(file);
} catch (error) {
  // Ignore error, upload anyway
}
```

**Good:**
```typescript
try {
  uploadFile(file);
} catch (error) {
  console.error('Upload failed:', error);
  return {
    success: false,
    error: 'Upload failed',
    // Don't leak internal details
  };
}
```

---

## Common Pitfalls

### Pitfall 1: Forgetting to Validate Files

```typescript
// ❌ BAD: No validation
export const POST = async (context) => {
  const formData = await context.request.formData();
  const file = formData.get('file');
  await saveFile(file); // Dangerous!
};
```

**Why bad?**
- User can upload anything
- Malware, viruses, huge files
- Can crash server or compromise security

**Fix:**
```typescript
// ✅ GOOD: Validate everything
export const POST = async (context) => {
  const formData = await context.request.formData();
  const file = formData.get('file');
  
  // Check type
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Invalid file type');
  }
  
  // Check size
  if (file.size > MAX_SIZE) {
    throw new Error('File too large');
  }
  
  // Check magic bytes
  const validation = await validateFile(file);
  if (!validation.valid) {
    throw new Error('File validation failed');
  }
  
  await saveFile(file);
};
```

---

### Pitfall 2: Storing Files in Database

```typescript
// ❌ BAD: Store file in database
await db.insert({
  filename: file.name,
  data: buffer, // 10MB blob in database
});
```

**Why bad?**
- Database gets huge
- Slow queries
- Expensive backups
- Not what databases are for

**Fix:**
```typescript
// ✅ GOOD: Store file in file storage, URL in database
const result = await uploadFile(buffer);
await db.insert({
  filename: file.name,
  url: result.url, // Just the URL
  key: result.key, // For deletion
  size: result.size,
});
```

---

### Pitfall 3: No Rate Limiting

```typescript
// ❌ BAD: No rate limiting
export const POST = async (context) => {
  const file = await context.request.formData().get('file');
  await uploadFile(file); // Can be abused
};
```

**Attack scenario:**
```bash
# Attacker uploads 10,000 files
for i in {1..10000}; do
  curl -F "file=@bigfile.mp4" https://yoursite.com/api/upload
done
# Result: 500GB storage used, $$$$ cost
```

**Fix:**
```typescript
// ✅ GOOD: Rate limit uploads
export const POST = async (context) => {
  const rateLimitResult = await rateLimit(context, 'UPLOAD');
  if (!rateLimitResult.allowed) {
    return error(429, 'Too many requests');
  }
  
  const file = await context.request.formData().get('file');
  await uploadFile(file);
};
```

---

## Testing Strategy

### Unit Tests

**What we test:**
- Authentication logic
- Authorization logic
- Validation logic
- Error handling

**How:**
```typescript
// Mock dependencies
vi.mock('@/lib/storage');
vi.mock('@/lib/fileValidation');

// Test endpoint
const response = await POST(mockContext);
expect(response.status).toBe(401);
```

---

### Integration Tests (Future)

**What to test:**
- Actual file upload
- Real storage integration
- Database updates
- End-to-end flow

**How:**
```typescript
const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
const formData = new FormData();
formData.append('file', file);

const response = await fetch('/api/courses/upload', {
  method: 'POST',
  body: formData,
});

expect(response.status).toBe(201);
const data = await response.json();
expect(data.data.url).toBeTruthy();
```

---

## Further Learning

### Topics to Explore

1. **Direct S3 Uploads**
   - Presigned URLs
   - Client-to-S3 (bypasses server)
   - Reduces server load

2. **Image Processing**
   - Sharp library
   - Resize, compress, watermark
   - Generate thumbnails

3. **Virus Scanning**
   - ClamAV integration
   - Cloud antivirus APIs
   - Scan before storage

4. **CDN Integration**
   - CloudFlare
   - AWS CloudFront
   - Faster global delivery

5. **WebSockets for Progress**
   - Real-time upload progress
   - Better UX
   - Cancel uploads

---

## Summary

We built a secure file upload system with:

✅ **Authentication:** Only logged-in users
✅ **Authorization:** Only admins and instructors
✅ **Rate Limiting:** Prevent abuse
✅ **Type Validation:** Only safe files
✅ **Size Validation:** Reasonable limits
✅ **Magic Bytes:** Verify actual content
✅ **Organized Storage:** By type and course
✅ **Good Error Handling:** Clear messages
✅ **Comprehensive Tests:** 18/18 passing

**Key Learnings:**
- Never trust client data
- Validate at multiple layers
- Use magic bytes to verify files
- Rate limit to prevent abuse
- Store files in file storage, not database
- Use UUIDs to prevent collisions

This foundation can be extended with image processing, virus scanning, CDN integration, and more advanced features as needed.
