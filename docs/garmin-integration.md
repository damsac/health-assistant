# Garmin Integration Documentation

## Overview

This document describes the Garmin Connect integration that allows users to sync their health and fitness data from Garmin Connect to the health assistant application.

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │  Python Script  │
│   (React)       │    │   (Hono)        │    │  (Garmin API)   │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ - Garmin UI     │◄──►│ - /garmin/*     │◄──►│ - garmin_sync.py│
│ - use-garmin.ts│    │ - Auth & Routes │    │ - Data Fetcher  │
│ - Display Data  │    │ - DB Operations │    │ - Data Storage  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   PostgreSQL    │
                    │   Database      │
                    ├─────────────────┤
                    │ - health_metric │
                    │ - garmin_       │
                    │   connection    │
                    └─────────────────┘
```

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
