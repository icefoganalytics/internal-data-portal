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

import { ensureAndAuthorizeCurrentUser } from "@/middlewares/authorization-middleware"
import bodyAuthorizationHoistMiddleware from "@/middlewares/body-authorization-hoist-middleware"
import jwtMiddleware from "@/middlewares/jwt-middleware"
import pathFormatMiddleware from "@/middlewares/path-format-middleware"
import temporaryAccessCookieHoistMiddleware from "@/middlewares/temporary-access-cookie-hoist-middleware"

import {
  AccessGrantsController,
  AccessRequests,
  AccessRequestsController,
  CurrentUserController,
  DatasetEntriesController,
  DatasetEntryPreviewsController,
  DatasetFieldsController,
  DatasetIntegrationsController,
  Datasets,
  DatasetsController,
  DatasetStewardshipsController,
  Download,
  QaScenarios,
  TaggingsController,
  TagsController,
  TemporaryAccessCookieController,
  UserGroups,
  UserGroupsController,
  Users,
  UsersController,
  VisualizationControlsController,
} from "@/controllers"

export const router = Router()

// non-api (no authentication is required) routes
router.route("/_status").get((req: Request, res: Response) => {
  return res.json({
    RELEASE_TAG,
    GIT_COMMIT_HASH,
  })
})

// Authenticated routes
router.use(
  /\/(api|download)/,
  bodyAuthorizationHoistMiddleware,
  temporaryAccessCookieHoistMiddleware,
  jwtMiddleware,
  ensureAndAuthorizeCurrentUser,
  pathFormatMiddleware
)

// Non-API routes
router.route("/download/datasets/:datasetIdOrSlug").post(Download.DatasetsController.create)

// API routes
// Add all the standard api controller routes here
router.route("/api/current-user").get(CurrentUserController.show)
router.route("/api/temporary-access-cookie").post(TemporaryAccessCookieController.create)

router.route("/api/datasets").get(DatasetsController.index).post(DatasetsController.create)
router
  .route("/api/datasets/:datasetIdOrSlug")
  .get(DatasetsController.show)
  .patch(DatasetsController.update)
router.route("/api/datasets/:datasetIdOrSlug/files").post(Datasets.FilesController.create)
router
  .route("/api/datasets/:datasetIdOrSlug/files/:datasetFileId")
  .patch(Datasets.FilesController.update)
router
  .route("/api/datasets/:datasetIdOrSlug/email-subscribers")
  .get(Datasets.EmailSubscribersController.index)
  .post(Datasets.EmailSubscribersController.create)
router.route("/api/datasets/:datasetIdOrSlug/refresh").post(Datasets.RefreshController.create)

router
  .route("/api/access-grants")
  .get(AccessGrantsController.index)
  .post(AccessGrantsController.create)
router
  .route("/api/access-grants/:accessGrantId")
  .patch(AccessGrantsController.update)
  .delete(AccessGrantsController.destroy)

router
  .route("/api/access-requests")
  .get(AccessRequestsController.index)
  .post(AccessRequestsController.create)
router
  .route("/api/access-requests/:accessRequestId/approve")
  .post(AccessRequests.ApproveController.create)
router
  .route("/api/access-requests/:accessRequestId/deny")
  .post(AccessRequests.DenyController.create)
router
  .route("/api/access-requests/:accessRequestId/revoke")
  .post(AccessRequests.RevokeController.create)

router.route("/api/dataset-entry-previews").get(DatasetEntryPreviewsController.index)
router.route("/api/dataset-entries").get(DatasetEntriesController.index)

router
  .route("/api/dataset-fields")
  .get(DatasetFieldsController.index)
  .post(DatasetFieldsController.create)
router
  .route("/api/dataset-fields/:datasetFieldId")
  .patch(DatasetFieldsController.update)
  .delete(DatasetFieldsController.destroy)

router.route("/api/dataset-integrations").post(DatasetIntegrationsController.create)
router
  .route("/api/dataset-integrations/:datasetIntegrationId")
  .get(DatasetIntegrationsController.show)
  .patch(DatasetIntegrationsController.update)

router
  .route("/api/dataset-stewardships/:datasetStewardshipId")
  .patch(DatasetStewardshipsController.update)

router.route("/api/users").get(UsersController.index).post(UsersController.create)
router.route("/api/users/search/:searchToken").get(Users.SearchController.index)
router
  .route("/api/users/:userId")
  .get(UsersController.show)
  .patch(UsersController.update)
  .delete(UsersController.destroy)
router.route("/api/users/:userId/sync").post(Users.SyncController.create)

router.route("/api/user-groups").get(UserGroupsController.index)
router.route("/api/user-groups/sync").post(UserGroups.SyncController.create)

router.route("/api/taggings").get(TaggingsController.index).post(TaggingsController.create)
router.route("/api/taggings/:taggingId").delete(TaggingsController.destroy)
router.route("/api/tags").get(TagsController.index)

router
  .route("/api/visualization-controls/:visualizationControlId")
  .get(VisualizationControlsController.show)
  .patch(VisualizationControlsController.update)

// TODO: might want to lock these to only run in non-production environments?
router
  .route("/api/qa-scenarios/cycle-user-role-type")
  .post(QaScenarios.CycleUserRoleTypeController.create)

// if no other routes match, return a 404
router.use("/api", (req: Request, res: Response) => {
  return res.status(404).json({ message: `Resource not found for ${req.path}` })
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
