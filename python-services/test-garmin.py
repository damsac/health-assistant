#!/usr/bin/env python3
import os
import sys
from datetime import datetime, timedelta
from garminconnect import Garmin
from dotenv import load_dotenv

load_dotenv()

# Test what Garmin Connect returns for different dates
email = "isaacwm23@gmail.com"
password = "Sacocean3@@"

client = Garmin(email, password)

try:
    client.login()
    print(f"✓ Successfully logged in")
    
    # Test today's date
    today = datetime.now().date()
    print(f"\nTesting date: {today}")
    
    # Get daily stats
    stats = client.get_stats(today.isoformat())
    print(f"Daily stats: {stats}")
    
    # Check what's available
    for key, value in stats.items():
        if value is not None:
            print(f"  {key}: {value}")
    
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
