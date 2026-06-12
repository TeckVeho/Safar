import { InvoiceTranslateClient } from "@/components/invoice-translate-client";
import { PageHeader } from "@/components/page-header";
import { getDictionary } from "@/lib/i18n/server";

export default async function InvoiceTranslatePage() {
  const dict = await getDictionary();

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        backLabel={dict.common.back}
        eyebrow={dict.invoiceTranslate.eyebrow}
        title={dict.invoiceTranslate.title}
        description={dict.invoiceTranslate.description}
        icon="phrases"
      />

      <InvoiceTranslateClient labels={dict.invoiceTranslate} />
    </div>
  );
}
