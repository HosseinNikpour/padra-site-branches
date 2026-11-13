import Link from "next/link";
import { prisma } from "@/lib/prisma";

type Props = {
  theme?: "home" | "hamila" | "lotus";
  anchors?: [string, string][];
};

export default async function SiteHeader({ theme = "home", anchors = [] }: Props) {
  const branches = await prisma.branch.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    select: { slug: true, name: true },
  });

  return (
    <header className={`pd-header pd-header-${theme}`}>
      <nav className="pd-nav">
        <Link href="/" className="pd-brand" aria-label="پادرا پارک">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/img/padra_logo.png" alt="پادرا پارک" />
        </Link>

        <div className="pd-links">
          <Link href="/">خانه</Link>
          {branches.map((b) => (
            <Link key={b.slug} href={`/branches/${b.slug}`}>
              {b.name}
            </Link>
          ))}
          {theme === "home" && <Link href="/#about">درباره ما</Link>}
        </div>

        <Link href="/account" className="pd-account">
          ورود / ثبت‌نام
        </Link>
      </nav>

      {anchors.length > 0 && (
        <div className="pd-anchors">
          {anchors.map(([label, href]) => (
            <a key={href} href={href}>
              {label}
            </a>
          ))}
        </div>
      )}
    </header>
  );
}
