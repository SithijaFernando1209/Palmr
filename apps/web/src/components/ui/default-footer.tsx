import Link from "next/link";
import { useTranslations } from "next-intl";

import packageJson from "../../../package.json";

const { version } = packageJson;

export function DefaultFooter() {
  const t = useTranslations();

  return (
    <footer className="w-full flex items-center justify-center py-3 h-16">
      <div className="flex flex-col items-center">
      </div>
    </footer>
  );
}
