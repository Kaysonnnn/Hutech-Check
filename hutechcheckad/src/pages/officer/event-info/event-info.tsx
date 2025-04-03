import {
  Button,
  Center,
  Checkbox,
  Group,
  Loader,
  Modal,
  Paper,
  rem,
  SimpleGrid,
  Table,
  Text,
  Textarea,
  Title
} from '@mantine/core'
import {
  IconBellRinging,
  IconId,
  IconTableImport,
  IconUserCheck,
  IconUserHeart,
  IconUserPlus
} from '@tabler/icons-react'
import axios from 'axios'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  Timestamp,
  updateDoc,
  where
} from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate, useParams } from 'react-router-dom'

import { StudentEventPRRow, StudentEventRow } from '@/components'
import { db } from '@/firebase'
import { selectUserID } from '@/redux'
import { EVENT_API_URL, formatCertNumber, getCertYear } from '@/utils'

export const EventInfo = () => {
  const { id } = useParams()

  const [opened, setOpened] = useState(false)
  const [formIsLoading, setFormIsLoading] = useState(false)
  const [studentsId, setStudentsId] = useState('')

  const [loading, setLoading] = useState(false)
  const [eventData, setEventData] = useState<any>(null)
  const [title, setTitle] = useState('')
  const [host, setHost] = useState('')
  const [certList, setCertList] = useState([])
  const [checkoutLength, setCheckoutLength] = useState<number>(0)
  const [preRegistrationList, setPreRegistrationList] = useState([])
  const [isSeePRList, setIsSeePRList] = useState(false)
  const [waiting, setWaiting] = useState(false)

  const userId = useSelector(selectUserID)

  const navigate = useNavigate()

  const redirectToEvents = () => {
    navigate('/events')
  }

  useEffect(() => {
    setLoading(true)
    checkIsExistEvent(id!)
  }, [])

  const checkIsExistEvent = async (eId: string) => {
    const docRef = doc(db, 'events', eId)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      const docData = docSnap.data()
      setEventData(docData)
      setTitle(docData.title)
      setHost(docData.host)
      if (docData.preRegistration != null) {
        setPreRegistrationList(docData.preRegistration)
      }
      await getEventCheckins(eId)
    } else {
      redirectToEvents()
    }
  }

  const getEventCheckins = async (eId: string) => {
    const docsRef = query(collection(db, 'certs'), where('eventId', '==', eId))
    const docsSnap = await getDocs(docsRef)

    let certs: any = []
    let checkoutLen = 0

    docsSnap.forEach((doc: any) => {
      const docData = doc.data()
      certs.push(docData)
      if (docData.checkoutAt !== '') {
        checkoutLen++
      }
    })

    setCertList(certs)
    setCheckoutLength(checkoutLen)
    setLoading(false)
  }

  const getStudentIdPattern = async () => {
    const configRef = doc(db, 'system', 'configuration')
    const configSnap = await getDoc(configRef)

    if (configSnap.exists()) {
      const configData = configSnap.data()
      return configData.regexCheckStudentId
    } else {
      return ''
    }
  }

  const checkStudentId = async (studentId: string) => {
    const studentIdPattern = await getStudentIdPattern()

    if (studentIdPattern != '') {
      return new RegExp(studentIdPattern.slice(1, -1)).test(studentId)
    } else {
      return true
    }
  }

  const checkExistStudentId = async (studentId: string) => {
    const docRef = doc(db, 'students', studentId)
    const docSnap = await getDoc(docRef)

    return docSnap.exists()
  }

  const checkStudentCheckedIn = async (studentId: string) => {
    const docRef = doc(db, 'certs', `${id}_${studentId}`)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      const docData = docSnap.data()
      const isCheckedOut = docData.checkoutAt

      if (isCheckedOut === '') {
        return 1
      } else if (isCheckedOut !== '') {
        return 2
      }
    } else {
      return 0
    }
  }

  const getCertSuffix = async () => {
    const docSnap = await getDoc(doc(db, 'hosts', host))

    if (docSnap.exists()) {
      return `CN${getCertYear(new Date())}${docSnap.data().symbol}`
    }
    return ''
  }

  const getCertId = async (suffix: string) => {
    const docsRef = query(
      collection(db, 'certs'),
      where('suffix', '==', suffix)
    )
    const docSnap = await getDocs(docsRef)
    return formatCertNumber(docSnap.size + 1, 6)
  }

  const handleCheckin = async (eventName: string, studentId: string) => {
    const existStudentId = await checkExistStudentId(studentId)
    if (!existStudentId) {
      await setDoc(doc(db, 'students', studentId), {
        studentId: studentId,
        fullName: '',
        studyClass: '',
        isMonitor: false,
        email: '',
        phone: '',
        createdAt: Timestamp.now().toDate()
      })
    }

    const certSuffix = await getCertSuffix()

    const certId = await getCertId(certSuffix)

    console.log(`${certId}/${certSuffix}`)

    await setDoc(doc(db, 'certs', `${id}_${studentId}`), {
      certId: `${certId}/${certSuffix}`,
      suffix: certSuffix,
      studentId: studentId,
      eventId: id,
      checkinAt: Timestamp.now().toDate(),
      checkinBy: userId,
      checkoutAt: ''
    })
  }

  const handleCheckout = async (studentId: string) => {
    await updateDoc(doc(db, 'certs', `${id}_${studentId}`), {
      checkoutAt: Timestamp.now().toDate()
    })
  }

  const handleCheckinAgain = async (studentId: string) => {
    await updateDoc(doc(db, 'certs', `${id}_${studentId}`), {
      checkoutAt: ''
    })
  }

  const handleCheckinOrCheckout = async (e: any) => {
    e.preventDefault()

    setFormIsLoading(true)

    const lines = studentsId.split('\n')
    for (const studentId of lines) {
      const validStudentId = await checkStudentId(studentId)

      if (validStudentId) {
        const state = await checkStudentCheckedIn(studentId)

        if (state === 0) {
          await handleCheckin(title, studentId)
          window.SweetAlert.success(
            'Check-in',
            `Đã check-in sinh viên ${studentId} thành công.`,
            true
          )
        } else if (state === 1) {
          await handleCheckout(studentId)
          window.SweetAlert.success(
            'Check-out',
            `Đã check-out sinh viên ${studentId} thành công.`,
            true
          )
        } else if (state === 2) {
          await handleCheckinAgain(studentId)
          window.SweetAlert.success(
            'Check-in lại',
            `Đã check-in sinh viên ${studentId} tham dự lại.`,
            true
          )
        } else {
          window.SweetAlert.warning('Lỗi', `Không tìm thấy sự kiện này.`, true)
        }
      } else {
        window.SweetAlert.warning(
          'Bỏ qua',
          `Bỏ qua check-in/out sinh viên ${studentId}.`,
          true
        )
      }
    }

    setFormIsLoading(false)
    setOpened(false)
    resetForm()
  }

  const resetForm = () => {
    setStudentsId('')
  }

  const handleSendReminder = () => {
    axios
      .post(
        `${EVENT_API_URL}/event-reminder`,
        {
          event: eventData,
          students: preRegistrationList
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
      .then(() => {
        window.SweetAlert.success(
          '',
          'Đã gửi thông báo nhắc nhở sự kiện này đến mail của các sinh viên đã đăng ký tham dự trước.',
          true
        )
      })
  }

  return (
    <>
      <Title order={2}>{title}</Title>
      <Text>Danh sách check-in, check-out</Text>

      {loading ? (
        <Loader color="blue" size="xl" type="dots" />
      ) : (
        <>
          <Modal
            opened={opened}
            onClose={() => {
              resetForm()
              setOpened(false)
            }}
            title="Check-in/out sinh viên"
            centered
            removeScrollProps={{ allowPinchZoom: true }}
            closeOnClickOutside={false}
          >
            <form onSubmit={handleCheckinOrCheckout}>
              <Textarea
                label="Nhập (các) mã số sinh viên"
                placeholder={'2180602080\n2180602058\n...'}
                description="Các MSSV không hợp lệ sẽ bị bỏ qua. Có thể nhập MSSV trùng nhau."
                value={studentsId}
                onChange={event => setStudentsId(event.currentTarget.value)}
                required
                radius="md"
                autosize
                minRows={6}
                maxRows={6}
                leftSection={<IconId size={18} stroke={1.5} />}
                disabled={formIsLoading}
              />
              <Group grow mt="md">
                <Button
                  my="lg"
                  onClick={() => {
                    resetForm()
                    setOpened(false)
                  }}
                  color="red"
                  disabled={formIsLoading}
                >
                  Đóng
                </Button>
                <Button
                  my="lg"
                  color="green"
                  type="submit"
                  loading={formIsLoading}
                >
                  Nhập
                </Button>
              </Group>
            </form>
          </Modal>

          <Button
            my="lg"
            onClick={() => setOpened(true)}
            leftSection={<IconTableImport size={18} stroke={1.5} />}
          >
            Nhập (nhiều) sinh viên
          </Button>

          <SimpleGrid cols={{ base: 1, sm: 3 }}>
            <Paper withBorder radius="md" p="xs">
              <Group>
                <Center>
                  <IconUserHeart
                    style={{ width: rem(20), height: rem(20) }}
                    stroke={1.5}
                  />
                </Center>

                <div>
                  <Text c="dimmed" size="xs" tt="uppercase" fw={700}>
                    Sinh viên đăng ký trước
                  </Text>
                  <Text fw={700} size="xl" color="blue">
                    {preRegistrationList.length}
                  </Text>
                </div>
              </Group>
            </Paper>
            <Paper withBorder radius="md" p="xs">
              <Group>
                <Center>
                  <IconUserPlus
                    style={{ width: rem(20), height: rem(20) }}
                    stroke={1.5}
                  />
                </Center>

                <div>
                  <Text c="dimmed" size="xs" tt="uppercase" fw={700}>
                    Tổng số sinh viên tham dự
                  </Text>
                  <Text fw={700} size="xl" color="green">
                    {certList.length}
                  </Text>
                </div>
              </Group>
            </Paper>
            <Paper withBorder radius="md" p="xs">
              <Group>
                <Center>
                  <IconUserCheck
                    style={{ width: rem(20), height: rem(20) }}
                    stroke={1.5}
                  />
                </Center>

                <div>
                  <Text c="dimmed" size="xs" tt="uppercase" fw={700}>
                    Số sinh viên check-out
                  </Text>
                  <Text fw={700} size="xl" color="red">
                    {checkoutLength}
                  </Text>
                </div>
              </Group>
            </Paper>
          </SimpleGrid>

          {preRegistrationList.length > 0 && (
            <Checkbox
              my="md"
              label="Xem danh sách sinh viên đã đăng ký trước"
              checked={isSeePRList}
              onChange={event => setIsSeePRList(event.currentTarget.checked)}
            />
          )}

          {isSeePRList && (
            <Button
              variant="light"
              onClick={handleSendReminder}
              leftSection={<IconBellRinging size={24} />}
            >
              Gửi thông báo nhắc nhở sinh viên
            </Button>
          )}

          <Table.ScrollContainer my="md" minWidth={500} type="native">
            {isSeePRList ? (
              <Table striped highlightOnHover withTableBorder>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>MSSV</Table.Th>
                    <Table.Th>Họ tên</Table.Th>
                    <Table.Th>Lớp</Table.Th>
                    <Table.Th>Email</Table.Th>
                    <Table.Th>Điện thoại</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {preRegistrationList.map((studentId: any, index: any) => (
                    <StudentEventPRRow studentId={studentId} key={studentId} />
                  ))}
                </Table.Tbody>
              </Table>
            ) : (
              <Table striped highlightOnHover withTableBorder>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>MSSV</Table.Th>
                    <Table.Th>Họ tên</Table.Th>
                    <Table.Th>Lớp</Table.Th>
                    <Table.Th>Email</Table.Th>
                    <Table.Th>Điện thoại</Table.Th>
                    <Table.Th>Checkin</Table.Th>
                    <Table.Th>Checkout</Table.Th>
                    <Table.Th>Người checkin</Table.Th>
                    <Table.Th>Hành động</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {certList.map((student: any, index: any) => (
                    <StudentEventRow
                      student={student}
                      isCheckedOut={student.checkoutAt !== ''}
                      key={student.studentId}
                    />
                  ))}
                </Table.Tbody>
              </Table>
            )}
          </Table.ScrollContainer>
        </>
      )}
    </>
  )
}
