import { Group, Image, Loader, SelectProps, Text } from '@mantine/core'
import { IconCheck } from '@tabler/icons-react'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { useEffect, useState } from 'react'

import { db } from '@/firebase'

export const SelectTemplate: SelectProps['renderOption'] = ({
  option: template,
  checked
}) => {
  const [isLoading, setIsLoading] = useState(false)
  const [title, setTitle] = useState('')
  const [image, setImage] = useState('')

  useEffect(() => {
    setIsLoading(true)
    findTemplate(template.label)
  }, [])

  const findTemplate = async (title: string) => {
    const docRef = query(
      collection(db, 'templates'),
      where('title', '==', title)
    )
    const docsSnap = await getDocs(docRef)
    const docData = docsSnap.docs[0].data()

    setTitle(docData.title)
    setImage(docData.image)
    setIsLoading(false)
  }

  return (
    <>
      {isLoading ? (
        <Loader color="blue" />
      ) : (
        <Group flex="1" gap="sm">
          <Image radius="xs" h={35} src={image} />
          <Text size="sm">{title}</Text>
          {checked && <IconCheck style={{ marginInlineStart: 'auto' }} />}
        </Group>
      )}
    </>
  )
}
