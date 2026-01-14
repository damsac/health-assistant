import {
  boolean,
  decimal,
  index,
  integer,
  pgTable,
  text,
  time,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const session = pgTable(
  'session',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    token: text('token').notNull().unique(),
    expiresAt: timestamp('expires_at').notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('idx_session_user_id').on(table.userId),
    index('idx_session_token').on(table.token),
  ],
);

export const account = pgTable(
  'account',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    accessTokenExpiresAt: timestamp('access_token_expires_at'),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
    scope: text('scope'),
    idToken: text('id_token'),
    password: text('password'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('idx_account_user_id').on(table.userId),
    index('idx_account_provider').on(table.providerId, table.accountId),
  ],
);

export const verification = pgTable(
  'verification',
  {
    id: text('id').primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [index('idx_verification_identifier').on(table.identifier)],
);

export const genderEnum = [
  'male',
  'female',
  'other',
  'prefer_not_to_say',
] as const;
export type Gender = (typeof genderEnum)[number];

export const sleepQualityEnum = ['poor', 'fair', 'good', 'excellent'] as const;
export type SleepQuality = (typeof sleepQualityEnum)[number];

export const stressLevelEnum = ['low', 'moderate', 'high'] as const;
export type StressLevel = (typeof stressLevelEnum)[number];

export const userProfile = pgTable(
  'user_profile',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
      .notNull()
      .unique()
      .references(() => user.id, { onDelete: 'cascade' }),
    heightCm: integer('height_cm'),
    weightGrams: integer('weight_grams'),
    gender: text('gender').$type<Gender>(),
    dietaryPreferences: text('dietary_preferences').array(),
    dateOfBirth: timestamp('date_of_birth'),
    measurementSystem: text('measurement_system').default('metric'),

    // New fields for progressive profile completion
    sleepHoursAverage: decimal('sleep_hours_average', {
      precision: 3,
      scale: 1,
    }),
    sleepQuality: text('sleep_quality').$type<SleepQuality>(),
    typicalWakeTime: time('typical_wake_time'),
    typicalBedTime: time('typical_bed_time'),
    mealsPerDay: integer('meals_per_day'),
    typicalMealTimes: text('typical_meal_times').array(),
    snackingHabits: text('snacking_habits'),
    supplementsMedications: text('supplements_medications'),
    healthConditions: text('health_conditions').array(),
    stressLevel: text('stress_level').$type<StressLevel>(),
    exerciseFrequency: text('exercise_frequency'),
    exerciseTypes: text('exercise_types').array(),
    waterIntakeLiters: decimal('water_intake_liters', {
      precision: 4,
      scale: 2,
    }),
    garminConnected: boolean('garmin_connected').default(false),
    garminUserId: text('garmin_user_id'),
    profileCompletionPercentage: integer(
      'profile_completion_percentage',
    ).default(40),

    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [index('idx_user_profile_user_id').on(table.userId)],
);

// Chat conversation - stores chat sessions
export const conversation = pgTable(
  'conversation',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    title: text('title'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [index('idx_conversation_user_id').on(table.userId)],
);

// Chat message roles
export const messageRoleEnum = ['user', 'assistant', 'system'] as const;
export type MessageRole = (typeof messageRoleEnum)[number];

// Chat message - stores individual messages with AI SDK UIMessage format
export const message = pgTable(
  'message',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    conversationId: uuid('conversation_id')
      .notNull()
      .references(() => conversation.id, { onDelete: 'cascade' }),
    role: text('role').notNull().$type<MessageRole>(),
    parts: text('parts').notNull(), // JSON stringified array of parts
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [index('idx_message_conversation_id').on(table.conversationId)],
);

// Garmin connection - stores user's Garmin Connect OAuth tokens and sync status
export const garminConnection = pgTable(
  'garmin_connection',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
      .notNull()
      .unique()
      .references(() => user.id, { onDelete: 'cascade' }),
    garminEmail: text('garmin_email').notNull(),
    oauth1Token: text('oauth1_token'), // Stores OAuth1 token as JSON string
    oauth2Token: text('oauth2_token'), // Stores OAuth2 token as JSON string
    isActive: boolean('is_active').notNull().default(true),
    lastSyncAt: timestamp('last_sync_at'),
    lastSyncStatus: text('last_sync_status'),
    lastSyncError: text('last_sync_error'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [index('idx_garmin_connection_user_id').on(table.userId)],
);

// Health metrics from Garmin - stores all health data points
export const healthMetric = pgTable(
  'health_metric',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    metricType: text('metric_type').notNull(),
    value: text('value').notNull(),
    unit: text('unit'),
    recordedAt: timestamp('recorded_at').notNull(),
    metadata: text('metadata'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('idx_health_metric_user_id').on(table.userId),
    index('idx_health_metric_type_date').on(
      table.userId,
      table.metricType,
      table.recordedAt,
    ),
  ],
);

// Profile sections - tracks completion status of different profile sections
export const profileSection = pgTable(
  'profile_sections',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    sectionKey: text('section_key').notNull(),
    completed: boolean('completed').default(false),
    completedAt: timestamp('completed_at'),
  },
  (table) => [
    index('idx_profile_section_user_id').on(table.userId),
    uniqueIndex('unique_user_section').on(table.userId, table.sectionKey),
  ],
);
