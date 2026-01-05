#!/usr/bin/env python3
# Note: Run with .venv/bin/python3 to use virtual environment
import os
import json
import sys
from datetime import datetime, timedelta, timezone
from garminconnect import Garmin
import psycopg2
from dotenv import load_dotenv

load_dotenv()

class GarminSync:
    def __init__(self, user_id, garmin_email, garmin_password):
        self.user_id = user_id
        self.garmin_email = garmin_email
        self.client = Garmin(garmin_email, garmin_password)
        self.db_conn = psycopg2.connect(os.getenv('DATABASE_URL'))
        
    def login(self):
        """Authenticate with Garmin Connect"""
        try:
            self.client.login()
            print(f"✓ Successfully logged in as {self.garmin_email}")
            return True
        except Exception as e:
            print(f"✗ Login failed: {e}")
            self._update_sync_status('error', str(e))
            return False
    
    def sync_daily_summary(self, date, force=False):
        """Fetch and store daily summary data"""
        try:
            date_str = date.strftime('%Y-%m-%d') if hasattr(date, 'strftime') else date.isoformat()
            print(f"    Fetching daily summary for {date_str} (force={force})")
            summary = self.client.get_stats(date_str)
            
            if 'totalSteps' in summary:
                print(f"    Found steps: {summary['totalSteps']}")
                self._store_metric('steps', summary['totalSteps'], 'steps', date, force=force)
            
            if 'totalKilocalories' in summary:
                print(f"    Found calories: {summary['totalKilocalories']}")
                self._store_metric('calories', summary['totalKilocalories'], 'kcal', date, force=force)
            
            if 'totalDistanceMeters' in summary:
                print(f"    Found distance: {summary['totalDistanceMeters']}")
                self._store_metric('distance', summary['totalDistanceMeters'], 'meters', date, force=force)
            
            if 'moderateIntensityMinutes' in summary:
                print(f"    Found active minutes: {summary['moderateIntensityMinutes']}")
                self._store_metric('active_minutes', summary['moderateIntensityMinutes'], 'minutes', date, force=force)
            
            if 'vigorousIntensityMinutes' in summary:
                print(f"    Found vigorous minutes: {summary['vigorousIntensityMinutes']}")
                self._store_metric('vigorous_minutes', summary['vigorousIntensityMinutes'], 'minutes', date, force=force)
                
            print(f"  ✓ Daily summary synced")
            return True
        except Exception as e:
            print(f"  ✗ Error syncing daily summary: {e}")
            return False
    
    def sync_heart_rate(self, date, force=False):
        """Fetch and store heart rate data"""
        try:
            hr_data = self.client.get_heart_rates(date.isoformat())
            
            if hr_data:
                if 'heartRateValues' in hr_data:
                    self._store_metric('heart_rate_detailed', json.dumps(hr_data['heartRateValues']), 'bpm', date, json.dumps(hr_data), force=force)
                
                if 'restingHeartRate' in hr_data:
                    self._store_metric('resting_heart_rate', hr_data['restingHeartRate'], 'bpm', date, force=force)
                
                if 'maxHeartRate' in hr_data:
                    self._store_metric('max_heart_rate', hr_data['maxHeartRate'], 'bpm', date, force=force)
                
                if 'minHeartRate' in hr_data:
                    self._store_metric('min_heart_rate', hr_data['minHeartRate'], 'bpm', date, force=force)
                    
                print(f"  ✓ Heart rate synced")
            return True
        except Exception as e:
            print(f"  ✗ Error syncing heart rate: {e}")
            return False
    
    def sync_sleep(self, date, force=False):
        """Fetch and store sleep data"""
        try:
            sleep_data = self.client.get_sleep_data(date.isoformat())
            
            if sleep_data and 'dailySleepDTO' in sleep_data:
                sleep_dto = sleep_data['dailySleepDTO']
                
                if 'sleepTimeSeconds' in sleep_dto:
                    sleep_minutes = sleep_dto['sleepTimeSeconds'] / 60
                    self._store_metric('sleep_duration', sleep_minutes, 'minutes', date, json.dumps(sleep_dto), force=force)
                
                if 'deepSleepSeconds' in sleep_dto:
                    deep_sleep_minutes = sleep_dto['deepSleepSeconds'] / 60
                    self._store_metric('deep_sleep', deep_sleep_minutes, 'minutes', date, force=force)
                
                if 'lightSleepSeconds' in sleep_dto:
                    light_sleep_minutes = sleep_dto['lightSleepSeconds'] / 60
                    self._store_metric('light_sleep', light_sleep_minutes, 'minutes', date, force=force)
                
                if 'remSleepSeconds' in sleep_dto:
                    rem_sleep_minutes = sleep_dto['remSleepSeconds'] / 60
                    self._store_metric('rem_sleep', rem_sleep_minutes, 'minutes', date, force=force)
                
                if 'awakeSleepSeconds' in sleep_dto:
                    awake_minutes = sleep_dto['awakeSleepSeconds'] / 60
                    self._store_metric('awake_time', awake_minutes, 'minutes', date, force=force)
                    
                print(f"  ✓ Sleep data synced")
            return True
        except Exception as e:
            print(f"  ✗ Error syncing sleep: {e}")
            return False
    
    def sync_activities(self, date, force=False):
        """Fetch and store activities"""
        try:
            activities = self.client.get_activities_by_date(
                date.isoformat(), 
                (date + timedelta(days=1)).isoformat()
            )
            
            if activities:
                for activity in activities:
                    activity_name = activity.get('activityName', 'Unknown')
                    self._store_metric('activity', json.dumps(activity), 'activity', date, json.dumps({
                        'activityId': activity.get('activityId'),
                        'activityName': activity_name,
                        'activityType': activity.get('activityType', {}).get('typeKey'),
                        'duration': activity.get('duration'),
                        'distance': activity.get('distance'),
                        'calories': activity.get('calories')
                    }), force=force)
                
                print(f"  ✓ {len(activities)} activities synced")
            return True
        except Exception as e:
            print(f"  ✗ Error syncing activities: {e}")
            return False
    
    def sync_stress(self, date, force=False):
        """Fetch and store stress data"""
        try:
            stress_data = self.client.get_stress_data(date.isoformat())
            
            if stress_data:
                if 'avgStressLevel' in stress_data:
                    self._store_metric('stress_avg', stress_data['avgStressLevel'], 'level', date, json.dumps(stress_data), force=force)
                
                if 'maxStressLevel' in stress_data:
                    self._store_metric('stress_max', stress_data['maxStressLevel'], 'level', date, force=force)
                    
                print(f"  ✓ Stress data synced")
            return True
        except Exception as e:
            print(f"  ✗ Error syncing stress: {e}")
            return False
    
    def _store_metric(self, metric_type, value, unit, recorded_at, metadata=None, force=False):
        """Store a health metric in the database"""
        cursor = self.db_conn.cursor()
        
        value_str = str(value) if not isinstance(value, str) else value
        
        try:
            # Convert date to datetime if needed
            if isinstance(recorded_at, str):
                recorded_dt = datetime.fromisoformat(recorded_at)
            elif hasattr(recorded_at, 'date'):
                recorded_dt = recorded_at
            else:
                recorded_dt = datetime.combine(recorded_at, datetime.min.time()).replace(tzinfo=timezone.utc)
            
            # Check if metric already exists for this date (unless forcing)
            if not force:
                cursor.execute("""
                    SELECT id FROM health_metric 
                    WHERE user_id = %s AND metric_type = %s AND DATE(recorded_at) = %s
                    LIMIT 1
                """, (self.user_id, metric_type, recorded_dt.date()))
                
                if cursor.fetchone():
                    print(f"    Skipping {metric_type}: already exists for {recorded_dt.date()}")
                    cursor.close()
                    return
            
            # If forcing, delete existing entry first
            if force:
                cursor.execute("""
                    DELETE FROM health_metric 
                    WHERE user_id = %s AND metric_type = %s AND DATE(recorded_at) = %s
                """, (self.user_id, metric_type, recorded_dt.date()))
                print(f"    Deleted existing {metric_type} for {recorded_dt.date()}")
            
            cursor.execute("""
                INSERT INTO health_metric (user_id, metric_type, value, unit, recorded_at, metadata)
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (self.user_id, metric_type, value_str, unit, recorded_dt, metadata))
            
            self.db_conn.commit()
            print(f"    Stored {metric_type}: {value_str} at {recorded_dt}")
        except Exception as e:
            print(f"    Warning: Could not store {metric_type}: {e}")
            self.db_conn.rollback()
        finally:
            cursor.close()
    
    def sync_last_n_days(self, days=7, force=False):
        """Sync data for the last N days"""
        # Use local date but with proper timezone
        today = datetime.now(timezone.utc).date()
        
        print(f"\n📊 Syncing last {days} days of Garmin data (UTC date: {today})...")
        print("=" * 50)
        
        # Also try yesterday's UTC date in case Garmin hasn't updated today yet
        dates_to_sync = [today]
        if days > 1:
            for i in range(1, days):
                dates_to_sync.append(today - timedelta(days=i))
        
        for i, date in enumerate(dates_to_sync):
            print(f"\n📅 {date.strftime('%Y-%m-%d')} ({i} days ago)")
            
            # Convert date to datetime with time component
            date_with_time = datetime.combine(date, datetime.min.time()).replace(tzinfo=timezone.utc)
            
            # Force refresh today's data
            is_today = date == today
            self.sync_daily_summary(date_with_time, force=is_today)
            self.sync_heart_rate(date_with_time, force=is_today)
            self.sync_sleep(date_with_time, force=is_today)
            self.sync_activities(date_with_time, force=is_today)
            self.sync_stress(date_with_time, force=is_today)
        
        self._update_sync_status('success')
        print(f"\n✅ Sync complete!")
    
    def _update_sync_status(self, status, error=None):
        """Update the sync status in garmin_connection table"""
        cursor = self.db_conn.cursor()
        try:
            cursor.execute("""
                UPDATE garmin_connection 
                SET last_sync_at = NOW(), 
                    last_sync_status = %s,
                    last_sync_error = %s,
                    updated_at = NOW()
                WHERE user_id = %s
            """, (status, error, self.user_id))
            self.db_conn.commit()
        except Exception as e:
            print(f"Warning: Could not update sync status: {e}")
            self.db_conn.rollback()
        finally:
            cursor.close()
    
    def close(self):
        """Close database connection"""
        self.db_conn.close()

if __name__ == "__main__":
    if len(sys.argv) < 4:
        print("Usage: python garmin_sync.py <user_id> <garmin_email> <garmin_password> [days]")
        sys.exit(1)
    
    user_id = sys.argv[1]
    garmin_email = sys.argv[2]
    garmin_password = sys.argv[3]
    days = int(sys.argv[4]) if len(sys.argv) > 4 else 7
    
    sync = GarminSync(user_id, garmin_email, garmin_password)
    
    if sync.login():
        sync.sync_last_n_days(days)
    else:
        print("❌ Sync failed due to login error")
        sys.exit(1)
    
    sync.close()
