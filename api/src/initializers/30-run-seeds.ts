import { seeder } from "@/db/umzug"
// import { SomeModel } from "@/models"

export async function runSeeds(): Promise<void> {
  if (process.env.SKIP_SEEDING_UNLESS_EMPTY === "true") {
    // const count = await SomeModel.count()
    // if (count > 0) {
    //   console.log("Skipping seeding as SKIP_SEEDING_UNLESS_EMPTY set, and data already seeded.")
    //   return
    // }
  }

  await seeder.up()
  return
}

export default runSeeds
