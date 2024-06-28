import type { Migration } from "@/db/umzug"
import { QueryTypes } from "sequelize";

export const up: Migration = async ({ context: queryInterface }) => {
  const [rows] = await queryInterface.sequelize.query<{ id: number, name: string }[]>('SELECT name from user_groups', {
    type: QueryTypes.SELECT,
  });

  for (const row of rows) {
    const trimmedName = row.name.trim().replace(/\s+/g, " ")
    await queryInterface.sequelize.query('UPDATE user_groups SET name = :trimmedName WHERE id = :userId', {
      replacements: { trimmedName, userId: row.id }
    });
  }
}

export const down: Migration = async () => {
  // no-op
}
