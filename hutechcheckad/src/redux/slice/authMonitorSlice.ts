import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  isMonitorLoggedIn: false,
  studentId: null,
  monitorFullName: null,
  studyClass: null,
  monitorEmail: null
}

const authMonitorSlice = createSlice({
  name: 'authMonitor',
  initialState,
  reducers: {
    SET_ACTIVE_AUTH_MONITOR: (state, action) => {
      const { monitorEmail, monitorFullName, studentId, studyClass } =
        action.payload
      state.isMonitorLoggedIn = true
      state.monitorEmail = monitorEmail
      state.monitorFullName = monitorFullName
      state.studentId = studentId
      state.studyClass = studyClass
    },
    REMOVE_ACTIVE_AUTH_MONITOR(state, action) {
      state.isMonitorLoggedIn = false
      state.monitorEmail = null
      state.monitorFullName = null
      state.studentId = null
      state.studyClass = null
    }
  }
})

export const { SET_ACTIVE_AUTH_MONITOR, REMOVE_ACTIVE_AUTH_MONITOR } =
  authMonitorSlice.actions

export const selectIsMonitorLoggedIn = (state: any) =>
  state.authMonitor.isMonitorLoggedIn
export const selectMonitorEmail = (state: any) => state.authMonitor.monitorEmail
export const selectMonitorFullName = (state: any) =>
  state.authMonitor.monitorFullName
export const selectStudentId = (state: any) => state.authMonitor.studentId
export const selectStudyClass = (state: any) => state.authMonitor.studyClass

export const authMonitorReducer = authMonitorSlice.reducer
