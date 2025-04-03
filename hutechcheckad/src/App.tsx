import './global.css'

import { Center, Loader } from '@mantine/core'
import axios from 'axios'
import { onAuthStateChanged } from 'firebase/auth'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where
} from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'

import { AppProvider } from '@/AppProvider'
import {
  Layout as LayoutOfficer,
  LayoutMonitor,
  SweetAlertContainer
} from '@/components'
import { auth, db } from '@/firebase'
import {
  Accounts,
  Activities,
  Certs,
  Configuration,
  EventEditor,
  EventInfo,
  Events,
  Hosts,
  Labels,
  Login,
  MonitorHome,
  Monitors,
  MyClass,
  OfficerHome,
  PageNotFound,
  Report,
  ReportClass,
  ReportMonitor,
  Students,
  TemplateInfo,
  Templates
} from '@/pages'
import {
  REMOVE_ACTIVE_AUTH_MONITOR,
  REMOVE_ACTIVE_USER,
  selectRoleName,
  SET_ACTIVE_AUTH_MONITOR,
  SET_ACTIVE_USER
} from '@/redux'
import {
  getFromLocalStorage,
  MONITOR_API_URL,
  removeFromLocalStorage
} from '@/utils'

function App() {
  const [loading, setLoading] = useState(true)
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false)
  const [signInType, setSignInType] = useState<number>(-1)

  const dispatch = useDispatch()

  const roleName = useSelector(selectRoleName)

  // Monitor currently sign in user
  useEffect(() => {
    setLoading(true)

    const monitorAuth = getFromLocalStorage('use-state')

    if (monitorAuth != null) {
      onMonitorAuthStateChanged(monitorAuth).then(() => {
        setLoading(false)
      })
    } else {
      onAuthStateChanged(auth, async (user: any) => {
        if (user) {
          const accountsCollectionRef = query(
            collection(db, 'accounts'),
            where('userId', '==', user.uid)
          )
          const accountsSnapshot = await getDocs(accountsCollectionRef)

          for (const doc of accountsSnapshot.docs) {
            const accountData = doc.data()

            const roleName = await getRole(accountData.roleName)

            dispatch(
              SET_ACTIVE_USER({
                email: user.email,
                fullName: accountData.fullName,
                userID: user.uid,
                roleId: accountData.roleName,
                roleName: roleName
              })
            )
          }

          setSignInType(0)
          setIsLoggedIn(true)
        } else {
          // @ts-ignore
          dispatch(REMOVE_ACTIVE_USER())
          setSignInType(-1)
          setIsLoggedIn(false)
        }

        setLoading(false)
      })
    }
  }, [dispatch])

  const onMonitorAuthStateChanged = async (monitorAuth: any) => {
    try {
      const res = await axios.get(`${MONITOR_API_URL}/`, {
        headers: {
          Authorization: `Bearer ${monitorAuth.accessToken}`
        }
      })
      if (res.status == 200) {
        const user = res.data

        dispatch(
          SET_ACTIVE_AUTH_MONITOR({
            monitorEmail: user.email,
            monitorFullName: user.fullName,
            studentId: user.studentId,
            studyClass: user.studyClass
          })
        )

        setSignInType(1)
        setIsLoggedIn(true)
      }
    } catch (e: any) {
      // @ts-ignore
      dispatch(REMOVE_ACTIVE_AUTH_MONITOR())
      removeFromLocalStorage('use-state')
      setSignInType(-1)
      setIsLoggedIn(false)
      window.location.reload()
    }
  }

  const getRole = async (roleName: string) => {
    let role = roleName

    if (role !== 'Quản trị viên' && role !== 'Cộng tác viên') {
      const docRef = doc(db, 'hosts', roleName)
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        const docData = docSnap.data()
        return docData.name
      }
    }

    return role
  }

  return (
    <>
      <SweetAlertContainer />

      <AppProvider>
        <HashRouter>
          {loading ? (
            <Center h="100vh">
              <Loader color="blue" size="xl" type="bars" />
            </Center>
          ) : !isLoggedIn ? (
            <Routes>
              {/* Chưa đăng nhập */}
              <>
                <Route path="/login" element={<Login />} />
                <Route path="*" element={<Navigate to="/login" />} />
              </>
            </Routes>
          ) : signInType == 0 ? (
            <LayoutOfficer>
              {/* Đã đăng nhập với tư cách Cán bộ */}
              <Routes>
                <>
                  <Route path="/login" element={<Navigate to="/" />} />

                  <Route path="/" element={<OfficerHome.Home />} />

                  {roleName != null && roleName == 'Quản trị viên' && (
                    <>
                      <Route path="/accounts" element={<Accounts />} />
                      <Route path="/hosts" element={<Hosts />} />
                      <Route
                        path="/configuration"
                        element={<Configuration />}
                      />
                      <Route path="/templates" element={<Templates />} />
                      <Route path="/templates/:id" element={<TemplateInfo />} />
                      <Route path="/labels" element={<Labels />} />

                      <Route
                        path="/report-monitor"
                        element={<ReportMonitor />}
                      />
                      <Route path="/report-class" element={<ReportClass />} />

                      <Route path="*" element={<PageNotFound />} />
                    </>
                  )}

                  <Route path="/events" element={<Events />} />
                  <Route path="/event-editor" element={<EventEditor />} />
                  <Route path="/event-editor/:id" element={<EventEditor />} />
                  <Route path="/events/:id" element={<EventInfo />} />
                  <Route path="/students" element={<Students />} />
                  <Route path="/monitors" element={<Monitors />} />
                  <Route path="/certs" element={<Certs />} />

                  <Route path={'/report'} element={<Report />} />

                  <Route path="*" element={<PageNotFound />} />
                </>
              </Routes>
            </LayoutOfficer>
          ) : (
            signInType == 1 && (
              <LayoutMonitor>
                {/* Đã đăng nhập với tư cách BCS Lớp */}
                <Routes>
                  <Route path="/login" element={<Navigate to="/" />} />

                  <Route path="/" element={<MonitorHome.Home />} />

                  <Route path="/my-class" element={<MyClass />} />
                  <Route path="/activities" element={<Activities />} />
                </Routes>
              </LayoutMonitor>
            )
          )}
        </HashRouter>
      </AppProvider>
    </>
  )
}

export default App
