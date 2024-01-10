import path from "path"
import * as dotenv from "dotenv"

import { stripTrailingSlash } from "@/utils/strip-trailing-slash"

export const NODE_ENV = process.env.NODE_ENV || "development"

let dotEnvPath
switch (process.env.NODE_ENV) {
  case "test":
    dotEnvPath = path.resolve(__dirname, "../.env.test")
    break
  case "production":
    dotEnvPath = path.resolve(__dirname, "../.env.production")
    break
  default:
    dotEnvPath = path.resolve(__dirname, "../.env.development")
}

dotenv.config({ path: dotEnvPath })

if (process.env.NODE_ENV !== "test") {
  console.log("Loading env: ", dotEnvPath)
}

export const API_PORT = process.env.API_PORT || "3000"

export const FRONTEND_URL = process.env.FRONTEND_URL || ""
export const AUTH0_DOMAIN = stripTrailingSlash(process.env.VITE_AUTH0_DOMAIN || "")
export const AUTH0_AUDIENCE = process.env.VITE_AUTH0_AUDIENCE
export const AUTH0_REDIRECT = process.env.VITE_AUTH0_REDIRECT || process.env.FRONTEND_URL || ""

export const APPLICATION_NAME = process.env.VITE_APPLICATION_NAME || ""

export const DB_HOST = process.env.DB_HOST || ""
export const DB_USER = process.env.DB_USER || ""
export const DB_PASS = process.env.DB_PASS || ""
export const DB_NAME = process.env.DB_NAME || ""
export const DB_PORT = parseInt(process.env.DB_PORT || "1433")

export const RELEASE_TAG = process.env.RELEASE_TAG || ""
export const GIT_COMMIT_HASH = process.env.GIT_COMMIT_HASH || ""
