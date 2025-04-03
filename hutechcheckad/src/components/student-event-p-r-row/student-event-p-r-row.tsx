import { Skeleton, Table } from '@mantine/core'
import { doc, getDoc } from 'firebase/firestore'
import { useEffect, useState } from 'react'

import { db } from '@/firebase'

export const StudentEventPRRow = ({ studentId }: { studentId: string }) => {
  const [loading, setLoading] = useState(false)
  const [fullName, setFullName] = useState<any>(null)
  const [studyClass, setStudyClass] = useState<any>(null)
  const [phone, setPhone] = useState<any>(null)
  const [email, setEmail] = useState<any>(null)

  useEffect(() => {
    setLoading(true)
    getStudent()
  }, [])

  const getStudent = async () => {
    const stRef = doc(db, 'students', studentId)
    const stSnap = await getDoc(stRef)

    if (stSnap.exists()) {
      const stData = stSnap.data()
      setFullName(stData.fullName)
      setStudyClass(stData.studyClass)
      setPhone(stData.phone)
      setEmail(stData.email)
    }
    setLoading(false)
  }

  return loading ? (
    <Table.Tr>
      <Table.Td>
        <Skeleton height={16} width="50%" radius="xl" />
      </Table.Td>
      <Table.Td>
        <Skeleton height={16} radius="xl" />
      </Table.Td>
      <Table.Td>
        <Skeleton height={16} width="50%" radius="xl" />
      </Table.Td>
      <Table.Td>
        <Skeleton height={16} radius="xl" />
      </Table.Td>
      <Table.Td>
        <Skeleton height={16} width="50%" radius="xl" />
      </Table.Td>
    </Table.Tr>
  ) : (
    <Table.Tr>
      <Table.Td>{studentId}</Table.Td>
      <Table.Td>{fullName}</Table.Td>
      <Table.Td>{studyClass}</Table.Td>
      <Table.Td>{email}</Table.Td>
      <Table.Td>{phone}</Table.Td>
    </Table.Tr>
  )
}
