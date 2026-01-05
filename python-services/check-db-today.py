#!/usr/bin/env python3
import os
import sys
from datetime import datetime, timedelta, timezone
from garminconnect import Garmin
from dotenv import load_dotenv

load_dotenv()

# Check what's in the database
import psycopg2

conn = psycopg2.connect(os.getenv('DATABASE_URL'))
cursor = conn.cursor()

# Check for today's metrics
cursor.execute("""
    SELECT metric_type, value, unit, recorded_at 
    FROM health_metric 
    WHERE user_id = 'xAM2VpuQCDkHoV1GeEuMkuYxAuWdAG7C'
    AND DATE(recorded_at) = '2026-01-04'
    AND metric_type IN ('steps', 'calories', 'distance', 'active_minutes', 'vigorous_minutes')
    ORDER BY recorded_at DESC
""")

print("Today's key metrics:")
for row in cursor.fetchall():
    print(f"  {row[0]}: {row[1]} {row[2] or ''} at {row[3]}")

cursor.close()
conn.close()
