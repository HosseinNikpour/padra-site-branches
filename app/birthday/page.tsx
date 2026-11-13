import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import BirthdayClient from "./BirthdayClient";
import { prisma } from "@/lib/prisma";
import "../site.css";
import "./birthday.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "رزرو تولد | پادرا پارک" };

type Props = { searchParams: Promise<{ branch?: string }> };

export default async function BirthdayPage({ searchParams }: Props) {
  const { branch: slug } = await searchParams;
  const branch = slug
    ? await prisma.branch.findFirst({ where: { slug, isActive: true }, select: { slug: true, name: true, area: true } })
    : null;

  return (
    <>
      <SiteHeader />
      {branch ? (
        <BirthdayClient branch={branch} />
      ) : (
        <main className="bd-page">
          <section className="bd-hero">
            <h1>رزرو تولد</h1>
            <p>رزرو تولد از صفحه هر شعبه انجام می‌شود. ابتدا شعبه را انتخاب کنید.</p>
          </section>
          <div className="bd-wrap">
            <div className="bd-card">
              <p className="bd-muted">دکمه «رزرو تولد» را در صفحه شعبه موردنظر بزنید:</p>
              <div className="bd-chips">
                {(await prisma.branch.findMany({ where: { isActive: true }, orderBy: [{ sortOrder: "asc" }, { id: "asc" }], select: { slug: true, name: true } })).map((b) => (
                  <Link key={b.slug} href={`/branches/${b.slug}#birthday`} className="bd-chip">{b.name}</Link>
                ))}
              </div>
            </div>
          </div>
        </main>
      )}
      <SiteFooter />
    </>
  );
}
