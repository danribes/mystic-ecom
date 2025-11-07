# T155: Database Backup - Learning Guide

**Task**: Configure automated database backups
**Date**: November 5, 2025
**Difficulty**: Intermediate
**Technologies**: PostgreSQL, Backup & Recovery, DevOps

---

## Table of Contents

1. [Introduction](#introduction)
2. [Why Backups Matter](#why-backups-matter)
3. [Key Concepts](#key-concepts)
4. [Understanding pg_dump](#understanding-pg_dump)
5. [Implementation Guide](#implementation-guide)
6. [Retention Policies](#retention-policies)
7. [Backup Strategies](#backup-strategies)
8. [Best Practices](#best-practices)
9. [Troubleshooting](#troubleshooting)

---

## Introduction

This guide teaches you how to implement automated database backups for PostgreSQL databases. You'll learn why backups are critical, how to create them, and how to manage them effectively.

### What You'll Learn

- Why database backups are essential
- How pg_dump works
- Creating automated backups
- Implementing retention policies
- Restoring from backups
- Managing backups via API
- Best practices for production

### Prerequisites

- Basic understanding of databases
- PostgreSQL knowledge
- Command line basics
- Understanding of cron (for scheduling)

---

## Why Backups Matter

### The Stakes Are High

**Without Backups**:
```
😱 Hard drive fails → All data lost
😱 Accidental DELETE → Customer data gone
😱 Ransomware attack → Database encrypted
😱 No recovery possible → Business over
```

**With Backups**:
```
✅ Hard drive fails → Restore from backup
✅ Accidental DELETE → Restore yesterday's backup
✅ Ransomware attack → Restore clean backup
✅ Back in business within hours
```

### Real-World Example

**Scenario**: E-commerce site with 10,000 customers
```
Without backup:
- Database corruption occurs
- All orders lost
- Customer data gone
- Legal liability
- Business reputation destroyed

With backup (taken 1 hour ago):
- Restore database (10 minutes)
- Lost only last hour of orders
- Contact affected customers
- Resume operations
- Business continues
```

---

## Key Concepts

### 1. Backup vs Snapshot

**Backup**:
```
Full copy of database at a point in time
- Stored as file
- Can be moved/copied
- Independent of database
```

**Snapshot**:
```
Point-in-time reference
- Stored by database system
- Fast to create
- Tied to database
```

**Our Implementation**: Uses backups (portable files)

---

### 2. Backup Types

#### Full Backup
```
Complete copy of entire database
- All tables, data, schemas
- Largest file size
- Longest time
- Simplest to restore
```

**Example**: 10GB database → 10GB backup file

#### Incremental Backup
```
Only changes since last backup
- Smaller files
- Faster
- Complex to restore (need all files)
```

**Example**: 10GB database → 100MB incremental

**Our Implementation**: Full backups (simpler, more reliable)

---

### 3. Backup Formats

#### Plain SQL (`.sql`)
```sql
-- Plain text SQL commands
CREATE TABLE users (...);
INSERT INTO users VALUES (...);
```

**Pros**: Human-readable, portable
**Cons**: Large file size, slower restore

#### Custom Format (`.dump`)
```
Binary compressed format
- Not human-readable
- Compressed
- Fastest restore
```

**Pros**: Smaller size (60-80% reduction), faster
**Cons**: Need pg_restore tool

**Our Default**: Custom format (best balance)

---

### 4. Retention Policy

**What**: Rules for keeping/deleting old backups

**Two Strategies**:

**Count-Based**:
```
Keep last 10 backups
- Always have 10 most recent
- Old backups deleted automatically
```

**Time-Based**:
```
Keep backups for 30 days
- Backups older than 30 days deleted
- Calendar-based retention
```

**Our Implementation**: Both (whichever triggers first)

---

## Understanding pg_dump

### What is pg_dump?

**pg_dump** = PostgreSQL's backup tool

```bash
pg_dump -h localhost -U user -d mydb -f backup.sql
```

**What it does**:
1. Connects to PostgreSQL database
2. Reads all tables and data
3. Exports to file
4. Creates restorable backup

---

### pg_dump Options

#### Host & Authentication
```bash
-h localhost     # Database host
-p 5432         # Port
-U username     # Username
-d database     # Database name
PGPASSWORD=xxx  # Password (via environment)
```

#### Format Options
```bash
-Fc  # Custom format (compressed, binary)
-Ft  # Tar format
     # (no flag) Plain SQL format
```

#### Compression
```bash
-Z 9  # Maximum compression (level 9)
```

#### Output
```bash
-f backup.dump  # Output file
```

#### Example Command
```bash
PGPASSWORD=secret pg_dump \
  -h localhost \
  -p 5432 \
  -U myuser \
  -d mydb \
  -Fc \
  -Z 9 \
  -f backup.dump
```

---

## Implementation Guide

### Step 1: Create Backup Manually

```bash
# Using our CLI tool
npm run backup

# Expected output:
📦 Starting database backup...
🔄 Creating backup: mydb_2025-11-05_14-30-00.dump
✅ Backup created: mydb_2025-11-05_14-30-00.dump (15.2 MB) in 2345ms
```

---

### Step 2: List Existing Backups

```bash
npm run backup:list

# Output:
📋 Listing backups...

Found 3 backup(s):

1. mydb_2025-11-05_14-30-00.dump
   Size: 15.2 MB
   Created: 2025-11-05 14:30:00
   Format: custom
```

---

### Step 3: View Backup Statistics

```bash
npm run backup:stats

# Output:
📊 Backup Statistics

Total Backups: 10
Total Size: 150.5 MB
Newest: 2025-11-05 14:30:00
Oldest: 2025-10-25 08:00:00
Average Size: 15.05 MB

Retention Policy:
  Days: 30
  Count: 10
```

---

### Step 4: Clean Up Old Backups

```bash
npm run backup:cleanup

# Output:
🧹 Cleaning up old backups...
✅ Cleaned up 5 old backup(s)
```

**What Happens**:
1. Lists all backups
2. Applies retention policy (30 days OR keep 10)
3. Deletes backups that violate policy
4. Reports number deleted

---

### Step 5: Automate with Cron

**Daily Backup at 2 AM**:
```cron
0 2 * * * cd /path/to/app && npm run backup >> /var/log/backup.log 2>&1
```

**Weekly Cleanup on Sunday at 3 AM**:
```cron
0 3 * * 0 cd /path/to/app && npm run backup:cleanup >> /var/log/backup-cleanup.log 2>&1
```

**Explanation**:
- `0 2 * * *` = At 2:00 AM every day
- `cd /path/to/app` = Go to app directory
- `&& npm run backup` = Run backup command
- `>> /var/log/backup.log` = Append output to log
- `2>&1` = Include errors in log

---

## Retention Policies

### Strategy 1: Keep N Most Recent

```bash
# Keep 10 most recent backups
BACKUP_RETENTION_COUNT=10 npm run backup:cleanup
```

**How It Works**:
```
Backups (sorted newest to oldest):
1. backup_2025-11-05_14-00.dump  ← Keep
2. backup_2025-11-05_12-00.dump  ← Keep
3. backup_2025-11-05_10-00.dump  ← Keep
...
10. backup_2025-11-03_20-00.dump ← Keep
11. backup_2025-11-03_18-00.dump ← DELETE (too old)
12. backup_2025-11-03_16-00.dump ← DELETE
```

**Good For**: Predictable storage usage

---

### Strategy 2: Keep for N Days

```bash
# Keep backups for 30 days
BACKUP_RETENTION_DAYS=30 npm run backup:cleanup
```

**How It Works**:
```
Today: November 5, 2025
Cutoff: October 6, 2025

backup_2025-11-05_14-00.dump  ← Keep (within 30 days)
backup_2025-10-20_12-00.dump  ← Keep (within 30 days)
backup_2025-10-01_10-00.dump  ← DELETE (older than 30 days)
```

**Good For**: Compliance requirements (must keep 30 days)

---

### Strategy 3: Combined (Recommended)

```bash
# Keep 10 most recent OR within 30 days
BACKUP_RETENTION_COUNT=10
BACKUP_RETENTION_DAYS=30
npm run backup:cleanup
```

**Logic**:
```
Delete if:
- More than 10 backups exist AND backup is not in top 10
  OR
- Backup is older than 30 days
```

**Benefit**: Safety net (always have 10 backups even if very old)

---

## Backup Strategies

### Strategy 1: Frequent Backups

```cron
# Every 6 hours
0 */6 * * * npm run backup
```

**Pros**: Minimal data loss (max 6 hours)
**Cons**: More storage, more load on database

**Good For**: Critical databases, high-transaction apps

---

### Strategy 2: Daily Backups

```cron
# Once per day at 2 AM
0 2 * * * npm run backup
```

**Pros**: Less storage, less load
**Cons**: Max 24 hours data loss

**Good For**: Most applications, moderate data changes

---

### Strategy 3: Tiered Backups

```
Hourly: Keep 24 backups (last 24 hours)
Daily: Keep 7 backups (last 7 days)
Weekly: Keep 4 backups (last 4 weeks)
Monthly: Keep 12 backups (last 12 months)
```

**Pros**: Long history with manageable storage
**Cons**: Complex to implement

**Good For**: Compliance, audit requirements

---

## Best Practices

### 1. Test Your Backups

**Why**: Untested backup = no backup

```bash
# Create test database
createdb mydb_test

# Restore backup to test database
pg_restore -d mydb_test backup.dump

# Verify data
psql -d mydb_test -c "SELECT COUNT(*) FROM users;"

# Cleanup
dropdb mydb_test
```

**Do This**: Monthly backup test

---

### 2. Store Backups Off-Site

**Problem**: Server fails → backup lost with it

**Solution**: Copy to different location
```bash
# After backup, upload to S3
aws s3 cp backup.dump s3://mybucket/backups/

# Or copy to different server
scp backup.dump backup-server:/backups/
```

---

### 3. Monitor Backup Success

**Setup Alerts**:
```bash
# If backup fails, send alert
if ! npm run backup; then
  curl -X POST https://api.example.com/alert \
    -d "message=Backup failed!"
fi
```

---

### 4. Document Recovery Process

**Create Runbook**:
```markdown
## Disaster Recovery Procedure

1. Identify latest good backup
2. Create new database
3. Restore backup
4. Verify data integrity
5. Point application to new database
6. Monitor for errors

Estimated Recovery Time: 30 minutes
```

---

## Troubleshooting

### Backup Failed: pg_dump not found

**Error**:
```
pg_dump: command not found
```

**Solution**: Install PostgreSQL client tools
```bash
# Ubuntu/Debian
sudo apt-get install postgresql-client

# macOS
brew install postgresql

# Docker (add to Dockerfile)
RUN apt-get update && apt-get install -y postgresql-client
```

---

### Backup Failed: Connection refused

**Error**:
```
could not connect to server: Connection refused
```

**Check**:
1. Is PostgreSQL running?
   ```bash
   ps aux | grep postgres
   ```

2. Is DATABASE_URL correct?
   ```bash
   echo $DATABASE_URL
   ```

3. Can you connect manually?
   ```bash
   psql $DATABASE_URL
   ```

---

### Backup Too Large

**Problem**: 50GB backup file

**Solutions**:

1. **Use compression**:
   ```bash
   # Already done by default (-Fc -Z 9)
   ```

2. **Exclude large tables**:
   ```bash
   pg_dump -Fc -T large_table -f backup.dump
   ```

3. **Incremental backups** (advanced):
   Use Write-Ahead Logging (WAL) archiving

---

### Restore Takes Too Long

**Problem**: Restoring 10GB backup takes 2 hours

**Solutions**:

1. **Use parallel restore**:
   ```bash
   pg_restore -j 4 -d mydb backup.dump
   # -j 4 = use 4 parallel jobs
   ```

2. **Disable indexes during restore**:
   ```bash
   # Indexes rebuilt automatically but faster
   pg_restore --no-owner --no-acl -d mydb backup.dump
   ```

---

## Further Learning

### Resources
- [PostgreSQL Backup Documentation](https://www.postgresql.org/docs/current/backup.html)
- [pg_dump Manual](https://www.postgresql.org/docs/current/app-pgdump.html)
- [WAL Archiving](https://www.postgresql.org/docs/current/continuous-archiving.html)

### Next Steps
1. Implement backup monitoring
2. Set up off-site backup storage
3. Test restore procedure monthly
4. Create disaster recovery runbook
5. Implement backup encryption

---

## Conclusion

### Key Takeaways

1. **Backups Are Essential**: No backup = eventual data loss
2. **Automate Everything**: Manual backups will be forgotten
3. **Test Restores**: Untested backup might not work
4. **Multiple Locations**: On-site and off-site backups
5. **Monitor & Alert**: Know when backups fail
6. **Document Recovery**: Clear process saves time in crisis

### Remember

> "Hope is not a backup strategy. Test is not optional."

Database backups are insurance. You hope you never need them, but when you do, you'll be grateful they exist.

Happy backing up! 💾
