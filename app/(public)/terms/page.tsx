import type { Metadata } from 'next'
import { ScrollText } from 'lucide-react'
import { PageHeader } from 'components/public/PageHeader'

export const metadata: Metadata = {
  title: 'Terms of Service — ClassMate',
  description: 'Review the terms and conditions for using the ClassMate platform.',
}

export default function TermsPage() {
  return (
    <>
      <PageHeader
        title="Terms of Service"
        description="By using ClassMate, you agree to these terms. Please read them carefully before using the platform."
        badge="Last updated: May 2026"
        icon={<ScrollText className="h-5 w-5" />}
      />

      <div className="container mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <div className="divide-border divide-y">
          <p className="text-muted-foreground pb-8 text-sm leading-relaxed">
            These Terms of Service (&ldquo;Terms&rdquo;) govern your access to and use of ClassMate
            (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;, or &ldquo;the platform&rdquo;).
            By creating an account or using any part of ClassMate, you agree to be bound by these
            Terms. If you do not agree, do not use the platform.
          </p>

          <section className="py-8">
            <h2 className="text-foreground mb-4 text-lg font-bold">Eligibility</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              ClassMate is intended for students, educators, and academic community members. You
              must be at least 13 years of age to create an account. By registering, you confirm
              that the information you provide is accurate and that you will keep it up to date. You
              are responsible for maintaining the confidentiality of your login credentials and for
              all activity that occurs under your account.
            </p>
          </section>

          <section className="py-8">
            <h2 className="text-foreground mb-4 text-lg font-bold">Acceptable Use</h2>
            <p className="text-muted-foreground mb-3 text-sm leading-relaxed">
              You agree to use ClassMate only for lawful, educational purposes. You must not:
            </p>
            <ul className="space-y-2">
              {[
                'Post content that is abusive, defamatory, discriminatory, or sexually explicit.',
                'Harass, threaten, or impersonate other users or platform staff.',
                'Share exam questions, model answers, or any content that facilitates academic dishonesty.',
                'Distribute malware, phishing links, or any malicious code.',
                'Attempt to access accounts, data, or systems you are not authorised to use.',
                'Use automated tools (bots, scrapers) to access or extract platform data.',
                'Circumvent rate limits, authentication, or any other technical safeguard.',
              ].map((item) => (
                <li key={item} className="text-muted-foreground flex items-start gap-2.5 text-sm">
                  <span className="bg-muted-foreground/50 mt-2 h-1 w-1 shrink-0 rounded-full" />
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section className="py-8">
            <h2 className="text-foreground mb-4 text-lg font-bold">User Responsibilities</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              You are solely responsible for the content you post and the actions you take on
              ClassMate. You agree to use the platform in a manner consistent with our Community
              Guidelines and to treat all members with respect. Any breach of these responsibilities
              may result in your content being removed from the platform.
            </p>
          </section>

          <section className="py-8">
            <h2 className="text-foreground mb-4 text-lg font-bold">
              Content Ownership and Licence
            </h2>
            <p className="text-muted-foreground mb-4 text-sm leading-relaxed">
              You retain ownership of all original content you create and share on ClassMate. By
              posting content, you grant ClassMate a non-exclusive, royalty-free licence to store,
              display, and distribute that content within the platform for the purpose of providing
              the service.
            </p>
            <p className="text-muted-foreground text-sm leading-relaxed">
              You are responsible for ensuring you have the right to share any content you upload,
              including study materials, images, and documents. Do not upload content that infringes
              copyright or other intellectual property rights.
            </p>
          </section>

          <section className="py-8">
            <h2 className="text-foreground mb-4 text-lg font-bold">AI Features</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              ClassMate includes AI-powered features such as the AI Tutor, content moderation, and
              thread recommendations. These features are provided to assist your learning experience
              and are not a substitute for professional academic advice. AI-generated responses may
              contain errors — always verify important information with trusted sources or your
              instructors. We are not liable for decisions made based on AI-generated content.
            </p>
          </section>

          <section className="py-8">
            <h2 className="text-foreground mb-4 text-lg font-bold">Platform Availability</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              We aim to keep ClassMate available at all times but do not guarantee uninterrupted
              access. We may perform maintenance, updates, or emergency interventions that
              temporarily limit access. We are not liable for any loss or inconvenience resulting
              from planned or unplanned downtime.
            </p>
          </section>

          <section className="py-8">
            <h2 className="text-foreground mb-4 text-lg font-bold">Enforcement</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              When content is reported by a member of the community, a moderator will review it. If
              the content is confirmed as a violation of these Terms or our Community Guidelines, it
              will be removed from the platform. The user who submitted the report will be notified
              of the outcome.
            </p>
          </section>

          <section className="pt-8">
            <h2 className="text-foreground mb-4 text-lg font-bold">Changes to These Terms</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              We may revise these Terms at any time. When we make material changes, we will update
              the &ldquo;Last updated&rdquo; date and notify active users via a platform
              notification. Your continued use of ClassMate after changes are published constitutes
              your acceptance of the updated Terms.
            </p>
          </section>
        </div>
      </div>
    </>
  )
}
