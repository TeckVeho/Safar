import { HalalScannerClient } from "@/components/halal-scanner-client";
import { PageHeader } from "@/components/page-header";
import { getDictionary } from "@/lib/i18n/server";

export default async function HalalScannerPage() {
  const dict = await getDictionary();

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        backLabel={dict.common.back}
        eyebrow={dict.halalScanner.eyebrow}
        title={dict.halalScanner.title}
        description={dict.halalScanner.description}
        icon="halal"
      />

      <HalalScannerClient labels={dict.halalScanner} scannerLabels={dict.barcodeScanner} />
    </div>
  );
}
