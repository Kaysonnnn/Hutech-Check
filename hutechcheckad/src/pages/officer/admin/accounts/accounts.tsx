import {
  ActionIcon,
  Badge,
  Button,
  Center,
  Group,
  Loader,
  Modal,
  PasswordInput,
  Select,
  Table,
  Text,
  TextInput,
  Title
} from '@mantine/core'
import { modals } from '@mantine/modals'
import {
  IconEdit,
  IconLock,
  IconSearch,
  IconTrash,
  IconUser,
  IconUserPlus
} from '@tabler/icons-react'
import axios from 'axios'
import {
  deleteDoc,
  doc,
  setDoc,
  Timestamp,
  updateDoc
} from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useLocation } from 'react-router-dom'

import { HostNameCol, Pagination } from '@/components'
import { db } from '@/firebase'
import { useFetchCollection } from '@/hooks'
import { User } from '@/models'
import {
  FILTER_BY_SEARCH_ACCOUNTS,
  selectAccounts,
  selectFilteredAccounts,
  STORE_ACCOUNTS,
  STORE_HOSTS
} from '@/redux'
import {
  ACCOUNTS_API_URL,
  emailPattern,
  HUTECH_AFFIX_EMAIL,
  uuidv4
} from '@/utils'

export const Accounts = () => {
  const [opened, setOpened] = useState(false)
  const [formIsLoading, setFormIsLoading] = useState(false)
  const { data, isLoading } = useFetchCollection('accounts')
  const accounts = useSelector(selectAccounts)
  const filteredAccounts = useSelector(selectFilteredAccounts)
  const { data: hostsList } = useFetchCollection('hosts')

  const [search, setSearch] = useState('')
  // Pagination states
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [itemsPerPage, setItemsPerPage] = useState<string | null>('10')
  // Get Current Items
  const indexOfLastItem = currentPage * Number(itemsPerPage)
  const indexOfFirstItem = indexOfLastItem - Number(itemsPerPage)
  const currentItems = filteredAccounts.slice(indexOfFirstItem, indexOfLastItem)

  const [formType, setFormType] = useState<'add' | 'edit'>('add')
  const [docId, setDocId] = useState('')
  const [userId, setUserId] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState('Quản trị viên')

  const location = useLocation()
  const dispatch = useDispatch()

  useEffect(() => {
    dispatch(STORE_HOSTS({ hosts: hostsList }))
  }, [dispatch, hostsList])

  useEffect(() => {
    dispatch(
      STORE_ACCOUNTS({
        accounts: data
      })
    )
  }, [dispatch, data])

  useEffect(() => {
    dispatch(FILTER_BY_SEARCH_ACCOUNTS({ accounts, search }))
    setCurrentPage(1)
  }, [dispatch, accounts, search])

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search)
    const pageParam = searchParams.get('page')

    if (pageParam) {
      const parsedPage = parseInt(pageParam, 10)
      setCurrentPage(isNaN(parsedPage) ? 1 : parsedPage)
    } else {
      setCurrentPage(1)
    }
  }, [location.search])

  /**
   * Phương thức tạo tài khoản người dùng mới vào Firebase Authentication.
   *
   * @param e Sự kiện form
   */
  const handleAddAccount = async (e: any) => {
    e.preventDefault()

    if (password.length < 6) {
      window.SweetAlert.warning('Mật khẩu phải có ít nhất 6 ký tự!', '', false)
      // } else if (!/[0-9]/.test(password)) {
      //   window.SweetAlert.warning("Mật khẩu phải có ít nhất 1 số!", "", false);
      // } else if (!/[a-z]/.test(password)) {
      //   window.SweetAlert.warning(
      //     "Mật khẩu phải có ít nhất 1 chữ thường!",
      //     "",
      //     false,
      //   );
      // } else if (!/[A-Z]/.test(password)) {
      //   window.SweetAlert.warning(
      //     "Mật khẩu phải có ít nhất 1 chữ hoa!",
      //     "",
      //     false,
      //   );
      // } else if (!/[$&+,:;=?@#|'<>.^*()%!-]/.test(password)) {
      //   window.SweetAlert.warning(
      //     "Mật khẩu phải có ít nhất 1 ký tự đặc biệt!",
      //     "",
      //     false,
      //   );
    } else {
      setFormIsLoading(true)

      let email = username
      if (!emailPattern.test(username)) {
        email += HUTECH_AFFIX_EMAIL
      }
      const uid = uuidv4()

      // gửi yêu cầu tạo tài khoản với các thông tin (uid, email, pass) lên server thông qua API
      try {
        const res = await axios.post(`${ACCOUNTS_API_URL}/create`, {
          uid: uid,
          email: email,
          password: password
        })
        if (res.status == 200) {
          const user = new User(uid, username, fullName, role)
          // Thêm các dữ liệu thông tin người dùng vào Firebase Firestore
          await setDoc(doc(db, 'accounts', uid), {
            // @ts-ignore
            ...user.toJson(),
            createdAt: Timestamp.now().toDate()
          })
          setOpened(false)
          window.SweetAlert.success(
            'Thêm người dùng',
            `Đã thêm người dùng mới ${username} thành công!`,
            false
          )

          // xóa hết nội dung form sau khi thêm thành công
          resetForm()
        }
      } catch (e: any) {
        window.SweetAlert.error(
          'Lỗi thêm tài khoản',
          `${e.response.data.message}`,
          false
        )
      }

      setFormIsLoading(false)
    }
  }

  /**
   * Phương thức chỉnh sửa tài khoản người dùng.
   *
   * @param e Sự kiện form
   */
  const editAccount = async (e: any) => {
    e.preventDefault()

    setFormIsLoading(true)

    if (password != '') {
      try {
        const res = await axios.post(`${ACCOUNTS_API_URL}/update`, {
          uid: userId,
          password: password
        })
        if (res.status == 200) {
          await updateAccountDoc()
        }
      } catch (e: any) {
        window.SweetAlert.error(
          'Lỗi cập nhật mật khẩu',
          `${e.response.data.message}`,
          false
        )
      }
    } else {
      await updateAccountDoc()
    }
  }

  const updateAccountDoc = async () => {
    const user = new User(userId, username, fullName, role)
    // cập nhật dữ liệu của người dùng đó
    await updateDoc(doc(db, 'accounts', docId), {
      // @ts-ignore
      ...user.toJson(),
      editedAt: Timestamp.now().toDate()
    })

    window.SweetAlert.success(
      'Cập nhật tài khoản',
      `Đã cập nhật thông tin cho tài khoản ${username} thành công!`,
      false
    )
    setFormIsLoading(false)
    setOpened(false)

    // reset form
    resetForm()
  }

  /**
   * Phương thức xóa tài khoản người dùng khỏi Firebase Authentication và Firebase Firestore.
   *
   * @param id Mã tài liệu của người dùng ở Firebase Firestore
   * @param userId Mã định danh tài khoản người dùng ở Firebase Authentication
   * @param username Tên người dùng
   */
  const deleteAccount = (id: string, userId: string, username: string) => {
    modals.openConfirmModal({
      title: 'Xóa tài khoản',
      centered: true,
      closeOnClickOutside: false,
      children: (
        <Text>
          Bạn có chắc muốn xóa quyền truy cập vào hệ thống của tài khoản{' '}
          <b>"{username}"</b> không?
        </Text>
      ),
      labels: { confirm: 'Xóa tài khoản', cancel: 'Đóng' },
      confirmProps: { color: 'red' },
      onCancel: () => {},
      onConfirm: async () => {
        try {
          const res = await axios.post(`${ACCOUNTS_API_URL}/delete`, {
            userId: userId
          })
          if (res.status == 200) {
            await deleteDoc(doc(db, 'accounts', id))
            window.SweetAlert.success(
              'Xóa tài khoản',
              `Đã xóa tài khoản ${username} thành công!`,
              false
            )
          }
        } catch (e: any) {
          window.SweetAlert.error(
            'Lỗi xóa tài khoản',
            `${e.response.data.message}`,
            false
          )
        }
      }
    })
  }

  /**
   * Đưa toàn bộ dữ liệu ở các ô nhập liệu về giá trị mặc định.
   */
  const resetForm = () => {
    setDocId('')
    setUserId('')
    setUsername('')
    setPassword('')
    setFullName('')
    setRole('Quản trị viên')
  }

  return (
    <>
      <Title order={2}>Danh sách tài khoản</Title>
      <Text>
        Danh sách tài khoản quản trị hệ thống, bạn có thể tạo mới và phân quyền
        các thành viên tại đây.
      </Text>

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
            size="55rem"
            title={
              formType == 'add' ? 'Tạo người dùng mới' : 'Thông tin người dùng'
            }
            centered
            removeScrollProps={{ allowPinchZoom: true }}
            closeOnClickOutside={false}
          >
            <form onSubmit={formType == 'add' ? handleAddAccount : editAccount}>
              <Group grow>
                <TextInput
                  label="Tài khoản"
                  placeholder="Username hoặc Email...."
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  disabled={formIsLoading || formType == 'edit'}
                  required={formType == 'add'}
                  radius="md"
                  leftSection={<IconUser size={18} stroke={1.5} />}
                />
                <PasswordInput
                  label={formType == 'add' ? 'Mật khẩu' : 'Đổi mật khẩu'}
                  placeholder={
                    formType == 'edit' ? 'Nhập vào nếu cần đổi mật khẩu' : ''
                  }
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required={formType == 'add'}
                  disabled={formIsLoading}
                  radius="md"
                  leftSection={<IconLock size={18} stroke={1.5} />}
                />
              </Group>
              <TextInput
                mt="md"
                label="Họ tên"
                placeholder="Nguyễn Văn A"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                required
                disabled={formIsLoading}
                radius="md"
              />
              <Select
                mt="md"
                label="Đơn vị"
                data={[
                  'Quản trị viên',
                  'Cộng tác viên',
                  ...hostsList.map((host: any) => {
                    return { value: host.hostId, label: host.name }
                  })
                ]}
                value={role}
                // @ts-ignore
                onChange={setRole}
                required
                radius="md"
                allowDeselect={false}
                searchable
                nothingFoundMessage="Không tìm thấy đơn vị này..."
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
            leftSection={<IconUserPlus size={24} />}
          >
            Thêm tài khoản
          </Button>

          <Group justify="space-between">
            <div>
              <TextInput
                label={
                  <>
                    <b>{filteredAccounts.length}</b> tài khoản
                  </>
                }
                placeholder="Tìm kiếm tài khoản"
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

          {filteredAccounts.length === 0 ? (
            <Text>Không có dữ liệu nào.</Text>
          ) : (
            <>
              <Table.ScrollContainer my="md" minWidth={500} type="native">
                <Table striped highlightOnHover withTableBorder>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Tên tài khoản</Table.Th>
                      <Table.Th>Họ tên</Table.Th>
                      <Table.Th>Đơn vị</Table.Th>
                      <Table.Th>Ngày tạo / chỉnh sửa</Table.Th>
                      <Table.Th>Hành động</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {currentItems.map((account: any, index: any) => {
                      const {
                        id,
                        userId,
                        username,
                        fullName,
                        roleName,
                        createdAt,
                        editedAt
                      } = account

                      return (
                        <Table.Tr key={userId}>
                          <Table.Td>{username}</Table.Td>
                          <Table.Td>{fullName}</Table.Td>
                          <Table.Td>
                            <Badge
                              color={
                                roleName == 'Quản trị viên' ? 'red' : 'blue'
                              }
                              radius="sm"
                            >
                              {roleName !== 'Quản trị viên' &&
                              roleName !== 'Cộng tác viên' ? (
                                <HostNameCol hostId={roleName} />
                              ) : (
                                roleName
                              )}
                            </Badge>
                          </Table.Td>
                          <Table.Td>
                            {editedAt ? (
                              <>{editedAt.toDate().toLocaleString()} (Đã sửa)</>
                            ) : (
                              createdAt.toDate().toLocaleString()
                            )}
                          </Table.Td>
                          <Table.Td>
                            <ActionIcon.Group>
                              <ActionIcon
                                size="lg"
                                color="green"
                                variant="filled"
                                onClick={() => {
                                  setFormType('edit')
                                  setDocId(id)
                                  setUserId(userId)
                                  setUsername(username)
                                  setFullName(fullName)
                                  setRole(roleName)
                                  setOpened(true)
                                }}
                              >
                                <IconEdit stroke={1.5} />
                              </ActionIcon>
                              <ActionIcon
                                size="lg"
                                color="red"
                                variant="filled"
                                onClick={() =>
                                  deleteAccount(id, userId, username)
                                }
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
                  totalItems={filteredAccounts.length}
                />
              </Center>
            </>
          )}
        </>
      )}
    </>
  )
}
