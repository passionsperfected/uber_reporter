const axios = require('axios');

const UBER_GRAPHQL_URL = 'https://riders.uber.com/graphql';

/**
 * Convert date to milliseconds since epoch
 */
function dateToMilliseconds(date, endOfDay = false) {
  const dateObj = new Date(date);
  if (endOfDay) {
    dateObj.setHours(23, 59, 59, 999);
  } else {
    dateObj.setHours(0, 0, 0, 0);
  }
  return dateObj.getTime();
}

/**
 * Fetch activities (trips) by date range
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @param {Object} cookies - Cookie jar object
 * @returns {Promise<Array>} Array of activities
 */
async function fetchActivitiesByDate(startDate, endDate, cookies) {
  const startTimeMs = dateToMilliseconds(startDate, false);
  const endTimeMs = dateToMilliseconds(endDate, true);

  const allActivities = [];
  let shouldCallMore = true;
  let nextPageToken = null;

  const graphqlQuery = `query Activities($cityID: Int, $endTimeMs: Float, $includePast: Boolean = true, $includeUpcoming: Boolean = true, $limit: Int = 5, $nextPageToken: String, $orderTypes: [RVWebCommonActivityOrderType!] = [RIDES, TRAVEL], $profileType: RVWebCommonActivityProfileType = PERSONAL, $startTimeMs: Float) {
  activities(cityID: $cityID) {
    cityID
    past(
      endTimeMs: $endTimeMs
      limit: $limit
      nextPageToken: $nextPageToken
      orderTypes: $orderTypes
      profileType: $profileType
      startTimeMs: $startTimeMs
    ) @include(if: $includePast) {
      activities {
        ...RVWebCommonActivityFragment
        __typename
      }
      nextPageToken
      __typename
    }
    upcoming @include(if: $includeUpcoming) {
      activities {
        ...RVWebCommonActivityFragment
        __typename
      }
      __typename
    }
    __typename
  }
}

fragment RVWebCommonActivityFragment on RVWebCommonActivity {
  buttons {
    isDefault
    startEnhancerIcon
    text
    url
    __typename
  }
  cardURL
  description
  imageURL {
    light
    dark
    __typename
  }
  subtitle
  title
  uuid
  __typename
}`;

  while (shouldCallMore) {
    const variables = {
      includePast: true,
      includeUpcoming: true,
      limit: 10,
      startTimeMs,
      endTimeMs,
      orderTypes: ['RIDES', 'TRAVEL'],
      profileType: 'PERSONAL'
    };

    if (nextPageToken) {
      variables.nextPageToken = nextPageToken;
    }

    const payload = {
      operationName: 'Activities',
      variables,
      query: graphqlQuery
    };

    try {
      const cookieString = cookiesToString(cookies);
      console.log('\n=== UBER API REQUEST ===');
      console.log('URL:', UBER_GRAPHQL_URL);
      console.log('Method: POST');
      console.log('Cookies found:', Object.keys(cookies).length);
      console.log('Cookie names:', Object.keys(cookies).join(', '));

      const headers = {
        'x-csrf-token': 'x',
        'Content-Type': 'application/json',
        'Cookie': cookieString,
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      };

      console.log('\nHeaders:');
      console.log('  x-csrf-token:', headers['x-csrf-token']);
      console.log('  Content-Type:', headers['Content-Type']);
      console.log('  User-Agent:', headers['User-Agent']);
      console.log('  Cookie (first 100 chars):', cookieString.substring(0, 100) + '...');

      console.log('\nPayload:');
      console.log('  Operation:', payload.operationName);
      console.log('  Variables:', JSON.stringify(payload.variables, null, 2));
      console.log('  Query (first 200 chars):', payload.query.substring(0, 200) + '...');
      console.log('========================\n');

      const response = await axios.post(UBER_GRAPHQL_URL, payload, { headers });

      const data = response.data;
      nextPageToken = data?.data?.activities?.past?.nextPageToken;
      const activities = data?.data?.activities?.past?.activities || [];

      if (activities.length === 0) {
        break;
      }

      allActivities.push(...activities);

      if (!nextPageToken) {
        shouldCallMore = false;
      }
    } catch (error) {
      console.error('Uber API Error:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        cookieCount: Object.keys(cookies).length
      });
      throw new Error(`Failed to fetch activities: ${error.message}`);
    }
  }

  return allActivities;
}

/**
 * Fetch trip details for a specific trip UUID
 * @param {string} tripUUID - The UUID of the trip
 * @param {Object} cookies - Cookie jar object
 * @returns {Promise<Object>} Trip details
 */
async function fetchTripDetails(tripUUID, cookies) {
  const graphqlQuery = `query GetTrip($tripUUID: String!) {
  getTrip(tripUUID: $tripUUID) {
    trip {
      beginTripTime
      cityID
      countryID
      disableCanceling
      disableRating
      driver
      dropoffTime
      fare
      isRidepoolTrip
      isScheduledRide
      isSurgeTrip
      isUberReserve
      jobUUID
      marketplace
      paymentProfileUUID
      status
      uuid
      vehicleDisplayName
      vehicleViewID
      waypoints
      __typename
    }
    mapURL
    polandTaxiLicense
    rating
    receipt {
      carYear
      distance
      distanceLabel
      duration
      vehicleType
      __typename
    }
    __typename
  }
}`;

  const payload = {
    operationName: 'GetTrip',
    variables: {
      tripUUID
    },
    query: graphqlQuery
  };

  try {
    const response = await axios.post(UBER_GRAPHQL_URL, payload, {
      headers: {
        'x-csrf-token': 'x',
        'Content-Type': 'application/json',
        'Cookie': cookiesToString(cookies),
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    return response.data?.data?.getTrip?.trip || {};
  } catch (error) {
    console.error('Error fetching trip details:', error.response?.status, error.message);
    throw new Error(`Failed to fetch trip details for ${tripUUID}: ${error.message}`);
  }
}

/**
 * Test connection to Uber API with current cookies
 * This makes a lightweight API call to verify authentication
 * @param {Object} cookies - Cookie jar object
 * @returns {Promise<Object>} { success: boolean, message: string }
 */
async function testConnection(cookies) {
  try {
    console.log('\n=== TESTING CONNECTION ===');
    console.log('Testing Uber API authentication...');

    // Try to fetch just 1 trip from the last year to test auth
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const now = new Date();

    const startTimeMs = oneYearAgo.getTime();
    const endTimeMs = now.getTime();

    const graphqlQuery = `query Activities($endTimeMs: Float, $includePast: Boolean = true, $limit: Int = 1, $startTimeMs: Float) {
  activities {
    past(
      endTimeMs: $endTimeMs
      limit: $limit
      startTimeMs: $startTimeMs
    ) @include(if: $includePast) {
      activities {
        uuid
        title
        __typename
      }
      __typename
    }
    __typename
  }
}`;

    const payload = {
      operationName: 'Activities',
      variables: {
        includePast: true,
        limit: 1,
        startTimeMs,
        endTimeMs
      },
      query: graphqlQuery
    };

    const response = await axios.post(UBER_GRAPHQL_URL, payload, {
      headers: {
        'x-csrf-token': 'x',
        'Content-Type': 'application/json',
        'Cookie': cookiesToString(cookies),
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    // Check if we got a valid response
    if (response.data?.data?.activities) {
      console.log('✅ Connection test PASSED - Authentication successful!');
      return {
        success: true,
        message: 'Successfully connected to Uber API!'
      };
    } else {
      console.log('⚠️ Connection test FAILED - Unexpected response format');
      return {
        success: false,
        message: 'Connected but received unexpected response. You may not be logged in.'
      };
    }
  } catch (error) {
    console.log('❌ Connection test FAILED');
    console.error('Error:', {
      status: error.response?.status,
      message: error.message
    });

    if (error.response?.status === 404 || error.response?.status === 401 || error.response?.status === 403) {
      return {
        success: false,
        message: 'Authentication failed. Please log into Uber in your browser first.'
      };
    }

    return {
      success: false,
      message: `Connection failed: ${error.message}`
    };
  }
}

/**
 * Convert cookies object to cookie string
 */
function cookiesToString(cookies) {
  return Object.entries(cookies)
    .map(([name, value]) => `${name}=${value}`)
    .join('; ');
}

module.exports = {
  fetchActivitiesByDate,
  fetchTripDetails,
  testConnection
};
