import path from "path"
import fs from "fs"

import { DatabaseError } from "sequelize"
import {
  Router,
  type Request,
  type Response,
  type ErrorRequestHandler,
  type NextFunction,
} from "express"
import { template } from "lodash"
import { UnauthorizedError } from "express-jwt"

import { APPLICATION_NAME, GIT_COMMIT_HASH, NODE_ENV, RELEASE_TAG } from "@/config"

import jwtMiddleware from "@/middlewares/jwt-middleware"
import { ensureAndAuthorizeCurrentUser } from "@/middlewares/authorization-middleware"

import {
  CurrentUserController,
  DatasetsController,
  UsersController,
  Users,
  UserGroups,
  UserGroupsController,
  QaScenarios,
} from "@/controllers"

export const router = Router()

// non-api (no authentication is required) routes
router.route("/_status").get((req: Request, res: Response) => {
  return res.json({
    RELEASE_TAG,
    GIT_COMMIT_HASH,
  })
})

// api routes
router.use("/api", jwtMiddleware, ensureAndAuthorizeCurrentUser)

// Add all the standard api controller routes here
router.route("/api/current-user").get(CurrentUserController.show)

router.route("/api/datasets").get(DatasetsController.index)
router.route("/api/datasets").post(DatasetsController.create)
router.route("/api/datasets/:datasetId").get(DatasetsController.show)

router.route("/api/users").get(UsersController.index)
router
  .route("/api/users/:userId/yukon-government-directory-sync")
  .post(Users.YukonGovernmentDirectorySyncController.create)

router.route("/api/user-groups").get(UserGroupsController.index)
router
  .route("/api/user-groups/yukon-government-directory-sync")
  .post(UserGroups.YukonGovernmentDirectorySyncController.create)

// TODO: might want to lock these to only run in non-production environments?
router.route("/api/qa-scenarios/link-random-tags").post(QaScenarios.LinkRandomTagsController.create)
router
  .route("/api/qa-scenarios/apply-random-access-grants")
  .post(QaScenarios.ApplyRandomAccessGrantsController.create)

// if no other routes match, return a 404
router.use("/api", (req: Request, res: Response) => {
  return res.status(404).json({ message: "Not Found" })
})

// Special error handler for all api errors
// See https://expressjs.com/en/guide/error-handling.html#writing-error-handlers
router.use("/api", (err: ErrorRequestHandler, req: Request, res: Response, next: NextFunction) => {
  if (res.headersSent) {
    return next(err)
  }

  if (err instanceof DatabaseError) {
    console.error(err)
    return res.status(422).json({ message: "Invalid query against database." })
  } else if (err instanceof UnauthorizedError) {
    console.error(err)
    return res.status(401).json({ message: err.inner.message })
  }

  console.error(err)
  return res.status(500).json({ message: "Internal Server Error" })
})

// if no other non-api routes match, send the pretty 404 page
if (NODE_ENV === "development") {
  router.use("/", (req: Request, res: Response) => {
    const templatePath = path.resolve(__dirname, "web/404.html")
    try {
      const templateString = fs.readFileSync(templatePath, "utf8")
      const compiledTemplate = template(templateString)
      const result = compiledTemplate({
        applicationName: APPLICATION_NAME,
        releaseTag: RELEASE_TAG,
        gitCommitHash: GIT_COMMIT_HASH,
      })
      return res.status(404).send(result)
    } catch (error) {
      console.error(error)
      return res.status(500).send(`Error building 404 page: ${error}`)
    }
  })
}

export default router
