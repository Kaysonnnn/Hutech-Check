import admin from 'firebase-admin'

// Thiết lập API admin từ Firebase
import serviceAccount from './firebase-adminsdk.json' assert { type: 'json' }

const firebaseConfig = {
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://hutech-checkin-default-rtdb.firebaseio.com'
}

admin.initializeApp(firebaseConfig)

/**
 * Tạo tài khoản mới vào Firebase Authentication.
 *
 * @param uid Mã định danh tài khoản
 * @param email Địa chỉ email
 * @param password Mật khẩu
 */
export async function createUserAuth(uid, email, password) {
  await admin.auth().createUser({
    uid: uid,
    email: email,
    emailVerified: true,
    password: password,
    disabled: false // tình trạng khóa tài khoản
  })
}

/**
 * Cập nhật mật khẩu cho tài khoản Firebase Authentication.
 *
 * @param uid Mã định danh tài khoản
 * @param password Mật khẩu
 */
export async function updateUserAuth(uid, password) {
  await admin.auth().updateUser(uid, {
    password: password
  })
}

/**
 * Xóa tài khoản đang tồn tại ở Firebase Authentication.
 *
 * @param userId Mã định danh tài khoản Firebase Auth
 */
export async function deleteUserAuth(userId) {
  await admin.auth().deleteUser(userId)
}
