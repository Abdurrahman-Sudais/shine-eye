import { CheckForm } from "@/components/check-form";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10 sm:py-16">
      <header className="mb-8">
        <p className="text-sm font-semibold tracking-wide text-brand">ShineEye</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          Shine your eye. Check before you click, pay, or reply.
        </h1>
        <p className="mt-3 text-lg leading-8 text-muted">
          Paste a suspicious message or link. We&apos;ll tell you if it looks like a scam, why, and
          what to do next.
        </p>
      </header>

      <CheckForm />

      <footer className="mt-12 text-sm leading-6 text-muted">
        ShineEye gives guidance, not guarantees. We don&apos;t store the messages you check.
      </footer>
    </main>
  );
}
