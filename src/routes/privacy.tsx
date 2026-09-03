import { createFileRoute } from "@tanstack/react-router";
import {
  LegalLayout,
  LegalSection,
  LegalP,
  LegalUl,
  LegalContact,
} from "@/components/LegalLayout";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Pulse wellness tracker" },
      {
        name: "description",
        content:
          "How Pulse collects, uses and protects your sleep, readiness, HRV, medication and journal data.",
      },
      { property: "og:title", content: "Privacy Policy — Pulse wellness tracker" },
      {
        property: "og:description",
        content:
          "How Pulse collects, uses and protects your personal wellness and health data.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PrivacyPage,
});

const UPDATED = "September 3, 2026";

function PrivacyPage() {
  return (
    <LegalLayout
      title="Privacy Policy"
      updated={UPDATED}
      intro="Pulse is a personal wellness log. This policy explains what information we collect when you use Pulse, how we use it, and the choices you have. Pulse is not a medical device and does not provide medical advice."
    >
      <LegalSection n={1} title="Information we collect">
        <LegalP>
          We collect only the information you provide or choose to sync into Pulse:
        </LegalP>
        <LegalUl>
          <li>
            <strong>Account information</strong> — your email address and an
            authentication identifier, used to sign you in. If you sign in with
            Google, Google shares the information it returns to us (typically
            your name and email).
          </li>
          <li>
            <strong>Wellness metrics</strong> — sleep minutes and score,
            readiness, heart rate variability (HRV), resting heart rate, and
            step counts that you enter manually or, in the future, that we
            import from linked devices such as an Oura ring or Apple Watch.
          </li>
          <li>
            <strong>Medication information</strong> — the medication name, dose,
            scheduled time, and the dates you mark a medication as taken.
          </li>
          <li>
            <strong>Journal entries</strong> — your self-reported mood, energy
            level, symptoms, and free-text notes for a given day.
          </li>
          <li>
            <strong>Device connections</strong> — which provider you have linked
            and the last sync time. We do not store the underlying device
            credentials in your account.
          </li>
        </LegalUl>
        <LegalP>
          We do not collect precise location, contacts, or browsing history.
        </LegalP>
      </LegalSection>

      <LegalSection n={2} title="How we use your information">
        <LegalP>We use your information to:</LegalP>
        <LegalUl>
          <li>Display your wellness trends, summaries, and daily check-ins.</li>
          <li>Operate, maintain, and improve Pulse features.</li>
          <li>Authenticate you and keep your account secure.</li>
          <li>Provide support and respond to your requests.</li>
        </LegalUl>
        <LegalP>
          We do not sell your personal or health information, and we do not use
          it to show you advertising.
        </LegalP>
      </LegalSection>

      <LegalSection n={3} title="How your data is stored and protected">
        <LegalP>
          Your data is stored in a managed database where each record is
          associated with your account. Access is enforced with row-level
          security policies so that only you can read or modify your own
          records. Authentication tokens are handled by our authentication
          provider and are not shared with other users.
        </LegalP>
        <LegalP>
          We use reasonable technical and organizational measures to protect
          your information. However, no method of transmission or storage is
          fully secure, and we cannot guarantee absolute security.
        </LegalP>
      </LegalSection>

      <LegalSection n={4} title="Device data (Oura and Apple Watch)">
        <LegalP>
          Today, wellness metrics are entered manually. When device sync is
          enabled, Pulse will import metrics from the providers you explicitly
          link. You connect a device through its own authorization flow, and
          you can revoke Pulse's access at any time from the provider's
          settings or from within Pulse.
        </LegalP>
        <LegalP>
          We import only the wellness metrics described above. We do not
          access data you have not consented to share, and we do not share
          device data with third parties.
        </LegalP>
      </LegalSection>

      <LegalSection n={5} title="Legal basis (for users in the EEA, UK, and Switzerland)">
        <LegalP>
          Where applicable data protection law applies, we process your
          information on the following bases:
        </LegalP>
        <LegalUl>
          <li>
            <strong>Performance of a contract</strong> — to provide the Pulse
            service you requested.
          </li>
          <li>
            <strong>Consent</strong> — when you link a device or enter journal
            notes. You can withdraw consent at any time.
          </li>
          <li>
            <strong>Legitimate interests</strong> — to keep the service secure
            and operating.
          </li>
        </LegalUl>
      </LegalSection>

      <LegalSection n={6} title="Data retention">
        <LegalP>
          We keep your information for as long as your account is active. If
          you delete your account, we will delete or de-identify your stored
          wellness, medication, and journal data within a reasonable period,
          except where retention is required by law.
        </LegalP>
      </LegalSection>

      <LegalSection n={7} title="Sharing of information">
        <LegalP>
          We share information only in limited circumstances:
        </LegalP>
        <LegalUl>
          <li>
            With infrastructure and authentication providers that help us run
            Pulse, under contractual obligations to protect the data.
          </li>
          <li>
            When required by law, regulation, or legal process, or to protect
            rights, safety, or property.
          </li>
        </LegalUl>
        <LegalP>
          We do not sell or rent your personal information to third parties.
        </LegalP>
      </LegalSection>

      <LegalSection n={8} title="Your privacy rights">
        <LegalP>
          Depending on where you live, you may have the right to:
        </LegalP>
        <LegalUl>
          <li>Access or receive a copy of your personal information.</li>
          <li>Correct inaccurate or incomplete information.</li>
          <li>Delete your account and associated data.</li>
          <li>Withdraw consent for device data or journal processing.</li>
          <li>Object to or restrict certain processing.</li>
        </LegalUl>
        <LegalP>
          To exercise any of these rights, contact us using the details below.
        </LegalP>
      </LegalSection>

      <LegalSection n={9} title="Children's privacy">
        <LegalP>
          Pulse is not intended for children under 16, and we do not knowingly
          collect information from them. If you believe a child has provided us
          information, contact us and we will delete it.
        </LegalP>
      </LegalSection>

      <LegalSection n={10} title="International transfers">
        <LegalP>
          Your information may be processed in a country other than your own,
          where privacy laws may differ. Where required, we use appropriate
          safeguards for such transfers.
        </LegalP>
      </LegalSection>

      <LegalSection n={11} title="Changes to this policy">
        <LegalP>
          We may update this policy from time to time. We will note the updated
          date above and, for material changes, notify you within the app or by
          email. Continued use after a change takes effect means you accept
          the revised policy.
        </LegalP>
      </LegalSection>

      <LegalSection n={12} title="Contact us">
        <LegalContact email="privacy@pulse.app" />
      </LegalSection>
    </LegalLayout>
  );
}
