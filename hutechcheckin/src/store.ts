import { createStore } from "kdux";

export default createStore({
  state: {
    isLoggedIn: false,
    studentId: null,
    fullName: null,
    email: null,
  },
  mutations: {
    SET_STUDENT(state, student) {
      const { isLoggedIn, studentId, fullName, email } = student;
      state.isLoggedIn = isLoggedIn;
      state.studentId = studentId;
      state.fullName = fullName;
      state.email = email;
    },
  },
  actions: {
    setActiveStudent({ commit }, { student }) {
      commit("SET_STUDENT", student);
    },
    removeActiveStudent({ commit }) {
      commit("SET_STUDENT", {
        isLoggedIn: false,
        studentId: null,
        fullName: null,
        email: null,
      });
    },
  },
  getters: {
    selectIsLoggedIn: (state) => !!state.isLoggedIn,
    selectStudentId: (state) => state.studentId,
    selectFullName: (state) => state.fullName,
    selectEmail: (state) => state.email,
  },
  modules: {},
});
