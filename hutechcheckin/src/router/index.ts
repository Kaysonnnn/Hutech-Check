import { AUTH_API_URL } from "@/const";
import { getFromLocalStorage } from "@/utils/LocalStorage";
import { createRouter, createWebHistory } from "@familyjs/kdu-router";
import axios from "axios";
import { RouteRecordRaw } from "kdu-router";
import TabsPage from "@/views/TabsPage.kdu";

const routes: Array<RouteRecordRaw> = [
  {
    path: "/",
    redirect: "/home",
  },
  {
    path: "/",
    component: TabsPage,
    children: [
      {
        path: "",
        redirect: "/home",
      },
      {
        path: "home",
        component: () => import("@/views/home/HomePage.kdu"),
      },
      {
        path: "student",
        component: () => import("@/views/student/StudentPage.kdu"),
      },
    ],
    meta: {
      requiresAuth: true,
    },
  },
  {
    path: "/login",
    component: () => import("@/views/login/LoginPage.kdu"),
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

const checkIsLoggedIn = () => {
  return new Promise(async (resolve: any, reject: any) => {
    const text = getFromLocalStorage("use-state");

    if (text != null) {
      try {
        const res = await axios.get(`${AUTH_API_URL}/`, {
          headers: {
            Authorization: `Bearer ${text.accessToken}`,
          },
        });
        if (res.status == 200) {
          resolve(true);
        }
      } catch (e: any) {
        resolve(false);
      }
    } else {
      resolve(false);
    }
  });
};

router.beforeEach(async (to: any, from: any, next: any) => {
  if (to.matched.some((record: any) => record.meta.requiresAuth)) {
    if (await checkIsLoggedIn()) {
      next();
    } else {
      next("/login");
    }
  } else {
    next();
  }
});

export default router;
