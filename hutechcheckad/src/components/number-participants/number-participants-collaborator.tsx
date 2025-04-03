import {
  Center,
  Group,
  Loader,
  rem,
  Text,
  useMantineTheme
} from '@mantine/core'
import { IconUserCheck, IconUserPlus } from '@tabler/icons-react'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { useEffect, useState } from 'react'

import { db } from '@/firebase'

import classes from './number-participants-collaborator.module.css'

export const NumberParticipantsCollaborator = ({
  docId
}: {
  docId: string
}) => {
  const theme = useMantineTheme()

  const [isLoading, setIsLoading] = useState(false)
  const [checkinLength, setCheckinLength] = useState<number>(0)
  const [checkoutLength, setCheckoutLength] = useState<number>(0)

  useEffect(() => {
    setIsLoading(true)
    getEventCheckin()
  }, [])

  const getEventCheckin = async () => {
    const docsRef = query(
      collection(db, 'certs'),
      where('eventId', '==', docId)
    )
    const docsSnap = await getDocs(docsRef)

    setCheckinLength(docsSnap.size)
    let checkoutLen = 0

    docsSnap.forEach((doc: any) => {
      const docData = doc.data()
      if (docData.checkoutAt !== '') {
        checkoutLen++
      }
    })

    setCheckoutLength(checkoutLen)
    setIsLoading(false)
  }

  return (
    <>
      {isLoading ? (
        <Loader color="blue" size="xs" mr="xs" />
      ) : (
        <>
          <Group gap="lg">
            <Center>
              <IconUserPlus
                style={{ width: rem(16), height: rem(16) }}
                stroke={1.5}
                color={theme.colors.dark[2]}
              />
              <Text size="sm" className={classes.bodyText}>
                {checkinLength}
              </Text>
            </Center>
            <Center>
              <IconUserCheck
                style={{ width: rem(16), height: rem(16) }}
                stroke={1.5}
                color={theme.colors.dark[2]}
              />
              <Text size="sm" className={classes.bodyText}>
                {checkoutLength}
              </Text>
            </Center>
          </Group>
        </>
      )}
    </>
  )
}
