import Link from "next/link";
import { useTranslations } from "next-intl";

import packageJson from "../../../../../../package.json";

const { version } = packageJson;

export function TransparentFooter() {
  const t = useTranslations();

  return (
    <footer className="absolute bottom-0 left-0 right-0 z-50 w-full flex items-center justify-center py-3 h-16 pointer-events-none">
      <div className="flex flex-col items-center pointer-events-auto">
      </div>
    </footer>
  );
}
