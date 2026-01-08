# Garmin Connect Integration

This document describes the Garmin Connect integration in the health assistant app.

## Overview

The Garmin Connect integration allows users to sync their health data from Garmin Connect to the health assistant app. This includes steps, heart rate, sleep data, activities, and calories.

## Architecture

```
Frontend (React Native) → Agent Server (Hono) → Garmin Connect API
                            ↓
                         PostgreSQL
```

1. **Frontend** - React Native app with expo-router
2. **Agent Server** - Hono server that handles Garmin API calls
3. **Database** - PostgreSQL storing synced health metrics

## Authentication Flow

1. User enters Garmin credentials in the app
2. Server logs into Garmin Connect using OAuth1/OAuth2
3. OAuth tokens are stored in the database
4. Future syncs use stored tokens (no password needed)

## Data Synced

### Daily Metrics
- **Steps** - Daily step count
- **Calories** - Total daily calories burned
- **Active Calories** - Calories burned through activity

### Heart Rate
- **Resting Heart Rate** - BPM
- **Maximum Heart Rate** - BPM
- **Minimum Heart Rate** - BPM

### Sleep
- **Sleep Duration** - Total sleep time in minutes
- **Deep Sleep** - Deep sleep duration in minutes
- **Light Sleep** - Light sleep duration in minutes
- **REM Sleep** - REM sleep duration in minutes
- **Awake Time** - Time awake during sleep period

### Activities
- **Latest Activity** - JSON object with activity details including:
  - Activity name
  - Duration
  - Distance
  - Calories burned

## Data Flow

1. **Authentication**: User enters Garmin credentials → Stored encrypted in database
2. **Sync Trigger**: Manual refresh or initial sync → Backend calls Python script
3. **Data Fetch**: Python script authenticates with Garmin → Fetches health data
4. **Storage**: Data processed and stored in PostgreSQL with proper timestamps
5. **Display**: Frontend queries latest metrics → Displays in formatted UI

## Key Components

### Frontend Components

#### `app/(app)/garmin.tsx`
Main UI component for Garmin integration:
- Connection form with credential input
- Metrics display with formatted cards
- Manual refresh functionality
- Error handling and loading states

#### `lib/hooks/use-garmin.ts`
React Query hooks for Garmin API:
- `useGarminConnection()` - Manage connection status
- `useConnectGarmin()` - Connect Garmin account
- `useDisconnectGarmin()` - Disconnect account
- `useSyncGarmin()` - Trigger manual sync
- `useGarminMetrics()` - Fetch health metrics

### Backend Components

#### `server/routes/garmin.ts`
Hono routes for Garmin API:
- `POST /garmin/connect` - Store Garmin credentials
- `DELETE /garmin/disconnect` - Remove credentials
- `POST /garmin/sync` - Trigger data sync
- `GET /garmin/metrics/latest` - Get latest metrics
- `GET /garmin/summary` - Get aggregated data

#### `server/services/health-data.ts`
Health data processing service:
- Converts raw metrics to structured summaries
- Handles unit conversions and parsing
- Provides data for AI consultation

### Python Integration

#### `python-services/garmin_sync.py`
Python script for Garmin Connect integration:
- Authenticates with Garmin Connect API
- Fetches multiple data types (steps, HR, sleep, etc.)
- Stores data in PostgreSQL with proper timestamps
- Handles force refresh to overwrite existing data

## Data Types

### Synced from Garmin:
- **Daily Summary**: Steps, calories, distance, active minutes
- **Heart Rate**: Resting, min, max HR
- **Sleep**: Duration, deep/light/REM phases, awake time
- **Activities**: Workouts with name, duration, distance, calories
- **Stress**: Average and maximum stress levels

### Stored in Database:
- `health_metric` table: Individual metric values with timestamps
- `garmin_connection` table: Encrypted credentials and sync status

## Configuration

### Environment Variables:
- `DATABASE_URL`: PostgreSQL connection string
- No additional Garmin-specific variables needed

### Python Dependencies:
- `garminconnect`: Garmin Connect API client
- `psycopg2-binary`: PostgreSQL adapter
- `python-dotenv`: Environment variable management

## Security Considerations

1. **Credential Storage**: Garmin credentials are encrypted before database storage
2. **API Security**: All endpoints require authentication
3. **Data Privacy**: Health data is stored securely with user isolation

## Troubleshooting

### Common Issues:

1. **Sync Shows "None" Values**
   - Cause: Old entries with null values in database
   - Fix: Backend now filters out None values automatically

2. **Date Display Issues**
   - Cause: Timezone conversion problems
   - Fix: Store dates without UTC timezone to avoid conversion

3. **404 Errors on Sync**
   - Cause: Frontend calling wrong port
   - Fix: Ensure all API calls use port 4000

4. **500 Internal Server Error**
   - Cause: Python script missing force parameter
   - Fix: All sync methods now support force refresh

## Future Improvements

1. **Automatic Sync**: Schedule periodic syncs
2. **Real-time Updates**: WebSocket integration for live data
3. **Historical Data**: Sync more than 7 days of history
4. **Additional Metrics**: Add more Garmin data types
5. **Offline Support**: Cache data for offline viewing
