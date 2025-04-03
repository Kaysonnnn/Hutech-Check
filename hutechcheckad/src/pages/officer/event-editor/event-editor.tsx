import {
  Button,
  Card,
  Center,
  Fieldset,
  Group,
  Image as MantineImage,
  Loader,
  MultiSelect,
  Progress,
  rem,
  Select,
  Switch,
  Text,
  Textarea,
  TextInput,
  Title,
  useMantineTheme
} from '@mantine/core'
import { DateTimePicker } from '@mantine/dates'
import { Dropzone, IMAGE_MIME_TYPE } from '@mantine/dropzone'
import { Link, RichTextEditor } from '@mantine/tiptap'
import {
  IconBuildingCommunity,
  IconCalendarEvent,
  IconCheck,
  IconDoor,
  IconPhoto,
  IconSparkles,
  IconTag,
  IconUpload,
  IconX
} from '@tabler/icons-react'
import { Color } from '@tiptap/extension-color'
import Highlight from '@tiptap/extension-highlight'
import Placeholder from '@tiptap/extension-placeholder'
import SubScript from '@tiptap/extension-subscript'
import Superscript from '@tiptap/extension-superscript'
import TextAlign from '@tiptap/extension-text-align'
import TextStyle from '@tiptap/extension-text-style'
import Underline from '@tiptap/extension-underline'
import { useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import cx from 'clsx'
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  Timestamp,
  updateDoc,
  where
} from 'firebase/firestore'
import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage'
import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate, useParams } from 'react-router-dom'

import { AI_PROMPT, chatSession } from '@/ai'
import { MultiSelectLabel, SelectTemplate } from '@/components'
import { db, storage } from '@/firebase'
import { useFetchCollection } from '@/hooks'
import { Event as EventModel } from '@/models'
import { selectRoleName } from '@/redux'
import {
  formatDateTime,
  getMegabyte,
  ImageUrlUtils,
  ImageUtils,
  uuidv4
} from '@/utils'

import classes from './event-editor.module.css'

export const EventEditor = () => {
  const theme = useMantineTheme()

  // It is required to extend dayjs with customParseFormat plugin
  // in order to parse dates with custom format
  dayjs.extend(customParseFormat)

  const { id } = useParams()

  function detectForm(id: any, f1: any, f2: any) {
    if (id == null || id == 'add') {
      return f1
    }
    return f2
  }

  const { data: hostsList } = useFetchCollection('hosts')
  const { data: labelsList } = useFetchCollection('labels')
  const { data: templatesList } = useFetchCollection('templates')

  const roleName = useSelector(selectRoleName)

  const [formIsLoading, setFormIsLoading] = useState(false)
  const [isGettingData, setIsGettingData] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [posterType, setPosterType] = useState(0) // 0: square, 1: landscape, 2: portrait
  const [poster, setPoster] = useState('')
  const [title, setTitle] = useState('')
  const [tempTitle, setTempTitle] = useState('')
  const [summary, setSummary] = useState('')
  const [description, setDescription] = useState('')
  const [host, setHost] = useState<string | null>('')
  const [labels, setLabels] = useState<string[]>([])
  const [eventDate, setEventDate] = useState<Date | null>(null)
  const [room, setRoom] = useState('')
  const [template, setTemplate] = useState<string | null>('')
  const [allowExport, setAllowExport] = useState(true)
  const [allowCheckin, setAllowCheckin] = useState(true)
  const [display, setDisplay] = useState(true)

  const [isGenerating, setIsGenerating] = useState(false)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link,
      Superscript,
      SubScript,
      Highlight,
      TextStyle,
      Color,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ placeholder: 'Mô tả chi tiết về sự kiện...' })
    ],
    content: description,
    onUpdate({ editor }) {
      setDescription(editor.getHTML())
    }
  })

  const navigate = useNavigate()

  const redirectToEvents = () => {
    navigate('/events')
  }

  useEffect(() => {
    if (id != null && id != 'add') {
      setIsGettingData(true)
      getEventDataFromId(id)
    }
  }, [])

  useEffect(() => {
    if (editor) {
      editor.commands.setContent(description)
    }
  }, [editor, description])

  const getEventDataFromId = async (id: string) => {
    const eventRef = doc(db, 'events', id)
    const eventSnap = await getDoc(eventRef)

    if (eventSnap.exists()) {
      const eventData = eventSnap.data()

      setTitle(eventData.title)
      setTempTitle(eventData.title)
      setLabels(eventData.labels)

      if (eventData.poster != null && eventData.poster != '') {
        const imageType = new ImageUrlUtils()
        if (await imageType.isSquare(eventData.poster)) {
          setPosterType(0)
        } else if (await imageType.isLandscape(eventData.poster)) {
          setPosterType(1)
        } else if (await imageType.isPortrait(eventData.poster)) {
          setPosterType(2)
        }
        setPoster(eventData.poster)
      }

      setSummary(eventData.summary || '')
      setDescription(eventData.description || '')
      setEventDate(new Date(eventData.date))
      setRoom(eventData.room)
      setHost(eventData.host)
      setTemplate(eventData.template)
      setAllowExport(eventData.allowExport)
      setAllowCheckin(eventData.allowCheckin)
      setDisplay(eventData.display)

      setIsGettingData(false)
    } else {
      window.SweetAlert.info(
        'Lỗi tìm nạp',
        'Không tìm thấy các thông tin về sự kiện này!',
        false
      )
      redirectToEvents()
    }
  }

  const handleImageChange = async (files: any) => {
    setIsUploading(true)
    try {
      const file = files[0]

      const imageType = new ImageUtils()
      if (await imageType.isSquare(file)) {
        setPosterType(0)
      } else if (await imageType.isLandscape(file)) {
        setPosterType(1)
      } else if (await imageType.isPortrait(file)) {
        setPosterType(2)
      }

      const storageRef = ref(storage, `events/${Date.now()}-${file.name}`) // Tạo tham chiếu đến đường dẫn lưu hình ảnh
      const uploadTask = uploadBytesResumable(storageRef, file) // Tạo tác vụ tải hình ảnh lên đám mây

      // Lắng nghe sự kiện thay đổi tiến trình tải hình ảnh
      uploadTask.on(
        'state_changed',
        snapshot => {
          // Xử lý tiến trình tải hình ảnh
          const progress = Math.round(
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100 // Tính phần trăm tiến trình tải hình ảnh
          )
          setUploadProgress(progress) // Cập nhật tiến trình tải hình ảnh
        },
        error => {
          // Xử lý lỗi tải hình ảnh
          setIsUploading(false)
          window.SweetAlert.error(
            'Lỗi lưu hình ảnh',
            `Không thể lưu hình ảnh lên đám mây! Vui lòng thử lại!<br/>${error.message}`,
            false
          )
        },
        () => {
          // Xử lý khi tải hình ảnh lên đám mây thành công
          getDownloadURL(uploadTask.snapshot.ref).then(downloadURL => {
            setPoster(downloadURL) // Cập nhật đường dẫn hình ảnh
            setIsUploading(false)
            window.SweetAlert.success(
              'Lưu hình ảnh',
              'Tải hình ảnh lên đám mây thành công',
              true
            )
          })
        }
      )
    } catch (error: any) {
      // Xử lý lỗi
      setIsUploading(false)
      window.SweetAlert.error(
        'Lỗi nhận hình ảnh',
        `Không thể nhận hình ảnh! Vui lòng thử lại!<br/>${error.message}`,
        false
      )
    }
  }

  const checkExistEvent = async () => {
    const docRef = query(collection(db, 'events'), where('title', '==', title))
    const docsSnap = await getDocs(docRef)

    return docsSnap.empty
  }

  const handleAddEvent = async (e: any) => {
    e.preventDefault()

    setFormIsLoading(true)

    const notExistEvent = await checkExistEvent()

    if (notExistEvent) {
      const genDocId = uuidv4()
      const event = new EventModel(
        title,
        host,
        labels,
        eventDate,
        room,
        template,
        allowExport,
        allowCheckin,
        display,
        poster,
        summary,
        description
      )
      await setDoc(doc(db, 'events', genDocId), {
        // @ts-ignore
        ...event.toEditorJson(),
        createdAt: Timestamp.now().toDate()
      })
      setFormIsLoading(false)
      window.SweetAlert.success(
        'Thêm sự kiện',
        `Đã thêm sự kiện "${title}" thành công!`,
        false
      )
    } else {
      setFormIsLoading(false)
      window.SweetAlert.error('Lỗi', 'Sự kiện này đã tồn tại.', false)
    }
  }

  const editEvent = async (e: any) => {
    e.preventDefault()

    setFormIsLoading(true)

    if (title == tempTitle) {
      await handleUpdateEvent()
    } else {
      const notExistEvent = await checkExistEvent()

      if (notExistEvent) {
        await handleUpdateEvent()
      } else {
        setFormIsLoading(false)
        window.SweetAlert.error('Lỗi', `Đã tồn tại sự kiện "${title}"`, false)
      }
    }
  }

  const handleUpdateEvent = async () => {
    const event = new EventModel(
      title,
      host,
      labels,
      eventDate,
      room,
      template,
      allowExport,
      allowCheckin,
      display,
      poster,
      summary,
      description
    )
    await updateDoc(doc(db, 'events', id!), {
      // @ts-ignore
      ...event.toEditorJson(),
      editedAt: Timestamp.now().toDate()
    })
    setFormIsLoading(false)
    window.SweetAlert.success(
      'Sửa sự kiện',
      `Đã cập nhật sự kiện "${tempTitle}" thành công!`,
      false
    )
    redirectToEvents()
  }

  const GenerateAIContent = async () => {
    if (title != '' && eventDate != null && room != '') {
      setIsGenerating(true)

      const FINAL_PROMPT = AI_PROMPT.replace('{event_title}', title)
        .replace('{event_date}', formatDateTime(eventDate, 'lúc'))
        .replace('{event_room}', room)

      const result = await chatSession.sendMessage(FINAL_PROMPT)
      setSummary(JSON.parse(result!.response!.text()).summary)
      setDescription(JSON.parse(result!.response!.text()).description)

      setIsGenerating(false)
    } else {
      window.SweetAlert.warning(
        '',
        'Vui lòng cung cấp đầy đủ thông tin bao gồm tiêu đề sự kiện, ngày và nơi diễn ra',
        true
      )
    }
  }

  return (
    <>
      <Title order={2}>Trình tạo sự kiện</Title>
      <Text>
        Trình chỉnh sửa này giúp bạn có thể thêm các thông tin chi tiết về sự
        kiện như Poster, mô tả, và nhiều hơn nữa.
      </Text>

      <Card
        my="lg"
        shadow="sm"
        radius="md"
        withBorder
        style={{ overflow: 'unset' }} // set overflow is unset to work with Rich Text Editor
      >
        {isGettingData ? (
          <>
            <Center>
              <Loader color="blue" size="md" />
            </Center>
          </>
        ) : (
          <form onSubmit={detectForm(id, handleAddEvent, editEvent)}>
            <Dropzone
              my="md"
              onDrop={files => handleImageChange(files)}
              onReject={files => {
                window.SweetAlert.error(
                  'Đính kèm không hợp lệ',
                  `Vui lòng đính kèm 1 Poster duy nhất và có kích thước <b>không quá 5MB</b>.`,
                  false
                )
              }}
              maxSize={getMegabyte(5)}
              accept={IMAGE_MIME_TYPE}
              multiple={false}
              loading={uploadProgress > 0 && uploadProgress < 100}
              disabled={formIsLoading}
            >
              <Group
                justify="center"
                gap="xl"
                mih={220}
                style={{ pointerEvents: 'none' }}
              >
                <Dropzone.Accept>
                  <IconUpload
                    style={{
                      width: rem(52),
                      height: rem(52),
                      color: 'var(--mantine-color-blue-6)'
                    }}
                    stroke={1.5}
                  />
                </Dropzone.Accept>
                <Dropzone.Reject>
                  <IconX
                    style={{
                      width: rem(52),
                      height: rem(52),
                      color: 'var(--mantine-color-red-6)'
                    }}
                    stroke={1.5}
                  />
                </Dropzone.Reject>
                <Dropzone.Idle>
                  <IconPhoto
                    style={{
                      width: rem(52),
                      height: rem(52),
                      color: 'var(--mantine-color-dimmed)'
                    }}
                    stroke={1.5}
                  />
                </Dropzone.Idle>

                <div>
                  <Text size="xl" inline>
                    Kéo thả hoặc nhấn để chọn Poster
                  </Text>
                  <Text size="sm" c="dimmed" inline mt={7}>
                    Poster phải có kích thước <b>không quá 5MB</b>.
                  </Text>
                </div>
              </Group>
            </Dropzone>

            {isUploading && (
              <Progress.Root size="xl">
                <Progress.Section value={uploadProgress}>
                  <Progress.Label>{uploadProgress.toFixed()}%</Progress.Label>
                </Progress.Section>
              </Progress.Root>
            )}

            {poster !== '' && (
              <>
                {posterType === 0 ? (
                  <MantineImage
                    mt="md"
                    src={poster}
                    alt="Event Poster"
                    maw={400}
                    mx="auto"
                  />
                ) : posterType === 1 ? (
                  <MantineImage
                    mt="md"
                    src={poster}
                    alt="Event Poster"
                    maw={700}
                    mx="auto"
                  />
                ) : (
                  <MantineImage
                    mt="md"
                    src={poster}
                    alt="Event Poster"
                    mah={500}
                    mx="auto"
                    style={{ width: 'auto', maxWidth: '100%' }}
                  />
                )}
              </>
            )}

            <TextInput
              mt="md"
              label="Tiêu đề"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
              radius="md"
              disabled={formIsLoading}
            />

            <Fieldset
              mt="md"
              legend="Mô tả"
              radius="md"
              disabled={isGenerating || formIsLoading}
            >
              <Button
                className={cx(classes.geminiButton)}
                onClick={GenerateAIContent}
                leftSection={<IconSparkles size={24} stroke={1.5} />}
                loading={isGenerating}
              >
                Tạo mô tả với AI
              </Button>

              <Textarea
                mt="md"
                radius="md"
                label="Tóm tắt"
                value={summary}
                onChange={event => setSummary(event.currentTarget.value)}
                autosize
                minRows={3}
                maxRows={3}
                resize="vertical"
              />

              <RichTextEditor mt="md" editor={editor}>
                <RichTextEditor.Toolbar sticky={true} stickyOffset={60}>
                  <RichTextEditor.ControlsGroup>
                    <RichTextEditor.Bold />
                    <RichTextEditor.Italic />
                    <RichTextEditor.Underline />
                    <RichTextEditor.Strikethrough />
                    <RichTextEditor.ClearFormatting />
                    <RichTextEditor.Highlight />
                    <RichTextEditor.Code />
                  </RichTextEditor.ControlsGroup>

                  <RichTextEditor.ControlsGroup>
                    <RichTextEditor.H1 />
                    <RichTextEditor.H2 />
                    <RichTextEditor.H3 />
                    <RichTextEditor.H4 />
                  </RichTextEditor.ControlsGroup>

                  <RichTextEditor.ColorPicker
                    colors={[
                      '#25262b',
                      '#868e96',
                      '#fa5252',
                      '#e64980',
                      '#be4bdb',
                      '#7950f2',
                      '#4c6ef5',
                      '#228be6',
                      '#15aabf',
                      '#12b886',
                      '#40c057',
                      '#82c91e',
                      '#fab005',
                      '#fd7e14'
                    ]}
                  />

                  <RichTextEditor.UnsetColor />

                  <RichTextEditor.ControlsGroup>
                    <RichTextEditor.Blockquote />
                    <RichTextEditor.Hr />
                    <RichTextEditor.BulletList />
                    <RichTextEditor.OrderedList />
                    <RichTextEditor.Subscript />
                    <RichTextEditor.Superscript />
                  </RichTextEditor.ControlsGroup>

                  <RichTextEditor.ControlsGroup>
                    <RichTextEditor.Link />
                    <RichTextEditor.Unlink />
                  </RichTextEditor.ControlsGroup>

                  <RichTextEditor.ControlsGroup>
                    <RichTextEditor.AlignLeft />
                    <RichTextEditor.AlignCenter />
                    <RichTextEditor.AlignJustify />
                    <RichTextEditor.AlignRight />
                  </RichTextEditor.ControlsGroup>

                  <RichTextEditor.ControlsGroup>
                    <RichTextEditor.Undo />
                    <RichTextEditor.Redo />
                  </RichTextEditor.ControlsGroup>
                </RichTextEditor.Toolbar>

                <RichTextEditor.Content />
              </RichTextEditor>
            </Fieldset>
            <MultiSelect
              mt="md"
              label="Chủ đề"
              data={
                labelsList.map((label: any) => {
                  return { value: label.id, label: label.name }
                }) || []
              }
              renderOption={MultiSelectLabel}
              value={labels}
              onChange={setLabels}
              clearable
              searchable
              nothingFoundMessage="Không tìm thấy chủ đề này..."
              hidePickedOptions
              comboboxProps={{
                transitionProps: { transition: 'scale-y', duration: 200 }
              }}
              radius="md"
              leftSection={<IconTag size={18} stroke={1.5} />}
              disabled={formIsLoading}
            />
            <Group grow mt="md">
              <DateTimePicker
                label="Thời gian diễn ra"
                placeholder="Chọn ngày, giờ..."
                value={eventDate}
                onChange={setEventDate}
                valueFormat="DD/MM/YYYY HH:mm"
                required
                radius="md"
                leftSection={<IconCalendarEvent size={18} stroke={1.5} />}
                leftSectionPointerEvents="none"
                disabled={formIsLoading}
              />
              <TextInput
                label="Nơi diễn ra"
                value={room}
                onChange={e => setRoom(e.target.value)}
                radius="md"
                leftSection={<IconDoor size={18} stroke={1.5} />}
                disabled={formIsLoading}
              />
            </Group>
            <Group grow mt="md">
              <Select
                label="Đơn vị tổ chức"
                data={
                  (roleName === 'Quản trị viên' || roleName === 'Cộng tác viên'
                    ? hostsList.map((host: any) => {
                        return { value: host.hostId, label: host.name }
                      })
                    : hostsList
                        .filter((host: any) => host.name === roleName)
                        .map((host: any) => {
                          return { value: host.hostId, label: roleName }
                        })) || []
                }
                value={host}
                onChange={setHost}
                required
                limit={5}
                searchable
                nothingFoundMessage="Không tìm thấy đơn vị này..."
                comboboxProps={{
                  transitionProps: { transition: 'scale-y', duration: 200 }
                }}
                radius="md"
                leftSection={<IconBuildingCommunity size={18} stroke={1.5} />}
                disabled={formIsLoading}
              />
              <Select
                label="Mẫu giấy chứng nhận"
                data={
                  templatesList.map((template: any) => {
                    return { value: template.id, label: template.title }
                  }) || []
                }
                renderOption={SelectTemplate}
                value={template}
                onChange={setTemplate}
                required
                clearable
                limit={5}
                searchable
                nothingFoundMessage="Không tìm thấy mẫu này..."
                comboboxProps={{
                  transitionProps: { transition: 'scale-y', duration: 200 }
                }}
                radius="md"
                leftSection={<IconPhoto size={18} stroke={1.5} />}
                disabled={formIsLoading}
              />
            </Group>
            <Switch
              mt="md"
              checked={allowExport}
              onChange={event => setAllowExport(event.currentTarget.checked)}
              color="teal"
              label="Cho phép xuất giấy chứng nhận"
              disabled
              onLabel="Bật"
              offLabel="Tắt"
              thumbIcon={
                allowExport ? (
                  <IconCheck
                    style={{ width: rem(12), height: rem(12) }}
                    color={theme.colors.teal[6]}
                    stroke={3}
                  />
                ) : (
                  <IconX
                    style={{ width: rem(12), height: rem(12) }}
                    color={theme.colors.red[6]}
                    stroke={3}
                  />
                )
              }
            />
            <Switch
              mt="md"
              checked={allowCheckin}
              onChange={event => setAllowCheckin(event.currentTarget.checked)}
              color="teal"
              label="Cho phép check-in sự kiện này"
              onLabel="Bật"
              offLabel="Tắt"
              thumbIcon={
                allowCheckin ? (
                  <IconCheck
                    style={{ width: rem(12), height: rem(12) }}
                    color={theme.colors.teal[6]}
                    stroke={3}
                  />
                ) : (
                  <IconX
                    style={{ width: rem(12), height: rem(12) }}
                    color={theme.colors.red[6]}
                    stroke={3}
                  />
                )
              }
              disabled={formIsLoading}
            />
            <Button
              my="lg"
              color="green"
              fullWidth
              type="submit"
              loading={formIsLoading}
            >
              {detectForm(id, 'Tạo sự kiện', 'Cập nhật sự kiện')}
            </Button>
          </form>
        )}
      </Card>
    </>
  )
}
