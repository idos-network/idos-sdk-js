import { Button, Flex, FormLabel, Input, VStack } from "@chakra-ui/react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { generateMnemonic } from "web-bip39";
import wordlist from "web-bip39/wordlists/english";

export function Bip39SeedGenerator() {
  const { t } = useTranslation();
  const [seed, setSeed] = useState<string>("");

  const onGenerateBip39Seed = async () => {
    const bipseed = await generateMnemonic(wordlist);
    setSeed(bipseed);
  };

  return (
    <form>
      <VStack align="stretch" mb={5}>
        <FormLabel>{t("enter-a-password-or-generate-a-bip39-seed")}</FormLabel>
        <Input onChange={(e) => setSeed(e.target.value)} value={seed} />
      </VStack>
      <Flex justify="end">
        <Button colorScheme="orange" onClick={onGenerateBip39Seed} type="button" variant="outline">
          {t("generate-bip39-seed")}
        </Button>
      </Flex>
    </form>
  );
}
