import { createRouter, createWebHistory, type RouteRecordRaw } from "vue-router"
import { authGuard } from "@auth0/auth0-vue"

const routes: RouteRecordRaw[] = [
  {
    path: "/",
    redirect: "/dashboard",
  },
  {
    name: "DashboardPage",
    path: "/dashboard",
    component: () => import("@/pages/DashboardPage.vue"),
  },
  {
    name: "DataSetNewPage",
    path: "/data-set/new",
    component: () => import("@/pages/DataSetNewPage.vue"),
  },
  {
    name: "SignInPage",
    path: "/sign-in",
    component: () => import("@/pages/SignInPage.vue"),
    meta: { requiresAuth: false },
  },
  {
    name: "StatusPage",
    path: "/status",
    component: () => import("@/pages/StatusPage.vue"),
    meta: { requiresAuth: false },
  },
  {
    name: "NotFoundPage",
    path: "/:pathMatch(.*)*",
    component: () => import("@/pages/NotFoundPage.vue"),
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach(async (to) => {
  if (to.meta.requiresAuth === false) return true
  // TODO: consider whether I should redirect to /sign-in instead of the auth0 login page?
  const isAuthenticated = await authGuard(to)
  if (isAuthenticated) return true

  // TODO: consider loading user in route guard?
  // check if current user exists
  // attempt to load current user, unless it's already been loaded?
  // if current user does not exist, attempt to create a new user
  // if current user still does exist, throw some kind of error?
  // if meta.requiresRoleAdmin (or whatever) does not match or exceed current user role
  // return false

  return false
})

export default router
