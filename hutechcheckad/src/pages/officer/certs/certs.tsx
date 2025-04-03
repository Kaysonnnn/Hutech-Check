import {
  ActionIcon,
  Center,
  Group,
  Loader,
  Modal,
  Select,
  Table,
  Text,
  TextInput,
  Title
} from '@mantine/core'
import { useViewportSize } from '@mantine/hooks'
import { modals } from '@mantine/modals'
import { IconCertificate, IconSearch, IconTrash } from '@tabler/icons-react'
import {
  collection,
  deleteDoc,
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
  selectRoleId,
  selectRoleName,
  STORE_CERTS
} from '@/redux'
import { formatTimestamp, textGetLines } from '@/utils'

export const Certs = () => {
  const { width } = useViewportSize()

  const [opened, setOpened] = useState(false)
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

  const roleName = useSelector(selectRoleName)
  const roleId = useSelector(selectRoleId)

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
      certsData = getData.filter(
        item => item !== undefined && item !== null && item.evData.display
      )
      // .sort((a: any, b: any) => {
      //   const aDate = new Date(a.date).getTime();
      //   const bDate = new Date(b.date).getTime();
      //   return bDate - aDate;
      // });
      if (roleName !== 'Quản trị viên' && roleName !== 'Cộng tác viên') {
        certsData = certsData.filter((item: any) => item.evData.host === roleId)
      }

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

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isCanvasLoading, setIsCanvasLoading] = useState(true)
  const cefWidth = 3371
  const cefHeight = 2420

  const drawImage = (cef: any, template: any, student: any, host: any) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const image = new Image()
    image.src = template.image

    image.onload = () => {
      setIsCanvasLoading(false)

      // Đặt kích thước canvas
      canvas.width = 3371
      canvas.height = 2420

      // Vẽ hình ảnh lên canvas với kích thước cố định
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(image, 0, 0, cefWidth, cefHeight)

      // Đặt thông tin
      ctx.textAlign = 'center'

      // Tên sinh viên
      ctx.font = `bold ${template.studentNameFs}pt Arial`
      ctx.fillStyle = template.studentNameColor
      if (template.isDisplayStudentName) {
        ctx.fillText(
          student.fullName,
          template.studentNameX,
          template.studentNameY
        )
      }

      // Mã số sinh viên
      ctx.font = `${template.studentCodeFs}pt Arial`
      ctx.fillStyle = template.studentCodeColor
      if (template.isDisplayStudentCode) {
        ctx.fillText(
          'MSSV: ' + student.studentId,
          template.studentCodeX,
          template.studentCodeY
        )
      }

      // Đơn vị tổ chứ
      ctx.font = `${template.cefHostFs}pt Arial`
      ctx.fillStyle = template.cefHostColor
      if (template.isDisplayCefHost && host.length != 0) {
        ctx.fillText(host.name, template.cefHostX, template.cefHostY)
      }

      // Event name
      ctx.font = `${template.eventTitleFs}pt Arial`
      ctx.fillStyle = template.eventTitleColor
      let maxW = 2930
      let lines = textGetLines(ctx, cef.title.toUpperCase(), maxW)
      let lineY = 65
      let startY = template.eventTitleY - (lines.length - 1) * lineY

      if (template.isDisplayEventTitle) {
        for (let i = 0; i < lines.length; i++) {
          ctx.fillText(lines[i], template.eventTitleX, startY + i * lineY * 2)
        }
      }

      // Set info day, month, year and cef number
      ctx.font = `italic ${template.cefDayFs}pt Arial`
      ctx.fillStyle = template.cefDayColor
      if (template.isDisplayCefDay)
        ctx.fillText(
          new Date(cef.date).getDate().toFixed(),
          template.cefDayX,
          template.cefDayY
        )
      if (template.isDisplayCefMonth)
        ctx.fillText(
          (new Date(cef.date).getMonth() + 1).toFixed(),
          template.cefMonthX,
          template.cefMonthY
        )
      if (template.isDisplayCefYear)
        ctx.fillText(
          new Date(cef.date).getFullYear().toFixed().slice(-2),
          template.cefYearX,
          template.cefYearY
        )

      ctx.font = `${template.cefNoFs}pt Arial`
      ctx.fillStyle = template.cefNoColor
      ctx.textAlign = 'left'
      if (template.isDisplayCefNo)
        ctx.fillText(`Số:     ${cef.certId}`, template.cefNoX, template.cefNoY)
    }
  }

  const openCefModal = async (cef: any) => {
    setOpened(true)
    setIsCanvasLoading(true)

    let templateData: any = []
    let studentData: any = []
    let hostData: any = []

    const templateRef = doc(db, 'templates', cef.evData.template)
    const templateDoc = await getDoc(templateRef)
    if (templateDoc.exists()) {
      templateData = templateDoc.data()
    }

    const studentRef = doc(db, 'students', cef.studentId)
    const studentDoc = await getDoc(studentRef)
    if (studentDoc.exists()) {
      studentData = studentDoc.data()
    }

    if (cef.evData.host !== '') {
      const hostRef = doc(db, 'hosts', cef.evData.host)
      const hostDoc = await getDoc(hostRef)
      if (hostDoc.exists()) {
        hostData = hostDoc.data()
      }
    }

    let dataLoaded = true

    const waitForData = setInterval(() => {
      if (dataLoaded) {
        clearInterval(waitForData)
        drawImage(cef, templateData, studentData, hostData)
      }
    }, 100)
  }

  const closeCefModal = () => {
    setOpened(false)
    setIsCanvasLoading(true)
  }

  const deleteCef = async (eventId: string, studentId: string) => {
    modals.openConfirmModal({
      title: 'Xóa chứng nhận',
      centered: true,
      closeOnClickOutside: false,
      children: (
        <Text>
          Bạn có chắc muốn xóa chứng nhận này của sinh viên <b>"{studentId}"</b>{' '}
          không? Đồng nghĩa với việc hủy checkin sự kiện của sinh viên này.
        </Text>
      ),
      labels: { confirm: 'Xóa chứng nhận', cancel: 'Đóng' },
      confirmProps: { color: 'red' },
      onCancel: () => {},
      onConfirm: async () => {
        await deleteDoc(doc(db, 'certs', `${eventId}_${studentId}`))
        window.SweetAlert.success(
          'Xóa chứng nhận',
          `Đã hủy chứng nhận của sinh viên ${studentId} thành công!<br/>Tải lại trang để xem thay đổi.`,
          false
        )
      }
    })
  }

  return (
    <>
      <Title order={2}>Danh sách chứng nhận</Title>
      <Text>Bạn có thể tra cứu chứng nhận của sinh viên tại đây.</Text>

      {isLoading ? (
        <Loader color="blue" size="xl" type="dots" />
      ) : (
        <>
          <Modal
            opened={opened}
            onClose={closeCefModal}
            size="55rem"
            title="Thông tin chứng nhận"
            centered
            removeScrollProps={{ allowPinchZoom: true }}
            closeOnClickOutside={false}
          >
            {isCanvasLoading && (
              <Center>
                <Loader color="blue" />
              </Center>
            )}
            <canvas style={{ width: '100%' }} ref={canvasRef} />
          </Modal>

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
                      <Table.Th>Hành động</Table.Th>
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
                          <Table.Td>
                            <ActionIcon.Group>
                              <ActionIcon
                                size="lg"
                                color="green"
                                variant="filled"
                                onClick={() => openCefModal(cert)}
                              >
                                <IconCertificate stroke={1.5} />
                              </ActionIcon>
                              {roleName === 'Quản trị viên' && (
                                <ActionIcon
                                  size="lg"
                                  color="red"
                                  variant="filled"
                                  onClick={() => deleteCef(id, studentId)}
                                >
                                  <IconTrash stroke={1.5} />
                                </ActionIcon>
                              )}
                            </ActionIcon.Group>
                          </Table.Td>
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
