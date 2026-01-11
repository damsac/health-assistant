# Garmin Integration Setup Guide

This guide explains how to set up and configure the Garmin Connect integration.

## Prerequisites

1. **PostgreSQL Database** - Running and accessible
2. **Node.js 18+** - For the backend server
3. **Python 3.11+** - For the Garmin sync script
4. **Garmin Connect Account** - With valid credentials

## Setup Steps

### 1. Database Setup

The database migrations will create the necessary tables:
- `garmin_connection` - Stores encrypted Garmin credentials
- `health_metric` - Stores all health data (already exists)

Run migrations:
```bash
npm run db:migrate
```

### 2. Python Environment Setup

Navigate to the python-services directory:
```bash
cd python-services
```

Create and activate virtual environment:
```bash
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
```

Install dependencies:
```bash
pip install -r requirements.txt
```

### 3. Environment Variables

Ensure your `.env` file contains:
```env
DATABASE_URL=postgresql://username:password@localhost:5432/health_assistant
```

### 4. Start Services

Start the backend server:
```bash
npm run dev
```

Start the frontend:
```bash
npx expo start --web
```

## Usage

### Connecting Garmin Account

1. Navigate to the Garmin page in the app
2. Enter your Garmin Connect email and password
3. Click "Connect"
4. Credentials are encrypted and stored securely

### Syncing Data

**Manual Sync:**
- Click the "Refresh Data" button
- This triggers the Python sync script
- Fetches the last 7 days of data
- Force refreshes today's data

**Automatic Sync:**
- Currently, sync is manual only
- Future versions may support scheduled syncs

### Data Types Synced

- **Daily Summary**: Steps, calories, distance, active minutes
- **Heart Rate**: Resting, min, max heart rate
- **Sleep**: Duration, deep/light/REM phases, awake time
- **Activities**: Workouts with details (name, duration, distance, calories)
- **Stress**: Average and maximum stress levels

## Troubleshooting

### Common Issues

1. **"Failed to sync Garmin data" (500 error)**
   - Check Python script logs for detailed error
   - Ensure DATABASE_URL is set correctly
   - Verify Python dependencies are installed

2. **"No Garmin connection found" (404 error)**
   - Ensure you've connected your Garmin account first
   - Check if the connection is active

3. **Data showing as "None"**
   - This is fixed in the latest version
   - Backend now filters out None values

4. **Wrong date display**
   - Fixed in the latest version
   - Dates now store without UTC timezone

### Debug Mode

To enable debug logging for the Python script:
1. Check the server logs after clicking sync
2. The script outputs detailed information about:
   - What dates are being fetched
   - What data Garmin returns
   - What's being stored in the database

### Testing the Python Script Directly

You can test the sync script directly:
```bash
cd python-services
DATABASE_URL="your_database_url" .venv/bin/python3 garmin_sync.py "user_id" "email" "password" 3
```

## Security Considerations

1. **Credential Storage**: Garmin credentials are encrypted using PostgreSQL's pgcrypto extension
2. **API Security**: All endpoints require authentication
3. **Data Privacy**: Health data is isolated per user

## Performance Notes

1. **Sync Duration**: Syncing 7 days typically takes 5-10 seconds
2. **Database**: Consider indexing on `user_id` and `recorded_at` for better query performance
3. **Rate Limits**: Garmin Connect may have rate limits - avoid too frequent syncs

## Future Enhancements

1. **Automatic Sync**: Implement scheduled syncs (e.g., daily)
2. **Real-time Updates**: Use WebSockets for live data updates
3. **More Data Types**: Add additional Garmin metrics
4. **Historical Data**: Sync more than 7 days of history
5. **Offline Support**: Cache data for offline viewing
