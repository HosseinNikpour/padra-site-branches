import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import HamilaView from "./HamilaView";
import LotusView from "./LotusView";
import { prisma } from "@/lib/prisma";
import "../../site.css";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

async function getBranch(slug: string) {
  return prisma.branch.findFirst({ where: { slug, isActive: true } });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const branch = await getBranch((await params).slug);
  return { title: branch ? `پادرا پارک | ${branch.name}` : "پادرا پارک" };
}

const ANCHORS: [string, string][] = [
  ["بازی‌ها", "#games"],
  ["ایونت‌ها", "#today"],
  ["کافه", "#cafe"],
  ["تولد", "#birthday"],
];

export default async function BranchPage({ params }: Props) {
  const branch = await getBranch((await params).slug);
  if (!branch) notFound();

  const info = {
    slug: branch.slug,
    name: branch.name,
    area: branch.area,
    address: branch.address,
    mapUrl: branch.mapUrl,
    phone: branch.phone,
    description: branch.description,
    hours: branch.hours,
  };

  // هر شعبه تم خودش را دارد؛ شعبه‌های دیگر با تم همیلا (سبک اصلی سایت) نمایش داده می‌شوند
  if (branch.slug === "lotus") {
    return (
      <>
        <SiteHeader theme="lotus" anchors={ANCHORS} />
        <LotusView branch={info} />
        <SiteFooter theme="lotus" />
      </>
    );
  }

  return (
    <>
      <SiteHeader theme="hamila" anchors={ANCHORS} />
      <HamilaView branch={info} />
      <SiteFooter theme="hamila" />
    </>
  );
}
