/*
 * Install the Generative AI SDK
 *
 * $ npm install @google/generative-ai
 */

import { GoogleGenerativeAI } from '@google/generative-ai'

const apiKey = import.meta.env.LAHM_PUBLIC_GEMINI_API_KEY
const genAI = new GoogleGenerativeAI(apiKey)

const model = genAI.getGenerativeModel({
  model: 'gemini-1.5-flash'
})

const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 64,
  maxOutputTokens: 8192,
  responseMimeType: 'application/json'
}

export const chatSession = model.startChat({
  generationConfig,
  // safetySettings: Adjust safety settings
  // See https://ai.google.dev/gemini-api/docs/safety-settings
  history: [
    {
      role: 'user',
      parts: [
        {
          text: 'Trường Đại học Công nghệ tp.HCM (HUTECH) sắp diễn ra sự kiện "HUTECH MUSIC PARTY 2024" vào ngày 07/11/2024, tại Sảnh dưới khu A. Hãy viết mô tả tóm tắt (summary) gây thu hút người tham dự về sự kiện này, và viết mô tả chi tiết đầy đủ (description ở dạng HTML để sử dụng trong @tiptap/editor) dài về nó bao gồm cả đối tượng tham dự, những điều lưu ý, lời cảm ơn,... ở định dạng JSON gồm 2 trường summary và description.'
        }
      ]
    },
    {
      role: 'model',
      parts: [
        {
          text: '```json\n{"summary": "Bùng nổ âm nhạc cùng HUTECH MUSIC PARTY 2024! 🎉 Hãy sẵn sàng cho một đêm cuồng nhiệt với những tiết mục hấp dẫn, âm nhạc sôi động và cơ hội giao lưu kết nối cùng bạn bè.  🗓️ 07/11/2024  📍 Sảnh dưới khu A  👉 Đừng bỏ lỡ!  #HUTECHMusicParty2024 #HUTECH", "description": "<h2>HUTECH MUSIC PARTY 2024 - Bùng nổ âm nhạc, thăng hoa cảm xúc</h2>\\n<p>Trường Đại học Công nghệ TP.HCM (HUTECH) trân trọng kính mời bạn đến với sự kiện âm nhạc \\"HUTECH MUSIC PARTY 2024\\" - một đêm hội âm nhạc sôi động, hứa hẹn mang đến cho bạn những trải nghiệm khó quên.</p>\\n<h3>Thông tin sự kiện:</h3>\\n<ul>\\n<li>Thời gian: 18:00 - 22:00, Thứ Bảy, ngày 07/11/2024</li>\\n<li>Địa điểm: Sảnh dưới khu A, Trường Đại học Công nghệ TP.HCM (HUTECH)</li>\\n</ul>\\n<h3>Đối tượng tham dự:</h3>\\n<ul>\\n<li>Sinh viên, giảng viên, cán bộ công nhân viên và cựu sinh viên HUTECH</li>\\n<li>Bạn bè, người thân của cộng đồng HUTECH</li>\\n</ul>\\n<h3>Chương trình dự kiến:</h3>\\n<ul>\\n<li>Biểu diễn âm nhạc sôi động từ các ban nhạc, ca sĩ tài năng</li>\\n<li>Các trò chơi, hoạt động vui nhộn, tạo cơ hội giao lưu kết nối</li>\\n<li>Bốc thăm trúng thưởng với nhiều phần quà hấp dẫn</li>\\n</ul>\\n<h3>Lưu ý:</h3>\\n<ul>\\n<li>Sự kiện miễn phí, không bán vé</li>\\n<li>Vui lòng giữ gìn trật tự, vệ sinh chung</li>\\n<li>Mang theo chứng minh thư/thẻ sinh viên để xác nhận danh tính khi vào cổng</li>\\n</ul>\\n<p>HUTECH MUSIC PARTY 2024 hứa hẹn sẽ là một đêm hội âm nhạc đầy sôi động, náo nhiệt, tạo cơ hội cho tất cả mọi người cùng nhau giải tỏa căng thẳng, thư giãn và tận hưởng những khoảnh khắc vui vẻ bên bạn bè, người thân. Hãy đến và cùng chúng tôi hòa mình vào không khí âm nhạc rộn ràng, đầy màu sắc! </p>\\n<p>Xin chân thành cảm ơn sự ủng hộ và đồng hành của quý vị!</p>"}\n\n```'
        }
      ]
    }
  ]
})
