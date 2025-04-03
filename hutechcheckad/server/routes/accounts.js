import express from 'express'

import {
  createUserAuth,
  deleteUserAuth,
  updateUserAuth
} from '../firebase/admin.js'

const router = express.Router()

/**
 * Yêu cầu tạo tài khoản bao gồm Email và Password để đăng ký với Firebase Auth.
 */
router.post('/create', async (req, res) => {
  try {
    // lấy các thông tin được gửi từ phía client
    const { uid, email, password } = req.body

    // gọi API tạo tài khoản
    await createUserAuth(uid, email, password)
      .then(() => {
        // trả về trạng thái 200: tạo tài khoản thành công
        res.status(200).send('Đã tạo tài khoản mới thành công!')
      })
      .catch(err => {
        // trả về trạng thái 400: tạo tài khoản thất bại
        res.status(400).json({ message: err.message })
      })
  } catch (err) {
    // trả về trạng thái 500: Lỗi kết nối đến server
    res.status(500).json({ message: 'Lỗi kết nối đến server' })
  }
})

/**
 * Yêu cầu cập nhật mật khẩu cho tài khoản Firebase Auth.
 */
router.post('/update', async (req, res) => {
  try {
    // lấy các thông tin được gửi từ phía client
    const { uid, password } = req.body

    // gọi API cập nhật mật khẩu tài khoản
    await updateUserAuth(uid, password)
      .then(() => {
        // trả về trạng thái 200: cập nhật mật khẩu tài khoản thành công
        res
          .status(200)
          .send('Đã cập nhật mật khẩu cho tài khoản này thành công!')
      })
      .catch(err => {
        // trả về trạng thái 400: cập nhật mật khẩu tài khoản thất bại
        res.status(400).json({ message: err.message })
      })
  } catch (err) {
    // trả về trạng thái 500: Lỗi kết nối đến server
    res.status(500).json({ message: 'Lỗi kết nối đến server' })
  }
})

/**
 * Yêu cầu xóa tài khoản Firebase Auth..
 */
router.post('/delete', async (req, res) => {
  try {
    // lấy các thông tin được gửi từ phía client
    const { userId } = req.body

    // gọi API xóa tài khoản
    await deleteUserAuth(userId)
      .then(() => {
        // trả về trạng thái 200: xóa tài khoản thành công
        res.status(200).send('Đã xóa tài khoản thành công!')
      })
      .catch(err => {
        // trả về trạng thái 400: xóa tài khoản thất bại
        res.status(400).json({ message: err.message })
      })
  } catch (err) {
    // trả về trạng thái 500: Lỗi kết nối đến server
    res.status(500).json({ message: 'Lỗi kết nối đến server' })
  }
})

export default router
