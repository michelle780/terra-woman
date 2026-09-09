import * as React from 'react'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'

import type { TemplateEntry } from './registry'

interface GettingStartedProps {
  memberName?: string
  startUrl?: string
}

const steps: { title: string; body: string }[] = [
  {
    title: '1. Connect your ring or watch',
    body: 'Link Oura, or add your Apple Watch numbers by hand — sleep, HRV and readiness start filling in.',
  },
  {
    title: '2. Do your first check-in',
    body: 'Ten quick sliders on how you feel today. This is what makes the patterns show up later.',
  },
  {
    title: '3. Add your medications',
    body: 'Set them up once, then it is one tap a day to confirm you took them.',
  },
  {
    title: '4. Log your cycle',
    body: 'Add your last period — leave the end date blank if it is still going.',
  },
]

const GettingStartedEmail = ({
  memberName = 'friend',
  startUrl = 'https://terrawoman.org',
}: GettingStartedProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>
      You joined Terra Woman — here are the four small steps to your first week, {memberName}.
    </Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={wordmark}>TERRA WOMAN</Text>
        <Heading style={h1}>Welcome, {memberName} — let's set up your first week</Heading>
        <Text style={text}>
          You took the first step by joining. Terra Woman becomes truly yours
          once a little of your data starts flowing in — and that only takes a
          few minutes. Four small steps, no rush:
        </Text>
        {steps.map((s) => (
          <Section key={s.title} style={stepCard}>
            <Text style={stepTitle}>{s.title}</Text>
            <Text style={stepBody}>{s.body}</Text>
          </Section>
        ))}
        <Text style={text}>
          You don't have to do them all today. Anything you add starts building
          your picture — and after a few days, Trends, Cycle and Moon start
          showing how it all connects.
        </Text>
        <Button style={button} href={startUrl}>
          Start my first step
        </Button>
        <Text style={footer}>
          You're receiving this because you created a Terra Woman account. You
          can change your email preferences in the app at any time.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: GettingStartedEmail,
  subject: (data: Record<string, any>) =>
    `Welcome${data['memberName'] ? `, ${data['memberName']}` : ''} — four small steps to your first week`,
  displayName: 'Getting started (no connections yet)',
  previewData: {
    memberName: 'Michelle',
    startUrl: 'https://terrawoman.org',
  },
} satisfies TemplateEntry

export default GettingStartedEmail

const wordmark = {
  fontSize: '12px',
  letterSpacing: '3px',
  color: '#A25D44',
  fontFamily: "Georgia, 'Times New Roman', serif",
  margin: '0 0 18px',
}
const main = {
  backgroundColor: '#F6F2EB',
  fontFamily: 'Lato, Arial, sans-serif',
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
const stepCard = {
  backgroundColor: '#F6F2EB',
  borderRadius: '10px',
  padding: '12px 16px',
  marginBottom: '10px',
}
const stepTitle = {
  fontSize: '14px',
  fontWeight: 'bold' as const,
  color: '#2F3A2E',
  margin: '0 0 4px',
}
const stepBody = {
  fontSize: '13px',
  color: '#55604F',
  lineHeight: '1.5',
  margin: '0',
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
