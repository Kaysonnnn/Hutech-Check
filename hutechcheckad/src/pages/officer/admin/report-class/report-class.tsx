import {
  Affix,
  Anchor,
  Button,
  Card,
  Center,
  Checkbox,
  Loader,
  SimpleGrid,
  Text,
  Title
} from '@mantine/core'
import { DatePickerInput } from '@mantine/dates'
import {
  ColumnDirective,
  ColumnsDirective,
  RangeDirective,
  RangesDirective,
  SheetDirective,
  SheetsDirective,
  SpreadsheetComponent
} from '@syncfusion/ej2-react-spreadsheet'
import {
  IconArrowLeft,
  IconCalendarEvent,
  IconSearch
} from '@tabler/icons-react'
import {
  collection,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  where
} from 'firebase/firestore'
import { useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'

import { db } from '@/firebase'
import { selectRoleId, selectRoleName } from '@/redux'
import { formatDate, getColumnName } from '@/utils'

export const ReportClass = () => {
  const [eventsData, setEventsData] = useState([])
  const [allEventChecked, setAllEventChecked] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const roleName = useSelector(selectRoleName)
  const roleId = useSelector(selectRoleId)

  const [filterDate, setFilterDate] = useState<[Date | null, Date | null]>([
    null,
    null
  ])

  const [isQuerying, setIsQuerying] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const spreadsheetRef = useRef(null)
  const [excelData, setExcelData] = useState<any>([])

  useEffect(() => {
    setIsLoading(true)
    getAllEventData()
  }, [])

  useEffect(() => {
    setInterval(() => {
      const element1 = document.querySelector(
        'div[style*="position: fixed;"][style*="top: 10px;"][style*="left: 10px;"][style*="color: #222222;"][style*="z-index: 999999999;"]'
      )
      const element2 = document.querySelector(
        'div[style*="position: fixed;"][style*="width: 100%;"][style*="height: 100%;"][style*="top: 0;"][style*="left: 0;"][style*="right: 0;"][style*="bottom: 0;"][style*="background-color: rgba(0, 0, 0, 0.5);"][style*="z-index: 99999;"]'
      )

      if (element1) {
        element1.remove()
      }
      if (element2) {
        element2.remove()
      }
    }, 0)
  }, [])

  const getAllEventData = async (dates?: [Date | null, Date | null]) => {
    let evsData: any = []
    let dataLoaded = false

    const evsRef = collection(db, 'events')
    const evsQuery = await query(evsRef, orderBy('date', 'desc'))
    await onSnapshot(evsQuery, async snapshot => {
      const allEventData: any = await Promise.all(
        snapshot.docs.map(async snap => {
          const eventDoc = snap.data()

          const eventData = {
            id: snap.id,
            title: eventDoc.title,
            date: eventDoc.date,
            host: eventDoc.host,
            display: eventDoc.display,
            checked: false
          }

          return { ...eventData }
        })
      )

      evsData = allEventData.filter(
        (item: any) => item !== undefined && item !== null && item.display
      )
      if (roleName !== 'Quản trị viên' && roleName !== 'Cộng tác viên') {
        evsData = evsData.filter((item: any) => item.host === roleId)
      }
      if (dates) {
        evsData = evsData.filter(
          (item: any) =>
            // @ts-ignore
            dates[0] <= new Date(item.date) && new Date(item.date) <= dates[1]
        )
      }

      dataLoaded = true
    })

    const waitForData = setInterval(() => {
      if (dataLoaded) {
        clearInterval(waitForData)
        setEventsData(evsData)
        setIsLoading(false)
      }
    }, 100)
  }

  const handleFilterEventByDate = async (dates: [Date | null, Date | null]) => {
    setFilterDate(dates)

    if (dates[0] != null && dates[1] == null) {
      // không làm gì cả
    } else if (dates[0] && dates[1]) {
      setIsLoading(true)
      await getAllEventData(dates)
    } else {
      setIsLoading(true)
      await getAllEventData()
    }
  }

  const toggleAllEventStates = (e: any) => {
    e.preventDefault()

    setAllEventChecked(!allEventChecked)

    setEventsData((prevEvent: any) =>
      prevEvent.map((ev: any) => ({ ...ev, checked: !allEventChecked }))
    )
  }

  const updateEventState = (id: string, value: boolean) => {
    setEventsData((prevEvent: any) =>
      prevEvent.map((ev: any) =>
        ev.id === id ? { ...ev, checked: value } : ev
      )
    )
  }

  const handleQueryOrBack = async () => {
    if (!showResult) {
      const checkedItems = eventsData.filter((item: any) => item.checked)

      if (checkedItems.length == 0) {
        window.SweetAlert.warning(
          '',
          'Vui lòng nhập đủ các thông tin bên trên',
          true
        )
      } else {
        setIsQuerying(true)

        let stList: any = []

        const studentQuery = query(collection(db, 'students'))
        const studentSnapshot = await getDocs(studentQuery)

        if (!studentSnapshot.empty) {
          studentSnapshot.forEach(doc => {
            const data = doc.data()
            stList.push({
              studentId: data.studentId,
              studyClass: data.studyClass
            })
          })
        }

        if (stList.length == 0) {
          window.SweetAlert.error(
            '',
            'Không tìm thấy sinh viên nào. Vui lòng kiểm tra lại dữ liệu đầu vào!',
            true
          )
        } else {
          const resultList: any[] = []

          const classList: any = []
          let seenClass = new Set<string>()
          stList.forEach((student: any) => {
            if (!seenClass.has(student.studyClass)) {
              seenClass.add(student.studyClass)
              classList.push(student.studyClass)
            }
          })

          for (const _class of classList) {
            let result: any = {
              ['Lớp']: _class
            }

            for (const item of checkedItems) {
              let count: number = 0

              const stQuery = query(
                collection(db, 'students'),
                where('studyClass', '==', _class)
              )
              const stSnaps = await getDocs(stQuery)

              if (!stSnaps.empty) {
                for (const doc of stSnaps.docs) {
                  const data = doc.data()

                  const certsCollection = collection(db, 'certs')
                  const certQuery = query(
                    certsCollection,
                    // @ts-ignore
                    where('eventId', '==', item.id),
                    where('studentId', '==', data.studentId)
                  )
                  const certSnapshot = await getDocs(certQuery)
                  if (!certSnapshot.empty) {
                    count++
                  }
                }
              }

              // @ts-ignore
              result[item.title] = count
            }

            resultList.push(result)
          }

          setExcelData(resultList)
          setShowResult(true)
          setIsQuerying(false)
        }
      }
    } else {
      setShowResult(false)
      setExcelData([])
    }
  }

  // Triggers before going to the editing mode.
  const onCellEdit = (args: any) => {
    args.cancel = true
    // Preventing the editing in 5th(Amount) column.
    // if (args.address.includes('E')) { args.cancel = true; }
  }

  const onCreate = () => {
    const spreadsheet = spreadsheetRef.current
    if (spreadsheet) {
      // @ts-ignore
      spreadsheet.freezePanes(1, 1)
      // @ts-ignore
      spreadsheet.cellFormat(
        {
          backgroundColor: '#f46e42',
          color: '#fff',
          fontWeight: 'bold'
        },
        `A1:${getColumnName(Object.keys(excelData[0]).length)}1`
      )
      // @ts-ignore
      spreadsheet.cellFormat(
        { textAlign: 'center' },
        `A1:${getColumnName(Object.keys(excelData[0]).length)}${excelData.length + 1}`
      )
    }
  }

  return (
    <>
      <Title order={2}>Tra cứu số lượng SV theo lớp tham gia sự kiện</Title>
      <Text mb="xl">
        Bạn có thể tra cứu danh sách số lượng sinh viên theo lớp tham gia các sự
        kiện tại đây.
      </Text>

      <Affix position={{ bottom: 80, right: 20 }}>
        <Button
          size="md"
          onClick={handleQueryOrBack}
          loading={isQuerying}
          leftSection={
            !showResult ? <IconSearch size={18} /> : <IconArrowLeft size={18} />
          }
        >
          {!showResult ? 'Tra cứu' : 'Quay lại'}
        </Button>
      </Affix>

      {!showResult ? (
        <Card mb={60} shadow="sm" radius="md" withBorder>
          <Text fw={700}>BỘ LỌC DANH SÁCH</Text>

          <Text mt="md">
            Các sự kiện/hội thảo mà bạn muốn tra cứu (vui lòng chọn ít nhất 1 sự
            kiện)
          </Text>
          {isLoading ? (
            <>
              <Loader mt="md" color="blue" />
            </>
          ) : (
            <>
              <DatePickerInput
                mt="md"
                type="range"
                label="Lọc các sự kiện theo ngày"
                placeholder="DD/MM/YYYY"
                value={filterDate}
                onChange={handleFilterEventByDate}
                valueFormat="DD/MM/YYYY"
                radius="md"
                size="md"
                clearable
                leftSection={<IconCalendarEvent size={18} stroke={1.5} />}
                leftSectionPointerEvents="none"
                disabled={isQuerying}
              />

              <Anchor
                mt="md"
                onClick={e => !isQuerying && toggleAllEventStates(e)}
              >
                Bấm vào đây để {allEventChecked && 'bỏ'} chọn toàn bộ sự
                kiện/hội thảo có bên dưới
              </Anchor>

              <SimpleGrid
                cols={{ base: 1, sm: 2, lg: 4 }}
                spacing={{ base: 'md', sm: 'sm' }}
                verticalSpacing={{ base: 'md', sm: 'sm' }}
              >
                {eventsData.map((ev: any, index) => (
                  <Checkbox
                    mt="xs"
                    label={ev.title}
                    description={
                      <Center inline>
                        <IconCalendarEvent size={18} stroke={1.5} />{' '}
                        {formatDate(ev.date)}
                      </Center>
                    }
                    key={ev.id}
                    checked={ev.checked}
                    onChange={event =>
                      updateEventState(ev.id, event.currentTarget.checked)
                    }
                    disabled={isQuerying}
                  />
                ))}
              </SimpleGrid>
            </>
          )}
        </Card>
      ) : (
        <>
          <SpreadsheetComponent
            ref={spreadsheetRef}
            created={onCreate}
            cellEdit={onCellEdit}
            allowSave={true}
            saveUrl="https://ej2services.syncfusion.com/production/web-services/api/spreadsheet/save"
          >
            <SheetsDirective>
              <SheetDirective name="Danh sách Lớp tham gia">
                {/*frozenColumns={1} frozenRows={1}*/}
                <RangesDirective>
                  <RangeDirective dataSource={excelData} startCell="A1" />
                </RangesDirective>
                <ColumnsDirective>
                  <ColumnDirective width={80} />
                  {Array.from({
                    length: Object.keys(excelData[0]).length - 1
                  }).map((_, index) => (
                    <ColumnDirective key={index} width={120} />
                  ))}
                </ColumnsDirective>
              </SheetDirective>
            </SheetsDirective>
          </SpreadsheetComponent>
        </>
      )}
    </>
  )
}
