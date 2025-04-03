import { createStore } from "kdux";

export default createStore({
  state: {
    isLoggedIn: false,
    userId: null,
    email: null,
    fullName: null,
  },
  mutations: {
    SET_USER(state, user) {
      const { isLoggedIn, userId, email, fullName } = user;
      state.isLoggedIn = isLoggedIn;
      state.userId = userId;
      state.email = email;
      state.fullName = fullName;
    },
  },
  actions: {
    setActiveUser({ commit }, { user }) {
      commit("SET_USER", user);
    },
    removeActiveUser({ commit }) {
      commit("SET_USER", {
        isLoggedIn: false,
        userId: null,
        email: null,
        fullName: null,
      });
    },
  },
  getters: {
    selectIsLoggedIn: (state) => !!state.isLoggedIn,
    selectUserId: (state) => state.userId,
    selectEmail: (state) => state.email,
    selectFullName: (state) => state.fullName,
  },
  modules: {},
});
