import {
  Button,
  Card,
  Center,
  Loader,
  PasswordInput,
  rem,
  Switch,
  Text,
  TextInput,
  Title,
  useMantineTheme
} from '@mantine/core'
import {
  IconAt,
  IconCheck,
  IconDeviceFloppy,
  IconLock,
  IconRegex,
  IconX
} from '@tabler/icons-react'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { useEffect, useState } from 'react'

import { db } from '@/firebase'

export const Configuration = () => {
  const theme = useMantineTheme()

  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [systemEmail, setSystemEmail] = useState('')
  const [systemEmailPw, setSystemEmailPw] = useState('')
  const [regexCheckStudentId, setRegexCheckStudentId] = useState('')
  const [isEmailNotify, setIsEmailNotify] = useState(false)
  const [isRequireStudentLogin, setIsRequireStudentLogin] = useState(false)

  useEffect(() => {
    setIsLoading(true)
    getData().then(() => setIsLoading(false))
  }, [])

  const getData = async () => {
    const docRef = doc(db, 'system', 'configuration')
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      const docData = docSnap.data()
      setSystemEmail(docData.systemEmail)
      setSystemEmailPw(docData.systemEmailPw)
      setRegexCheckStudentId(docData.regexCheckStudentId)
      setIsEmailNotify(docData.isEmailNotify)
      setIsRequireStudentLogin(docData.isRequireStudentLogin)
    }
  }

  const handleSaving = async (e: any) => {
    e.preventDefault()

    setIsSaving(true)

    await setDoc(doc(db, 'system', 'configuration'), {
      systemEmail: systemEmail,
      systemEmailPw: systemEmailPw,
      regexCheckStudentId: regexCheckStudentId,
      isEmailNotify: isEmailNotify,
      isRequireStudentLogin: isRequireStudentLogin
    })
      .then(() => {
        window.SweetAlert.success(
          'Lưu thiết lập hệ thống',
          'Đã lưu các thay đổi thông tin dữ liệu hệ thống thành công!',
          false
        )
        setIsSaving(false)
      })
      .catch((e: any) => {
        window.SweetAlert.success('Lỗi lưu thiết lập hệ thống', `${e}`, false)
        setIsSaving(false)
      })
  }

  return (
    <>
      <Title order={2}>Thiết lập hệ thống</Title>
      <Text>
        Tùy chỉnh cách bạn, và những người khác sử dụng hệ thống quản lý hoạt
        động sinh viên.
      </Text>

      <Card my="lg" shadow="sm" radius="md" withBorder>
        {isLoading ? (
          <Center>
            <Loader color="blue" size="md" />
          </Center>
        ) : (
          <>
            <form onSubmit={handleSaving}>
              <TextInput
                label="Email hệ thống"
                description="Email chính cho hệ thống. Dùng để gửi email cho sinh viên"
                value={systemEmail}
                onChange={e => setSystemEmail(e.target.value)}
                radius="md"
                required={isEmailNotify || isRequireStudentLogin}
                disabled={isSaving}
                leftSection={<IconAt size={18} stroke={1.5} />}
              />
              <PasswordInput
                mt="md"
                label="Mật khẩu Email hệ thống"
                value={systemEmailPw}
                onChange={e => setSystemEmailPw(e.target.value)}
                radius="md"
                required={isEmailNotify || isRequireStudentLogin}
                disabled={isSaving}
                leftSection={<IconLock size={18} stroke={1.5} />}
              />
              <TextInput
                mt="md"
                label="RegEx kiểm tra MSSV hợp lệ"
                description="Nếu bỏ trống, nghĩa là không sử dụng tính năng này"
                value={regexCheckStudentId}
                onChange={e => setRegexCheckStudentId(e.target.value)}
                radius="md"
                disabled={isSaving}
                leftSection={<IconRegex size={18} stroke={1.5} />}
              />
              <Switch
                mt="md"
                checked={isEmailNotify}
                onChange={event =>
                  setIsEmailNotify(event.currentTarget.checked)
                }
                color="teal"
                label="Thông báo qua email của sinh viên khi checkin sự kiện"
                description="Tính năng thông báo qua email cho sinh viên khi checkin sự kiện"
                onLabel="Bật"
                offLabel="Tắt"
                thumbIcon={
                  isEmailNotify ? (
                    <IconCheck
                      style={{ width: rem(12), height: rem(12) }}
                      color={theme.colors.teal[6]}
                      stroke={3}
                    />
                  ) : (
                    <IconX
                      style={{ width: rem(12), height: rem(12) }}
                      color={theme.colors.red[6]}
                      stroke={3}
                    />
                  )
                }
                disabled={isSaving}
              />
              <Switch
                mt="md"
                checked={isRequireStudentLogin}
                onChange={event =>
                  setIsRequireStudentLogin(event.currentTarget.checked)
                }
                color="teal"
                label="Bắt buộc sinh viên đăng nhập/xác thực email để lấy chứng nhận"
                onLabel="Bật"
                offLabel="Tắt"
                thumbIcon={
                  isRequireStudentLogin ? (
                    <IconCheck
                      style={{ width: rem(12), height: rem(12) }}
                      color={theme.colors.teal[6]}
                      stroke={3}
                    />
                  ) : (
                    <IconX
                      style={{ width: rem(12), height: rem(12) }}
                      color={theme.colors.red[6]}
                      stroke={3}
                    />
                  )
                }
                disabled={isSaving}
              />

              <Center mt="lg">
                <Button
                  type="submit"
                  leftSection={<IconDeviceFloppy size={18} stroke={1.5} />}
                  variant="filled"
                  loading={isSaving}
                >
                  Lưu lại
                </Button>
              </Center>
            </form>
          </>
        )}
      </Card>
    </>
  )
}
