import {
  Box,
  Button,
  Divider,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Heading,
  Input,
  InputGroup,
  InputRightElement,
  Select,
  VStack,
} from "@chakra-ui/react";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";

type RememberOption = "session" | "day" | "week";

export type PasswordFormValues = {
  password: string;
  remember: RememberOption;
};

type PasswordFormProps = {
  onSubmit: (values: PasswordFormValues) => void;
};

export function PasswordForm(props: PasswordFormProps) {
  const { t } = useTranslation();
  const [show, setShow] = useState(false);

  const {
    handleSubmit,
    register,
    formState: { errors },
  } = useForm<PasswordFormValues>({
    defaultValues: {
      remember: "session",
    },
  });

  const toggleShowPassword = () => {
    setShow(!show);
  };

  return (
    <Box>
      <Heading size="md">
        {t(
          "for-your-security-this-data-dashboard-forgets-your-password-please-enter-it-again-in-order-to-decrypt-and-see-your-data"
        )}
      </Heading>
      <Divider my={5} />
      <form onSubmit={handleSubmit(props.onSubmit)}>
        <VStack align="stretch" justify="start" maxW="container.sm" spacing={5}>
          <FormControl isInvalid={!!errors.password}>
            <FormLabel htmlFor="password">Password</FormLabel>
            <InputGroup>
              <Input
                pr="4.5rem"
                id="password"
                type={show ? "text" : "password"}
                {...register("password", { required: String(t("field-is-required")) })}
              />
              <InputRightElement w="4.5rem">
                <Button h="1.75rem" onClick={toggleShowPassword} size="sm">
                  {show ? t("hide") : t("show")}
                </Button>
              </InputRightElement>
            </InputGroup>
            <FormErrorMessage>{errors.password && errors.password.message}</FormErrorMessage>
          </FormControl>
          <FormControl isInvalid={!!errors.remember}>
            <FormLabel htmlFor="remember">{t("remember-password")}</FormLabel>
            <Select
              id="remember"
              placeholder="Select an option"
              {...register("remember", { required: String(t("field-is-required")) })}
            >
              <option value="session">{t("while-tab-is-open")}</option>
              <option value="day">{t("for-1-day")}</option>
              <option value="week">{t("for-1-week")}</option>
            </Select>
            <FormErrorMessage>{errors.remember && errors.remember.message}</FormErrorMessage>
          </FormControl>
          <Flex justify="end">
            <Button colorScheme="orange" type="submit" variant="outline">
              {t("save-password")}
            </Button>
          </Flex>
        </VStack>
      </form>
    </Box>
  );
}
