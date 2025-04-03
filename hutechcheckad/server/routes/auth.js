import express from 'express'
import { doc, getDoc } from 'firebase/firestore'
import jwt from 'jsonwebtoken'

import { db } from '../firebase/config.js'
import { generateOTP } from '../utils/otp.js'
import { sendOTPEmail, sendOTPVerifyEmail } from '../utils/sendEmail.js'

<<<<<<< HEAD
const router = express.Router()

=======
const router = express.Router();
>>>>>>> 443178b (fist commit)
/**
 * Chứa các token đăng nhập sinh viên
 */
let refreshTokens = []
/**
 * Chứa các mã OTP xác minh để đăng nhập sinh viên
 */
let activeOTP = {}
/**
 * Chứa các mã OTP xác minh Email này và đổi sang Email khác
 */
let verifyEmail = {}

/**
 * Yêu cầu thử nghiệm tính khả dụng của token
 *
 * @deprecated không cần thiết sử dụng vì việc này dùng để thử nghiệm token
 */
router.post('/token', (req, res) => {
  const refreshToken = req.body.token
  if (refreshToken == null) {
    return res.sendStatus(401)
  }
  if (!refreshTokens.includes(refreshToken)) {
    return res.sendStatus(403)
  }
  jwt.verify(
    refreshToken,
    process.env.LAHM_REFRESH_TOKEN_SECRET,
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
 * Yêu cầu lấy thông tin cơ bản của sinh viên
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const studentsCollectionRef = doc(db, 'students', req.student.studentId)
    const studentsSnapshot = await getDoc(studentsCollectionRef)

    if (studentsSnapshot.exists()) {
      const studentData = studentsSnapshot.data()
      res.status(200).json({
        studentId: studentData.studentId,
        fullName: studentData.fullName,
        email: studentData.email
      })
    }
  } catch (e) {
    res.status(400).send(e.message)
  }
})

/**
 * Yêu cầu đăng nhập sinh viên
 */
router.post('/login', async (req, res) => {
  const studentId = req.body.studentId

  const studentsCollectionRef = doc(db, 'students', studentId)
  const studentsSnapshot = await getDoc(studentsCollectionRef)

  if (studentsSnapshot.exists()) {
    const student = { studentId: studentId }
    const accessToken = generateAccessToken(student)
    const refreshToken = jwt.sign(
      student,
      process.env.LAHM_REFRESH_TOKEN_SECRET
    )
    refreshTokens.push(refreshToken)
    res
      .status(200)
      .json({ accessToken: accessToken, refreshToken: refreshToken })
  } else {
    res.status(404).json()
  }
})

/**
 * Yêu cầu gửi OTP để xác minh đăng nhập sinh viên nếu đã bật tính năng xác thực này
 * trên hệ thống admin
 */
router.post('/request-otp', async (req, res) => {
  const studentId = req.body.studentId

  const docRef = doc(db, 'students', studentId)
  const docSnap = await getDoc(docRef)

  if (docSnap.exists()) {
    const docData = docSnap.data()
    const otp = generateOTP()

    activeOTP[docData.studentId] = {
      otp: otp,
      createdAt: new Date()
    }
    await sendOTPEmail(docData.email, otp)

    return res.status(200).json()
  }
  return res.status(400).json()
})

/**
 * Yêu cầu xác minh OTP để đăng nhập
 */
router.post('/verify-otp', async (req, res) => {
  try {
    const { studentId, otp } = req.body

    // Check if OTP exists and is correct
    if (!activeOTP[studentId] || activeOTP[studentId].otp !== otp) {
      return res.status(400).json({ message: 'Mã OTP không chính xác.' })
    }

    // Check if OTP has expired (more than 15 minutes)
    const currentTime = new Date()
    const otpCreationTime = activeOTP[studentId].createdAt
    const timeDifference = (currentTime - otpCreationTime) / 1000 // Convert to seconds
    if (timeDifference > 180) {
      // OTP expires after 180 seconds (3 minutes)
      delete activeOTP[studentId]
      return res.status(401).json({ message: 'Mã OTP này đã hết hạn.' })
    }

    // Remove OTP from activeOTP array
    delete activeOTP[studentId]

    const student = { studentId: studentId }
    const accessToken = generateAccessToken(student)
    const refreshToken = jwt.sign(
      student,
      process.env.LAHM_REFRESH_TOKEN_SECRET
    )
    refreshTokens.push(refreshToken)
    res
      .status(200)
      .json({ accessToken: accessToken, refreshToken: refreshToken })
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' })
  }
})

/**
 * Yêu cầu gửi OTP để xác minh Email mới của sinh viên
 */
router.post('/request-verify-email', async (req, res) => {
  const { studentId, email } = req.body

  const docRef = doc(db, 'students', studentId)
  const docSnap = await getDoc(docRef)

  if (docSnap.exists()) {
    const docData = docSnap.data()
    const otp = generateOTP()

    verifyEmail[docData.studentId] = {
      email: email,
      otp: otp,
      createdAt: new Date()
    }
    await sendOTPVerifyEmail(studentId, email, otp)

    return res.status(200).json()
  }
  return res.status(400).json()
})

/**
 * Yêu cầu xác minh OTP Email mới của sinh viên
 */
router.post('/verify-email-otp', async (req, res) => {
  try {
    const { studentId, email, otp } = req.body

    // Check if OTP exists and is correct
    if (!verifyEmail[studentId] || verifyEmail[studentId].otp !== otp) {
      return res.status(400).json({ message: 'Mã OTP không chính xác.' })
    }

    if (verifyEmail[studentId].email !== email) {
      return res.status(400).json({
        message:
          'Địa chỉ email có sự thay đổi. Yêu cầu gửi mã mới nếu thay đổi.'
      })
    }

    // Check if OTP has expired (more than 15 minutes)
    const currentTime = new Date()
    const otpCreationTime = verifyEmail[studentId].createdAt
    const timeDifference = (currentTime - otpCreationTime) / 1000 // Convert to seconds
    if (timeDifference > 180) {
      // OTP expires after 180 seconds (3 minutes)
      delete verifyEmail[studentId]
      return res.status(401).json({ message: 'Mã OTP này đã hết hạn.' })
    }

    // Remove OTP from activeOTP array
    delete verifyEmail[studentId]

    res.status(200).json({})
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' })
  }
})

/**
 * Yêu cầu đăng xuất tài khoản sinh viên hiện tại
 */
router.post('/logout', (req, res) => {
  refreshTokens = refreshTokens.filter(token => token !== req.body.token)
  res.status(200).json()
})

function generateAccessToken(student) {
  return jwt.sign(student, process.env.LAHM_ACCESS_TOKEN_SECRET, {
    expiresIn: '900s' // 900s = 15m
  })
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (token == null) {
    return res.sendStatus(401)
  }

  jwt.verify(token, process.env.LAHM_ACCESS_TOKEN_SECRET, (err, student) => {
    if (err) {
      return res.sendStatus(403)
    }
    req.student = student
    next()
  })
}

export default router
