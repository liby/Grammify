import { Divider, Button } from "@mantine/core";

interface CheckButtonProps {
  inputValue: string;
  isLoading: boolean;
  handleCheck: (inputValue: string) => Promise<void>;
}

export function CheckButton({
  inputValue,
  isLoading,
  handleCheck,
}: CheckButtonProps) {
  return (
    <Divider
      my="xs"
      variant="dashed"
      labelPosition="center"
      label={
        <Button
          loading={isLoading}
          disabled={!inputValue || isLoading}
          onClick={() => handleCheck(inputValue)}
          compact
          variant="gradient"
          gradient={{ from: "#ed6ea0", to: "#ec8c69", deg: 35 }}
        >
          Check
        </Button>
      }
    />
  );
}
