import { Button, PasswordInput, Select, Tabs } from "@mantine/core";
import { useInputState } from "@mantine/hooks";
import { Dispatch, SetStateAction, useRef, useState } from "react";

export const models = [
  { value: "gpt-3.5-turbo", label: "gpt-3.5-turbo" },
  { value: "gpt-3.5-turbo-0301", label: "gpt-3.5-turbo-0301" },
];

interface SettingsPageProps {
  currentModel: string;
  setCurrentModelModel: Dispatch<SetStateAction<string>>;
  tokens: string;
  setTokens: Dispatch<SetStateAction<string>>;
}

export function SettingsPage({
  currentModel,
  setCurrentModelModel,
  tokens,
  setTokens,
}: SettingsPageProps) {
  const apiKeysRef = useRef<HTMLInputElement>(null);
  const [inputToken, setInputToken] = useInputState(tokens);
  const [isLoading, setIsLoading] = useState(false);

  return (
    <Tabs.Panel value="settings" pt="xs">
      <PasswordInput
        placeholder="Please input API keys"
        label="API keys"
        description="OpenAI API 密钥，多个密钥之间请用英文半角逗号分隔"
        withAsterisk
        value={inputToken}
        onChange={setInputToken}
      />

      <Select
        mt="sm"
        placeholder="Please select Model"
        label="Model"
        description="OpenAI API 由具有不同功能和价位的多种模型提供支持"
        withAsterisk
        defaultValue={currentModel}
        data={models}
        onChange={(value) => {
          if (value) {
            setCurrentModelModel(value);
          }
        }}
        styles={(theme) => ({
          item: {
            // applies styles to selected item
            "&[data-selected]": {
              "&, &:hover": {
                backgroundColor:
                  theme.colorScheme === "dark"
                    ? theme.colors.teal[9]
                    : theme.colors.teal[1],
                color:
                  theme.colorScheme === "dark"
                    ? theme.white
                    : theme.colors.teal[9],
              },
            },

            // applies styles to hovered item (with mouse or keyboard)
            "&[data-hovered]": {},
          },
        })}
      />
      <Button
        mt="xl"
        fullWidth
        loading={isLoading}
        onClick={() => {
          setIsLoading(true);
          chrome.storage.local.set(
            {
              apiKeys: apiKeysRef.current?.value,
              currentModel,
            },
            () => {
              if (apiKeysRef.current?.value) {
                setTokens(apiKeysRef.current.value);
              }
              setCurrentModelModel(currentModel);
              setIsLoading(false);
            }
          );
        }}
      >
        Save
      </Button>
    </Tabs.Panel>
  );
}
