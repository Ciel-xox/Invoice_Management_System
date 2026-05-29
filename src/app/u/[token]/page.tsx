import Link from "next/link";
import { getCompanyByToken } from "@/lib/db";
import { notFound } from "next/navigation";
import UploadClient from "./UploadClient";

export const dynamic = "force-dynamic";

const SHOW_DEV_NAV = process.env.NODE_ENV !== "production";

type Props = { params: Promise<{ token: string }> };

export default async function UploadPage({ params }: Props) {
  const { token } = await params;
  const company = await getCompanyByToken(token);
  if (!company) notFound();

  if (company.status === "disabled") {
    return (
      <div className="max-w-xl mx-auto px-5 py-16 text-center">
        {SHOW_DEV_NAV && (
          <div className="text-left mb-6">
            <Link href="/" className="text-xs text-ink-3 no-underline">
              ← トップに戻る
            </Link>
          </div>
        )}
        <p className="text-2xl mb-3">🔒</p>
        <p className="text-base font-medium">この URL は現在利用できません</p>
        <p className="text-sm text-ink-2 mt-2">
          ご担当者までお問い合わせください。
        </p>
      </div>
    );
  }

  return <UploadClient company={company} showDevNav={SHOW_DEV_NAV} />;
}
