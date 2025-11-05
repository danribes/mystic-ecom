/**
 * Build Analysis Script
 *
 * Analyzes production build output and generates reports:
 * - Bundle size statistics
 * - Compression analysis
 * - Optimization recommendations
 * - Size threshold checks
 *
 * Usage: npm run build:analyze
 *
 * Part of T144: Minify and bundle assets for production
 */

import { readdir, stat, readFile } from 'fs/promises';
import { join, relative } from 'path';
import { gzipSync } from 'zlib';
import {
  type AssetInfo,
  type BundleStats,
  getAssetType,
  generateAssetHash,
  analyzeBundleStats,
  generateBundleReport,
  checkBundleSize,
  generateRecommendations,
  DEFAULT_THRESHOLDS,
  formatSize,
} from '../lib/buildOptimization';

/**
 * Recursively finds all files in a directory
 */
async function findFiles(dir: string, baseDir: string = dir): Promise<string[]> {
  const files: string[] = [];

  try {
    const entries = await readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);

      if (entry.isDirectory()) {
        // Skip node_modules and hidden directories
        if (entry.name === 'node_modules' || entry.name.startsWith('.')) {
          continue;
        }
        files.push(...(await findFiles(fullPath, baseDir)));
      } else {
        files.push(relative(baseDir, fullPath));
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error);
  }

  return files;
}

/**
 * Analyzes a single asset file
 */
async function analyzeAsset(
  filePath: string,
  distDir: string
): Promise<AssetInfo | null> {
  try {
    const fullPath = join(distDir, filePath);
    const stats = await stat(fullPath);
    const content = await readFile(fullPath);

    // Calculate gzip size
    const gzipSize = gzipSync(content).length;

    return {
      path: filePath,
      size: stats.size,
      gzipSize,
      hash: generateAssetHash(content),
      type: getAssetType(filePath),
    };
  } catch (error) {
    console.error(`Error analyzing asset ${filePath}:`, error);
    return null;
  }
}

/**
 * Main analysis function
 */
async function analyzeBuildOutput(distDir: string): Promise<BundleStats> {
  console.log(`\n🔍 Analyzing build output in: ${distDir}\n`);

  // Find all files
  const files = await findFiles(distDir);
  console.log(`Found ${files.length} files\n`);

  // Analyze each asset
  const assetPromises = files.map((file) => analyzeAsset(file, distDir));
  const assetResults = await Promise.all(assetPromises);
  const assets = assetResults.filter((asset): asset is AssetInfo => asset !== null);

  // Generate statistics
  const stats = analyzeBundleStats(assets);

  return stats;
}

/**
 * Main execution
 */
async function main() {
  const distDir = join(process.cwd(), 'dist');

  try {
    // Analyze build
    const stats = await analyzeBuildOutput(distDir);

    // Generate report
    const report = generateBundleReport(stats);
    console.log(report);

    // Check size thresholds
    const sizeCheck = checkBundleSize(stats, DEFAULT_THRESHOLDS);

    if (sizeCheck.warnings.length > 0) {
      console.log('\n⚠️  Warnings:');
      sizeCheck.warnings.forEach((warning) => console.log(`  - ${warning}`));
    }

    if (sizeCheck.errors.length > 0) {
      console.log('\n❌ Errors:');
      sizeCheck.errors.forEach((error) => console.log(`  - ${error}`));
    }

    if (sizeCheck.passed && sizeCheck.warnings.length === 0) {
      console.log('\n✅ All size checks passed!');
    }

    // Generate recommendations
    const recommendations = generateRecommendations(stats);

    if (recommendations.length > 0) {
      console.log('\n💡 Optimization Recommendations:');
      recommendations.forEach((rec) => {
        const icon = rec.type === 'error' ? '❌' : rec.type === 'warning' ? '⚠️' : 'ℹ️';
        console.log(`  ${icon} [${rec.category}] ${rec.message}`);
      });
    }

    // Summary
    console.log('\n📊 Summary:');
    console.log(`  Total Size:      ${formatSize(stats.totalSize)}`);
    console.log(`  Total Gzip:      ${formatSize(stats.totalGzipSize)}`);
    console.log(`  Assets:          ${stats.assets.length}`);
    console.log(`  Checks:          ${sizeCheck.passed ? '✅ Passed' : '❌ Failed'}`);
    console.log(`  Warnings:        ${sizeCheck.warnings.length}`);
    console.log(`  Recommendations: ${recommendations.length}`);
    console.log('');

    // Exit with error code if checks failed
    process.exit(sizeCheck.passed ? 0 : 1);
  } catch (error) {
    console.error('Error analyzing build:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { analyzeBuildOutput, main };
