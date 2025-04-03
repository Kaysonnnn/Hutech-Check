import express from 'express'
import { doc, getDoc } from 'firebase/firestore'

import { db } from '../firebase/config.js'
import { sendEmailCheckin } from '../utils/sendEmail.js'

const router = express.Router()

/**
 * Yêu cầu gửi mail cảm ơn đã tham dự sự kiện khi sinh viên check-in
 */
router.post('/thank-you', async (req, res) => {
  const { eventName, studentId } = req.body

  const docRef = doc(db, 'students', studentId)
  const docSnap = await getDoc(docRef)

  if (docSnap.exists()) {
    const docData = docSnap.data()

    if (
      docData.email !== '' &&
      docData.studentId !== '' &&
      docData.fullName !== ''
    ) {
      await sendEmailCheckin(
        docData.email,
        eventName,
        `${docData.studentId.slice(-4)}_${docData.fullName}`
      )
    }

    res.status(200).json()
  }
  res.status(400).json()
})

export default router
