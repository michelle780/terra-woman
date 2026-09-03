import { createFileRoute } from "@tanstack/react-router";
import {
  LegalLayout,
  LegalSection,
  LegalP,
  LegalUl,
  LegalContact,
} from "@/components/LegalLayout";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — Pulse wellness tracker" },
      {
        name: "description",
        content:
          "The terms that govern your use of Pulse, a personal wellness log for sleep, medication and symptom tracking.",
      },
      { property: "og:title", content: "Terms of Service — Pulse wellness tracker" },
      {
        property: "og:description",
        content:
          "The terms that govern your use of Pulse, your personal wellness log.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TermsPage,
});

const UPDATED = "September 3, 2026";

function TermsPage() {
  return (
    <LegalLayout
      title="Terms of Service"
      updated={UPDATED}
      intro="These terms govern your use of Pulse. By creating an account or using Pulse, you agree to them. Pulse is a personal wellness log and is not a medical device or a substitute for professional medical care."
    >
      <LegalSection n={1} title="Your account">
        <LegalP>
          You must be at least 16 years old to use Pulse. You agree to provide
          accurate information and to keep your password and account secure. You
          are responsible for activity that happens through your account.
        </LegalP>
      </LegalSection>

      <LegalSection n={2} title="Not medical advice">
        <LegalP>
          Pulse displays wellness metrics, medication check-ins, and
          self-reported notes for your own awareness only. Nothing in Pulse is
          medical advice, diagnosis, or treatment. Do not use Pulse to make
          medical decisions or to replace guidance from a qualified health
          professional. If you have a medical concern, contact a licensed
          provider.
        </LegalP>
      </LegalSection>

      <LegalSection n={3} title="Your content">
        <LegalP>
          You retain ownership of the information you enter or sync into Pulse,
          including metrics, medications, and journal entries. You grant Pulse
          a limited license to host, store, and display that information back to
          you as part of the service.
        </LegalP>
        <LegalP>
          You are responsible for the accuracy and lawfulness of the
          information you provide.
        </LegalP>
      </LegalSection>

      <LegalSection n={4} title="Acceptable use">
        <LegalP>You agree not to:</LegalP>
        <LegalUl>
          <li>Use Pulse in a way that violates applicable law.</li>
          <li>
            Attempt to access another user's data or circumvent access controls.
          </li>
          <li>
            Interfere with, overload, or reverse-engineer Pulse or its
            infrastructure.
          </li>
          <li>Enter information you know to be false or misleading.</li>
        </LegalUl>
      </LegalSection>

      <LegalSection n={5} title="Devices and third-party data">
        <LegalP>
          When you link a device (such as an Oura ring or Apple Watch), you do
          so through the provider's own authorization and under that
          provider's terms. Pulse imports only the metrics you authorize, and
          we are not responsible for the accuracy or availability of
          third-party device data.
        </LegalP>
      </LegalSection>

      <LegalSection n={6} title="Service availability">
        <LegalP>
          We strive to keep Pulse available but do not guarantee uninterrupted
          or error-free operation. We may modify, suspend, or discontinue
          features at any time. Where required by law, we will give reasonable
          notice of material changes.
        </LegalP>
      </LegalSection>

      <LegalSection n={7} title="Accounts and termination">
        <LegalP>
          You can delete your account at any time. We may suspend or terminate
          your access if you violate these terms or create a risk to Pulse or
          its users.
        </LegalP>
      </LegalSection>

      <LegalSection n={8} title="Intellectual property">
        <LegalP>
          Pulse, including its design, branding, and software, is owned by or
          licensed to us. These terms do not grant you any right to use Pulse's
          names, logos, or underlying software except as needed to use the
          service.
        </LegalP>
      </LegalSection>

      <LegalSection n={9} title="Disclaimer of warranties">
        <LegalP>
          Pulse is provided "as is" and "as available," without warranties of
          any kind, whether express or implied. We do not warrant that Pulse
          will be accurate, reliable, timely, or fit for any particular
          purpose, including medical purposes.
        </LegalP>
      </LegalSection>

      <LegalSection n={10} title="Limitation of liability">
        <LegalP>
          To the fullest extent permitted by law, Pulse and its providers are
          not liable for any indirect, incidental, special, consequential, or
          punitive damages, or for loss of data, arising from your use of or
          inability to use Pulse.
        </LegalP>
        <LegalP>
          Because Pulse is not a medical device, we are not liable for
          decisions you make based on information shown in Pulse.
        </LegalP>
      </LegalSection>

      <LegalSection n={11} title="Governing law">
        <LegalP>
          These terms are governed by the laws of the jurisdiction in which
          Pulse operates, without regard to conflict-of-law principles. You and
          we agree to resolve disputes in the courts of that jurisdiction,
          except where mandatory consumer rights require otherwise.
        </LegalP>
      </LegalSection>

      <LegalSection n={12} title="Changes to these terms">
        <LegalP>
          We may update these terms from time to time. We will note the
          updated date above and notify you of material changes within the app
          or by email. Continued use after a change takes effect means you
          accept the revised terms.
        </LegalP>
      </LegalSection>

      <LegalSection n={13} title="Contact us">
        <LegalContact email="support@pulse.app" />
      </LegalSection>
    </LegalLayout>
  );
}
