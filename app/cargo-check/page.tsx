import { CargoCheckClient } from "@/components/cargo-check-client";
import { PageHeader } from "@/components/page-header";
import { getDictionary } from "@/lib/i18n/server";

export default async function CargoCheckPage() {
  const dict = await getDictionary();

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        backLabel={dict.common.back}
        eyebrow={dict.cargoCheck.eyebrow}
        title={dict.home.cargoCheck}
        description={dict.cargoCheck.description}
        icon="cargo"
      />

      <CargoCheckClient
        labels={dict.cargoCheck}
        scannerLabels={dict.barcodeScanner}
        historyLabels={{
          itemList: dict.home.historyItemList,
          ingredientsCheck: dict.home.historyIngredientsCheck,
        }}
      />
    </div>
  );
}
