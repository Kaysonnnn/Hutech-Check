import { Button, Loader, Table } from '@mantine/core'
import {
  deleteDoc,
  doc,
  getDoc,
  Timestamp,
  updateDoc
} from 'firebase/firestore'
import { useEffect, useState } from 'react'

import { db } from '@/firebase'
import { formatTimestamp } from '@/utils'

export const StudentEventRow = ({
  student,
  isCheckedOut
}: {
  student: any
  isCheckedOut: boolean
}) => {
  const [loading, setLoading] = useState(false)
  const [fullName, setFullName] = useState<any>(null)
  const [studyClass, setStudyClass] = useState<any>(null)
  const [phone, setPhone] = useState<any>(null)
  const [email, setEmail] = useState<any>(null)
  const [checkinBy, setCheckinBy] = useState<any>(null)
  const [btnLoading, setBtnLoading] = useState(false)
  const [waitRemove, setWaitRemove] = useState(false)

  useEffect(() => {
    setLoading(true)
    getStudent()
  }, [])

  const getStudent = async () => {
    const stRef = doc(db, 'students', student.studentId)
    const stSnap = await getDoc(stRef)

    if (stSnap.exists()) {
      const stData = stSnap.data()
      setFullName(stData.fullName)
      setStudyClass(stData.studyClass)
      setPhone(stData.phone)
      setEmail(stData.email)

      if (student.checkinBy !== '') {
        const userRef = doc(db, 'accounts', student.checkinBy)
        const userSnap = await getDoc(userRef)

        if (userSnap.exists()) {
          setCheckinBy(userSnap.data().fullName)
        }
      } else {
        setCheckinBy('')
      }
    }
    setLoading(false)
  }

  const handleCheckinAgain = async (studentId: string) => {
    setBtnLoading(true)
    await updateDoc(doc(db, 'certs', `${student.eventId}_${studentId}`), {
      checkoutAt: ''
    })
    window.SweetAlert.success(
      'Check-in sinh viên',
      `Đã check-in sinh viên ${studentId} tham dự lại.<br/>Tải lại trang để xem thay đổi.`,
      false
    )
    setBtnLoading(false)
  }

  const handleCheckout = async (studentId: string) => {
    setBtnLoading(true)
    await updateDoc(doc(db, 'certs', `${student.eventId}_${studentId}`), {
      checkoutAt: Timestamp.now().toDate()
    })
    window.SweetAlert.success(
      'Hủy check-out sinh viên',
      `Đã check-out sinh viên ${studentId} thành công.<br/>Tải lại trang để xem thay đổi.`,
      false
    )
    setBtnLoading(false)
  }

  const handleCancelCheckin = async (studentId: string) => {
    setWaitRemove(true)
    await deleteDoc(doc(db, 'certs', `${student.eventId}_${studentId}`))
    window.SweetAlert.success(
      'Hủy check-in sinh viên',
      `Đã hủy check-in sinh viên ${studentId} thành công.<br/>Tải lại trang để xem thay đổi.`,
      false
    )
    setWaitRemove(false)
  }

  return loading ? (
    <Loader color="blue" type="dots" />
  ) : (
    <Table.Tr>
      <Table.Td>{student.studentId}</Table.Td>
      <Table.Td>{fullName}</Table.Td>
      <Table.Td>{studyClass}</Table.Td>
      <Table.Td>{email}</Table.Td>
      <Table.Td>{phone}</Table.Td>
      <Table.Td>{formatTimestamp(student.checkinAt.seconds)}</Table.Td>
      <Table.Td>
        {student.checkoutAt && formatTimestamp(student.checkoutAt.seconds)}
      </Table.Td>
      <Table.Td>{checkinBy}</Table.Td>
      <Table.Td>
        <Button.Group>
          {!isCheckedOut ? (
            <Button
              variant="filled"
              loading={btnLoading}
              color="green"
              onClick={() => handleCheckout(student.studentId)}
            >
              Checkout
            </Button>
          ) : (
            <Button
              variant="filled"
              loading={btnLoading}
              color="green"
              onClick={() => handleCheckinAgain(student.studentId)}
            >
              Hủy Checkout
            </Button>
          )}
          <Button
            variant="filled"
            color="red"
            loading={waitRemove}
            onClick={() => handleCancelCheckin(student.studentId)}
          >
            Hủy Checkin
          </Button>
        </Button.Group>
      </Table.Td>
    </Table.Tr>
  )
}
