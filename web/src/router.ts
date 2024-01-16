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

router.beforeEach((to) => {
  if (to.meta.requiresAuth === false) return true

  return authGuard(to)
})

export default router
