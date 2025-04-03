import {
  Center,
  Checkbox,
  Group,
  Loader,
  Select,
  Table,
  Text,
  TextInput,
  Title
} from '@mantine/core'
import { IconSearch } from '@tabler/icons-react'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { Pagination } from '@/components'
import { db } from '@/firebase'
import {
  FILTER_BY_SEARCH_STUDENTS,
  selectFilteredStudents,
  selectStudents,
  selectStudyClass,
  STORE_STUDENTS
} from '@/redux'

export const MyClass = () => {
  const [isLoading, setIsLoading] = useState(false)

  const students = useSelector(selectStudents)
  const filteredStudents = useSelector(selectFilteredStudents)

  const [search, setSearch] = useState('')
  // Pagination states
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [itemsPerPage, setItemsPerPage] = useState<string | null>('10')
  // Get Current Items
  const indexOfLastItem = currentPage * Number(itemsPerPage)
  const indexOfFirstItem = indexOfLastItem - Number(itemsPerPage)
  const currentItems = filteredStudents.slice(indexOfFirstItem, indexOfLastItem)

  const studyClass = useSelector(selectStudyClass)

  const dispatch = useDispatch()

  useEffect(() => {
    setIsLoading(true)
    fetchStudentsData()
  }, [])

  const fetchStudentsData = async () => {
    let studentsData: any = []
    let dataLoaded = false

    const docRef = query(
      collection(db, 'students'),
      where('studyClass', '==', studyClass)
    )
    await onSnapshot(docRef, async snapshot => {
      const allData: any = await Promise.all(
        snapshot.docs.map(async snap => {
          const doc = snap.data()
          return { ...doc }
        })
      )

      studentsData = allData
      dataLoaded = true
    })

    const waitForData = setInterval(() => {
      if (dataLoaded) {
        clearInterval(waitForData)
        dispatch(
          STORE_STUDENTS({
            students: studentsData
          })
        )
        setIsLoading(false)
      }
    }, 100)
  }

  useEffect(() => {
    dispatch(FILTER_BY_SEARCH_STUDENTS({ students, search }))
    setCurrentPage(1)
  }, [dispatch, students, search])

  return (
    <>
      <Title order={2}>Danh sách sinh viên ({studyClass})</Title>
      <Text>
        Bạn có thể xem các sinh viên lớp mình đã tham gia sự kiện tại đây.
      </Text>
      <Text c="red">
        Nếu có thông tin thay đổi, vui lòng liên hệ ban quản trị để cập nhật.
      </Text>

      {isLoading ? (
        <Loader color="blue" size="xl" type="dots" />
      ) : (
        <>
          <Group justify="space-between">
            <div>
              <TextInput
                label={
                  <>
                    <b>{filteredStudents.length}</b> sinh viên
                  </>
                }
                placeholder="Tìm kiếm sinh viên"
                leftSection={<IconSearch stroke={1.5} />}
                value={search}
                onChange={(e: any) => setSearch(e.target.value)}
                variant="default"
              />
            </div>

            <Select
              label={`Đang hiển thị ${itemsPerPage} mục`}
              placeholder="Chọn giá trị"
              data={['10', '25', '50', '100']}
              value={itemsPerPage}
              onChange={setItemsPerPage}
              allowDeselect={false}
            />
          </Group>

          {filteredStudents.length === 0 ? (
            <Text>Không có dữ liệu nào.</Text>
          ) : (
            <>
              <Table.ScrollContainer my="md" minWidth={500} type="native">
                <Table striped highlightOnHover withTableBorder>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>MSSV</Table.Th>
                      <Table.Th>Họ tên</Table.Th>
                      <Table.Th>Lớp</Table.Th>
                      <Table.Th>BCS</Table.Th>
                      <Table.Th>Điện thoại</Table.Th>
                      <Table.Th>Email</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {currentItems.map((student: any, index: any) => {
                      const {
                        id,
                        studentId,
                        fullName,
                        studyClass,
                        isMonitor,
                        email,
                        phone,
                        createdAt,
                        editedAt
                      } = student

                      return (
                        <Table.Tr key={studentId}>
                          <Table.Td>{studentId}</Table.Td>
                          <Table.Td>{fullName}</Table.Td>
                          <Table.Td>{studyClass}</Table.Td>
                          <Table.Td>
                            {isMonitor && (
                              <Checkbox
                                checked={isMonitor}
                                onChange={() => {}}
                                radius="xl"
                              />
                            )}
                          </Table.Td>
                          <Table.Td>{phone}</Table.Td>
                          <Table.Td>{email}</Table.Td>
                        </Table.Tr>
                      )
                    })}
                  </Table.Tbody>
                </Table>
              </Table.ScrollContainer>

              <Center>
                <Pagination
                  currentPage={currentPage}
                  setCurrentPage={setCurrentPage}
                  itemsPerPage={Number(itemsPerPage)}
                  totalItems={filteredStudents.length}
                />
              </Center>
            </>
          )}
        </>
      )}
    </>
  )
}
