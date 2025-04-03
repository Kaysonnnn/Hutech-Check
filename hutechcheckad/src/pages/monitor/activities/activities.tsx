import {
  Button,
  Center,
  Flex,
  Group,
  Loader,
  Modal,
  Progress,
  Select,
  Space,
  Table,
  Text,
  TextInput,
  Title
} from '@mantine/core'
import { useViewportSize } from '@mantine/hooks'
import { modals } from '@mantine/modals'
import { IconNotebook, IconSearch } from '@tabler/icons-react'
import { MimeType, TemplateHandler } from 'easy-template-x'
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query
} from 'firebase/firestore'
import { useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { Pagination } from '@/components'
import { db } from '@/firebase'
import {
  FILTER_BY_SEARCH_CERTS,
  selectCerts,
  selectFilteredCerts,
  selectStudyClass,
  STORE_CERTS
} from '@/redux'
import { formatDate, formatTimestamp, textGetLines } from '@/utils'

export const Activities = () => {
  const [opened, setOpened] = useState(false)
  const { width } = useViewportSize()

  const canvasRefs = useRef<HTMLCanvasElement[]>([])

  const [isLoading, setIsLoading] = useState(false)
  const [originalCerts, setOriginalCerts] = useState<any[]>([])
  const certs = useSelector(selectCerts)
  const filteredCerts = useSelector(selectFilteredCerts)

  const [search, setSearch] = useState('')
  // Pagination states
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [itemsPerPage, setItemsPerPage] = useState<string | null>('10')
  // Get Current Items
  const indexOfLastItem = currentPage * Number(itemsPerPage)
  const indexOfFirstItem = indexOfLastItem - Number(itemsPerPage)
  const currentItems = filteredCerts.slice(indexOfFirstItem, indexOfLastItem)

  const [semesters, setSemesters] = useState<
    { group: string; items: { label: string; value: string }[] }[]
  >([])
  const [selectedSemester, setSelectedSemester] = useState<string | null>(
    'Tất cả'
  )
  const [faculty, setFaculty] = useState('')
  const [isFormLoading, setIsFormLoading] = useState(false)
  const [modalMessage, setModalMessage] = useState('')
  const [isCompleted, setIsCompleted] = useState(false)
  const [progressValue, setProgressValue] = useState(0)
  const isCancelledRef = useRef(false)

  const studyClass = useSelector(selectStudyClass)

  const dispatch = useDispatch()

  useEffect(() => {
    setIsLoading(true)
    getAllCertsData()
  }, [])

  useEffect(() => {
    dispatch(FILTER_BY_SEARCH_CERTS({ certs, search }))
    setCurrentPage(1)
  }, [dispatch, certs, search])

  const getAllCertsData = async () => {
    let certsData: any = []
    let dataLoaded = false

    const evsRef = collection(db, 'certs')
    const evQuery = await query(evsRef, orderBy('checkinAt', 'desc'))
    await onSnapshot(evQuery, async snapshot => {
      const allCefData: any = await Promise.all(
        snapshot.docs.map(async snap => {
          const certDoc = snap.data()

          const checkinAt = formatTimestamp(certDoc.checkinAt?.seconds)
          const checkoutAt =
            certDoc.checkoutAt !== ''
              ? formatTimestamp(certDoc.checkoutAt?.seconds)
              : ''

          const certData = {
            id: snap.id,
            certId: certDoc.certId,
            studentId: certDoc.studentId,
            eventId: certDoc.eventId,
            checkinAt,
            checkoutAt
          }

          return { ...certData }
        })
      )

      let certsDataPromises: Promise<any>[] = []
      for (const item of allCefData) {
        if (item.checkoutAt === '') {
          const getData = getPromiseData(item.eventId, item.studentId)
          certsDataPromises.push(
            getData.then(({ stData, evData }) => ({
              id: item.id,
              certId: item.certId,
              studentId: item.studentId,
              checkinAt: item.checkinAt,
              stData,
              evData
            }))
          )
        }
      }

      const getData = await Promise.all(certsDataPromises)
      certsData = getData
        .filter(
          item => item !== undefined && item !== null && item.evData.display
        )
        .filter((item: any) => item.stData.studyClass === studyClass)

      // console.log(certsData);

      dataLoaded = true
    })

    const waitForData = setInterval(() => {
      if (dataLoaded) {
        clearInterval(waitForData)
        dispatch(
          STORE_CERTS({
            certs: certsData
          })
        )
        setOriginalCerts(certsData)
        getSemesterList(certsData)
        setIsLoading(false)
      }
    }, 100)
  }

  const getPromiseData = async (eventId: string, studentId: string) => {
    let stData: any = []
    const stSnap = await getDoc(doc(db, 'students', studentId))
    if (stSnap.exists()) {
      stData = stSnap.data()
    }

    let evData: any = []
    const evSnap = await getDoc(doc(db, 'events', eventId))
    if (evSnap.exists()) {
      evData = evSnap.data()
    }

    const { hostName, labelData } = await getEventData(evData)
    evData.host = hostName
    evData.labels = labelData

    return { stData, evData }
  }

  const getSemesterList = (certsData: any) => {
    const yearsMap: { [key: string]: { label: string; value: string }[] } = {}

    certsData.forEach((doc: any) => {
      const checkinDate = doc.checkinAt
      const [checkinDay, checkinMonth, checkinYear] = checkinDate
        .split(' ')[0]
        .split('/')
        .map(Number)
      const date = new Date(checkinYear, checkinMonth - 1, checkinDay)

      const day = date.getDate()
      const month = date.getMonth() + 1
      const year = date.getFullYear()
      const yearSlice = Number(year.toString().slice(-2))

      let academicYear: string
      let value: string
      let label: string

      if ((day >= 1 && month >= 9) || (day <= 31 && month <= 1)) {
        if (month === 1) {
          academicYear = `hk1_${year - 1}-${year}`
          label = `Năm học ${year - 1}-${year} học kì 1`
          value = `${yearSlice - 1}${yearSlice}_1`
        } else {
          academicYear = `hk1_${year}-${year + 1}`
          label = `Năm học ${year}-${year + 1} học kì 1`
          value = `${yearSlice}${yearSlice + 1}_1`
        }
      } else if (day >= 1 && month >= 2 && day <= 30 && month <= 6) {
        academicYear = `hk2_${year - 1}-${year}`
        label = `Năm học ${year - 1}-${year} học kì 2`
        value = `${yearSlice - 1}${yearSlice}_2`
      } else {
        // (day >= 1 && month >= 7) && (day <= 31 && month <= 8)
        academicYear = `hk3_${year - 1}-${year}`
        label = `Năm học ${year - 1}-${year} học kì 3`
        value = `${yearSlice - 1}${yearSlice}_3`
      }

      if (!yearsMap[academicYear]) {
        yearsMap[academicYear] = []
      }

      if (!yearsMap[academicYear].some(item => item.label === label)) {
        yearsMap[academicYear].push({ label, value })
      }
    })

    const semestersArray = Object.entries(yearsMap).map(([group, items]) => ({
      group,
      items
    }))
    setSemesters(semestersArray)
  }

  const handleFilterBySemester = async (_value: any) => {
    setSelectedSemester(_value)

    if (_value === 'Tất cả') {
      dispatch(
        STORE_CERTS({
          certs: originalCerts
        })
      )
    } else {
      const splitValue = _value.toString().split('_') // ["2324", "1"]
      const semester = splitValue[1] // "1"
      let tempYear: string = '20'
      let tempCert: any = []

      originalCerts.forEach((cert: any) => {
        const checkinDate = cert.checkinAt
        const [checkinDay, checkinMonth, checkinYear] = checkinDate
          .split(' ')[0]
          .split('/')
          .map(Number)
        const date = new Date(checkinYear, checkinMonth - 1, checkinDay)

        const day = date.getDate()
        const month = date.getMonth() + 1
        const year = date.getFullYear()

        if (
          semester === '1' &&
          ((day >= 1 &&
            month >= 9 &&
            year === Number(`${tempYear}${splitValue[0].slice(0, 2)}`) &&
            day <= 31 &&
            month <= 12 &&
            year === Number(`${tempYear}${splitValue[0].slice(0, 2)}`)) ||
            (month == 1 &&
              year === Number(`${tempYear}${splitValue[0].slice(2, 4)}`)))
        ) {
          tempCert.push(cert)
        } else if (
          semester === '2' &&
          day >= 1 &&
          month >= 2 &&
          year == Number(`${tempYear}${splitValue[0].slice(2, 4)}`) &&
          day <= 30 &&
          month <= 6 &&
          year == Number(`${tempYear}${splitValue[0].slice(2, 4)}`)
        ) {
          tempCert.push(cert)
        } else if (
          semester === '3' &&
          day >= 1 &&
          month >= 7 &&
          year == Number(`${tempYear}${splitValue[0].slice(2, 4)}`) &&
          day <= 31 &&
          month <= 8 &&
          year == Number(`${tempYear}${splitValue[0].slice(2, 4)}`)
        ) {
          tempCert.push(cert)
        }
      })

      dispatch(
        STORE_CERTS({
          certs: tempCert
        })
      )
    }
  }

  const verifyFaculty = () => {
    // console.log(selectedSemester);
    if (selectedSemester == 'Tất cả') {
      window.SweetAlert.info(
        '',
        'Vui lòng chọn năm học, học kỳ (phần <b>Lọc theo</b>) để tiếp tục công việc.',
        true
      )
    } else {
      setOpened(true)
    }
  }

  const getEventData = async (ev: any) => {
    let temData: any = []
    const temRef = doc(db, 'templates', ev.template)
    const temDoc = await getDoc(temRef)
    if (temDoc.exists()) {
      temData = temDoc.data()
    }

    let hostName: string = ''
    const hostRef = doc(db, 'hosts', ev.host)
    const hostDoc = await getDoc(hostRef)
    if (hostDoc.exists()) {
      hostName = hostDoc.data().name
    }

    let labelData: any = []
    for (const labelId of ev.labels) {
      const labelRef = doc(db, 'labels', labelId)
      const labelDoc = await getDoc(labelRef)
      if (labelDoc.exists()) {
        labelData.push(labelDoc.data().name)
      }
    }

    return { temData, hostName, labelData }
  }

  const createImageFromCanvas = async (
    canvas: HTMLCanvasElement,
    cert: any
  ) => {
    const { temData } = await getEventData(cert.evData)

    const cefWidth = 3371
    const cefHeight = 2420

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const image = new Image()
    image.crossOrigin = 'Anonymous'
    image.src = temData.image

    return new Promise<void>(resolve => {
      image.onload = () => {
        canvas.width = 3371
        canvas.height = 2420

        // Vẽ hình ảnh lên canvas với kích thước cố định
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(image, 0, 0, cefWidth, cefHeight)

        // Đặt thông tin
        ctx.textAlign = 'center'

        // Tên sinh viên
        ctx.font = `bold ${temData.studentNameFs}pt Arial`
        ctx.fillStyle = temData.studentNameColor
        if (temData.isDisplayStudentName) {
          ctx.fillText(
            cert.stData.fullName,
            temData.studentNameX,
            temData.studentNameY
          )
        }

        // Mã số sinh viên
        ctx.font = `${temData.studentCodeFs}pt Arial`
        ctx.fillStyle = temData.studentCodeColor
        if (temData.isDisplayStudentCode) {
          ctx.fillText(
            'MSSV: ' + cert.stData.studentId,
            temData.studentCodeX,
            temData.studentCodeY
          )
        }

        // Đơn vị tổ chứ
        ctx.font = `${temData.cefHostFs}pt Arial`
        ctx.fillStyle = temData.cefHostColor
        if (temData.isDisplayCefHost && cert.host.length != 0) {
          ctx.fillText(cert.host, temData.cefHostX, temData.cefHostY)
        }

        // Event name
        ctx.font = `${temData.eventTitleFs}pt Arial`
        ctx.fillStyle = temData.eventTitleColor
        let maxW = 2930
        let lines = textGetLines(ctx, cert.evData.title.toUpperCase(), maxW)
        let lineY = 65
        let startY = temData.eventTitleY - (lines.length - 1) * lineY

        if (temData.isDisplayEventTitle) {
          for (let i = 0; i < lines.length; i++) {
            ctx.fillText(lines[i], temData.eventTitleX, startY + i * lineY * 2)
          }
        }

        // Set info day, month, year and cef number
        ctx.font = `italic ${temData.cefDayFs}pt Arial`
        ctx.fillStyle = temData.cefDayColor
        if (temData.isDisplayCefDay)
          ctx.fillText(
            new Date(cert.evData.date).getDate().toFixed(),
            temData.cefDayX,
            temData.cefDayY
          )
        if (temData.isDisplayCefMonth)
          ctx.fillText(
            (new Date(cert.evData.date).getMonth() + 1).toFixed(),
            temData.cefMonthX,
            temData.cefMonthY
          )
        if (temData.isDisplayCefYear)
          ctx.fillText(
            new Date(cert.evData.date).getFullYear().toFixed().slice(-2),
            temData.cefYearX,
            temData.cefYearY
          )

        ctx.font = `${temData.cefNoFs}pt Arial`
        ctx.fillStyle = temData.cefNoColor
        ctx.textAlign = 'left'
        if (temData.isDisplayCefNo)
          ctx.fillText(`Số:     ${cert.certId}`, temData.cefNoX, temData.cefNoY)

        resolve()
      }
    })
  }

  let allCerts: any = []
  let certSportsFestival: any = [] // GCN Hội Thao
  let certVolunteer: any = [] // GCN Tình Nguyện
  let certSkill: any = [] // GCN Kỹ Năng
  let certSeminar: any = [] // GCN Hội Thảo
  let certAcademics: any = [] // GCN Học Thuật

  // See issue (Fixed): https://github.com/alonrbar/easy-template-x/issues/119
  const convertCanvasToBlobImage = async (
    canvas: HTMLCanvasElement,
    labels: string[]
  ) => {
    await new Promise<void>(resolve => {
      canvas.toBlob(blob => {
        if (blob) {
          const blobData = {
            _type: 'image',
            source: blob,
            format: MimeType.Png,
            width: 400,
            height: 287
          }
          allCerts.push({ ['cert image']: blobData })

          for (const label of labels) {
            if (label == 'Hội Thao')
              certSportsFestival.push({ ['cert image']: blobData })
            if (label == 'Tình Nguyện')
              certVolunteer.push({ ['cert image']: blobData })
            if (label == 'Kỹ Năng') certSkill.push({ ['cert image']: blobData })
            if (label == 'Hội Thảo')
              certSeminar.push({ ['cert image']: blobData })
            if (label == 'Học Thuật')
              certAcademics.push({ ['cert image']: blobData })
          }

          resolve()
        }
      })
    })
  }

  let theTemplate: Blob

  const getTemplate = async (): Promise<Blob> => {
    if (theTemplate) return theTemplate
    const request = await fetch('/files/template.docx')
    const defaultTemplate = await request.blob()
    return defaultTemplate
  }

  const saveFile = (filename: string, blob: Blob) => {
    // get downloadable url from the blob
    const blobUrl = URL.createObjectURL(blob)

    // create temp link element
    let link: HTMLAnchorElement | null = document.createElement('a')
    link.download = filename
    link.href = blobUrl

    // use the link to invoke a download
    document.body.appendChild(link)
    link.click()

    // remove the link
    setTimeout(() => {
      if (link) {
        link.remove()
        URL.revokeObjectURL(blobUrl)
        link = null
      }
    }, 0)
  }

  const download = async (e: any) => {
    e.preventDefault()

    isCancelledRef.current = false // Reset cờ hiệu hủy bỏ khi bắt đầu quá trình mới
    setIsFormLoading(true)
    setProgressValue(0)

    setModalMessage('Đang chuẩn bị lấy mẫu...')
    const templateFile = await getTemplate()
    setProgressValue(10)

    if (isCancelledRef.current) return // Kiểm tra cờ hiệu hủy bỏ

    setModalMessage('Đang phân tích dữ liệu...')
    let studentList: any = []
    let seenMSSV = new Set<string>()

    let evSportsFestival: any = [] // Sự kiện Hội Thao
    let evVolunteer: any = [] // Sự kiện Tình Nguyện
    let evSkill: any = [] // Sự kiện Kỹ Năng
    let evSeminar: any = [] // Sự kiện Hội Thảo
    let evAcademics: any = [] // Sự kiện Học Thuật

    const totalCerts = filteredCerts.length
    for (const cert of filteredCerts) {
      if (isCancelledRef.current) return // Kiểm tra cờ hiệu hủy bỏ

      const index: any = filteredCerts.indexOf(cert)
      const mssv = `${cert.studentId}`

      const canvas = canvasRefs.current[index]
      await createImageFromCanvas(canvas, cert)
      if (isCancelledRef.current) return // Kiểm tra cờ hiệu hủy bỏ
      await convertCanvasToBlobImage(canvas, cert.evData.labels)
      if (isCancelledRef.current) return // Kiểm tra cờ hiệu hủy bỏ

      for (const label of cert.evData.labels) {
        const studentInEvent = {
          mssv: mssv,
          name: `${cert.stData.fullName}`,
          event: `${cert.evData.title}`,
          date: `${formatDate(cert.evData?.date)}`
        }
        if (label == 'Hội Thao') evSportsFestival.push(studentInEvent)
        if (label == 'Tình Nguyện') evVolunteer.push(studentInEvent)
        if (label == 'Kỹ Năng') evSkill.push(studentInEvent)
        if (label == 'Hội Thảo') evSeminar.push(studentInEvent)
        if (label == 'Học Thuật') evAcademics.push(studentInEvent)
      }

      if (!seenMSSV.has(mssv)) {
        seenMSSV.add(mssv)
        studentList.push({
          index: `${index + 1}`,
          mssv: mssv,
          name: `${cert.stData.fullName}`,
          phone: cert.stData.phone,
          email: cert.stData.email
        })
      }

      // Cập nhật tiến độ từ 10 đến 80
      const progressIncrement = 70 / totalCerts // 10 là khoảng cách từ 20 đến 80
      setProgressValue(10 + index * progressIncrement)
    }

    if (isCancelledRef.current) return // Kiểm tra cờ hiệu hủy bỏ

    const splitYear = selectedSemester!.toString().split('_') // ["2324", "1"]

    const jsonData: any = {
      semester: `20${splitYear[0].slice(0, 2)} - 20${splitYear[0].slice(2, 4)}`,
      study_class: `${studyClass}`,
      major: `${faculty.toUpperCase()}`,
      students: studentList,
      evSportsFestival,
      evVolunteer,
      evSkill,
      evSeminar,
      evAcademics,
      allCertsList: allCerts,
      certSportsFestivalList: certSportsFestival,
      certVolunteerList: certVolunteer,
      certSkillList: certSkill,
      certSeminarList: certSeminar,
      certAcademicsList: certAcademics
    }
    // const jsonData = getJsonData();
    // console.log(jsonData);
    setProgressValue(90)

    if (isCancelledRef.current) return // Kiểm tra cờ hiệu hủy bỏ

    setModalMessage('Đang tạo tài liệu...')
    const handler = new TemplateHandler()
    const docx = await handler.process(templateFile, jsonData)
    setProgressValue(100)

    if (isCancelledRef.current) return // Kiểm tra cờ hiệu hủy bỏ

    setModalMessage('Sổ nhật ký hiện đã sẵn sàng để tự động tải về.')
    saveFile('so-nhat-ky-tttt.docx', docx)
    setIsCompleted(true)
  }

  const resetForm = () => {
    setFaculty('')
  }

  const closeModal = () => {
    if (!isCompleted) {
      isCancelledRef.current = true // Đặt cờ để yêu cầu hủy quá trình
      window.SweetAlert.warning(
        '',
        'Quá trình xử lý tài liệu đã bị hủy bỏ.',
        true
      )
    }
    modals.closeAll()
    setIsFormLoading(false)
    setProgressValue(0)
    setIsCompleted(false)
    setOpened(false)
    resetForm()
  }

  return (
    <>
      <Title order={2}>Thống kê hoạt động</Title>
      <Text>
        Thông kê hoạt động tham gia theo từng kỳ của lớp {studyClass}.
      </Text>

      {isLoading ? (
        <Loader color="blue" size="xl" type="dots" />
      ) : (
        <>
          <Modal
            opened={opened}
            onClose={closeModal}
            title={!isFormLoading ? 'Xác nhận Khoa/Viện' : 'Sổ nhật ký'}
            centered
            removeScrollProps={{ allowPinchZoom: true }}
          >
            {!isFormLoading ? (
              <form onSubmit={download}>
                <TextInput
                  label="Khoa/Viện"
                  placeholder="CÔNG NGHỆ THÔNG TIN"
                  data-autofocus
                  value={faculty}
                  onChange={e => setFaculty(e.target.value)}
                />
                <Button
                  type="submit"
                  fullWidth
                  mt="md"
                  disabled={faculty == ''}
                >
                  Tiếp tục
                </Button>
              </form>
            ) : !isCompleted ? (
              <div>
                <Center>
                  <Loader color="blue" />
                  <Space w="md" />
                  <Flex
                    justify="flex-start"
                    align="flex-start"
                    direction="column"
                    wrap="wrap"
                  >
                    <Text fw={700}>{modalMessage}</Text>
                    <Text>
                      Quá trình xử lý này có thể diễn ra lâu hơn khi có nhiều dữ
                      liệu. Kiên nhẫn chờ đợi đến khi hoàn tất và không đóng hộp
                      thoại này.
                    </Text>
                  </Flex>
                </Center>
                <Progress.Root size="lg" mt="md">
                  <Progress.Section value={progressValue}>
                    <Progress.Label>{progressValue.toFixed()}%</Progress.Label>
                  </Progress.Section>
                </Progress.Root>
              </div>
            ) : (
              <div>
                <Text>{modalMessage}</Text>
                <Button fullWidth mt="md" onClick={closeModal}>
                  Đóng
                </Button>
              </div>
            )}
          </Modal>

          <Text my="md">
            <Button
              variant="filled"
              onClick={() => verifyFaculty()}
              leftSection={<IconNotebook size={18} stroke={1.5} />}
            >
              Xuất Sổ nhật ký "Tập thể sinh viên tiên tiến"
            </Button>{' '}
            dựa theo những thông tin thống kê hoạt động ở bảng bên dưới.
          </Text>

          <div style={{ display: 'none' }}>
            {Array.from({ length: filteredCerts.length }).map((_, index) => (
              <canvas
                key={index}
                ref={el => el && (canvasRefs.current[index] = el)}
                style={{
                  border: '1px solid black',
                  margin: '5px',
                  width: '45%'
                }}
              />
            ))}
          </div>

          <Group justify="space-between" my="md" grow={width >= 768}>
            <div>
              <TextInput
                label={
                  <>
                    <b>{filteredCerts.length}</b> chứng nhận
                  </>
                }
                placeholder="Tìm kiếm CN, SV,..."
                leftSection={<IconSearch stroke={1.5} />}
                value={search}
                onChange={(e: any) => setSearch(e.target.value)}
                variant="default"
              />
            </div>

            <Select
              label={`Lọc theo`}
              data={['Tất cả', ...semesters]}
              value={selectedSemester}
              onChange={_value => handleFilterBySemester(_value)}
              allowDeselect={false}
            />

            <Select
              label={`Đang hiển thị ${itemsPerPage} mục`}
              placeholder="Chọn giá trị"
              data={['10', '25', '50', '100']}
              value={itemsPerPage}
              onChange={setItemsPerPage}
              allowDeselect={false}
            />
          </Group>

          {filteredCerts.length === 0 ? (
            <Text my="md">Không có dữ liệu nào.</Text>
          ) : (
            <>
              <Table.ScrollContainer my="md" minWidth={500} type="native">
                <Table striped highlightOnHover withTableBorder>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Mã CN</Table.Th>
                      <Table.Th>Sự kiện</Table.Th>
                      <Table.Th>MSSV</Table.Th>
                      <Table.Th>Họ tên</Table.Th>
                      <Table.Th>Lớp</Table.Th>
                      <Table.Th>Ngày checkin</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {currentItems.map((cert: any, index: any) => {
                      const {
                        id,
                        certId,
                        checkinAt,
                        studentId,
                        stData,
                        evData
                      } = cert

                      return (
                        <Table.Tr key={certId + index}>
                          <Table.Td>{certId}</Table.Td>
                          <Table.Td miw={150} maw={275}>
                            {evData.title}
                          </Table.Td>
                          <Table.Td>{studentId}</Table.Td>
                          <Table.Td>{stData.fullName}</Table.Td>
                          <Table.Td>{stData.studyClass}</Table.Td>
                          <Table.Td>{checkinAt}</Table.Td>
                        </Table.Tr>
                      )
                    })}
                  </Table.Tbody>
                </Table>
              </Table.ScrollContainer>

              <Center>
                <Pagination
                  currentPage={currentPage}
                  setCurrentPage={setCurrentPage}
                  itemsPerPage={Number(itemsPerPage)}
                  totalItems={filteredCerts.length}
                />
              </Center>
            </>
          )}
        </>
      )}
    </>
  )
}
