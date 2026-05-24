import type { Metadata } from 'next'
import { Shield } from 'lucide-react'
import { PageHeader } from 'components/public/PageHeader'

export const metadata: Metadata = {
  title: 'Privacy Policy — ClassMate',
  description: 'Learn how ClassMate collects, uses, and protects your personal information.',
}

export default function PrivacyPage() {
  return (
    <>
      <PageHeader
        title="Privacy Policy"
        description="We are committed to protecting your privacy. This policy explains what data we collect, why we collect it, and how you can control it."
        badge="Last updated: May 2026"
        icon={<Shield className="h-5 w-5" />}
      />

      <div className="container mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <div className="divide-border divide-y">
          <p className="text-muted-foreground pb-8 text-sm leading-relaxed">
            This Privacy Policy applies to ClassMate and describes how we handle personal
            information collected through our platform. By creating an account or using ClassMate,
            you agree to the practices described here.
          </p>

          <section className="py-8">
            <h2 className="text-foreground mb-4 text-lg font-bold">Information We Collect</h2>
            <div className="space-y-5">
              <div>
                <p className="text-foreground mb-1 text-sm font-semibold">Account information</p>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Your name, email address, and password when you register with email, or your
                  Google account details when you sign in with Google. We store only what is needed
                  to identify you and secure your account.
                </p>
              </div>
              <div>
                <p className="text-foreground mb-1 text-sm font-semibold">Content you create</p>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Forum posts, replies, study group messages, uploaded study materials, and any
                  other content you submit to the platform. This content is stored so it can be
                  displayed to other users and, where applicable, processed by our AI moderation and
                  recommendation systems.
                </p>
              </div>
              <div>
                <p className="text-foreground mb-1 text-sm font-semibold">Usage data</p>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Pages visited, features used, forum threads viewed, and interactions with the AI
                  Tutor. We use this data to improve recommendations and platform performance. We do
                  not use third-party analytics trackers.
                </p>
              </div>
              <div>
                <p className="text-foreground mb-1 text-sm font-semibold">Session data</p>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Authentication tokens stored in secure HTTP-only cookies to keep you signed in.
                  These expire automatically and are never accessible to JavaScript on the page.
                </p>
              </div>
            </div>
          </section>

          <section className="py-8">
            <h2 className="text-foreground mb-4 text-lg font-bold">How We Use Your Data</h2>
            <p className="text-muted-foreground mb-3 text-sm leading-relaxed">
              We use the data we collect solely to operate and improve ClassMate. Specifically:
            </p>
            <ul className="space-y-2">
              {[
                'Authenticate you and protect your account.',
                'Display your content to other students on the platform.',
                'Run AI moderation to screen posts for policy violations before publishing.',
                'Generate personalised thread recommendations using an on-premise AI model.',
                'Power the AI Tutor for academic assistance in private sessions.',
                'Send in-app notifications related to your account activity.',
                'Investigate reports of policy violations and enforce our community guidelines.',
              ].map((item) => (
                <li key={item} className="text-muted-foreground flex items-start gap-2.5 text-sm">
                  <span className="bg-muted-foreground/50 mt-2 h-1 w-1 shrink-0 rounded-full" />
                  {item}
                </li>
              ))}
            </ul>
            <p className="text-muted-foreground mt-4 text-sm leading-relaxed">
              We do not sell your data to third parties, use it for advertising, or share it with
              external marketing services.
            </p>
          </section>

          <section className="py-8">
            <h2 className="text-foreground mb-4 text-lg font-bold">AI Features and Your Data</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              ClassMate uses an on-premise AI model (Llama 3.1, hosted by BINUS University) for
              content moderation, thread recommendations, and the AI Tutor. Your content is sent to
              this model for processing but is not used to train external commercial AI systems. The
              model runs within the university infrastructure and is not a third-party cloud
              service.
            </p>
          </section>

          <section className="py-8">
            <h2 className="text-foreground mb-4 text-lg font-bold">Data Sharing</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              We do not sell or rent your personal information. We may share data only in the
              following limited circumstances: to comply with a legal obligation or court order; to
              protect the safety of our users or the public; or with service providers who assist us
              in operating the platform under strict confidentiality agreements. Any third-party
              services we use (such as Firebase for authentication) process data only as instructed
              by us and are bound by their own privacy policies.
            </p>
          </section>

          <section className="py-8">
            <h2 className="text-foreground mb-4 text-lg font-bold">Data Retention</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              We retain your account and content data for as long as your account is active. If you
              delete your account, we will remove your personal information within 30 days, except
              where we are required to retain it for legal or safety reasons. Anonymised or
              aggregated usage statistics may be retained indefinitely.
            </p>
          </section>

          <section className="py-8">
            <h2 className="text-foreground mb-4 text-lg font-bold">Your Rights</h2>
            <p className="text-muted-foreground mb-3 text-sm leading-relaxed">
              You have the right to:
            </p>
            <ul className="space-y-2">
              {[
                'Access the personal data we hold about you.',
                'Request correction of inaccurate information.',
                'Request deletion of your account and associated data.',
                'Export a copy of the content you have created on the platform.',
                'Withdraw consent where processing is based on consent.',
              ].map((item) => (
                <li key={item} className="text-muted-foreground flex items-start gap-2.5 text-sm">
                  <span className="bg-muted-foreground/50 mt-2 h-1 w-1 shrink-0 rounded-full" />
                  {item}
                </li>
              ))}
            </ul>
            <p className="text-muted-foreground mt-4 text-sm leading-relaxed">
              To exercise any of these rights, contact your platform administrator or use the
              account settings within the app.
            </p>
          </section>

          <section className="pt-8">
            <h2 className="text-foreground mb-4 text-lg font-bold">Changes to This Policy</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              We may update this policy from time to time. When we make material changes, we will
              update the &ldquo;Last updated&rdquo; date at the top of this page and notify active
              users via a platform notification. Continued use of ClassMate after changes take
              effect constitutes acceptance of the revised policy.
            </p>
          </section>
        </div>
      </div>
    </>
  )
}
