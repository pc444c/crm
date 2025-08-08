import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq, like } from 'drizzle-orm';
import { pgTable, serial, text, timestamp, integer } from 'drizzle-orm/pg-core';

// Схема таблиц (копируем необходимые части)
const teams = pgTable('teams', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
});

const userTeams = pgTable('user_teams', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').notNull(),
  team_id: integer('team_id').notNull(),
  created_at: timestamp('created_at').defaultNow(),
});

const connectionString = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_qIbwU4eBNhv0@ep-square-salad-a26ye40t-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
const client = postgres(connectionString);
const db = drizzle(client);

async function deleteTestTeam() {
  try {
    console.log('Ищем тестовые команды...');
    
    // Найдем команды с тестовыми названиями
    const testTeams = await db
      .select()
      .from(teams)
      .where(like(teams.name, '%ТЕСТ%'));
    
    console.log('Найдено тестовых команд:', testTeams.length);
    testTeams.forEach(team => {
      console.log(`- ID: ${team.id}, Название: ${team.name}`);
    });
    
    if (testTeams.length === 0) {
      console.log('Тестовые команды не найдены');
      return;
    }
    
    for (const team of testTeams) {
      console.log(`Удаляем команду: ${team.name} (ID: ${team.id})`);
      
      // Сначала удаляем связи пользователей с командой
      await db.delete(userTeams).where(eq(userTeams.team_id, team.id));
      console.log(`- Удалены связи пользователей для команды ${team.name}`);
      
      // Затем удаляем саму команду
      await db.delete(teams).where(eq(teams.id, team.id));
      console.log(`- Удалена команда ${team.name}`);
    }
    
    console.log('Тестовые команды успешно удалены!');
    
  } catch (error) {
    console.error('Ошибка при удалении команд:', error);
  } finally {
    await client.end();
  }
}

deleteTestTeam();
