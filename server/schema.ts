import {
  pgTable,
  serial,
  integer,
  varchar,
  timestamp,
} from "drizzle-orm/pg-core";
export const users = pgTable("users", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  login: varchar({ length: 255 }).notNull(),
  password: varchar({ length: 255 }).notNull(),
  role: varchar({ length: 50 }).default("user").notNull(), // например, можно добавить роль
  created_at: timestamp("created_at", { precision: 3 }).defaultNow().notNull(),
  last_activity: timestamp("last_activity", { precision: 3 }), // последняя активность пользователя
  is_online: varchar({ length: 10 }).default("offline").notNull(), // статус онлайн (online/offline)
});
// databases.ts
export const databases = pgTable("databases", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  created_at: timestamp("created_at", { precision: 3 }).defaultNow().notNull(),
  online_at: timestamp("online_at", { precision: 3 }),
  // online date
});
// records.ts
export const records = pgTable("records", {
  id: serial("id").primaryKey(),
  database_id: integer("database_id")
    .notNull()
    .references(() => databases.id),
  title: varchar("title", { length: 255 }),
  number: varchar("number", { length: 50 }),
  fio: varchar("fio", { length: 255 }),
  city: varchar("city", { length: 100 }),
  region: varchar("region", { length: 100 }),
  address: varchar("address", { length: 255 }),
  age: varchar("age", { length: 10 }), // Можно сделать integer, если нужно число
  phone: varchar("phone", { length: 20 }),
  timezone: varchar("timezone", { length: 50 }),
  custom1: varchar("custom1", { length: 255 }),
  custom2: varchar("custom2", { length: 255 }),
  custom3: varchar("custom3", { length: 255 }),
  description: varchar("description", { length: 500 }), // "Доп. информация"
  created_at: timestamp("created_at", { precision: 3 }).defaultNow().notNull(),
  tag: varchar("tag", { length: 50 }).default("no used").notNull(), // Добавляем поле tag
  user_id: integer("user_id").references(() => users.id), // ID пользователя с внешним ключом
  // поле сохранение изменения статуса дата
  status_updated_at: timestamp("status_updated_at", {
    precision: 3,
  }),
  // поле даты в какое время запись была использована
  used_at: timestamp("used_at", { precision: 3 }),
  // поле для хранения статуса
});
// tags.ts
export const tags = pgTable("tags", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull(),
  about: varchar("about", { length: 255 }),
  color: varchar("color", { length: 20 }).notNull(), // Цвет тега
  created_at: timestamp("created_at", { precision: 3 }).defaultNow().notNull(),
});
