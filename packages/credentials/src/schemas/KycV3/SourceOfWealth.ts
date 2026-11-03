import { IsIn, IsMimeType, IsOptional, IsString } from "class-validator";

import {
  ApproximateNetWorths,
  Currencies,
  SourceOfWealthSources,
  SourceOfWealthTypes,
  YearlyGrossIncomes,
  type ApproximateNetWorth,
  type Currency,
  type SourceOfWealthSource,
  type SourceOfWealthType,
  type YearlyGrossIncome,
} from "../enums";
import { Base85FileField, RequiredWhen, RequiredWith } from "../utils";

export class SourceOfWealth {
  /* How the source of wealth was obtained: self-attested by the person (MANUAL) or verified. A MANUAL one does not count towards the level. */
  @IsIn(SourceOfWealthSources)
  source: SourceOfWealthSource;

  /* The category of wealth source declared by the person (e.g. SALARY, INVESTMENTS). */
  @IsIn(SourceOfWealthTypes)
  type: SourceOfWealthType;

  /* The person's yearly gross income, as a band. */
  @IsOptional()
  @IsIn(YearlyGrossIncomes)
  yearlyGrossIncome?: YearlyGrossIncome;

  /* The currency of the person's yearly gross income. */
  @RequiredWith("yearlyGrossIncome")
  @IsIn(Currencies)
  yearlyGrossIncomeCurrency?: Currency;

  /* The person's approximate net worth, as a band. */
  @IsOptional()
  @IsIn(ApproximateNetWorths)
  approximateNetWorth?: ApproximateNetWorth;

  /* The currency of the person's approximate net worth. */
  @RequiredWith("approximateNetWorth")
  @IsIn(Currencies)
  approximateNetWorthCurrency?: Currency;

  /* A file containing proof of the person's source of wealth. */
  @IsOptional()
  @Base85FileField()
  sourceOfWealthProofFile?: Buffer;

  /* Type of the document provided as proof of the person's source of wealth. */
  @RequiredWhen((sow: SourceOfWealth) => !!sow.sourceOfWealthProofFile)
  @IsString()
  @IsMimeType()
  sourceOfWealthProofFileType?: string;

  /* Name of the document provided as proof of the person's source of wealth. */
  @RequiredWhen((sow: SourceOfWealth) => !!sow.sourceOfWealthProofFile)
  @IsString()
  sourceOfWealthProofFileName?: string;
}
