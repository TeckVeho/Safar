import { PageHeader } from "@/components/page-header";
import { PhrasesClient } from "@/components/phrases-client";
import { getDictionary } from "@/lib/i18n/server";

export default async function PhrasesPage() {
  const dict = await getDictionary();

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        backLabel={dict.common.back}
        eyebrow={dict.phrases.eyebrow}
        title={dict.home.phrases}
        description={dict.phrases.description}
        icon="phrases"
      />

      <PhrasesClient labels={dict.phrases} translateHref="/invoice-translate" />
    </div>
  );
}
