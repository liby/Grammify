import { Card, Text, Textarea, Skeleton, Alert, Tabs } from "@mantine/core";
import { TypographyStylesProvider } from "@mantine/core";
import showdown from "showdown";
import {
  Children,
  PropsWithChildren,
  useCallback,
  useEffect,
  useState,
} from "react";
import { useInputState } from "@mantine/hooks";
import { IconAlertCircle, IconChecks, IconSettings } from "@tabler/icons-react";
import { CompletionResponse, isError } from "#/types/types";
import { CheckButton } from "./check-button";
import { models, SettingsPage } from "./settings-page";

export function PopCard({ children }: PropsWithChildren) {
  const [inputValue, setInputValue] = useInputState("");
  const [currentModel, setCurrentModelModel] = useState(models[0].value);
  const [tokens, setTokens] = useState("");
  const [output, setOutput] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const converter = new showdown.Converter();

  const handleCheck = useCallback(
    async (inputValue: string) => {
      setIsLoading(true);
      try {
        const body = {
          model: currentModel,
          temperature: 0,
          max_tokens: 1000,
          top_p: 1,
          frequency_penalty: 1,
          presence_penalty: 1,
          messages: [
            {
              role: "system",
              // Inspired by https://github.com/yetone/bob-plugin-openai-polisher/blob/c2c371c141b3eed601e3b8375171c2f239d36fc9/src/main.js#L19
              content:
                "Revise the following sentences to make them more clear, concise, and coherent. Please note that you need to list the changes and briefly explain why",
            },
            {
              role: "user",
              content: inputValue,
            },
          ],
        };

        const apiKeys = tokens.split(",").map((key) => key.trim());
        const apiKey = apiKeys[Math.floor(Math.random() * apiKeys.length)];

        if (!apiKey && !process.env.NEXT_PUBLIC_OPEN_AI_TOKEN) {
          setErrorMessage("请先设置 API Keys");
          return;
        }

        const response = await fetch(
          "https://api.openai.com/v1/chat/completions",
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${
                apiKey || process.env.NEXT_PUBLIC_OPEN_AI_TOKEN
              }`,
            },
            method: "POST",
            body: JSON.stringify(body),
          }
        );
        const result: CompletionResponse = await response.json();

        if (result.error) {
          setErrorMessage(
            result.error.message
              ? `${result.error.type}: ${result.error.message}`
              : "Unknown Error"
          );
          return;
        }
        setOutput(result.choices[0].message.content);
      } catch (error) {
        if (isError(error)) {
          setErrorMessage(`${error.type}: ${error.message}`);
        }
        setErrorMessage("Unknown Error");
      } finally {
        setIsLoading(false);
      }
    },
    [currentModel, tokens]
  );

  useEffect(() => {
    chrome.storage?.local.get(
      {
        apiKeys: "",
        currentModel: "",
      },
      (result) => {
        if (result.apiKeys) {
          setTokens(result.apiKeys);
        }
        if (result.currentModel) {
          setCurrentModelModel(result.currentModel);
        }
      }
    );
  }, []);

  return (
    <Card radius={0}>
      <Tabs defaultValue="check">
        {children}
        <Tabs.Panel value="check" pt="xs">
          {tokens || process.env.NEXT_PUBLIC_OPEN_AI_TOKEN ? (
            <>
              <Textarea
                radius={0}
                mt={20}
                minRows={6}
                value={inputValue}
                onChange={setInputValue}
              />
              <Card.Section>
                <CheckButton
                  handleCheck={handleCheck}
                  inputValue={inputValue}
                  isLoading={isLoading}
                />
              </Card.Section>

              {errorMessage ? (
                <Alert
                  icon={<IconAlertCircle size="1rem" />}
                  title="Bummer!"
                  color="red"
                >
                  {errorMessage}
                </Alert>
              ) : (
                <Skeleton visible={isLoading}>
                  <TypographyStylesProvider>
                    <div
                      dangerouslySetInnerHTML={{
                        __html: converter.makeHtml(output),
                      }}
                    />
                  </TypographyStylesProvider>
                </Skeleton>
              )}
            </>
          ) : (
            <Alert
              icon={<IconAlertCircle size="1rem" />}
              title="ちょっと待って!"
              color="red"
              variant="filled"
            >
              <Text>记得先在设置里填写 API Keys 喔！</Text>
            </Alert>
          )}
        </Tabs.Panel>
        <SettingsPage
          currentModel={currentModel}
          setCurrentModelModel={setCurrentModelModel}
          tokens={tokens}
          setTokens={setTokens}
        />
      </Tabs>
    </Card>
  );
}
