import { db } from "~~/server";
import { tags } from "~~/server/schema";
import { defineEventHandler, readBody, createError } from "h3";
import { eq, and, asc } from "drizzle-orm";

// добавление тега
export default defineEventHandler(async (event) => {
  // получение тела запроса ,а иммено text,desc,color
  const body = await readBody(event);
  const { name, color, desc } = body;
  //   записываем в базу данных
  const result = await db
    .insert(tags)
    .values({
      name: name,
      color: color,
      created_at: new Date(),
    })
    .returning()
    .execute();
  const newTag = result[0];
  if (!newTag) {
    throw createError({
      statusCode: 500,
      statusMessage: "Ошибка при добавлении тега",
    });
  }
  return {
    statusCode: 200,
    statusMessage: "Тег успешно добавлен",
    data: newTag,
  };
});
