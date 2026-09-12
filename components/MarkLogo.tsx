import Image from "next/image";

export function MarkLogo({ className = "" }: { className?: string }) {
  return <Image src="/brand/mark-ai-logo.svg" alt="Mark AI" width={180} height={45} priority className={className} />;
}
