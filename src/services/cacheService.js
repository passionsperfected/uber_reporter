const fs = require('fs').promises;
const path = require('path');
const os = require('os');

// Cache directory in user's home directory
const CACHE_DIR = path.join(os.homedir(), '.uber-utilities-cache');
const ACTIVITY_CACHE_DIR = path.join(CACHE_DIR, 'activity');
const TRIP_CACHE_DIR = path.join(CACHE_DIR, 'trip');
const PDF_CACHE_DIR = path.join(CACHE_DIR, 'pdf');

/**
 * Initialize cache directories
 */
async function initializeCacheDirectories() {
  await fs.mkdir(ACTIVITY_CACHE_DIR, { recursive: true });
  await fs.mkdir(TRIP_CACHE_DIR, { recursive: true });
  await fs.mkdir(PDF_CACHE_DIR, { recursive: true });
}

/**
 * Get cached activities by cache key
 * @param {string} cacheKey - Cache key (e.g., "2023-01-01_2023-12-31")
 * @returns {Promise<Array|null>} Cached activities or null if not found
 */
async function getCachedActivities(cacheKey) {
  try {
    await initializeCacheDirectories();
    const filePath = path.join(ACTIVITY_CACHE_DIR, `${cacheKey}_activity_cache.json`);
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    // Cache miss is not an error
    if (error.code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}

/**
 * Cache activities
 * @param {string} cacheKey - Cache key
 * @param {Array} activities - Activities to cache
 */
async function cacheActivities(cacheKey, activities) {
  try {
    await initializeCacheDirectories();
    const filePath = path.join(ACTIVITY_CACHE_DIR, `${cacheKey}_activity_cache.json`);
    await fs.writeFile(filePath, JSON.stringify(activities, null, 2));
  } catch (error) {
    console.error('Failed to cache activities:', error);
  }
}

/**
 * Get cached trip details
 * @param {string} tripUUID - Trip UUID
 * @returns {Promise<Object|null>} Cached trip details or null if not found
 */
async function getCachedTrip(tripUUID) {
  try {
    await initializeCacheDirectories();
    const filePath = path.join(TRIP_CACHE_DIR, `${tripUUID}.json`);
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    // Cache miss is not an error
    if (error.code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}

/**
 * Cache trip details
 * @param {string} tripUUID - Trip UUID
 * @param {Object} tripDetails - Trip details to cache
 */
async function cacheTrip(tripUUID, tripDetails) {
  try {
    await initializeCacheDirectories();
    const filePath = path.join(TRIP_CACHE_DIR, `${tripUUID}.json`);
    await fs.writeFile(filePath, JSON.stringify(tripDetails, null, 2));
  } catch (error) {
    console.error('Failed to cache trip:', error);
  }
}

/**
 * Get cache statistics
 * @returns {Promise<Object>} Cache statistics
 */
async function getCacheStats() {
  try {
    await initializeCacheDirectories();

    // Count activity cache files
    const activityFiles = await fs.readdir(ACTIVITY_CACHE_DIR);
    const activityCacheCount = activityFiles.filter(f => f.endsWith('.json')).length;

    // Count trip cache files
    const tripFiles = await fs.readdir(TRIP_CACHE_DIR);
    const tripCacheCount = tripFiles.filter(f => f.endsWith('.json')).length;

    // Count PDF cache files
    const pdfFiles = await fs.readdir(PDF_CACHE_DIR);
    const pdfCacheCount = pdfFiles.filter(f => f.endsWith('.pdf')).length;

    // Calculate total cache size
    let totalSize = 0;

    const calculateDirSize = async (dir, files) => {
      for (const file of files) {
        try {
          const filePath = path.join(dir, file);
          const stats = await fs.stat(filePath);
          if (stats.isFile()) {
            totalSize += stats.size;
          }
        } catch (err) {
          // Skip files that can't be read
        }
      }
    };

    await calculateDirSize(ACTIVITY_CACHE_DIR, activityFiles);
    await calculateDirSize(TRIP_CACHE_DIR, tripFiles);
    await calculateDirSize(PDF_CACHE_DIR, pdfFiles);

    // Convert size to human-readable format
    const formatSize = (bytes) => {
      if (bytes === 0) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    };

    return {
      activityCacheCount,
      tripCacheCount,
      pdfCacheCount,
      totalSize: formatSize(totalSize),
      totalSizeBytes: totalSize,
      cacheDir: CACHE_DIR
    };
  } catch (error) {
    console.error('Failed to get cache stats:', error);
    return {
      activityCacheCount: 0,
      tripCacheCount: 0,
      pdfCacheCount: 0,
      totalSize: '0 B',
      totalSizeBytes: 0,
      cacheDir: CACHE_DIR
    };
  }
}

/**
 * Clear all cache
 */
async function clearCache() {
  try {
    await fs.rm(CACHE_DIR, { recursive: true, force: true });
    await initializeCacheDirectories();
  } catch (error) {
    console.error('Failed to clear cache:', error);
    throw error;
  }
}

module.exports = {
  getCachedActivities,
  cacheActivities,
  getCachedTrip,
  cacheTrip,
  getCacheStats,
  clearCache,
  CACHE_DIR,
  PDF_CACHE_DIR
};
