export interface CommandDetails {
  description: string;
  args: string[];
}
export const COMMAND_DETAILS: { [commandName: string]: CommandDetails } = {
  "run-command": {
    description: "Runs a command in a bash terminal",
    args: ["command"],
  },
};
