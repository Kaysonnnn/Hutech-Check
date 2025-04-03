import { auth } from "@/firebase/config";
import { createRouter, createWebHistory } from "@familyjs/kdu-router";
import { onAuthStateChanged } from "firebase/auth";
import { RouteRecordRaw } from "kdu-router";

const routes: Array<RouteRecordRaw> = [
  {
    path: "/",
    component: () => import("@/views/home/HomePage.kdu"),
    meta: {
      requiresAuth: true,
    },
  },
  {
    path: "/checkin/:id",
    component: () => import("@/views/checkin/CheckinPage.kdu"),
    meta: {
      requiresAuth: true,
    },
  },
  {
    path: "/login",
    component: () => import("@/views/auth/LoginPage.kdu"),
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

const getCurrentUser = () => {
  return new Promise((resolve: any, reject: any) => {
    const removeListener = onAuthStateChanged(
      auth,
      (user) => {
        removeListener();
        resolve(user);
      },
      reject
    );
  });
};

router.beforeEach(async (to: any, from: any, next: any) => {
  if (to.matched.some((record: any) => record.meta.requiresAuth)) {
    if (await getCurrentUser()) {
      next();
    } else {
      next("/login");
    }
  } else {
    next();
  }
});

export default router;
