import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Terminal, Server, Database, Shield, CheckCircle2, Copy, ExternalLink } from "lucide-react";

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <span className="text-sm font-bold text-primary-foreground">W</span>
              </div>
              <span className="text-xl font-bold tracking-tight text-foreground">Workly</span>
            </Link>
            <span className="text-muted-foreground">/</span>
            <span className="text-sm font-medium text-foreground">Documentation</span>
          </div>
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </nav>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Page Title */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">Installation Guide</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Get Workly up and running on your own infrastructure in minutes. Full control, full ownership.
          </p>
        </div>

        {/* Prerequisites */}
        <section className="mb-12">
          <h2 className="mb-4 text-2xl font-semibold text-foreground">Prerequisites</h2>
          <div className="rounded-lg border border-border bg-card p-6">
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-foreground" />
                <div>
                  <span className="font-medium text-foreground">Docker</span>
                  <span className="text-muted-foreground"> - Version 20.10 or higher</span>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-foreground" />
                <div>
                  <span className="font-medium text-foreground">Docker Compose</span>
                  <span className="text-muted-foreground"> - Version 2.0 or higher</span>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-foreground" />
                <div>
                  <span className="font-medium text-foreground">2GB RAM minimum</span>
                  <span className="text-muted-foreground"> - 4GB recommended for production</span>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-foreground" />
                <div>
                  <span className="font-medium text-foreground">10GB disk space</span>
                  <span className="text-muted-foreground"> - For application and database</span>
                </div>
              </li>
            </ul>
          </div>
        </section>

        {/* Quick Start */}
        <section className="mb-12">
          <h2 className="mb-4 text-2xl font-semibold text-foreground">Quick Start</h2>
          <p className="mb-6 text-muted-foreground">
            The fastest way to get Workly running is with our one-line installer script.
          </p>

          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-card">
              <div className="flex items-center justify-between border-b border-border px-4 py-2">
                <div className="flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">Terminal</span>
                </div>
                <Button variant="ghost" size="sm" className="h-8 gap-2 text-xs">
                  <Copy className="h-3 w-3" />
                  Copy
                </Button>
              </div>
              <div className="p-4">
                <code className="text-sm text-foreground">
                  curl -fsSL https://get.workly.dev | bash
                </code>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              This script will download and configure Workly with sensible defaults. Once complete, access Workly at{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 text-foreground">http://localhost:3000</code>
            </p>
          </div>
        </section>

        {/* Manual Installation */}
        <section className="mb-12">
          <h2 className="mb-4 text-2xl font-semibold text-foreground">Manual Installation</h2>
          <p className="mb-6 text-muted-foreground">
            For more control over your installation, follow these manual steps.
          </p>

          <div className="space-y-6">
            {/* Step 1 */}
            <div>
              <h3 className="mb-3 flex items-center gap-2 text-lg font-medium text-foreground">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">1</span>
                Clone the repository
              </h3>
              <div className="rounded-lg border border-border bg-card">
                <div className="flex items-center justify-between border-b border-border px-4 py-2">
                  <div className="flex items-center gap-2">
                    <Terminal className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">Terminal</span>
                  </div>
                  <Button variant="ghost" size="sm" className="h-8 gap-2 text-xs">
                    <Copy className="h-3 w-3" />
                    Copy
                  </Button>
                </div>
                <div className="p-4">
                  <code className="text-sm text-foreground">
                    git clone https://github.com/workly/workly.git<br />
                    cd workly
                  </code>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div>
              <h3 className="mb-3 flex items-center gap-2 text-lg font-medium text-foreground">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">2</span>
                Configure environment variables
              </h3>
              <div className="rounded-lg border border-border bg-card">
                <div className="flex items-center justify-between border-b border-border px-4 py-2">
                  <div className="flex items-center gap-2">
                    <Terminal className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">Terminal</span>
                  </div>
                  <Button variant="ghost" size="sm" className="h-8 gap-2 text-xs">
                    <Copy className="h-3 w-3" />
                    Copy
                  </Button>
                </div>
                <div className="p-4">
                  <code className="text-sm text-foreground">
                    cp .env.example .env<br />
                    # Edit .env with your preferred settings
                  </code>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div>
              <h3 className="mb-3 flex items-center gap-2 text-lg font-medium text-foreground">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">3</span>
                Start with Docker Compose
              </h3>
              <div className="rounded-lg border border-border bg-card">
                <div className="flex items-center justify-between border-b border-border px-4 py-2">
                  <div className="flex items-center gap-2">
                    <Terminal className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">Terminal</span>
                  </div>
                  <Button variant="ghost" size="sm" className="h-8 gap-2 text-xs">
                    <Copy className="h-3 w-3" />
                    Copy
                  </Button>
                </div>
                <div className="p-4">
                  <code className="text-sm text-foreground">
                    docker compose up -d
                  </code>
                </div>
              </div>
            </div>

            {/* Step 4 */}
            <div>
              <h3 className="mb-3 flex items-center gap-2 text-lg font-medium text-foreground">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">4</span>
                Access Workly
              </h3>
              <p className="text-muted-foreground">
                Open your browser and navigate to{" "}
                <code className="rounded bg-muted px-1.5 py-0.5 text-foreground">http://localhost:3000</code>
                {" "}to complete the setup wizard.
              </p>
            </div>
          </div>
        </section>

        {/* Configuration */}
        <section className="mb-12">
          <h2 className="mb-4 text-2xl font-semibold text-foreground">Configuration Options</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-border bg-card p-5">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                  <Database className="h-5 w-5 text-foreground" />
                </div>
                <h3 className="font-semibold text-foreground">Database</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                PostgreSQL (default), MySQL, or SQLite for smaller deployments.
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card p-5">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                  <Server className="h-5 w-5 text-foreground" />
                </div>
                <h3 className="font-semibold text-foreground">Storage</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Local filesystem, S3-compatible storage, or cloud providers.
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card p-5">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                  <Shield className="h-5 w-5 text-foreground" />
                </div>
                <h3 className="font-semibold text-foreground">Authentication</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Built-in auth, LDAP/Active Directory, or SAML/SSO providers.
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card p-5">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                  <ExternalLink className="h-5 w-5 text-foreground" />
                </div>
                <h3 className="font-semibold text-foreground">Integrations</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                GitHub, GitLab, Slack, and 50+ other integrations available.
              </p>
            </div>
          </div>
        </section>

        {/* Environment Variables */}
        <section className="mb-12">
          <h2 className="mb-4 text-2xl font-semibold text-foreground">Environment Variables</h2>
          <div className="overflow-hidden rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-foreground">Variable</th>
                  <th className="px-4 py-3 text-left font-medium text-foreground">Description</th>
                  <th className="px-4 py-3 text-left font-medium text-foreground">Default</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-card">
                <tr>
                  <td className="px-4 py-3 font-mono text-xs text-foreground">DATABASE_URL</td>
                  <td className="px-4 py-3 text-muted-foreground">PostgreSQL connection string</td>
                  <td className="px-4 py-3 text-muted-foreground">-</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-mono text-xs text-foreground">SECRET_KEY</td>
                  <td className="px-4 py-3 text-muted-foreground">Application secret for encryption</td>
                  <td className="px-4 py-3 text-muted-foreground">auto-generated</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-mono text-xs text-foreground">PORT</td>
                  <td className="px-4 py-3 text-muted-foreground">HTTP server port</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">3000</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-mono text-xs text-foreground">SMTP_HOST</td>
                  <td className="px-4 py-3 text-muted-foreground">Email server hostname</td>
                  <td className="px-4 py-3 text-muted-foreground">-</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-mono text-xs text-foreground">STORAGE_TYPE</td>
                  <td className="px-4 py-3 text-muted-foreground">File storage backend</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">local</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Help Section */}
        <section className="rounded-lg border border-border bg-muted/50 p-6">
          <h2 className="mb-2 text-lg font-semibold text-foreground">Need help?</h2>
          <p className="mb-4 text-muted-foreground">
            Join our community for support and discussions.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="https://github.com/workly/workly" target="_blank">
              <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
                GitHub
              </Button>
            </Link>
            <Link href="https://discord.gg/workly" target="_blank">
              <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" />
                </svg>
                Discord
              </Button>
            </Link>
            <Link href="https://docs.workly.dev" target="_blank">
              <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                <ExternalLink className="h-4 w-4" />
                Full Docs
              </Button>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
