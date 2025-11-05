/**
 * Database Performance Analysis Script
 * Task T140: Optimize database queries (add indexes, analyze slow queries)
 *
 * This script:
 * - Analyzes table sizes and index usage
 * - Identifies slow queries
 * - Detects missing indexes
 * - Recommends optimizations
 * - Generates performance report
 *
 * Usage: tsx src/scripts/analyzeDatabasePerformance.ts
 */

import { pool } from '../lib/db';

interface TableSize {
  schema: string;
  table: string;
  totalSize: string;
  tableSize: string;
  indexesSize: string;
  rowCount: number;
}

interface IndexUsage {
  schema: string;
  table: string;
  index: string;
  indexScans: number;
  tuplesFetched: number;
  size: string;
  definition: string;
}

interface SlowQuery {
  query: string;
  calls: number;
  totalTime: number;
  meanTime: number;
  minTime: number;
  maxTime: number;
}

interface MissingIndexSuggestion {
  table: string;
  column: string;
  reason: string;
  estimatedImpact: 'high' | 'medium' | 'low';
}

/**
 * Get table sizes ordered by total size
 */
async function getTableSizes(): Promise<TableSize[]> {
  const query = `
    SELECT
      schemaname AS schema,
      tablename AS table,
      pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size,
      pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS table_size,
      pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) AS indexes_size,
      n_live_tup AS row_count
    FROM pg_stat_user_tables
    WHERE schemaname = 'public'
    ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
  `;

  const result = await pool.query(query);

  return result.rows.map(row => ({
    schema: row.schema,
    table: row.table,
    totalSize: row.total_size,
    tableSize: row.table_size,
    indexesSize: row.indexes_size,
    rowCount: parseInt(row.row_count, 10) || 0,
  }));
}

/**
 * Get index usage statistics
 */
async function getIndexUsage(): Promise<IndexUsage[]> {
  const query = `
    SELECT
      schemaname AS schema,
      tablename AS table,
      indexname AS index,
      idx_scan AS index_scans,
      idx_tup_fetch AS tuples_fetched,
      pg_size_pretty(pg_relation_size(indexrelid)) AS size,
      indexdef AS definition
    FROM pg_stat_user_indexes
    JOIN pg_indexes ON pg_stat_user_indexes.indexname = pg_indexes.indexname
      AND pg_stat_user_indexes.schemaname = pg_indexes.schemaname
    WHERE pg_stat_user_indexes.schemaname = 'public'
    ORDER BY idx_scan ASC, pg_relation_size(indexrelid) DESC;
  `;

  const result = await pool.query(query);

  return result.rows.map(row => ({
    schema: row.schema,
    table: row.table,
    index: row.index,
    indexScans: parseInt(row.index_scans, 10) || 0,
    tuplesFetched: parseInt(row.tuples_fetched, 10) || 0,
    size: row.size,
    definition: row.definition,
  }));
}

/**
 * Get slow queries from pg_stat_statements
 * Requires pg_stat_statements extension to be enabled
 */
async function getSlowQueries(): Promise<SlowQuery[]> {
  try {
    // First check if pg_stat_statements is available
    const checkExtension = await pool.query(`
      SELECT EXISTS (
        SELECT 1 FROM pg_extension WHERE extname = 'pg_stat_statements'
      ) AS has_extension;
    `);

    if (!checkExtension.rows[0].has_extension) {
      console.log('⚠️  pg_stat_statements extension not enabled. Skipping slow query analysis.');
      console.log('   To enable: CREATE EXTENSION pg_stat_statements;');
      return [];
    }

    const query = `
      SELECT
        query,
        calls,
        total_exec_time AS total_time,
        mean_exec_time AS mean_time,
        min_exec_time AS min_time,
        max_exec_time AS max_time
      FROM pg_stat_statements
      WHERE query NOT LIKE '%pg_stat_statements%'
        AND query NOT LIKE '%pg_catalog%'
      ORDER BY mean_exec_time DESC
      LIMIT 20;
    `;

    const result = await pool.query(query);

    return result.rows.map(row => ({
      query: row.query,
      calls: parseInt(row.calls, 10) || 0,
      totalTime: parseFloat(row.total_time) || 0,
      meanTime: parseFloat(row.mean_time) || 0,
      minTime: parseFloat(row.min_time) || 0,
      maxTime: parseFloat(row.max_time) || 0,
    }));
  } catch (error) {
    console.log('⚠️  Unable to fetch slow queries. pg_stat_statements may not be configured.');
    return [];
  }
}

/**
 * Analyze queries and suggest missing indexes
 */
async function suggestMissingIndexes(): Promise<MissingIndexSuggestion[]> {
  const suggestions: MissingIndexSuggestion[] = [];

  // Check for sequential scans on large tables
  const seqScanQuery = `
    SELECT
      schemaname || '.' || relname AS table,
      seq_scan,
      idx_scan,
      n_live_tup AS row_count,
      seq_scan::float / GREATEST(idx_scan, 1)::float AS seq_to_idx_ratio
    FROM pg_stat_user_tables
    WHERE schemaname = 'public'
      AND n_live_tup > 1000
      AND seq_scan > 0
    ORDER BY seq_to_idx_ratio DESC, n_live_tup DESC
    LIMIT 10;
  `;

  const seqScanResult = await pool.query(seqScanQuery);

  for (const row of seqScanResult.rows) {
    if (row.seq_to_idx_ratio > 10) {
      suggestions.push({
        table: row.table.split('.')[1],
        column: 'frequently_queried_columns',
        reason: `Table has ${row.seq_scan} sequential scans vs ${row.idx_scan || 0} index scans. Consider adding indexes on WHERE/JOIN columns.`,
        estimatedImpact: 'high',
      });
    } else if (row.seq_to_idx_ratio > 3) {
      suggestions.push({
        table: row.table.split('.')[1],
        column: 'filter_columns',
        reason: `High ratio of sequential to index scans. Review query patterns and add appropriate indexes.`,
        estimatedImpact: 'medium',
      });
    }
  }

  return suggestions;
}

/**
 * Get cache hit ratio
 */
async function getCacheHitRatio(): Promise<{ ratio: number; bufferHits: number; diskReads: number }> {
  const query = `
    SELECT
      sum(heap_blks_read) AS disk_reads,
      sum(heap_blks_hit) AS buffer_hits,
      sum(heap_blks_hit) / GREATEST(sum(heap_blks_hit) + sum(heap_blks_read), 1) AS ratio
    FROM pg_statio_user_tables;
  `;

  const result = await pool.query(query);
  const row = result.rows[0];

  return {
    ratio: parseFloat(row.ratio) || 0,
    bufferHits: parseInt(row.buffer_hits, 10) || 0,
    diskReads: parseInt(row.disk_reads, 10) || 0,
  };
}

/**
 * Get database connection statistics
 */
async function getConnectionStats(): Promise<{
  totalConnections: number;
  activeConnections: number;
  idleConnections: number;
  maxConnections: number;
}> {
  const query = `
    SELECT
      count(*) AS total,
      count(*) FILTER (WHERE state = 'active') AS active,
      count(*) FILTER (WHERE state = 'idle') AS idle
    FROM pg_stat_activity;
  `;

  const maxConnQuery = `SHOW max_connections;`;

  const [statsResult, maxConnResult] = await Promise.all([
    pool.query(query),
    pool.query(maxConnQuery),
  ]);

  const stats = statsResult.rows[0];
  const maxConn = maxConnResult.rows[0];

  return {
    totalConnections: parseInt(stats.total, 10) || 0,
    activeConnections: parseInt(stats.active, 10) || 0,
    idleConnections: parseInt(stats.idle, 10) || 0,
    maxConnections: parseInt(maxConn.max_connections, 10) || 100,
  };
}

/**
 * Generate and print performance report
 */
async function generateReport(): Promise<void> {
  console.log('\n' + '='.repeat(80));
  console.log('DATABASE PERFORMANCE ANALYSIS REPORT');
  console.log('='.repeat(80));
  console.log(`Generated: ${new Date().toISOString()}\n`);

  // Connection Statistics
  console.log('─'.repeat(80));
  console.log('CONNECTION STATISTICS');
  console.log('─'.repeat(80));
  const connStats = await getConnectionStats();
  console.log(`Total Connections:  ${connStats.totalConnections}/${connStats.maxConnections}`);
  console.log(`Active:             ${connStats.activeConnections}`);
  console.log(`Idle:               ${connStats.idleConnections}`);

  const connUsagePercent = (connStats.totalConnections / connStats.maxConnections) * 100;
  if (connUsagePercent > 80) {
    console.log(`⚠️  WARNING: Using ${connUsagePercent.toFixed(1)}% of available connections`);
  }
  console.log('');

  // Cache Hit Ratio
  console.log('─'.repeat(80));
  console.log('CACHE PERFORMANCE');
  console.log('─'.repeat(80));
  const cacheStats = await getCacheHitRatio();
  const cacheHitPercent = cacheStats.ratio * 100;
  console.log(`Cache Hit Ratio:    ${cacheHitPercent.toFixed(2)}%`);
  console.log(`Buffer Hits:        ${cacheStats.bufferHits.toLocaleString()}`);
  console.log(`Disk Reads:         ${cacheStats.diskReads.toLocaleString()}`);

  if (cacheHitPercent < 90) {
    console.log(`⚠️  WARNING: Cache hit ratio below 90%. Consider increasing shared_buffers.`);
  } else if (cacheHitPercent >= 95) {
    console.log(`✅ Excellent cache hit ratio!`);
  }
  console.log('');

  // Table Sizes
  console.log('─'.repeat(80));
  console.log('TABLE SIZES (Top 10)');
  console.log('─'.repeat(80));
  const tableSizes = await getTableSizes();
  console.log(
    `${'Table'.padEnd(30)} ${'Total Size'.padStart(12)} ${'Table'.padStart(12)} ${'Indexes'.padStart(12)} ${'Rows'.padStart(12)}`
  );
  console.log('─'.repeat(80));

  tableSizes.slice(0, 10).forEach(table => {
    console.log(
      `${table.table.padEnd(30)} ${table.totalSize.padStart(12)} ${table.tableSize.padStart(12)} ${table.indexesSize.padStart(12)} ${table.rowCount.toLocaleString().padStart(12)}`
    );
  });
  console.log('');

  // Index Usage
  console.log('─'.repeat(80));
  console.log('INDEX USAGE');
  console.log('─'.repeat(80));
  const indexes = await getIndexUsage();

  const unusedIndexes = indexes.filter(idx => idx.indexScans === 0 && !idx.index.includes('pkey'));
  const usedIndexes = indexes.filter(idx => idx.indexScans > 0);

  console.log(`Total Indexes:      ${indexes.length}`);
  console.log(`Used Indexes:       ${usedIndexes.length}`);
  console.log(`Unused Indexes:     ${unusedIndexes.length}`);
  console.log('');

  if (unusedIndexes.length > 0) {
    console.log('⚠️  UNUSED INDEXES (consider removing):');
    console.log(`${'Index'.padEnd(40)} ${'Table'.padEnd(20)} ${'Size'.padStart(10)}`);
    console.log('─'.repeat(80));
    unusedIndexes.slice(0, 10).forEach(idx => {
      console.log(`${idx.index.padEnd(40)} ${idx.table.padEnd(20)} ${idx.size.padStart(10)}`);
    });
    console.log('');
  }

  // Most Used Indexes
  const topIndexes = usedIndexes.sort((a, b) => b.indexScans - a.indexScans).slice(0, 10);
  if (topIndexes.length > 0) {
    console.log('✅ MOST USED INDEXES:');
    console.log(`${'Index'.padEnd(40)} ${'Scans'.padStart(15)} ${'Size'.padStart(10)}`);
    console.log('─'.repeat(80));
    topIndexes.forEach(idx => {
      console.log(`${idx.index.padEnd(40)} ${idx.indexScans.toLocaleString().padStart(15)} ${idx.size.padStart(10)}`);
    });
    console.log('');
  }

  // Slow Queries
  console.log('─'.repeat(80));
  console.log('SLOW QUERIES (Top 10 by average execution time)');
  console.log('─'.repeat(80));
  const slowQueries = await getSlowQueries();

  if (slowQueries.length > 0) {
    slowQueries.slice(0, 10).forEach((query, i) => {
      console.log(`${i + 1}. ${query.meanTime.toFixed(2)}ms avg (${query.calls} calls, ${query.maxTime.toFixed(2)}ms max)`);
      console.log(`   ${query.query.substring(0, 75)}...`);
      console.log('');
    });
  } else {
    console.log('No slow query data available. Enable pg_stat_statements extension for detailed metrics.');
    console.log('');
  }

  // Missing Index Suggestions
  console.log('─'.repeat(80));
  console.log('MISSING INDEX SUGGESTIONS');
  console.log('─'.repeat(80));
  const suggestions = await suggestMissingIndexes();

  if (suggestions.length > 0) {
    suggestions.forEach((suggestion, i) => {
      const priority = suggestion.estimatedImpact === 'high' ? '🔴' : suggestion.estimatedImpact === 'medium' ? '🟡' : '🟢';
      console.log(`${i + 1}. ${priority} Table: ${suggestion.table}`);
      console.log(`   Column: ${suggestion.column}`);
      console.log(`   Reason: ${suggestion.reason}`);
      console.log(`   Impact: ${suggestion.estimatedImpact.toUpperCase()}`);
      console.log('');
    });
  } else {
    console.log('✅ No obvious missing indexes detected.');
    console.log('');
  }

  // Recommendations
  console.log('─'.repeat(80));
  console.log('RECOMMENDATIONS');
  console.log('─'.repeat(80));

  const recommendations: string[] = [];

  if (cacheHitPercent < 90) {
    recommendations.push('Increase shared_buffers to improve cache hit ratio');
  }

  if (unusedIndexes.length > 5) {
    recommendations.push(`Remove ${unusedIndexes.length} unused indexes to reduce storage and write overhead`);
  }

  if (suggestions.filter(s => s.estimatedImpact === 'high').length > 0) {
    recommendations.push('Add high-priority indexes for tables with excessive sequential scans');
  }

  if (connUsagePercent > 80) {
    recommendations.push('Monitor connection usage - approaching max_connections limit');
  }

  if (slowQueries.some(q => q.meanTime > 1000)) {
    recommendations.push('Optimize queries with >1000ms average execution time');
  }

  if (recommendations.length > 0) {
    recommendations.forEach((rec, i) => {
      console.log(`${i + 1}. ${rec}`);
    });
  } else {
    console.log('✅ No critical issues detected. Database performance looks good!');
  }

  console.log('');
  console.log('='.repeat(80));
  console.log('');
}

/**
 * Main execution
 */
async function main(): Promise<void> {
  try {
    await generateReport();
    process.exit(0);
  } catch (error) {
    console.error('Error generating performance report:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { generateReport, getTableSizes, getIndexUsage, getSlowQueries, suggestMissingIndexes };
