const fs = require('fs').promises;
const path = require('path');
const os = require('os');

// Settings directory in user's home directory
const SETTINGS_DIR = path.join(os.homedir(), '.uber-utilities-settings');
const ADDRESS_MAPPINGS_FILE = path.join(SETTINGS_DIR, 'address-mappings.json');
const REPORT_CONFIG_FILE = path.join(SETTINGS_DIR, 'report-config.json');

/**
 * Initialize settings directory
 */
async function initializeSettingsDirectory() {
  await fs.mkdir(SETTINGS_DIR, { recursive: true });
}

/**
 * Save address mappings
 * @param {Array} mappings - Address mappings array
 */
async function saveAddressMappings(mappings) {
  try {
    await initializeSettingsDirectory();
    await fs.writeFile(ADDRESS_MAPPINGS_FILE, JSON.stringify(mappings, null, 2));
    console.log('Address mappings saved to internal storage');
  } catch (error) {
    console.error('Failed to save address mappings:', error);
    throw error;
  }
}

/**
 * Load address mappings
 * @returns {Promise<Array>} Address mappings array
 */
async function loadAddressMappings() {
  try {
    await initializeSettingsDirectory();
    const data = await fs.readFile(ADDRESS_MAPPINGS_FILE, 'utf8');
    const mappings = JSON.parse(data);
    console.log(`Loaded ${mappings.length} address mappings from internal storage`);
    return mappings;
  } catch (error) {
    // File doesn't exist or is invalid - return empty array
    if (error.code === 'ENOENT') {
      console.log('No saved address mappings found');
      return [];
    }
    console.error('Failed to load address mappings:', error);
    return [];
  }
}

/**
 * Save report configuration
 * @param {Object} config - Report configuration object
 */
async function saveReportConfig(config) {
  try {
    await initializeSettingsDirectory();
    await fs.writeFile(REPORT_CONFIG_FILE, JSON.stringify(config, null, 2));
    console.log('Report config saved to internal storage');
  } catch (error) {
    console.error('Failed to save report config:', error);
    throw error;
  }
}

/**
 * Load report configuration
 * @returns {Promise<Object>} Report configuration object
 */
async function loadReportConfig() {
  try {
    await initializeSettingsDirectory();
    const data = await fs.readFile(REPORT_CONFIG_FILE, 'utf8');
    const config = JSON.parse(data);
    console.log('Loaded report config from internal storage');
    return config;
  } catch (error) {
    // File doesn't exist or is invalid - return empty config
    if (error.code === 'ENOENT') {
      console.log('No saved report config found');
      return {
        name: '',
        vendorNumber: '',
        purchaseOrder: '',
        department: ''
      };
    }
    console.error('Failed to load report config:', error);
    return {
      name: '',
      vendorNumber: '',
      purchaseOrder: '',
      department: ''
    };
  }
}

/**
 * Export address mappings to file (for user backup)
 * @param {Array} mappings - Address mappings array
 * @param {string} filePath - Export file path
 */
async function exportAddressMappings(mappings, filePath) {
  await fs.writeFile(filePath, JSON.stringify(mappings, null, 2));
  console.log(`Address mappings exported to ${filePath}`);
}

/**
 * Import address mappings from file
 * @param {string} filePath - Import file path
 * @returns {Promise<Array>} Imported address mappings
 */
async function importAddressMappings(filePath) {
  const data = await fs.readFile(filePath, 'utf-8');
  const mappings = JSON.parse(data);
  console.log(`Imported ${mappings.length} address mappings from ${filePath}`);
  return mappings;
}

/**
 * Export report config to file (for user backup)
 * @param {Object} config - Report configuration
 * @param {string} filePath - Export file path
 */
async function exportReportConfig(config, filePath) {
  await fs.writeFile(filePath, JSON.stringify(config, null, 2));
  console.log(`Report config exported to ${filePath}`);
}

/**
 * Import report config from file
 * @param {string} filePath - Import file path
 * @returns {Promise<Object>} Imported report configuration
 */
async function importReportConfig(filePath) {
  const data = await fs.readFile(filePath, 'utf-8');
  const config = JSON.parse(data);
  console.log('Imported report config from file');
  return config;
}

module.exports = {
  saveAddressMappings,
  loadAddressMappings,
  saveReportConfig,
  loadReportConfig,
  exportAddressMappings,
  importAddressMappings,
  exportReportConfig,
  importReportConfig,
  SETTINGS_DIR
};
