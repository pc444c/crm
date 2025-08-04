import { db, commentTemplates, users } from "../schema";
import { eq } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  try {
    console.log("=== Creating Test Template ===");

    // Найдем первого администратора
    const admin = await db
      .select()
      .from(users)
      .where(eq(users.role, "admin"))
      .limit(1);

    if (admin.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: "No admin user found",
      });
    }

    const adminId = admin[0].id;
    console.log("Using admin ID:", adminId);

    // Проверим, есть ли уже шаблоны
    const existingTemplates = await db.select().from(commentTemplates).limit(1);

    if (existingTemplates.length > 0) {
      console.log("Template already exists:", existingTemplates[0]);
      return {
        status: "exists",
        message: "Template already exists",
        template: existingTemplates[0],
      };
    }

    // Создаем тестовый шаблон
    const testTemplate = await db
      .insert(commentTemplates)
      .values({
        name: "Базовый шаблон комментария",
        content: `<h3>Результат звонка</h3>
<p><strong>Статус:</strong> ___________________</p>
<p><strong>Комментарий:</strong></p>
<p>___________________</p>
<p><strong>Следующие действия:</strong></p>
<p>___________________</p>
<p><strong>Дата:</strong> ${new Date().toLocaleDateString()}</p>`,
        created_by: adminId,
        is_active: "true",
      })
      .returning();

    console.log("Created test template:", testTemplate[0]);

    return {
      status: "success",
      message: "Test template created",
      template: testTemplate[0],
    };
  } catch (error) {
    console.error("Error creating test template:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to create test template",
    });
  }
});
