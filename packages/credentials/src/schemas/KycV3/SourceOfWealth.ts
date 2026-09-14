import { IsIn, IsOptional } from "class-validator";

import {
  ApproximateNetWorths,
  Currencies,
  SourceOfWealthTypes,
  YearlyGrossIncomes,
  type ApproximateNetWorth,
  type Currency,
  type SourceOfWealthType,
  type YearlyGrossIncome,
} from "../enums";
import { Base85FileField, RequiredWith } from "../utils";

export class SourceOfWealth {
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
}
