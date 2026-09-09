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

interface InsightsUpdateProps {
  memberName?: string
  appUrl?: string
  /**
   * Member quotes shown in the email. The defaults below are SAMPLE copy —
   * replace them with real words from real members before a wider send.
   */
  quotes?: { text: string; attribution: string }[]
}

const SAMPLE_QUOTES = [
  {
    text: 'Seeing my sleep and my mood on the same page finally explained a week I thought was just me being difficult.',
    attribution: 'Sample quote — replace with a real member',
  },
  {
    text: 'The cycle view was so validating. I stopped apologising for the days my body needs more.',
    attribution: 'Sample quote — replace with a real member',
  },
  {
    text: 'One tap for my medications, and I can actually see the streak. It made the habit stick.',
    attribution: 'Sample quote — replace with a real member',
  },
]

const InsightsUpdateEmail = ({
  memberName = 'friend',
  appUrl = 'https://terrawoman.org',
  quotes = SAMPLE_QUOTES,
}: InsightsUpdateProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your patterns are starting to speak — see what other women are noticing</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={wordmark}>TERRA WOMAN</Text>

        <Img
          src="https://terrawoman.org/email/insights-hero.png"
          alt="Terra Woman tree of life"
          width="550"
          style={heroImage}
        />

        <Heading style={h1}>Your patterns are starting to speak, {memberName}</Heading>

        <Text style={text}>
          A few small notes a day — sleep, energy, mood, cycle, medications — and after a couple of
          weeks something quietly shifts: you stop guessing. The heavy days have a shape. The good
          ones do too.
        </Text>

        <Img
          src="https://terrawoman.org/email/insights-patterns.png"
          alt="Sleep, mood and cycle lines rising together"
          width="550"
          style={heroImage}
        />

        <Text style={eyebrow}>WHAT WOMEN ARE NOTICING</Text>

        {quotes.map((q, i) => (
          <Section key={i} style={quoteCard}>
            <Text style={quoteText}>&ldquo;{q.text}&rdquo;</Text>
            <Text style={quoteAttribution}>{q.attribution}</Text>
          </Section>
        ))}

        <Text style={text}>
          If you&rsquo;ve only checked in once or twice, this is the gentle nudge: three days in a
          row is usually where it starts to feel like yours.
        </Text>

        <Button style={button} href={`${appUrl}/`}>
          Open Terra Woman
        </Button>

        <Hr style={hr} />

        <Text style={footer}>
          Terra Woman is private by design — your notes are yours, and never shared without your
          written consent. You can change your reminder preferences in the app at any time.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: InsightsUpdateEmail,
  subject: (data: Record<string, any>) =>
    `Your patterns are starting to speak${data['memberName'] ? `, ${data['memberName']}` : ''}`,
  displayName: 'Insights update (member stories)',
  previewData: {
    memberName: 'Michelle',
    appUrl: 'https://terrawoman.org',
  },
} satisfies TemplateEntry

export default InsightsUpdateEmail

const main = {
  backgroundColor: '#ffffff',
  fontFamily: 'Lato, Arial, sans-serif',
}
const container = {
  padding: '28px 25px',
  backgroundColor: '#FDFBF7',
  borderTop: '4px solid #A25D44',
  borderRadius: '8px',
}
const wordmark = {
  fontSize: '12px',
  letterSpacing: '3px',
  color: '#A25D44',
  fontFamily: "Georgia, 'Times New Roman', serif",
  margin: '0 0 18px',
}
const heroImage = {
  width: '100%',
  maxWidth: '550px',
  borderRadius: '10px',
  margin: '0 0 22px',
}
const h1 = {
  fontSize: '24px',
  fontWeight: 'bold' as const,
  color: '#2F3A2E',
  fontFamily: "Georgia, 'Times New Roman', serif",
  lineHeight: '1.25',
  margin: '0 0 16px',
}
const text = {
  fontSize: '15px',
  color: '#55604F',
  lineHeight: '1.65',
  margin: '0 0 24px',
}
const eyebrow = {
  fontSize: '11px',
  letterSpacing: '2px',
  fontWeight: 'bold' as const,
  color: '#A25D44',
  margin: '0 0 12px',
}
const quoteCard = {
  backgroundColor: '#F6F2EB',
  borderLeft: '3px solid #A25D44',
  borderRadius: '8px',
  padding: '14px 16px',
  margin: '0 0 12px',
}
const quoteText = {
  fontSize: '15px',
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
  padding: '12px 22px',
  textDecoration: 'none',
}
const hr = { borderColor: '#E6DFD3', margin: '30px 0 16px' }
const footer = { fontSize: '12px', color: '#999999', margin: '0' }
