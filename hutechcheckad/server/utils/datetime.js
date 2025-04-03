export const formatDate = value => {
  const date = new Date(value)
  let day = date.getDate()
  let month = date.getMonth() + 1
  const year = date.getFullYear()

  if (day < 10) day = '0' + day
  if (month < 10) month = '0' + month

  return day + '/' + month + '/' + year
}

export const formatTime = value => {
  const time = new Date(value)
  let hours = time.getHours() + 7 // +7 (timezone Asia/Ho_Chi_Minh) for run in server hosting UTC
  let minutes = time.getMinutes()

  if (hours < 10) hours = '0' + hours
  if (minutes < 10) minutes = '0' + minutes

  return hours + ':' + minutes
}

/**
 * Định dạng một đối tượng Date thành một chuỗi với ngày và thời gian.
 *
 * @param {Date} value - Đối tượng Date cần định dạng.
 * @param {string} [mid] - Chuỗi tùy chọn để chèn giữa ngày và thời gian. Nếu không được cung cấp, sẽ bỏ qua và chỉ nối ngày và thời gian.
 * @returns {string} Chuỗi đã định dạng với ngày và thời gian.
 *
 * @example
 * // Ví dụ sử dụng mid:
 * // Giả sử ngày hiện tại là 24/08/2024 và thời gian là 12:38.
 * formatDateTime(new Date(), "lúc");
 * // Kết quả: "24/08/2024 lúc 12:38"
 *
 * @example
 * // Ví dụ không sử dụng mid:
 * // Giả sử ngày hiện tại là 24/08/2024 và thời gian là 12:38.
 * formatDateTime(new Date());
 * // Kết quả: "24/08/2024 12:38"
 */
export const formatDateTime = (value, mid) => {
  return formatDate(value) + (mid ? ` ${mid} ` : ' ') + formatTime(value)
}
