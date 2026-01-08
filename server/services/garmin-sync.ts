import { and, eq, sql } from 'drizzle-orm';
import { GarminConnect } from 'garmin-connect';
import { db, garminConnection, healthMetric } from '@/lib/db';

/**
 * Garmin Connect synchronization service
 *
 * Handles authentication, data fetching, and storage of health metrics
 * from Garmin Connect to PostgreSQL database.
 */

export class GarminSyncService {
  private client: GarminConnect;
  private userId: string;

  constructor(email: string, password: string, userId: string) {
    this.client = new GarminConnect({
      username: email,
      password: password,
    });
    this.userId = userId;
  }

  /**
   * Login to Garmin Connect and save OAuth tokens to database
   */
  async login(): Promise<{ oauth1: unknown; oauth2: unknown }> {
    await this.client.login();

    const oauth1 = this.client.client.oauth1Token;
    const oauth2 = this.client.client.oauth2Token;

    // Save tokens to database
    await db
      .update(garminConnection)
      .set({
        oauth1Token: JSON.stringify(oauth1),
        oauth2Token: JSON.stringify(oauth2),
        updatedAt: new Date(),
      })
      .where(eq(garminConnection.userId, this.userId));

    return { oauth1, oauth2 };
  }

  /**
   * Load existing OAuth tokens from database
   */
  async loadTokensFromDb(): Promise<boolean> {
    const connection = await db.query.garminConnection.findFirst({
      where: eq(garminConnection.userId, this.userId),
    });

    if (!connection?.oauth1Token || !connection?.oauth2Token) {
      return false;
    }

    try {
      const oauth1 = JSON.parse(connection.oauth1Token);
      const oauth2 = JSON.parse(connection.oauth2Token);
      this.client.loadToken(oauth1, oauth2);
      return true;
    } catch (error) {
      console.error('Failed to load tokens:', error);
      return false;
    }
  }

  /**
   * Sync daily summary data for a specific date
   */
  async syncDailySummary(date: Date, force = false): Promise<boolean> {
    try {
      console.log(
        `    Fetching daily summary for ${date.toISOString().split('T')[0]} (force=${force})`,
      );

      // getSteps returns just a number, not an object
      const steps = await this.client.getSteps(date);

      if (steps != null) {
        await this.storeMetric('steps', steps, 'steps', date, force);
      }

      // Fetch daily calories using the generic get method
      try {
        const dateStr = date.toISOString().split('T')[0];
        const dailyData: any = await this.client.get(
          `usersummary/usersummary/${dateStr}/daily`,
        );
        if (dailyData && dailyData.totalKilocalories != null) {
          await this.storeMetric(
            'calories',
            dailyData.totalKilocalories,
            'kcal',
            date,
            force,
          );
          console.log(
            `    ✓ Calories synced: ${dailyData.totalKilocalories} kcal`,
          );
        }
        if (dailyData && dailyData.activeKilocalories != null) {
          await this.storeMetric(
            'active_calories',
            dailyData.activeKilocalories,
            'kcal',
            date,
            force,
          );
          console.log(
            `    ✓ Active calories synced: ${dailyData.activeKilocalories} kcal`,
          );
        }
      } catch (calorieError: any) {
        console.log(
          `    Could not fetch calories: ${calorieError?.message || calorieError}`,
        );
      }

      console.log('  ✓ Daily summary synced');
      return true;
    } catch (error) {
      console.error('  ✗ Error syncing daily summary:', error);
      return false;
    }
  }

  /**
   * Sync heart rate data for a specific date
   */
  async syncHeartRate(date: Date, force = false): Promise<boolean> {
    try {
      console.log(
        `    Fetching heart rate for ${date.toISOString().split('T')[0]}`,
      );

      const hrData = await this.client.getHeartRate(date);

      if (hrData.restingHeartRate != null) {
        await this.storeMetric(
          'resting_heart_rate',
          hrData.restingHeartRate,
          'bpm',
          date,
          force,
        );
      }

      if (hrData.maxHeartRate != null) {
        await this.storeMetric(
          'max_heart_rate',
          hrData.maxHeartRate,
          'bpm',
          date,
          force,
        );
      }

      if (hrData.minHeartRate != null) {
        await this.storeMetric(
          'min_heart_rate',
          hrData.minHeartRate,
          'bpm',
          date,
          force,
        );
      }

      console.log('  ✓ Heart rate synced');
      return true;
    } catch (error) {
      console.error('  ✗ Error syncing heart rate:', error);
      return false;
    }
  }

  /**
   * Sync sleep data for a specific date
   */
  async syncSleep(date: Date, force = false): Promise<boolean> {
    try {
      console.log(`    Fetching sleep for ${date.toISOString().split('T')[0]}`);

      const sleepData = await this.client.getSleepData(date);

      if (sleepData.dailySleepDTO?.sleepTimeSeconds != null) {
        const sleepMinutes = sleepData.dailySleepDTO.sleepTimeSeconds / 60;
        await this.storeMetric(
          'sleep_duration',
          sleepMinutes,
          'minutes',
          date,
          force,
        );
      }

      if (sleepData.dailySleepDTO?.deepSleepSeconds != null) {
        const deepMinutes = sleepData.dailySleepDTO.deepSleepSeconds / 60;
        await this.storeMetric(
          'deep_sleep',
          deepMinutes,
          'minutes',
          date,
          force,
        );
      }

      if (sleepData.dailySleepDTO?.lightSleepSeconds != null) {
        const lightMinutes = sleepData.dailySleepDTO.lightSleepSeconds / 60;
        await this.storeMetric(
          'light_sleep',
          lightMinutes,
          'minutes',
          date,
          force,
        );
      }

      if (sleepData.dailySleepDTO?.remSleepSeconds != null) {
        const remMinutes = sleepData.dailySleepDTO.remSleepSeconds / 60;
        await this.storeMetric('rem_sleep', remMinutes, 'minutes', date, force);
      }

      if (sleepData.dailySleepDTO?.awakeSleepSeconds != null) {
        const awakeMinutes = sleepData.dailySleepDTO.awakeSleepSeconds / 60;
        await this.storeMetric(
          'awake_time',
          awakeMinutes,
          'minutes',
          date,
          force,
        );
      }

      console.log('  ✓ Sleep data synced');
      return true;
    } catch (error) {
      console.error('  ✗ Error syncing sleep:', error);
      return false;
    }
  }

  /**
   * Sync activities for a specific date
   */
  async syncActivities(date: Date, force = false): Promise<boolean> {
    try {
      const dateStr = date.toISOString().split('T')[0];
      console.log(`    Fetching activities for ${dateStr}`);

      const activities = await this.client.getActivities(0, 20);
      console.log(`    Found ${activities.length} total activities`);
      const dateActivities = activities.filter(
        (activity: { startTimeLocal: string }) => {
          const activityDate = new Date(activity.startTimeLocal)
            .toISOString()
            .split('T')[0];
          return activityDate === dateStr;
        },
      );

      console.log(
        `    Found ${dateActivities.length} activities for ${dateStr}`,
      );

      if (dateActivities.length > 0) {
        // Store the most recent activity
        const activity = dateActivities[0];
        console.log(
          `    Activity: ${activity.activityName || 'Unknown'}, Calories: ${activity.calories || 'N/A'}`,
        );
        await this.storeMetric(
          'activity',
          JSON.stringify(activity),
          null,
          date,
          force,
        );
        console.log(`  ✓ ${dateActivities.length} activities synced`);
      } else {
        console.log(`    No activities found for ${dateStr}`);
      }

      return true;
    } catch (error) {
      console.error('  ✗ Error syncing activities:', error);
      return false;
    }
  }

  /**
   * Sync stress data for a specific date
   * Note: garmin-connect doesn't have a direct getStress method
   * Stress data would need to be fetched differently
   */
  async syncStress(date: Date, _force = false): Promise<boolean> {
    try {
      console.log(
        `    Skipping stress for ${date.toISOString().split('T')[0]} (not available in garmin-connect)`,
      );

      // Stress data not directly available in garmin-connect
      // Would need to use a different endpoint or method
      // Skipping for now

      return true;
    } catch (error) {
      console.error('  ✗ Error syncing stress:', error);
      return false;
    }
  }

  /**
   * Store a health metric in the database
   */
  private async storeMetric(
    metricType: string,
    value: string | number,
    unit: string | null,
    recordedAt: Date,
    force = false,
  ): Promise<void> {
    if (value == null) {
      console.log(`    Skipping ${metricType}: value is null`);
      return;
    }

    const valueStr = typeof value === 'string' ? value : String(value);
    const recordedDate = new Date(recordedAt);
    recordedDate.setHours(12, 0, 0, 0); // Set to noon to avoid timezone issues

    try {
      // Check if metric already exists for this date (unless forcing)
      if (!force) {
        const existing = await db.query.healthMetric.findFirst({
          where: and(
            eq(healthMetric.userId, this.userId),
            eq(healthMetric.metricType, metricType),
            sql`DATE(${healthMetric.recordedAt}) = DATE(${recordedDate.toISOString()})`,
          ),
        });

        if (existing) {
          console.log(`    Skipping ${metricType}: already exists`);
          return;
        }
      }

      // If forcing, delete existing entry first
      if (force) {
        await db
          .delete(healthMetric)
          .where(
            and(
              eq(healthMetric.userId, this.userId),
              eq(healthMetric.metricType, metricType),
              sql`DATE(${healthMetric.recordedAt}) = DATE(${recordedDate.toISOString()})`,
            ),
          );
        console.log(`    Deleted existing ${metricType}`);
      }

      // Insert new metric
      await db.insert(healthMetric).values({
        userId: this.userId,
        metricType,
        value: valueStr,
        unit,
        recordedAt: recordedDate,
        metadata: null,
      });

      console.log(`    Stored ${metricType}: ${valueStr}`);
    } catch (error) {
      console.error(`    Warning: Could not store ${metricType}:`, error);
    }
  }

  /**
   * Sync data for the last N days
   */
  async syncLastNDays(days = 7): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    console.log(`\n📊 Syncing last ${days} days of Garmin data...`);
    console.log('='.repeat(50));

    for (let i = 0; i < days; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);

      const dateStr = date.toISOString().split('T')[0];
      console.log(`\n📅 ${dateStr} (${i} days ago)`);

      // Force refresh today's data
      const isToday = i === 0;

      await this.syncDailySummary(date, isToday);
      await this.syncHeartRate(date, isToday);
      await this.syncSleep(date, isToday);
      await this.syncActivities(date, isToday);
      await this.syncStress(date, isToday);
    }

    // Update sync status
    await db
      .update(garminConnection)
      .set({
        lastSyncAt: new Date(),
        lastSyncStatus: 'success',
        lastSyncError: null,
      })
      .where(eq(garminConnection.userId, this.userId));

    console.log('\n✅ Sync complete!');
  }

  /**
   * Update sync status in database
   */
  async updateSyncStatus(
    status: 'success' | 'error',
    error?: string,
  ): Promise<void> {
    await db
      .update(garminConnection)
      .set({
        lastSyncAt: new Date(),
        lastSyncStatus: status,
        lastSyncError: error || null,
      })
      .where(eq(garminConnection.userId, this.userId));
  }
}

/**
 * Helper function to create and authenticate a Garmin client
 */
export async function createGarminClient(
  userId: string,
  email?: string,
  password?: string,
): Promise<GarminSyncService> {
  const connection = await db.query.garminConnection.findFirst({
    where: eq(garminConnection.userId, userId),
  });

  if (!connection) {
    throw new Error('No Garmin connection found');
  }

  const garminEmail = email || connection.garminEmail;
  const garminPassword = password;

  const service = new GarminSyncService(
    garminEmail,
    garminPassword || '',
    userId,
  );

  // Try to load existing tokens first
  if (!password) {
    const tokensLoaded = await service.loadTokensFromDb();
    if (!tokensLoaded) {
      throw new Error('No valid tokens found and no password provided');
    }
  } else {
    // Login with password and save new tokens
    await service.login();
  }

  return service;
}
