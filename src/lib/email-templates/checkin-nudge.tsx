import * as React from 'react'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
} from '@react-email/components'

import type { TemplateEntry } from './registry'

interface CheckinNudgeProps {
  memberName?: string
  checkinUrl?: string
}

const CheckinNudgeEmail = ({
  memberName = 'friend',
  checkinUrl = 'https://terra-woman.lovable.app/today',
}: CheckinNudgeProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>A gentle nudge — how are you feeling today, {memberName}?</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={wordmark}>TERRA WOMAN</Text>
        <Heading style={h1}>A moment for you, {memberName}</Heading>
        <Text style={text}>
          Your daily check-in takes less than a minute — a quiet pause to notice
          your energy, mood, and how your body feels today. Small notes, over
          time, become your story.
        </Text>
        <Button style={button} href={checkinUrl}>
          Check in now
        </Button>
        <Text style={footer}>
          You're receiving this because you asked for email check-in reminders
          in Terra Woman. You can change your reminder preferences in the app at
          any time.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: CheckinNudgeEmail,
  subject: (data: Record<string, any>) =>
    `A moment for you${data.memberName ? `, ${data.memberName}` : ''} — your daily check-in`,
  displayName: 'Daily check-in nudge',
  previewData: {
    memberName: 'Michelle',
    checkinUrl: 'https://terra-woman.lovable.app/today',
  },
} satisfies TemplateEntry

export default CheckinNudgeEmail

const wordmark = {
  fontSize: '12px',
  letterSpacing: '3px',
  color: '#A25D44',
  fontFamily: "Georgia, 'Times New Roman', serif",
  margin: '0 0 18px',
}
const main = {
  backgroundColor: '#F6F2EB',
  fontFamily: "Lato, Arial, sans-serif",
}
const container = {
  padding: '28px 25px',
  backgroundColor: '#FDFBF7',
  borderTop: '4px solid #A25D44',
  borderRadius: '8px',
}
const h1 = {
  fontSize: '22px',
  fontWeight: 'bold' as const,
  color: '#2F3A2E',
  fontFamily: "Georgia, 'Times New Roman', serif",
  margin: '0 0 20px',
}
const text = {
  fontSize: '14px',
  color: '#55604F',
  lineHeight: '1.6',
  margin: '0 0 25px',
}
const button = {
  backgroundColor: '#A25D44',
  color: '#ffffff',
  fontSize: '14px',
  border: '1px solid #A25D44',
  borderRadius: '8px',
  padding: '12px 20px',
  textDecoration: 'none',
}
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }
