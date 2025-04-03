import { Button, Container, Text, Title } from '@mantine/core'
import { IconSchool, IconTable } from '@tabler/icons-react'

import { Dots } from '@/components'

import classes from './home.module.css'

export const Home = () => {
  //

  return (
    <Container className={classes.wrapper} size={1400}>
      <Dots className={classes.dots} style={{ left: 0, top: 0 }} />
      <Dots className={classes.dots} style={{ left: 60, top: 0 }} />
      <Dots className={classes.dots} style={{ left: 0, top: 140 }} />
      <Dots className={classes.dots} style={{ right: 0, top: 60 }} />

      <div className={classes.inner}>
        <Title className={classes.title}>
          Hệ thống quản lý{' '}
          <Text component="span" className={classes.highlight} inherit>
            Hoạt động sinh viên
          </Text>
        </Title>

        <Container p={0} size={600}>
          <Text size="lg" c="dimmed" className={classes.description}>
            Hệ thống quản lý dành cho Ban cán sự Lớp dùng thống kê hoạt động{' '}
            tham gia sự kiện của lớp và hoạt động Tập thể sinh viên tiên tiến.
          </Text>
        </Container>

        <div className={classes.controls}>
          <Button
            component="a"
            href="/#/my-class"
            className={classes.control}
            size="lg"
            variant="default"
            color="gray"
            leftSection={<IconSchool stroke={1.5} />}
          >
            Danh sách lớp
          </Button>
          <Button
            component="a"
            href="/#/activities"
            className={classes.control}
            size="lg"
            leftSection={<IconTable stroke={1.5} />}
          >
            Thống kê
          </Button>
        </div>
      </div>
    </Container>
  )
}
