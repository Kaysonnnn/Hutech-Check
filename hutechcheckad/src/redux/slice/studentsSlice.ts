import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  students: [],
  monitors: []
}

const studentSlice = createSlice({
  name: 'student',
  initialState,
  reducers: {
    STORE_STUDENTS(state, action) {
      state.students = action.payload.students
    },
    STORE_MONITORS(state, action) {
      const { monitors } = action.payload
      const tempMonitors = monitors.filter(
        (monitor: any) => monitor.isMonitor === true
      )
      state.monitors = tempMonitors
    }
  }
})

export const { STORE_STUDENTS, STORE_MONITORS } = studentSlice.actions

export const selectStudents = (state: any) => state.student.students
export const selectMonitors = (state: any) => state.student.monitors

export const studentReducer = studentSlice.reducer
