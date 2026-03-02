import { assign, fromPromise, setup } from "xstate";

export type QuoteProvider = "transak" | "noah" | "due";

export interface QuoteRequest {
  amountIn: number;
  currencyIn: string;
  currencyOut: string;
  accountId?: string; // Optional accountId for Due provider
}

export interface ProviderQuote {
  provider: QuoteProvider;
  rate: string;
  youReceive: string;
  fee: string;
}

interface QuotesContext {
  request: QuoteRequest | null;
  quotes: Record<QuoteProvider, ProviderQuote | null>;
  errors: Record<QuoteProvider, string | null>;
}

type FetchQuotesEvent = { type: "FETCH_QUOTES"; request: QuoteRequest };
type ResetQuotesEvent = { type: "RESET_QUOTES" };
type QuotesEvent = FetchQuotesEvent | ResetQuotesEvent;

const initialContext: QuotesContext = {
  request: null,
  quotes: { transak: null, noah: null, due: null },
  errors: { transak: null, noah: null, due: null },
};

async function fetchTransakQuote(request: QuoteRequest): Promise<ProviderQuote> {
  const response = await fetch(
    `/app/quotes/provider?provider=transak&sourceCurrency=${request.currencyIn}&destinationCurrency=${request.currencyOut}&amount=${request.amountIn}`,
  );

  if (!response.ok) {
    throw new Error("Failed to fetch Transak quote.");
  }

  const data = await response.json();
  const rate = Number.parseFloat(data.rate);
  const youReceive = (request.amountIn * rate).toFixed(2);
  const feePercent = ((1 - rate) * 100).toFixed(1);

  return {
    provider: "transak",
    rate: data.rate,
    youReceive,
    fee: `${feePercent}%`,
  };
}

async function fetchNoahQuote(request: QuoteRequest): Promise<ProviderQuote> {
  const response = await fetch(
    `/app/quotes/provider?provider=noah&sourceCurrency=${request.currencyIn}&destinationCurrency=${request.currencyOut}&amount=${request.amountIn}`,
  );

  if (!response.ok) {
    throw new Error("Failed to fetch Noah quote.");
  }

  const data = await response.json();
  const rate = Number.parseFloat(data.rate);
  const youReceive = (request.amountIn * rate).toFixed(2);
  const feePercent = ((1 - rate) * 100).toFixed(1);

  return {
    provider: "noah",
    rate: data.rate,
    youReceive,
    fee: `${feePercent}%`,
  };
}

async function fetchDueQuote(request: QuoteRequest): Promise<ProviderQuote> {
  if (!request.accountId) {
    throw new Error("accountId is required for Due quotes.");
  }

  const response = await fetch("/app/quotes/due", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      currencyIn: request.currencyIn,
      currencyOut: request.currencyOut,
      amountIn: request.amountIn,
      accountId: request.accountId,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "Failed to fetch Due quote." }));
    throw new Error(errorData.error || "Failed to fetch Due quote.");
  }

  const data = await response.json();
  const rate = Number.parseFloat(data.rate);
  const youReceive = request.amountIn
    ? (request.amountIn * rate).toFixed(2)
    : data.destination?.amount || "0";
  const feePercent = data.fee ? `${Number.parseFloat(data.fee) * 100}%` : "0%";

  return {
    provider: "due",
    rate: data.rate,
    youReceive,
    fee: feePercent,
  };
}

export const quoteMachine = setup({
  types: {
    context: {} as QuotesContext,
    events: {} as QuotesEvent,
  },
  actors: {
    fetchAllQuotes: fromPromise(async ({ input }: { input: { request: QuoteRequest } }) => {
      // Build array of quote promises
      const quotePromises: Promise<ProviderQuote>[] = [
        fetchTransakQuote(input.request),
        fetchNoahQuote(input.request),
      ];

      // Only fetch Due quote if accountId is provided
      if (input.request.accountId) {
        quotePromises.push(fetchDueQuote(input.request));
      }

      const results = await Promise.allSettled(quotePromises);
      const [transakResult, noahResult, dueResult] = results;

      return {
        transak:
          transakResult.status === "fulfilled"
            ? { quote: transakResult.value, error: null }
            : { quote: null, error: transakResult.reason?.message ?? "Transak quote failed" },
        noah:
          noahResult.status === "fulfilled"
            ? { quote: noahResult.value, error: null }
            : { quote: null, error: noahResult.reason?.message ?? "Noah quote failed" },
        due:
          dueResult && dueResult.status === "fulfilled"
            ? { quote: dueResult.value, error: null }
            : dueResult && dueResult.status === "rejected"
              ? { quote: null, error: dueResult.reason?.message ?? "Due quote failed" }
              : { quote: null, error: input.request.accountId ? "Due quote failed" : null },
      };
    }),
  },
  actions: {
    setRequest: assign(({ event }) => {
      if (event.type !== "FETCH_QUOTES") return {};
      return {
        request: event.request,
        quotes: { transak: null, noah: null, due: null },
        errors: { transak: null, noah: null, due: null },
      };
    }),

    setQuoteResults: assign(({ event }) => {
      const output =
        "output" in event && event.output && typeof event.output === "object"
          ? (event.output as {
              transak: { quote: ProviderQuote | null; error: string | null };
              noah: { quote: ProviderQuote | null; error: string | null };
              due: { quote: ProviderQuote | null; error: string | null };
            })
          : null;

      if (!output) return {};

      return {
        quotes: {
          transak: output.transak.quote,
          noah: output.noah.quote,
          due: output.due.quote,
        },
        errors: {
          transak: output.transak.error,
          noah: output.noah.error,
          due: output.due.error,
        },
      };
    }),

    setFetchError: assign(() => ({
      errors: {
        transak: "Failed to fetch quotes",
        noah: "Failed to fetch quotes",
        due: "Failed to fetch quotes",
      },
    })),

    resetQuotes: assign(() => ({ ...initialContext })),
  },
}).createMachine({
  id: "quotes",
  initial: "idle",
  context: initialContext,
  states: {
    idle: {
      on: {
        FETCH_QUOTES: {
          target: "fetching",
          actions: ["setRequest"],
        },
        RESET_QUOTES: {
          actions: ["resetQuotes"],
        },
      },
    },

    fetching: {
      invoke: {
        src: "fetchAllQuotes",
        input: ({ context }) => {
          if (!context.request) {
            throw new Error("Missing quote request.");
          }
          return { request: context.request };
        },
        onDone: {
          target: "success",
          actions: ["setQuoteResults"],
        },
        onError: {
          target: "error",
          actions: ["setFetchError"],
        },
      },
    },

    success: {
      on: {
        FETCH_QUOTES: {
          target: "fetching",
          actions: ["setRequest"],
        },
        RESET_QUOTES: {
          target: "idle",
          actions: ["resetQuotes"],
        },
      },
    },

    error: {
      on: {
        FETCH_QUOTES: {
          target: "fetching",
          actions: ["setRequest"],
        },
        RESET_QUOTES: {
          target: "idle",
          actions: ["resetQuotes"],
        },
      },
    },
  },
});
