import {
  ActionIcon,
  Button,
  Center,
  Group,
  Loader,
  Modal,
  Select,
  Table,
  Text,
  TextInput,
  Title
} from '@mantine/core'
import { modals } from '@mantine/modals'
import {
  IconEdit,
  IconSearch,
  IconTrash,
  IconUsersPlus
} from '@tabler/icons-react'
import axios from 'axios'
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  QuerySnapshot,
  setDoc,
  Timestamp,
  updateDoc,
  where
} from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { Pagination } from '@/components'
import { db } from '@/firebase'
import { useFetchCollection } from '@/hooks'
import { Host } from '@/models'
import {
  FILTER_BY_SEARCH_HOSTS,
  selectFilteredHosts,
  selectHosts,
  STORE_HOSTS
} from '@/redux'
import { ACCOUNTS_API_URL, uuidv4 } from '@/utils'

export const Hosts = () => {
  const [opened, setOpened] = useState(false)
  const [formIsLoading, setFormIsLoading] = useState(false)
  const { data, isLoading } = useFetchCollection('hosts')
  const hosts = useSelector(selectHosts)
  const filteredHosts = useSelector(selectFilteredHosts)

  const [search, setSearch] = useState('')
  // Pagination states
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [itemsPerPage, setItemsPerPage] = useState<string | null>('10')
  // Get Current Items
  const indexOfLastItem = currentPage * Number(itemsPerPage)
  const indexOfFirstItem = indexOfLastItem - Number(itemsPerPage)
  const currentItems = filteredHosts.slice(indexOfFirstItem, indexOfLastItem)

  const [formType, setFormType] = useState<'add' | 'edit'>('add')
  const [docId, setDocId] = useState('')
  const [name, setName] = useState('')
  const [symbol, setSymbol] = useState('')

  const dispatch = useDispatch()

  useEffect(() => {
    dispatch(
      STORE_HOSTS({
        hosts: data
      })
    )
  }, [dispatch, data])

  useEffect(() => {
    dispatch(FILTER_BY_SEARCH_HOSTS({ hosts, search }))
    setCurrentPage(1)
  }, [dispatch, hosts, search])

  const checkExistHost = async () => {
    const docRef = query(collection(db, 'hosts'), where('name', '==', name))
    const docsSnap = await getDocs(docRef)

    return docsSnap.empty
  }

  const handleAddHost = async (e: any) => {
    e.preventDefault()

    setFormIsLoading(true)

    const notExistHost = await checkExistHost()

    if (notExistHost) {
      const hostId = uuidv4()
      const host = new Host(hostId, name, symbol)
      await setDoc(doc(db, 'hosts', hostId), {
        // @ts-ignore
        ...host.toJson(),
        createdAt: Timestamp.now().toDate()
      })
      setOpened(false)
      window.SweetAlert.success(
        'Thêm đơn vị',
        `Đã thêm đơn vị "${name}" thành công!`,
        false
      )

      // xóa hết nội dung form sau khi thêm thành công
      resetForm()
    } else {
      window.SweetAlert.error('Lỗi', 'Đơn vị này đã tồn tại.', false)
    }

    setFormIsLoading(false)
  }

  const handleEditHost = async (e: any) => {
    e.preventDefault()

    setFormIsLoading(true)

    const notExistHost = await checkExistHost()

    if (notExistHost) {
      const host = new Host(docId, name, symbol)
      await updateDoc(doc(db, 'hosts', docId), {
        // @ts-ignore
        ...host.toJson(),
        editedAt: Timestamp.now().toDate()
      })

      window.SweetAlert.success(
        'Cập nhật đơn vị',
        `Đã cập nhật đơn vị thành công!`,
        false
      )
      setOpened(false)

      // reset form
      resetForm()
    } else {
      window.SweetAlert.error('Lỗi', 'Đơn vị này đã tồn tại.', false)
    }

    setFormIsLoading(false)
  }

  const findAndDeleteAllInfo = async (
    hostId: string,
    accounts: QuerySnapshot
  ) => {
    const evsRef = query(collection(db, 'events'), where('host', '==', hostId))
    const evsSnap = await getDocs(evsRef)

    if (!evsSnap.empty) {
      const removeListener = evsSnap.docs.map(async (ev: any) => {
        await updateDoc(doc(db, 'events', ev.id), {
          host: ''
        })
      })

      await Promise.all(removeListener)
    }

    accounts.docs.map(async (account: any) => {
      const certsRef = query(
        collection(db, 'certs'),
        where('checkinBy', '==', account.id)
      )
      const certsSnap = await getDocs(certsRef)

      if (!certsSnap.empty) {
        const removeListener = certsSnap.docs.map(async (cert: any) => {
          await updateDoc(doc(db, 'certs', cert.id), {
            checkinBy: ''
          })
        })

        await Promise.all(removeListener)
      }
    })
  }

  const findAndDeleteAccount = async (hostId: string) => {
    const docsRef = query(
      collection(db, 'accounts'),
      where('roleName', '==', hostId)
    )
    const docsSnap = await getDocs(docsRef)

    const docsLength = docsSnap.size
    let accountDeleted = 0

    if (!docsSnap.empty) {
      await findAndDeleteAllInfo(hostId, docsSnap)

      const removeListener = docsSnap.docs.map(async (acc: any) => {
        const res = await axios.post(`${ACCOUNTS_API_URL}/delete`, {
          userId: acc.data().userId
        })
        if (res.status == 200) {
          accountDeleted += 1
          console.log(accountDeleted)
          await deleteDoc(doc(db, 'accounts', acc.data().userId))
        }
      })

      await Promise.all(removeListener)
    }

    console.log('result', accountDeleted)

    return { accountDeleted, docsLength }
  }

  const deleteHost = (docId: string, name: string) => {
    modals.openConfirmModal({
      title: 'Xóa đơn vị',
      centered: true,
      closeOnClickOutside: false,
      children: (
        <Text>
          Bạn có chắc muốn xóa đơn vị <b>"{name}"</b> không? Các tài khoản liên
          quan được cấp đơn vị này sẽ bị xóa vĩnh viễn.
        </Text>
      ),
      labels: { confirm: 'Xóa đơn vị', cancel: 'Đóng' },
      confirmProps: { color: 'red' },
      onCancel: () => {},
      onConfirm: async () => {
        window.SweetAlert.info(
          'Xóa đơn vị',
          `Đang tiến hành việc xóa đơn vị "${name}" và các thông tin liên quan......`,
          true
        )
        const { accountDeleted, docsLength } = await findAndDeleteAccount(docId)
        await deleteDoc(doc(db, 'hosts', docId))
        window.SweetAlert.success(
          'Xóa đơn vị',
          `Đã xóa đơn vị "${name}", và ${accountDeleted}/${docsLength} tài khoản liên quan thành công!`,
          false
        )
      }
    })
  }

  /**
   * Đưa toàn bộ dữ liệu ở các ô nhập liệu về giá trị mặc định.
   */
  const resetForm = () => {
    setDocId('')
    setName('')
    setSymbol('')
  }

  return (
    <>
      <Title order={2}>Danh sách các đơn vị</Title>
      <Text>Danh sách các quyền hạn cho đơn vị sử dụng hệ thống.</Text>

      {isLoading ? (
        <Loader color="blue" size="xl" type="dots" />
      ) : (
        <>
          <Modal
            opened={opened}
            onClose={() => {
              resetForm()
              setOpened(false)
            }}
            title={formType == 'add' ? 'Thêm đơn vị mới' : 'Sửa đơn vị'}
            centered
            removeScrollProps={{ allowPinchZoom: true }}
            closeOnClickOutside={false}
          >
            <form onSubmit={formType == 'add' ? handleAddHost : handleEditHost}>
              <TextInput
                label="Tên đơn vị"
                placeholder="Khoa CNTT"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                disabled={formIsLoading}
                radius="md"
              />
              <TextInput
                mt="md"
                label="Viết tắt"
                description={
                  <>
                    Tên viết tắt này sẽ được hiển thị trên giấy chứng nhận.
                    <br />
                    Ví dụ: 613831/CN2324<u>CNTT</u>
                  </>
                }
                placeholder="CNTT"
                value={symbol}
                onChange={e => setSymbol(e.target.value)}
                required
                disabled={formIsLoading}
                radius="md"
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
                  {formType == 'add' ? 'Thêm' : 'Cập nhật'}
                </Button>
              </Group>
            </form>
          </Modal>

          <Button
            my="lg"
            onClick={() => {
              setFormType('add')
              setOpened(true)
            }}
            leftSection={<IconUsersPlus size={24} />}
          >
            Thêm đơn vị
          </Button>

          <Group justify="space-between">
            <div>
              <TextInput
                label={
                  <>
                    <b>{filteredHosts.length}</b> đơn vị
                  </>
                }
                placeholder="Tìm kiếm đơn vị"
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

          {filteredHosts.length === 0 ? (
            <Text>Không có dữ liệu nào.</Text>
          ) : (
            <>
              <Table.ScrollContainer my="md" minWidth={500} type="native">
                <Table striped highlightOnHover withTableBorder>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Tên đơn vị</Table.Th>
                      <Table.Th>Viết tắt</Table.Th>
                      <Table.Th>Hành động</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {currentItems.map((host: any, index: any) => {
                      const { id, hostId, name, symbol, createdAt, editedAt } =
                        host

                      return (
                        <Table.Tr key={id}>
                          <Table.Td>{name}</Table.Td>
                          <Table.Td>{symbol}</Table.Td>
                          <Table.Td>
                            <ActionIcon.Group>
                              <ActionIcon
                                size="lg"
                                color="green"
                                variant="filled"
                                onClick={() => {
                                  setFormType('edit')
                                  setDocId(id)
                                  setName(name)
                                  setSymbol(symbol)
                                  setOpened(true)
                                }}
                              >
                                <IconEdit stroke={1.5} />
                              </ActionIcon>
                              <ActionIcon
                                size="lg"
                                color="red"
                                variant="filled"
                                onClick={() => deleteHost(id, name)}
                              >
                                <IconTrash stroke={1.5} />
                              </ActionIcon>
                            </ActionIcon.Group>
                          </Table.Td>
                        </Table.Tr>
                      )
                    })}
                  </Table.Tbody>
                </Table>
              </Table.ScrollContainer>

              <Center mt="md">
                <Pagination
                  currentPage={currentPage}
                  setCurrentPage={setCurrentPage}
                  itemsPerPage={Number(itemsPerPage)}
                  totalItems={filteredHosts.length}
                />
              </Center>
            </>
          )}
        </>
      )}
    </>
  )
}
