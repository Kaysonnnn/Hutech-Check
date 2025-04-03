import express from 'express'
import { doc, getDoc } from 'firebase/firestore'
import jwt from 'jsonwebtoken'

import { db } from '../firebase/config.js'
import { generateOTP } from '../utils/otp.js'
import { sendOTPEmailForMonitor } from '../utils/sendEmail.js'

const router = express.Router()

/**
 * Chứa các token đăng nhập ban cán sự lớp
 */
let refreshTokens = []
/**
 * Chứa các mã OTP xác minh để đăng nhập ban cán sự lớp
 */
let activeOTP = {}

/**
 * Yêu cầu thử nghiệm tính khả dụng của token
 *
 * @deprecated không cần thiết sử dụng vì việc này dùng để thử nghiệm token
 */
router.post('/token', (req, res) => {
  // lấy thông tin token được gửi từ phía client
  const refreshToken = req.body.token

  // nếu token không tồn tại thì trả về trạng thái lỗi
  if (refreshToken == null) {
    return res.sendStatus(401)
  }
  if (!refreshTokens.includes(refreshToken)) {
    return res.sendStatus(403)
  }

  // xác minh tính khả dụng của token
  jwt.verify(
    refreshToken,
    process.env.LAHM_MONITOR_REFRESH_TOKEN_SECRET,
    (err, student) => {
      if (err) {
        return res.sendStatus(403)
      }
      const accessToken = generateAccessToken({ studentId: student.studentId })
      res.json({ accessToken: accessToken })
    }
  )
})

/**
 * Yêu cầu lấy thông tin cơ bản của ban cán sự lớp
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    // tìm thông tin sinh viên từ Firebase Firestore với mssv được gửi từ phía client
    const studentsCollectionRef = doc(db, 'students', req.student.studentId)
    const studentsSnapshot = await getDoc(studentsCollectionRef)

    // nếu tồn tại sinh viên này và nếu sinh viên đó là ban cán sự lớp thì được phép lấy thông tin
    // ngược lại thì không có quyền đăng nhập vào hệ thống
    if (studentsSnapshot.exists()) {
      const studentData = studentsSnapshot.data()
      if (studentData.isMonitor) {
        res.status(200).json({
          studentId: studentData.studentId,
          fullName: studentData.fullName,
          studyClass: studentData.studyClass,
          email: studentData.email
        })
      } else {
        res
          .status(400)
          .send({ message: 'Bạn không có quyền truy cập vào hệ thống này!' })
      }
    }
  } catch (e) {
    // trả về lỗi 400: sinh viên không tồn tại
    res.status(400).send(e.message)
  }
})

/**
 * Yêu cầu đăng nhập tài khoản ban cán sự lớp
 *
 * @requires email - Ban cán sự lớp bắt buộc phải có Email
 */
router.post('/login', async (req, res) => {
  // lấy thông tin mã số sinh viên được gửi từ phía client
  const studentId = req.body.studentId

  // tìm thông tin sinh viên từ Firebase Firestore
  const studentsCollectionRef = doc(db, 'students', studentId)
  const studentsSnapshot = await getDoc(studentsCollectionRef)

  // nếu tồn tại sinh viên này và nếu sinh viên đó là ban cán sự lớp thì sẽ gửi mã otp để xác minh đăng nhập
  // ngược lại thì không có quyền đăng nhập vào hệ thống
  if (studentsSnapshot.exists()) {
    const studentData = studentsSnapshot.data()
    if (studentData.isMonitor) {
      const otp = generateOTP()

      activeOTP[studentId] = {
        otp: otp,
        createdAt: new Date()
      }
      await sendOTPEmailForMonitor(studentData.email, otp)

      return res.status(200).json()
    } else {
      res
        .status(400)
        .send({ message: 'Bạn không có quyền truy cập vào hệ thống này!' })
    }
  } else {
    // trả về lỗi 404: sinh viên không tồn tại
    res.status(404).json({ message: 'Tài khoản này không tồn tại!' })
  }
})

/**
 * Yêu cầu xác minh OTP để đăng nhập
 */
router.post('/verify-otp', async (req, res) => {
  try {
    const { studentId, otp } = req.body

    // Kiểm tra OTP có tồn tại và chính xác không
    if (!activeOTP[studentId] || activeOTP[studentId].otp !== otp) {
      return res.status(400).json({ message: 'Mã OTP không chính xác.' })
    }

    // Kiểm tra OTP đã hết hạn chưa (sau 3 phút)
    const currentTime = new Date()
    const otpCreationTime = activeOTP[studentId].createdAt
    const timeDifference = (currentTime - otpCreationTime) / 1000 // Convert to seconds
    if (timeDifference > 180) {
      // OTP hết hạn sau 180 giây (3 phút)
      delete activeOTP[studentId]
      return res.status(401).json({ message: 'Mã OTP này đã hết hạn.' })
    }

    // Xóa OTP khỏi mảng activeOTP
    delete activeOTP[studentId]

    // gửi token về client để đăng nhập
    const student = { studentId: studentId }
    const accessToken = generateAccessToken(student)
    const refreshToken = jwt.sign(
      student,
      process.env.LAHM_MONITOR_REFRESH_TOKEN_SECRET
    )
    refreshTokens.push(refreshToken)
    res
      .status(200)
      .json({ accessToken: accessToken, refreshToken: refreshToken })
  } catch (error) {
    // trả về lỗi 500: không có kết nối đến server
    res.status(500).json({ message: 'Lỗi kết nối đến server' })
  }
})

/**
 * Yêu cầu đăng xuất tài khoản BCS lớp
 */
router.post('/logout', (req, res) => {
  refreshTokens = refreshTokens.filter(token => token !== req.body.token)
  res.status(200).json()
})

/**
 * Sinh token và hết hạn sau 1 tiếng
 */
function generateAccessToken(student) {
  return jwt.sign(student, process.env.LAHM_MONITOR_ACCESS_TOKEN_SECRET, {
    expiresIn: '3600s' // 3600s = 1h
  })
}

/**
 * Xác minh tính khả dụng của token
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (token == null) {
    return res.sendStatus(401)
  }

  jwt.verify(
    token,
    process.env.LAHM_MONITOR_ACCESS_TOKEN_SECRET,
    (err, student) => {
      if (err) {
        return res.sendStatus(403)
      }
      req.student = student
      next()
    }
  )
}

export default router
