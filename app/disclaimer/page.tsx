import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap, ArrowLeft, AlertTriangle, ExternalLink, Mail } from 'lucide-react';

export const metadata = {
  title: 'Disclaimer & Terms of Use | DCC CSE',
  description:
    'Important institutional disclaimer, non-affiliation notice, and terms of use for the independent DCC CSE student academic dashboard.',
};

export default function DisclaimerPage() {
  return (
    <div className="min-h-screen bg-background text-foreground py-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
      <div className="mx-auto w-full max-w-3xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2 group mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <GraduationCap className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold tracking-tight">DCC CSE</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Institutional Disclaimer &amp; Terms of Use
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Last Updated: October 2026 • Please read carefully before using this application.
          </p>
        </div>

        {/* Primary Alert Banner */}
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 sm:p-5 text-amber-900 dark:text-amber-200 space-y-2">
          <div className="flex items-center gap-2 font-semibold text-sm sm:text-base">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>Independent Student Project — Not an Official College Website</span>
          </div>
          <p className="text-xs sm:text-sm leading-relaxed text-amber-800 dark:text-amber-300">
            <strong>DCC CSE</strong> is an independent, non-commercial, open-source student companion developed solely to assist students with personal study scheduling and grade calculations. It is <strong>NOT</strong> an official website of, affiliated with, operated by, sponsored by, or endorsed by <strong>Dhaka City College</strong> or the <strong>National University Bangladesh</strong>.
          </p>
        </div>

        {/* Detailed Clauses */}
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Terms, Fair Use &amp; Privacy Statement</CardTitle>
            <CardDescription>
              Legal boundaries, data privacy, and intellectual property disclosures.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 text-sm text-muted-foreground leading-relaxed">
            {/* Clause 1 */}
            <div className="space-y-2">
              <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                1. Non-Affiliation and Non-Endorsement
              </h2>
              <p>
                This application is maintained independently by student developers for peer educational utility. Nothing contained on this website constitutes official college policy, academic records, official fee invoices, or administrative directives.
              </p>
            </div>

            {/* Clause 2 */}
            <div className="space-y-2">
              <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                2. Authoritative Sources for Official Notices
              </h2>
              <p>
                Routines, exam schedules, seat plans, and course syllabi displayed within this app are student-maintained reference aids. While every effort is made to maintain accuracy, schedules may change without notice. For official examination dates, fee deadlines, registration requirements, and college notices, always consult the official Dhaka City College administration:
              </p>
              <div className="pt-1">
                <a
                  href="https://dhakacitycollege.edu.bd"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary underline underline-offset-4 hover:text-primary/80"
                >
                  Official Dhaka City College Website <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>

            {/* Clause 3 */}
            <div className="space-y-2">
              <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                3. Nominative Fair Use of Trademarks
              </h2>
              <p>
                The names &ldquo;Dhaka City College&rdquo;, &ldquo;DCC&rdquo;, and &ldquo;National University&rdquo; are trademarks of their respective owners. Their mention on this website is strictly for descriptive and nominative identification purposes to specify the academic context of the student community using this utility tool. No ownership, trademark claim, or endorsement is claimed.
              </p>
            </div>

            {/* Clause 4 */}
            <div className="space-y-2">
              <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                4. Independent Authentication &amp; Anti-Phishing Safeguard
              </h2>
              <p>
                DCC CSE operates entirely on its own isolated user database. This application does not connect to, query, or collect credentials from official college management systems.
              </p>
              <div className="rounded-lg bg-muted p-3 text-xs text-foreground font-medium border border-border">
                ⚠️ <strong>Security Rule:</strong> Students must NEVER use their official college administration, institutional email, or personal banking passwords on this application. Please create a unique password specifically for this study tool.
              </div>
            </div>

            {/* Clause 5 */}
            <div className="space-y-2">
              <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                5. Privacy and Local-First Data Storage
              </h2>
              <p>
                Your personal academic data—including marked attendance, CGPA inputs, custom routines, and fee notes—is stored locally on your device via browser IndexedDB. No personal academic records are sold, scraped, or shared with third parties.
              </p>
            </div>

            {/* Clause 6 */}
            <div className="space-y-2">
              <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                6. Administration Contact &amp; Takedown Requests
              </h2>
              <p>
                If you are a faculty member, department head, or official representative of Dhaka City College and have any questions, concerns, or requests to modify, update, or remove any student-contributed content, please reach out directly:
              </p>
              <div className="flex flex-col sm:flex-row gap-2 pt-1 text-xs">
                <a
                  href="https://api.whatsapp.com/send/?phone=8801521743944"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline"
                >
                  <Mail className="h-3.5 w-3.5" /> Developer Contact (WhatsApp / Direct)
                </a>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Back Link */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
          <Link href="/" className="inline-flex items-center gap-1.5 text-primary hover:underline font-medium">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Application / Dashboard
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:text-foreground">Home</Link>
            <Link href="/login" className="hover:text-foreground">Sign In</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
