import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PlaybookResourcePage } from "@/components/content/playbook-resource-page";
import { getTradingPlaybook } from "@/lib/content/playbooks";
import { getPublicMetadataUrl } from "@/lib/seo";

const playbook = getTradingPlaybook("cross-asset-ratio-framework");

export const metadata: Metadata = {
  alternates: { canonical: "/research/playbooks/cross-asset-ratio-framework" },
  description: playbook?.description,
  openGraph: {
    description: playbook?.description,
    images: playbook ? [{ alt: playbook.title, url: playbook.coverPath }] : [],
    title: playbook?.title,
    type: "article",
    url: getPublicMetadataUrl(
      "/research/playbooks/cross-asset-ratio-framework"
    ),
  },
  title: playbook?.title,
};

export default function CrossAssetRatioFrameworkPage() {
  if (!playbook) {
    notFound();
  }

  return <PlaybookResourcePage playbook={playbook} />;
}
