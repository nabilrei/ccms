import {
    timestamp,
    pgTable,
    text,
    primaryKey,
    integer,
    boolean,
    pgEnum,
    uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql, relations } from "drizzle-orm";
import type { AdapterAccountType } from "next-auth/adapters";

// Define Enums
export const roleEnum = pgEnum("role", ["admin", "coach", "coachee"]);
export const bookingStatusEnum = pgEnum("booking_status", [
    "pending",
    "accepted",
    "rejected",
    "completed",
    "cancelled",
]);

// ---------------------------
// REQUIRED TABLES FOR AUTH.JS
// ---------------------------
export const users = pgTable("user", {
    id: text("id")
        .primaryKey()
        .$defaultFn(() => crypto.randomUUID()),
    name: text("name"),
    email: text("email").notNull().unique(), // Added unique constraint explicitly
    emailVerified: timestamp("emailVerified", { mode: "date" }),
    image: text("image"),
    role: roleEnum("role").default("coachee"), // Application specific: role
    department: text("department"), // Application specific: department
    positionId: text("position_id").references(() => positions.id), // Added positionId
    bio: text("bio"), // Application specific: coach bio
    createdAt: timestamp("created_at").defaultNow(),
});

export const positions = pgTable("position", {
    id: text("id")
        .primaryKey()
        .$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow(),
});

export const competencies = pgTable("competency", {
    id: text("id")
        .primaryKey()
        .$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow(),
});

export const userCompetencies = pgTable("user_competency", {
    userId: text("user_id")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    competencyId: text("competency_id")
        .notNull()
        .references(() => competencies.id, { onDelete: "cascade" }),
}, (table) => ({
    pk: primaryKey({ columns: [table.userId, table.competencyId] }),
}));

export const accounts = pgTable(
    "account",
    {
        userId: text("userId")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        type: text("type").$type<AdapterAccountType>().notNull(),
        provider: text("provider").notNull(),
        providerAccountId: text("providerAccountId").notNull(),
        refresh_token: text("refresh_token"),
        access_token: text("access_token"),
        expires_at: integer("expires_at"),
        token_type: text("token_type"),
        scope: text("scope"),
        id_token: text("id_token"),
        session_state: text("session_state"),
    },
    (account) => ({
        compoundKey: primaryKey({
            columns: [account.provider, account.providerAccountId],
        }),
    })
);

export const sessions = pgTable("session", {
    sessionToken: text("sessionToken").primaryKey(),
    userId: text("userId")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
    "verificationToken",
    {
        identifier: text("identifier").notNull(),
        token: text("token").notNull(),
        expires: timestamp("expires", { mode: "date" }).notNull(),
    },
    (verificationToken) => ({
        compositePk: primaryKey({
            columns: [verificationToken.identifier, verificationToken.token],
        }),
    })
);

export const authenticators = pgTable(
    "authenticator",
    {
        credentialID: text("credentialID").notNull().unique(),
        userId: text("userId")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        providerAccountId: text("providerAccountId").notNull(),
        credentialPublicKey: text("credentialPublicKey").notNull(),
        counter: integer("counter").notNull(),
        credentialDeviceType: text("credentialDeviceType").notNull(),
        credentialBackedUp: boolean("credentialBackedUp").notNull(),
        transports: text("transports"),
    },
    (authenticator) => ({
        compositePK: primaryKey({
            columns: [authenticator.userId, authenticator.credentialID],
        }),
    })
);

// ---------------------------
// APPLICATION TABLES
// ---------------------------
export const bookings = pgTable("booking", {
    id: text("id")
        .primaryKey()
        .$defaultFn(() => crypto.randomUUID()),
    coacheeId: text("coachee_id")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    coachId: text("coach_id")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    date: timestamp("date", { mode: "date" }).notNull(),
    startTime: text("start_time"),
    endTime: text("end_time"),
    method: text("method"),
    batch: text("batch"),
    status: bookingStatusEnum("status").default("pending"),
    topic: text("topic"),
    notes: text("notes"),
    feedback: text("feedback"),
    nextAction: text("next_action"),
    coacheeRating: integer("coachee_rating"),
    coacheeFeedback: text("coachee_feedback"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at")
        .defaultNow()
        .$onUpdate(() => new Date()),
});

// ---------------------------
// RELATIONS
// ---------------------------

export const usersRelations = relations(users, ({ many, one }) => ({
    bookingsAsCoachee: many(bookings, { relationName: "coachee_bookings" }),
    bookingsAsCoach: many(bookings, { relationName: "coach_bookings" }),
    position: one(positions, {
        fields: [users.positionId],
        references: [positions.id],
    }),
    userCompetencies: many(userCompetencies),
}));

export const positionsRelations = relations(positions, ({ many }) => ({
    users: many(users),
}));

export const competenciesRelations = relations(competencies, ({ many }) => ({
    userCompetencies: many(userCompetencies),
}));

export const userCompetenciesRelations = relations(userCompetencies, ({ one }) => ({
    user: one(users, {
        fields: [userCompetencies.userId],
        references: [users.id],
    }),
    competency: one(competencies, {
        fields: [userCompetencies.competencyId],
        references: [competencies.id],
    }),
}));

export const bookingsRelations = relations(bookings, ({ one }) => ({
    coachee: one(users, {
        fields: [bookings.coacheeId],
        references: [users.id],
        relationName: "coachee_bookings",
    }),
    coach: one(users, {
        fields: [bookings.coachId],
        references: [users.id],
        relationName: "coach_bookings",
    }),
}));
