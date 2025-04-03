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
import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { Pagination } from '@/components'
import { useFetchCollection } from '@/hooks'
import {
  FILTER_BY_SEARCH_MONITORS,
  selectFilteredMonitors,
  selectMonitors,
  STORE_MONITORS
} from '@/redux'

export const Monitors = () => {
  const { data, isLoading } = useFetchCollection('students')
  const monitors = useSelector(selectMonitors)
  const filteredMonitors = useSelector(selectFilteredMonitors)

  const [search, setSearch] = useState('')
  // Pagination states
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [itemsPerPage, setItemsPerPage] = useState<string | null>('10')
  // Get Current Items
  const indexOfLastItem = currentPage * Number(itemsPerPage)
  const indexOfFirstItem = indexOfLastItem - Number(itemsPerPage)
  const currentItems = filteredMonitors.slice(indexOfFirstItem, indexOfLastItem)

  const dispatch = useDispatch()

  useEffect(() => {
    dispatch(
      STORE_MONITORS({
        monitors: data
      })
    )
  }, [dispatch, data])

  useEffect(() => {
    dispatch(FILTER_BY_SEARCH_MONITORS({ monitors, search }))
    setCurrentPage(1)
  }, [dispatch, monitors, search])

  return (
    <>
      <Title order={2} mb="lg">
        Danh sách ban cán sự lớp
      </Title>

      {isLoading ? (
        <Loader color="blue" size="xl" type="dots" />
      ) : (
        <>
          <Group justify="space-between" my="md">
            <div>
              <TextInput
                label={
                  <>
                    <b>{filteredMonitors.length}</b> sinh viên
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

          {filteredMonitors.length === 0 ? (
            <Text my="md">Không có dữ liệu nào.</Text>
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
                  totalItems={filteredMonitors.length}
                />
              </Center>
            </>
          )}
        </>
      )}
    </>
  )
}
