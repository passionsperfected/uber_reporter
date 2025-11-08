const Database = require('better-sqlite3');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

/**
 * Load cookies from different browsers
 * @param {string} browserType - 'firefox', 'chrome', or 'safari'
 * @returns {Promise<Object>} Cookie jar object
 */
async function loadBrowserCookies(browserType = 'firefox') {
  switch (browserType.toLowerCase()) {
    case 'firefox':
      return await loadFirefoxCookies();
    case 'chrome':
      return await loadChromeCookies();
    case 'safari':
      return await loadSafariCookies();
    default:
      throw new Error(`Unsupported browser type: ${browserType}`);
  }
}

/**
 * Load Firefox cookies
 */
async function loadFirefoxCookies() {
  try {
    const platform = os.platform();
    let firefoxPath;

    if (platform === 'darwin') {
      firefoxPath = path.join(os.homedir(), 'Library/Application Support/Firefox/Profiles');
    } else if (platform === 'win32') {
      firefoxPath = path.join(os.homedir(), 'AppData/Roaming/Mozilla/Firefox/Profiles');
    } else {
      firefoxPath = path.join(os.homedir(), '.mozilla/firefox');
    }

    // Find the most recently used profile with cookies
    const profiles = await fs.readdir(firefoxPath);

    // Filter to only profiles that contain 'default' and have cookies.sqlite
    const validProfiles = [];
    for (const profile of profiles) {
      if (profile.includes('default')) {
        const cookiesPath = path.join(firefoxPath, profile, 'cookies.sqlite');
        try {
          await fs.access(cookiesPath);
          const stats = await fs.stat(path.join(firefoxPath, profile));
          validProfiles.push({
            name: profile,
            mtime: stats.mtime,
            cookiesPath
          });
        } catch (e) {
          // Skip profiles without cookies.sqlite
          continue;
        }
      }
    }

    if (validProfiles.length === 0) {
      throw new Error('Could not find Firefox profile with cookies.sqlite file');
    }

    // Sort by modification time (most recent first) and prioritize .default-release
    validProfiles.sort((a, b) => {
      // Prioritize .default-release over .default
      const aIsRelease = a.name.includes('.default-release');
      const bIsRelease = b.name.includes('.default-release');
      if (aIsRelease && !bIsRelease) return -1;
      if (!aIsRelease && bIsRelease) return 1;
      // Then sort by modification time
      return b.mtime - a.mtime;
    });

    const selectedProfile = validProfiles[0];
    console.log('Using Firefox profile:', selectedProfile.name);

    const cookies = await readFirefoxCookies(selectedProfile.cookiesPath);

    console.log('Firefox cookies extracted:', Object.keys(cookies));

    return cookies;
  } catch (error) {
    throw new Error(`Failed to load Firefox cookies: ${error.message}`);
  }
}

/**
 * Load Chrome cookies
 */
async function loadChromeCookies() {
  try {
    const platform = os.platform();
    let cookiesPath;
    let tempCookiesPath = null;

    if (platform === 'darwin') {
      cookiesPath = path.join(os.homedir(), 'Library/Application Support/Google/Chrome/Default/Cookies');
    } else if (platform === 'win32') {
      cookiesPath = path.join(os.homedir(), 'AppData/Local/Google/Chrome/User Data/Default/Network/Cookies');
    } else {
      cookiesPath = path.join(os.homedir(), '.config/google-chrome/Default/Cookies');
    }

    // Chrome locks the cookies file, so we need to copy it first
    tempCookiesPath = path.join(os.tmpdir(), `chrome-cookies-${Date.now()}.db`);
    await fs.copyFile(cookiesPath, tempCookiesPath);

    const cookies = await readChromeCookies(tempCookiesPath);

    // Clean up temp file
    try {
      await fs.unlink(tempCookiesPath);
    } catch (e) {
      // Ignore cleanup errors
    }

    return cookies;
  } catch (error) {
    throw new Error(`Failed to load Chrome cookies: ${error.message}`);
  }
}

/**
 * Load Safari cookies
 */
async function loadSafariCookies() {
  try {
    const platform = os.platform();
    if (platform !== 'darwin') {
      throw new Error('Safari cookies can only be accessed on macOS');
    }

    const cookiesPath = path.join(os.homedir(), 'Library/Cookies/Cookies.binarycookies');

    // Safari cookies require special handling due to binary format and permissions
    // This is a simplified version - in production, you'd need a proper binary cookie parser
    // For now, we'll throw an informative error
    throw new Error('Safari cookie extraction requires additional permissions. Please use Firefox or Chrome for now.');
  } catch (error) {
    throw new Error(`Failed to load Safari cookies: ${error.message}`);
  }
}

/**
 * Read Firefox cookies from SQLite database
 */
async function readFirefoxCookies(cookiesPath) {
  try {
    // Firefox also locks the file, so copy it first
    const tempPath = path.join(os.tmpdir(), `firefox-cookies-${Date.now()}.sqlite`);
    await fs.copyFile(cookiesPath, tempPath);

    const db = new Database(tempPath, { readonly: true });

    const rows = db.prepare(
      "SELECT name, value FROM moz_cookies WHERE host LIKE '%uber.com%'"
    ).all();

    db.close();

    // Clean up temp file
    try {
      await fs.unlink(tempPath);
    } catch (e) {
      // Ignore cleanup errors
    }

    const cookies = {};
    rows.forEach(row => {
      cookies[row.name] = row.value;
    });

    return cookies;
  } catch (error) {
    throw new Error(`Failed to read Firefox cookies: ${error.message}`);
  }
}

/**
 * Read Chrome cookies from SQLite database
 */
async function readChromeCookies(cookiesPath) {
  try {
    const db = new Database(cookiesPath, { readonly: true });

    const rows = db.prepare(
      "SELECT name, value, encrypted_value FROM cookies WHERE host_key LIKE '%uber.com%'"
    ).all();

    db.close();

    const cookies = {};
    rows.forEach(row => {
      // Note: encrypted_value would need decryption on some platforms
      // For now, we're using the plain value if available
      if (row.value) {
        cookies[row.name] = row.value;
      }
    });

    return cookies;
  } catch (error) {
    throw new Error(`Failed to read Chrome cookies: ${error.message}`);
  }
}

/**
 * Detect default browser
 */
async function detectDefaultBrowser() {
  const platform = os.platform();

  try {
    if (platform === 'darwin') {
      const { stdout } = await execAsync(
        'defaults read ~/Library/Preferences/com.apple.LaunchServices/com.apple.launchservices.secure | grep -A 1 "https" | grep -A 1 "LSHandlerRoleAll" | grep "LSHandlerURLScheme"'
      );

      if (stdout.includes('chrome')) return 'chrome';
      if (stdout.includes('firefox')) return 'firefox';
      if (stdout.includes('safari')) return 'safari';
    } else if (platform === 'win32') {
      // Windows detection logic
      const { stdout } = await execAsync(
        'reg query HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\Shell\\Associations\\UrlAssociations\\http\\UserChoice'
      );

      if (stdout.includes('Chrome')) return 'chrome';
      if (stdout.includes('Firefox')) return 'firefox';
    } else {
      // Linux detection logic
      const { stdout } = await execAsync('xdg-settings get default-web-browser');

      if (stdout.includes('chrome')) return 'chrome';
      if (stdout.includes('firefox')) return 'firefox';
    }
  } catch (error) {
    console.error('Error detecting default browser:', error);
  }

  // Default to Firefox if detection fails
  return 'firefox';
}

module.exports = {
  loadBrowserCookies,
  loadFirefoxCookies,
  loadChromeCookies,
  loadSafariCookies,
  detectDefaultBrowser
};
