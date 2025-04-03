import {
  Anchor,
  Button,
  Container,
  Modal,
  PasswordInput,
  Space,
  TextInput,
  Title
} from '@mantine/core'
import { IconLock, IconUser } from '@tabler/icons-react'
import axios from 'axios'
import {
  browserSessionPersistence,
  setPersistence,
  signInWithEmailAndPassword
} from 'firebase/auth'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { auth } from '@/firebase'
import {
  emailPattern,
  HUTECH_AFFIX_EMAIL,
  MONITOR_API_URL,
  saveToLocalStorage
} from '@/utils'

import classes from './login.module.css'

export const Login = () => {
  // mở form đăng nhập
  const [opened, setOpened] = useState(false)
  // đăng nhập với 0: cán bộ, 1: bcs lớp
  const [signInType, setSignInType] = useState(0)

  // ô nhập liệu
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  // đợi xác minh đăng nhập
  const [isLoading, setIsLoading] = useState(false)
  // kiểm tra có phải là bcs lớp hay không
  const [isVerifyMonitor, setIsVerifyMonitor] = useState(false)

  const navigate = useNavigate()

  /**
   * Chuyển hướng người dùng đến trang chủ
   */
  const redirectUser = () => {
    navigate('/')
  }

  /**
   * Phương thức đăng nhập vào hệ thống với tài khoản cán bộ được cấp.
   *
   * @param e Sự kiện form
   */
  const handleLoginWithOfficer = (e: any) => {
    e.preventDefault()
    setIsLoading(true)

    // nếu username nhập vào không phải là email thì sẽ ghép thêm đuôi @hutechcheckin.web.app
    let email = username
    if (!emailPattern.test(username)) {
      email += HUTECH_AFFIX_EMAIL
    }

    // Lưu phiên đăng nhập trên tab hiện tại
    setPersistence(auth, browserSessionPersistence).then(() => {
      // Đăng nhập tài khoản người dùng với Email và Password vào Firebase Auth
      signInWithEmailAndPassword(auth, email, password)
        .then(userCredential => {
          // const user = userCredential.user;
          setIsLoading(false)
          window.SweetAlert.success('Đăng nhập thành công', '', false)
          redirectUser()
          // console.log(userCredential.user); // TODO: Remove
        })
        .catch(error => {
          setIsLoading(false)

          const code = error.code

          if (code === 'auth/user-not-found') {
            return window.SweetAlert.error(
              'Lỗi xác thực',
              `Tài khoản này không tồn tại!<br/>Mã lỗi: ${code}`,
              false
            )
          } else if (code === 'auth/invalid-credential') {
            return window.SweetAlert.error(
              'Lỗi xác thực',
              `Thông tin đăng nhập không chính xác!<br/>Mã lỗi: ${code}`,
              false
            )
          } else if (code === 'auth/too-many-requests') {
            return window.SweetAlert.error(
              'Lỗi xác thực',
              `Quá nhiều yêu cầu đăng nhập! Vui lòng thử lại sau!<br/>Mã lỗi: ${code}`,
              false
            )
          } else {
            return window.SweetAlert.error(
              'Lỗi xác thực',
              `Mã lỗi: ${code}`,
              false
            )
          }
        })
    })
  }

  /**
   * Phương thức đăng nhập vào hệ thống với tài khoản ban cán sự lớp.
   *
   * @param e Sự kiện form
   */
  const handleLoginWithMonitor = async (e: any) => {
    e.preventDefault()

    // mật khẩu là mssv
    if (password != username) {
      window.SweetAlert.error(
        'Lỗi xác thực',
        'Thông tin đăng nhập không chính xác.',
        false
      )
    } else {
      setIsLoading(true)

      try {
        // gửi yêu cầu API đăng nhập với mssv vừa nhập
        const res = await axios.post(
          `${MONITOR_API_URL}/login`,
          {
            studentId: username
          },
          {
            headers: {
              'Content-Type': 'application/json'
            }
          }
        )

        if (res.status == 200) {
          // thành công: gửi mã otp đến email của sinh viên
          window.SweetAlert.success(
            '',
            'Đã gửi mã xác thực OTP đến email của sinh viên.',
            true
          )
          setIsVerifyMonitor(true)
        }
      } catch (e: any) {
        window.SweetAlert.error('Lỗi xác thực', e.response.data.message, true)
        resetForm()
      }

      setIsLoading(false)
    }
  }

  const handleVerifyMonitor = async (ev: any) => {
    ev.preventDefault()

    if (otp == '') {
      window.SweetAlert.warning('', 'Vui lòng nhập mã xác thực OTP', true)
    } else {
      setIsLoading(true)

      try {
        // gửi yêu cầu API xác minh otp
        const res = await axios.post(
          `${MONITOR_API_URL}/verify-otp`,
          {
            studentId: username,
            otp: otp
          },
          {
            headers: {
              'Content-Type': 'application/json'
            }
          }
        )
        if (res.status == 200) {
          // thành công: lưu token được gửi từ phía server để đăng nhập và chuyển hướng
          // đến trang chủ
          saveToLocalStorage('use-state', res.data)
          window.location.reload()
        }
      } catch (err: any) {
        window.SweetAlert.error('Lỗi xác thực', err.response.data.message, true)
      }

      setIsLoading(false)
    }
  }

  const openSignInModal = (type: number) => {
    setSignInType(type)
    setOpened(true)
  }

  /**
   * Đặt lại các nhập liệu về trạng thái ban đầu
   */
  const resetForm = () => {
    setSignInType(0)
    setUsername('')
    setPassword('')
    setIsVerifyMonitor(false)
    setOtp('')
  }

  return (
    <Container size={420} my={40}>
      <Title ta="center" className={classes.title} mb={30}>
        Chào mừng!
      </Title>

      <Modal
        opened={opened}
        onClose={() => {
          resetForm()
          setOpened(false)
        }}
        title={`Đăng nhập với tư cách ${signInType == 0 ? 'Cán bộ' : 'BCS Lớp'}`}
        centered
        closeOnClickOutside={false}
        removeScrollProps={{ allowPinchZoom: true }}
      >
        <form
          onSubmit={
            signInType == 0
              ? handleLoginWithOfficer
              : isVerifyMonitor
                ? handleVerifyMonitor
                : handleLoginWithMonitor
          }
        >
          <TextInput
            label="Tài khoản"
            placeholder={`${signInType == 0 ? 'Tên tài khoản' : 'Mã số sinh viên'}`}
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
            disabled={isLoading || isVerifyMonitor}
            radius="md"
            leftSection={<IconUser size={18} stroke={1.5} />}
          />
          <PasswordInput
            mt="md"
            label="Mật khẩu"
            placeholder="Mật khẩu"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            disabled={isLoading || isVerifyMonitor}
            radius="md"
            leftSection={<IconLock size={18} stroke={1.5} />}
          />

          {isVerifyMonitor && (
            <>
              <PasswordInput
                mt="md"
                label="Mã xác minh OTP"
                value={otp}
                onChange={e => setOtp(e.target.value)}
                required
                disabled={isLoading}
                radius="md"
                leftSection={<IconLock size={18} stroke={1.5} />}
              />
              <Anchor
                mt="xs"
                component="button"
                underline="never"
                onClick={e => handleLoginWithMonitor(e)}
              >
                Gửi lại mã
              </Anchor>
            </>
          )}

          <Button fullWidth mt="xl" type="submit" loading={isLoading}>
            {!isVerifyMonitor ? 'Đăng nhập' : 'Xác minh'}
          </Button>
        </form>
      </Modal>

      <Button fullWidth size="md" onClick={() => openSignInModal(0)}>
        Đăng nhập với tư cách Cán bộ
      </Button>
      <Space h="md" />
      <Button fullWidth size="md" onClick={() => openSignInModal(1)}>
        Đăng nhập với tư cách BCS Lớp
      </Button>
    </Container>
  )
}
