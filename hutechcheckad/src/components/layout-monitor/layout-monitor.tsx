import {
  ActionIcon,
  AppShell,
  Burger,
  Center,
  Divider,
  Group,
  ScrollArea,
  Text,
  useComputedColorScheme,
  useMantineColorScheme
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { modals } from '@mantine/modals'
import { IconLogout, IconMoon, IconSun } from '@tabler/icons-react'
import axios from 'axios'
import cx from 'clsx'
import { useDispatch, useSelector } from 'react-redux'

import { REMOVE_ACTIVE_AUTH_MONITOR, selectMonitorFullName } from '@/redux'
import {
  getFromLocalStorage,
  MONITOR_API_URL,
  removeFromLocalStorage
} from '@/utils'

import { Navbar } from './_navbar'
import classes from './layout-monitor.module.css'

export function LayoutMonitor({ children }: { children: React.ReactNode }) {
  const [opened, { toggle }] = useDisclosure()
  const { setColorScheme } = useMantineColorScheme()
  const computedColorScheme = useComputedColorScheme('light', {
    getInitialValueInEffect: true
  })

  const dispatch = useDispatch()

  const fullName = useSelector(selectMonitorFullName)

  const handleLogout = () => {
    modals.openConfirmModal({
      title: 'Đăng xuất',
      children: <Text>Bạn có chắc chắn muốn đăng xuất không?</Text>,
      labels: { confirm: 'Đăng xuất', cancel: 'Đóng' },
      confirmProps: { color: 'red' },
      onCancel: () => {},
      onConfirm: async () => {
        const token = getFromLocalStorage('use-state')
        try {
          const res = await axios.post(
            `${MONITOR_API_URL}/logout`,
            {
              token: token.refreshToken
            },
            {
              headers: {
                'Content-Type': 'application/json'
              }
            }
          )
          if (res.status == 200) {
            removeFromLocalStorage('use-state')
            // @ts-ignore
            dispatch(REMOVE_ACTIVE_AUTH_MONITOR())
            window.location.reload()
          }
        } catch (e: any) {
          window.SweetAlert.error('', 'Đăng xuất thất bại!', true)
        }
      }
    })
  }

  return (
    <AppShell
      header={{ height: 60 }}
      footer={{ height: 60 }}
      navbar={{ width: 300, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
          <Text fw={700} size="xl">
            BCS Lớp
          </Text>
          <ActionIcon
            onClick={() =>
              setColorScheme(computedColorScheme === 'light' ? 'dark' : 'light')
            }
            variant="default"
            size="xl"
            aria-label="Toggle color scheme"
          >
            <IconSun className={cx(classes.icon, classes.light)} stroke={1.5} />
            <IconMoon className={cx(classes.icon, classes.dark)} stroke={1.5} />
          </ActionIcon>
        </Group>
      </AppShell.Header>
      <AppShell.Navbar p="md">
        <AppShell.Section>
          {fullName}
          <Divider mt="sm" />
        </AppShell.Section>
        <AppShell.Section grow my="md" component={ScrollArea}>
          <Navbar />
        </AppShell.Section>
        <AppShell.Section>
          <Divider mb="sm" />
          <a className={classes.link} onClick={handleLogout}>
            <IconLogout className={classes.linkIcon} stroke={1.5} color="red" />
            <span>Đăng xuất</span>
          </a>
        </AppShell.Section>
      </AppShell.Navbar>
      <AppShell.Main>{children}</AppShell.Main>
      <AppShell.Footer p="md">
        <Center>&copy; Xây dựng bởi HĐK Team.</Center>
      </AppShell.Footer>
    </AppShell>
  )
}
