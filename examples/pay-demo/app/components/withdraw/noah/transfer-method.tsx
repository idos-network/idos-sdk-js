import { Globe, LandmarkIcon, Loader2Icon } from "lucide-react";
import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { useCheckout } from "~/contexts/checkout-context";
import { formatPaymentMethod } from "~/lib/payment-method";
import type { PaymentMethod } from "~/lib/types/noah";

function CountryFlag({ country }: { country: { flag?: string; name: string } }) {
  if (!country) {
    return null;
  }

  return (
    <div
      aria-label={`${country.name} flag`}
      className="flex h-full w-16 place-content-center items-center gap-4 rounded-lg bg-input/30 px-6 py-3"
      role="img"
    >
      {country.flag ? (
        <span aria-hidden="true" className="text-2xl">
          {country.flag}
        </span>
      ) : (
        <Globe aria-hidden="true" className="size-4" />
      )}
    </div>
  );
}

function TransferMethodSkeleton() {
  return (
    <div className="flex h-15 shrink-0 items-center gap-2">
      <div className="flex h-full flex-1 items-center gap-4 rounded-lg bg-input/30 px-6 py-3">
        <span className="text-sm">Loading payment method...</span>
      </div>
      <div className="flex h-full w-16 place-content-center items-center gap-4 rounded-lg bg-input/30 px-6 py-3">
        <Loader2Icon className="size-5 shrink-0 animate-spin" />
      </div>
    </div>
  );
}

export function TransferMethod() {
  const { token, country, paymentMethod, setPaymentMethod, setChannelId } = useCheckout();
  const [channels, setChannels] = useState<{
    Items: { ID: string; PaymentMethodType: PaymentMethod }[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!country || !token) return;

    const fetchChannels = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(
          `/app/noah/channels?${new URLSearchParams({
            countryCode: country.code,
            token:
              token === "USDC0"
                ? "USDC"
                : token === "USDT0"
                  ? "USDT"
                  : token === "POL"
                    ? "MATIC"
                    : token,
            fiatCurrency: country.currency,
          })}`,
        );
        if (response.ok) {
          const data = await response.json();
          setChannels(data);
        }
      } catch (error) {
        console.error("Error fetching channels:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchChannels();
  }, [country, token]);

  useEffect(() => {
    const channelsData = channels?.Items;
    if (channelsData && channelsData.length === 1) {
      const channel = channelsData[0];
      const paymentMethodType = channel.PaymentMethodType;
      if (paymentMethod !== paymentMethodType) {
        setPaymentMethod(paymentMethodType);
      }
      // Store the channel ID
      if (channel.ID) {
        setChannelId(channel.ID);
      }
    } else if (channelsData && channelsData.length > 1 && paymentMethod) {
      // When multiple channels exist and payment method is selected, find and store channel ID
      const selectedChannel = channelsData.find(
        (item: { PaymentMethodType: PaymentMethod }) => item.PaymentMethodType === paymentMethod,
      );
      if (selectedChannel?.ID) {
        setChannelId(selectedChannel.ID);
      }
    }
  }, [channels, paymentMethod, setPaymentMethod, setChannelId]);

  if (!(country && token)) {
    return null;
  }

  if (isLoading) {
    return <TransferMethodSkeleton />;
  }

  const channelsData = channels?.Items;
  if (!channelsData || channelsData.length === 0) {
    return null;
  }

  if (channelsData.length === 1) {
    const channel = channelsData[0];
    const paymentMethodType = channel.PaymentMethodType;

    return (
      <div className="flex h-15 shrink-0 items-center gap-2">
        <div className="flex h-full flex-1 items-center gap-4 rounded-lg bg-input/30 px-6 py-3">
          <LandmarkIcon aria-hidden="true" className="size-6" />
          <span className="font-semibold text-sm">{formatPaymentMethod(paymentMethodType)}</span>
        </div>
        <CountryFlag country={country} />
      </div>
    );
  }

  const paymentMethods = Array.from(
    new Set(
      channelsData.map((item: { PaymentMethodType: PaymentMethod }) => item.PaymentMethodType),
    ),
  );

  const handlePaymentMethodChange = (value: string) => {
    const selectedMethod = value as PaymentMethod;
    setPaymentMethod(selectedMethod);
    // Find and store the channel ID for the selected payment method
    const selectedChannel = channelsData.find(
      (item: { PaymentMethodType: PaymentMethod }) => item.PaymentMethodType === selectedMethod,
    );
    if (selectedChannel?.ID) {
      setChannelId(selectedChannel.ID);
    }
  };

  return (
    <div className="flex w-full shrink-0 items-center justify-center gap-2">
      <div className="flex flex-1 flex-col gap-2">
        <Select
          onValueChange={(value) => handlePaymentMethodChange(value as PaymentMethod)}
          value={paymentMethod || ""}
        >
          <SelectTrigger
            className="w-full rounded-lg border-none bg-input/30 pr-4 pl-6"
            id="payment-method"
            size="lg"
          >
            <SelectValue
              placeholder={<span className="text-foreground">Select payment method</span>}
            />
          </SelectTrigger>
          <SelectContent>
            {paymentMethods.map((method) => (
              <SelectItem key={method as string} value={method as string}>
                {formatPaymentMethod(method as PaymentMethod)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <CountryFlag country={country} />
    </div>
  );
}
