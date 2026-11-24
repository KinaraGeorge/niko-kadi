import type { Metadata } from "next";
import { TableClient } from "@/components/game/TableClient";
import { normaliseCode } from "@/game/protocol";

type Props = { params: Promise<{ code: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params;
  return {
    title: `Table KADI-${normaliseCode(code)}`,
    description: "You've been invited to a game of Kadi. Tap to take your seat.",
    robots: { index: false },
  };
}

export default async function TablePage({ params }: Props) {
  const { code } = await params;
  return <TableClient code={normaliseCode(code)} />;
}
