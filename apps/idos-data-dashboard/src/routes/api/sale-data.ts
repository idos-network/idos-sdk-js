import type { Address } from "viem";

import { formatEther, formatUnits } from "viem";

import { getUserByEvmAddress } from "@/core/db/leaderboard.queries.server";
import {
  getContributionWallet,
  getReferralsAllocations,
  getReferralsUncappedAllocations,
} from "@/core/db/sale.queries.server";
import { SERVER_ENV } from "@/core/envFlags.server";
import { readSaleContractMulticall } from "@/core/sale-contract.server";
import { calculatePriceDiscount, calculateTokenPrice } from "@/lib/sale-utils";

import type { Route } from "./+types/sale-data";

export interface SaleData {
  totalUserInvestedUsdc: number;
  confirmedContribution: number;
  returnedContribution: number;
  individualCap: number | null;
  confirmedIdosAllocation: number;
  airdropBonus: number;
  airdropPercentage: number;
  totalSaleContributions: number;
  currentTokenPrice: number;
  investorCount: number;
  maxTarget: number;
  minTarget: number;
  totalConfirmedContributions: number;
  fdv: number;
  capStatus: "below" | "within" | "above";
}

const EMPTY_RESPONSE: SaleData = {
  totalUserInvestedUsdc: 0,
  confirmedContribution: 0,
  returnedContribution: 0,
  individualCap: null,
  confirmedIdosAllocation: 0,
  airdropBonus: 0,
  airdropPercentage: 0,
  totalSaleContributions: 0,
  currentTokenPrice: 0,
  investorCount: 0,
  maxTarget: 0,
  minTarget: 0,
  totalConfirmedContributions: 0,
  fdv: 0,
  capStatus: "below",
};

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const address = url.searchParams.get("address");

  if (!address) {
    return Response.json(EMPTY_RESPONSE);
  }

  if (!SERVER_ENV.LEGACY_APP_DB_URL) {
    return Response.json(EMPTY_RESPONSE);
  }

  const userId = await getUserByEvmAddress(address);

  let contributionAddress: Address = address as Address;
  let referralsAllocResult = { totalReferralsCountAllocation: 0, totalAllocationValue: 0 };
  let _referralsUncappedResult = {
    totalReferralsCountUncapped: 0,
    totalUncappedAllocationValue: 0,
  };

  if (userId) {
    const [wallet, refAlloc, refUncapped] = await Promise.all([
      getContributionWallet(userId),
      getReferralsAllocations(userId),
      getReferralsUncappedAllocations(userId),
    ]);

    if (wallet) {
      contributionAddress = wallet as Address;
    }
    referralsAllocResult = refAlloc;
    _referralsUncappedResult = refUncapped;
  }

  const contractData = await readSaleContractMulticall(contributionAddress);

  const totalSaleContributions = Number(formatUnits(contractData.totalUncappedAllocations, 6));
  const totalUserInvestedUsdc = Number(formatUnits(contractData.uncappedAllocation, 6));
  const confirmedContribution = Number(formatUnits(contractData.allocation, 6));
  const returnedContribution = totalUserInvestedUsdc - confirmedContribution;
  const currentTokenPrice = calculateTokenPrice(totalSaleContributions);

  const individualCap =
    totalSaleContributions >= 2_000_000 ? Number(formatUnits(contractData.individualCap, 6)) : null;

  const confirmedIdosAllocation =
    currentTokenPrice > 0 ? confirmedContribution / currentTokenPrice : 0;

  const totalReferralsAllocations = Number(
    formatUnits(BigInt(referralsAllocResult.totalAllocationValue), 6),
  );
  const priceDiscount = calculatePriceDiscount(totalUserInvestedUsdc + totalReferralsAllocations);
  const airdropBonus = confirmedIdosAllocation * priceDiscount;
  const airdropPercentage = priceDiscount * 100;

  const maxTarget = Number(formatUnits(contractData.maxTarget, 6));
  const minTarget = Number(formatUnits(contractData.minTarget, 6));
  const investorCount = Number(contractData.investorCount);
  const totalConfirmedContributions = Math.min(totalSaleContributions, maxTarget);
  const percentageOfSupplyToBeSold = 0.025;
  const totalTokensForSale = Number(formatEther(contractData.totalTokensForSale));
  const fdv = (currentTokenPrice * totalTokensForSale) / percentageOfSupplyToBeSold;

  const capStatus: SaleData["capStatus"] =
    totalSaleContributions < minTarget
      ? "below"
      : totalSaleContributions <= maxTarget
        ? "within"
        : "above";

  const data: SaleData = {
    totalUserInvestedUsdc,
    confirmedContribution,
    returnedContribution,
    individualCap,
    confirmedIdosAllocation,
    airdropBonus,
    airdropPercentage,
    totalSaleContributions,
    currentTokenPrice,
    investorCount,
    maxTarget,
    minTarget,
    totalConfirmedContributions,
    fdv,
    capStatus,
  };

  return Response.json(data);
}
