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
import { isError } from "#/types/types";
import { CheckButton } from "./check-button";
import { models, SettingsPage } from "./settings-page";
import { polish } from "#/utils/polish";

export function PopCard({ children }: PropsWithChildren) {
  const [inputValue, setInputValue] = useInputState("");
  const [currentModel, setCurrentModelModel] = useState(models[0].value);
  const [tokens, setTokens] = useState("");
  const [output, setOutput] = useState("");
  const [stream, setStream] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const converter = new showdown.Converter();

  const handleCheck = useCallback(
    async (inputValue: string) => {
      setIsLoading(true);
      setOutput("");
      const params = {
        prompt: inputValue,
        model: currentModel,
        apiKey: tokens,
      };
      try {
        if (stream) {
          await polish({
            ...params,
            stream: true,
            onMessage: (message) => {
              if (message.role) {
                return;
              }
              setOutput((output) => {
                return output + message.content;
              });
            },
            onFinish: (reason) => {
              if (reason !== "stop") {
                setErrorMessage(`Polishing failed：${reason}`);
              }
              setOutput((content) => {
                if (content.endsWith('"') || content.endsWith("」")) {
                  return content.slice(0, -1);
                }
                return content;
              });
            },
          });
        } else {
          await polish({
            ...params,
            stream: false,
            onMessage: (message) => {
              setOutput(message.content);
            },
          });
        }
      } catch (error) {
        if (isError(error)) {
          setErrorMessage(`${error.message}`);
        }
        setErrorMessage("Unknown Error");
      } finally {
        setIsLoading(false);
      }
    },
    [currentModel, stream, tokens]
  );

  useEffect(() => {
    chrome.storage?.sync.get(
      {
        apiKeys: "",
        currentModel: models[0].value,
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
