import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
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

// Garmin connection - stores user's Garmin Connect credentials and sync status
export const garminConnection = pgTable(
  'garmin_connection',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
      .notNull()
      .unique()
      .references(() => user.id, { onDelete: 'cascade' }),
    garminEmail: text('garmin_email').notNull(),
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
