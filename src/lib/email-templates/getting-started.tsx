import * as React from 'react'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
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

const previews: { label: string; description: string }[] = [
  {
    label: 'Today',
    description:
      'Sleep, mood, cycle, medications — one calm page. Check in, confirm meds, and see where you are.',
  },
  {
    label: 'Trends',
    description:
      'After a few days, lines start moving together — sleep drops, stress rises, mood follows. You see the shape.',
  },
  {
    label: 'Cycle & Moon',
    description:
      'Your cycle phase alongside the moon, with symptoms logged so you never start from scratch each month.',
  },
]

const memberQuotes = [
  {
    text:
      'I spent years feeling like my body was speaking a language no one would translate. Terra Woman gave me the words. Now I bring the data to my OB instead of guessing at symptoms.',
    attribution: '— Sarah, 34',
  },
  {
    text:
      'I thought I was tracking everything. Turns out sleep, HRV, and cycle data were sitting in three different apps that never talked to each other. Seeing it all in one place showed me patterns I\u2019d been missing for months.',
    attribution: '— Priya, 29',
  },
  {
    text:
      'Every month felt like starting over, no memory of what worked last time. Now I can look back and see the pattern instead of just living through it again.',
    attribution: '— Jamie, 41',
  },
  {
    text:
      'I used to walk into appointments with a mental list I\u2019d half forget. Now I show up with real data. My doctor actually said it changed the conversation.',
    attribution: '— Elena, 37',
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

        <Img
          src="https://terrawoman.org/email/insights-hero.png"
          alt="Terra Woman tree of life"
          width="550"
          style={heroImage}
        />

        <Heading style={h1}>Welcome, {memberName} — let&rsquo;s set up your first week</Heading>

        <Text style={text}>
          You took the first step by joining. Terra Woman becomes truly yours once a little of your
          data starts flowing in — and that only takes a few minutes. Four small steps, no rush:
        </Text>

        {steps.map((s) => (
          <Section key={s.title} style={stepCard}>
            <Text style={stepTitle}>{s.title}</Text>
            <Text style={stepBody}>{s.body}</Text>
          </Section>
        ))}

        <Img
          src="https://terrawoman.org/email/getting-started-today.png"
          alt="Preview of the Today page with sleep, mood and cycle tiles"
          width="550"
          style={heroImage}
        />

        <Text style={eyebrow}>WHAT YOU&rsquo;LL START SEEING</Text>

        {previews.map((p) => (
          <Section key={p.label} style={previewCard}>
            <Text style={previewLabel}>{p.label}</Text>
            <Text style={previewBody}>{p.description}</Text>
          </Section>
        ))}

        <Hr style={hr} />

        <Text style={eyebrow}>WHAT WOMEN ARE NOTICING</Text>

        {memberQuotes.map((q, i) => (
          <Section key={i} style={quoteCard}>
            <Text style={quoteText}>&ldquo;{q.text}&rdquo;</Text>
            <Text style={quoteAttribution}>{q.attribution}</Text>
          </Section>
        ))}

        <Img
          src="https://terrawoman.org/email/getting-started-outcomes.png"
          alt="Cycle, medication and trend cards fanned together"
          width="550"
          style={heroImage}
        />

        <Text style={text}>
          You don&rsquo;t have to do all four steps today. Anything you add starts building your
          picture — and after a few days, patterns, cycle and moon start showing how it all connects.
          Other women are telling us the same thing: seeing it together is what makes it feel real.
        </Text>

        <Button style={button} href={startUrl}>
          Start my first step
        </Button>

        <Text style={footer}>
          You&rsquo;re receiving this because you created a Terra Woman account. Terra Woman is
          private by design — your notes are yours, and never shared without your written consent.
          You can change your email preferences in the app at any time.
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
const heroImage = {
  width: '100%',
  maxWidth: '550px',
  borderRadius: '10px',
  margin: '0 0 22px',
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
  lineHeight: '1.65',
  margin: '0 0 25px',
}
const eyebrow = {
  fontSize: '11px',
  letterSpacing: '2px',
  fontWeight: 'bold' as const,
  color: '#A25D44',
  margin: '0 0 12px',
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
const previewCard = {
  backgroundColor: '#F6F2EB',
  borderLeft: '3px solid #8A967F',
  borderRadius: '8px',
  padding: '14px 16px',
  margin: '0 0 10px',
}
const previewLabel = {
  fontSize: '13px',
  fontWeight: 'bold' as const,
  color: '#2F3A2E',
  margin: '0 0 4px',
}
const previewBody = {
  fontSize: '13px',
  color: '#55604F',
  lineHeight: '1.5',
  margin: '0',
}
const quoteCard = {
  backgroundColor: '#F6F2EB',
  borderLeft: '3px solid #A25D44',
  borderRadius: '8px',
  padding: '14px 16px',
  margin: '0 0 12px',
}
const quoteText = {
  fontSize: '14px',
  lineHeight: '1.6',
  color: '#2F3A2E',
  fontFamily: "Georgia, 'Times New Roman', serif",
  margin: '0 0 8px',
}
const quoteAttribution = {
  fontSize: '11px',
  letterSpacing: '1px',
  color: '#8A8F84',
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
const hr = { borderColor: '#E6DFD3', margin: '28px 0 16px' }
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }
