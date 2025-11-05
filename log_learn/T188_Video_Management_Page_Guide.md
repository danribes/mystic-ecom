# T188: Video Management Page - Learning Guide

**Task**: Create admin video management interface
**Complexity**: Intermediate
**Topics**: Admin CRUD operations, inline editing, modal dialogs, search/filter
**Date**: 2025-11-04

---

## Table of Contents

1. [Overview](#overview)
2. [Learning Objectives](#learning-objectives)
3. [Key Concepts](#key-concepts)
4. [Implementation Steps](#implementation-steps)
5. [Best Practices](#best-practices)
6. [Common Pitfalls](#common-pitfalls)

---

## Overview

This guide teaches you how to build a complete admin interface for managing resources (videos) with CRUD operations, inline editing, search/filter, and modal dialogs.

### What We're Building

An admin video management page that:
- Lists all videos in a table
- Allows inline editing of metadata
- Provides delete functionality with confirmation
- Implements search and filter
- Shows different status states
- Works responsively on all devices

---

## Learning Objectives

By the end of this guide, you will understand:

1. **CRUD Operations**: How to implement Create, Read, Update, Delete
2. **Inline Editing**: How to edit data without leaving the page
3. **Modal Dialogs**: How to implement confirmation modals
4. **Search/Filter**: How to implement client-side filtering
5. **State Management**: How to manage UI state for editing/deleting
6. **API Design**: How to build RESTful update/delete endpoints

---

## Key Concepts

### 1. Inline Editing Pattern

Instead of navigating to a separate edit page, allow users to edit directly in the list:

```typescript
// State: Display mode or Edit mode
const [isEditing, setIsEditing] = useState(false);

// Toggle between modes
<div className={isEditing ? 'hidden' : 'block'}>
  <h3>{title}</h3>
  <button onClick={() => setIsEditing(true)}>Edit</button>
</div>

<div className={isEditing ? 'block' : 'hidden'}>
  <input value={title} onChange={...} />
  <button onClick={handleSave}>Save</button>
  <button onClick={() => setIsEditing(false)}>Cancel</button>
</div>
```

**Benefits**:
- Faster workflow (no page navigation)
- Better UX (see context while editing)
- Less code (no separate edit page)

### 2. Confirmation Modal Pattern

Always confirm destructive actions (delete):

```typescript
// Show modal
function handleDeleteClick() {
  setItemToDelete(item);
  setShowModal(true);
}

// Confirm deletion
async function handleConfirm() {
  await deleteItem(itemToDelete.id);
  setShowModal(false);
  removeFromList(itemToDelete.id);
}
```

**Why Important**: Prevents accidental deletions, gives users a chance to reconsider.

### 3. Client-Side Search and Filter

For moderate-sized lists (< 1000 items), filter on client:

```typescript
function handleSearch(searchTerm) {
  const filtered = allItems.filter(item =>
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.lessonId.toLowerCase().includes(searchTerm.toLowerCase())
  );
  displayItems(filtered);
}
```

**Benefits**:
- Instant results (no API call)
- Works offline
- Reduces server load

**When to Use Server-Side**: Lists with 1000+ items, complex filters, or when you need to preserve state across page loads.

### 4. API Endpoint Design

**Update Endpoint** (PUT):
```typescript
PUT /api/admin/videos/update
Body: { videoId, title, description }
Response: { success: true, video: {...} }
```

**Delete Endpoint** (DELETE):
```typescript
DELETE /api/admin/videos/delete
Body: { videoId }
Response: { success: true, message: "Deleted" }
```

**RESTful Principles**:
- PUT for updates (idempotent)
- DELETE for deletions
- Return updated resource or success status
- Use proper HTTP status codes (200, 404, 500)

### 5. Optimistic vs. Pessimistic UI Updates

**Pessimistic** (wait for API response):
```typescript
async function handleDelete() {
  const response = await deleteAPI(id);
  if (response.ok) {
    removeFromUI(id); // ✅ Only update UI after success
  }
}
```

**Optimistic** (update UI immediately):
```typescript
async function handleDelete() {
  removeFromUI(id); // Update UI first
  try {
    await deleteAPI(id);
  } catch (error) {
    addBackToUI(id); // ✅ Rollback on error
  }
}
```

**When to Use**:
- Pessimistic: Important operations (delete, payment)
- Optimistic: Fast operations (like, favorite)

---

## Implementation Steps

### Step 1: Create the Page with Video List

```astro
---
import { getCourseVideos } from '@/lib/videos';

const { id: courseId } = Astro.params;
const videos = await getCourseVideos(courseId);
---

<table>
  <thead>
    <tr>
      <th>Video</th>
      <th>Lesson</th>
      <th>Duration</th>
      <th>Status</th>
      <th>Actions</th>
    </tr>
  </thead>
  <tbody>
    {videos.map((video) => (
      <tr data-video-id={video.id}>
        <td>{video.title}</td>
        <td>{video.lesson_id}</td>
        <td>{formatDuration(video.duration)}</td>
        <td>{video.status}</td>
        <td>
          <button class="edit-btn">Edit</button>
          <button class="delete-btn">Delete</button>
        </td>
      </tr>
    ))}
  </tbody>
</table>
```

### Step 2: Implement Inline Editing

```html
<td>
  <!-- Display Mode -->
  <div class="display-mode">
    <h3>{video.title}</h3>
    <p>{video.description}</p>
  </div>

  <!-- Edit Mode (hidden by default) -->
  <div class="edit-mode hidden">
    <input class="title-input" value={video.title} />
    <textarea class="desc-input">{video.description}</textarea>
    <button class="save-btn">Save</button>
    <button class="cancel-btn">Cancel</button>
  </div>
</td>

<script>
// Toggle edit mode
document.querySelectorAll('.edit-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    const row = e.target.closest('tr');
    row.querySelector('.display-mode').classList.add('hidden');
    row.querySelector('.edit-mode').classList.remove('hidden');
  });
});

// Save changes
document.querySelectorAll('.save-btn').forEach(btn => {
  btn.addEventListener('click', async (e) => {
    const row = e.target.closest('tr');
    const videoId = row.dataset.videoId;
    const title = row.querySelector('.title-input').value;
    const description = row.querySelector('.desc-input').value;

    await fetch('/api/admin/videos/update', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoId, title, description })
    });

    // Update display
    row.querySelector('.display-mode h3').textContent = title;
    row.querySelector('.display-mode p').textContent = description;

    // Hide edit mode
    row.querySelector('.edit-mode').classList.add('hidden');
    row.querySelector('.display-mode').classList.remove('hidden');
  });
});
</script>
```

### Step 3: Implement Delete with Confirmation

```html
<!-- Delete Confirmation Modal -->
<div id="delete-modal" class="modal hidden">
  <div class="modal-content">
    <h3>Delete Video</h3>
    <p>Are you sure you want to delete "<span id="video-title"></span>"?</p>
    <button id="confirm-delete">Delete</button>
    <button id="cancel-delete">Cancel</button>
  </div>
</div>

<script>
let videoToDelete = null;

// Show modal
document.querySelectorAll('.delete-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    const row = e.target.closest('tr');
    videoToDelete = {
      id: row.dataset.videoId,
      title: row.querySelector('h3').textContent
    };

    document.getElementById('video-title').textContent = videoToDelete.title;
    document.getElementById('delete-modal').classList.remove('hidden');
  });
});

// Confirm delete
document.getElementById('confirm-delete').addEventListener('click', async () => {
  await fetch('/api/admin/videos/delete', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ videoId: videoToDelete.id })
  });

  // Remove row from table
  const row = document.querySelector(`[data-video-id="${videoToDelete.id}"]`);
  row.remove();

  // Hide modal
  document.getElementById('delete-modal').classList.add('hidden');
  videoToDelete = null;
});
</script>
```

### Step 4: Implement Search and Filter

```html
<input id="search" placeholder="Search videos..." />
<select id="status-filter">
  <option value="">All Statuses</option>
  <option value="ready">Ready</option>
  <option value="inprogress">Processing</option>
</select>

<script>
function applyFilters() {
  const searchTerm = document.getElementById('search').value.toLowerCase();
  const statusFilter = document.getElementById('status-filter').value;

  document.querySelectorAll('tbody tr').forEach(row => {
    const title = row.querySelector('h3').textContent.toLowerCase();
    const status = row.querySelector('.status-badge').textContent.toLowerCase();

    const matchesSearch = title.includes(searchTerm);
    const matchesStatus = !statusFilter || status === statusFilter;

    row.style.display = (matchesSearch && matchesStatus) ? '' : 'none';
  });
}

document.getElementById('search').addEventListener('input', applyFilters);
document.getElementById('status-filter').addEventListener('change', applyFilters);
</script>
```

### Step 5: Create Update API Endpoint

```typescript
// src/pages/api/admin/videos/update.ts
import type { APIRoute } from 'astro';
import { checkAdminAuth } from '@/lib/auth/admin';
import { updateVideoMetadata } from '@/lib/videos';

export const PUT: APIRoute = async ({ request, cookies }) => {
  // 1. Check authentication
  const authResult = await checkAdminAuth(cookies);
  if (!authResult.user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  // 2. Parse request
  const { videoId, title, description } = await request.json();

  // 3. Validate inputs
  if (!videoId || !title) {
    return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
  }

  // 4. Update in database
  const video = await updateVideoMetadata(videoId, {
    title: title.trim(),
    description: description?.trim() || null,
  });

  // 5. Return success
  return new Response(JSON.stringify({ success: true, video }), { status: 200 });
};
```

### Step 6: Create Delete API Endpoint

```typescript
// src/pages/api/admin/videos/delete.ts
import type { APIRoute } from 'astro';
import { checkAdminAuth } from '@/lib/auth/admin';
import { deleteVideoRecord } from '@/lib/videos';
import { deleteVideo as deleteFromCloudflare } from '@/lib/cloudflare';

export const DELETE: APIRoute = async ({ request, cookies }) => {
  // 1. Check authentication
  const authResult = await checkAdminAuth(cookies);
  if (!authResult.user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  // 2. Parse request
  const { videoId } = await request.json();

  // 3. Get video details
  const video = await getVideoById(videoId);
  if (!video) {
    return new Response(JSON.stringify({ error: 'Video not found' }), { status: 404 });
  }

  // 4. Delete from Cloudflare (graceful failure)
  try {
    await deleteFromCloudflare(video.cloudflare_video_id);
  } catch (error) {
    logger.error('Cloudflare deletion failed:', error);
    // Continue with database deletion
  }

  // 5. Delete from database
  await deleteVideoRecord(videoId);

  // 6. Return success
  return new Response(JSON.stringify({ success: true }), { status: 200 });
};
```

---

## Best Practices

### 1. Always Validate User Input

```typescript
// Client-side
if (!title.trim()) {
  alert('Title cannot be empty');
  return;
}

// Server-side
if (!videoId || !title) {
  return new Response(JSON.stringify({ error: 'Invalid input' }), { status: 400 });
}
```

### 2. Provide User Feedback

```typescript
// Loading state
button.disabled = true;
button.textContent = 'Saving...';

// Success state
button.textContent = 'Saved!';
setTimeout(() => {
  button.textContent = 'Save';
  button.disabled = false;
}, 1500);

// Error state
alert('Failed to save. Please try again.');
button.disabled = false;
```

### 3. Handle Errors Gracefully

```typescript
try {
  await deleteAPI(id);
  removeFromUI(id);
} catch (error) {
  console.error('Delete failed:', error);
  alert('Failed to delete. Please try again.');
  // Don't remove from UI if API failed
}
```

### 4. Use Data Attributes

```html
<button
  class="delete-btn"
  data-video-id={video.id}
  data-video-title={video.title}
>
  Delete
</button>

<script>
const btn = event.target;
const videoId = btn.dataset.videoId;
const title = btn.dataset.videoTitle;
</script>
```

### 5. Keyboard Accessibility

```html
<!-- Close modal on Escape -->
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && isModalOpen) {
    closeModal();
  }
});

<!-- Submit form on Enter -->
input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    handleSave();
  }
});
```

---

## Common Pitfalls

### 1. Not Resetting Form on Cancel

**Problem**: Edited values persist after cancel
**Solution**: Store original values and restore on cancel

```typescript
const originalTitle = input.dataset.original;
input.addEventListener('cancel', () => {
  input.value = originalTitle; // Reset to original
});
```

### 2. Forgetting to Disable Buttons During Operations

**Problem**: Users can click multiple times, causing duplicate requests
**Solution**: Disable button during async operations

```typescript
button.disabled = true; // Disable immediately
await asyncOperation();
button.disabled = false; // Re-enable after
```

### 3. Not Handling Cloudflare Deletion Failures

**Problem**: Video deleted from DB but still in Cloudflare (orphaned)
**Solution**: Log error but continue with DB deletion

```typescript
try {
  await deleteFromCloudflare(videoId);
} catch (error) {
  logger.error('Cloudflare deletion failed:', error);
  // Continue anyway - DB deletion is more important
}
await deleteFromDatabase(videoId);
```

### 4. Memory Leaks with Event Listeners

**Problem**: Adding event listeners without removing them
**Solution**: Use event delegation or remove listeners

```typescript
// ✅ Good: Event delegation
document.addEventListener('click', (e) => {
  if (e.target.matches('.delete-btn')) {
    handleDelete(e);
  }
});

// ❌ Bad: Individual listeners
items.forEach(item => {
  item.addEventListener('click', handleDelete); // Memory leak!
});
```

---

## Conclusion

You've learned how to build a complete admin management interface with:
- ✅ CRUD operations
- ✅ Inline editing
- ✅ Delete confirmation modals
- ✅ Search and filter
- ✅ RESTful API endpoints
- ✅ Error handling and user feedback

### Next Steps

1. **Add Pagination**: For large lists
2. **Add Bulk Actions**: Select and delete multiple items
3. **Add Sorting**: Click column headers to sort
4. **Add Export**: Export list to CSV

---

**Author**: Claude Code
**Version**: 1.0
**Last Updated**: 2025-11-04
