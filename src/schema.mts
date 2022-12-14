// create-file <file: string> <contents: string>
// Creates a file

import { CommandDetails, COMMAND_DETAILS } from "./commands.mjs";

// run-command <command: string>
// Runs a command in a bash terminal

// send-message <to: string> <message: string>
// Sends a Slack message to the specified recipient

const getArrayParserForArgs = <KeyName extends string>(
  commandName: string,
  argNames: KeyName[]
): ((args: string[]) => Result<{ [k in KeyName]: string }>) => {
  return (args: string[]): Result<{ [k in KeyName]: string }> => {
    if (args.length !== argNames.length) {
      return {
        error: `${commandName}: Expected ${argNames.length} arguments, got ${args.length}`,
      };
    }

    const result: { [k in KeyName]: string } = {} as any;
    for (let i = 0; i < argNames.length; i++) {
      result[argNames[i]] = args[i];
    }

    return { data: result };
  };
};

interface Step {
  type: string;
  [argName: string]: string;
}

interface ValidatedResponse {
  description: string;
  steps: Step[];
}

export type SubStep = {
  type: "sub-steps";
  steps: FullResponse;
};

export interface FullResponse {
  description: string;
  steps: (Step | SubStep)[];
}

type Result<T> =
  | {
      data: T;
      error?: undefined;
    }
  | {
      error: string;
      data?: undefined;
    };

export const generateUsage = (commands: {
  [commandName: string]: CommandDetails;
}): string => {
  let usage = [];

  for (const [commandName, command] of Object.entries(commands)) {
    usage.push(
      JSON.stringify(
        {
          name: commandName,
          description: command.description,
          args: command.args,
        },
        null,
        2
      )
    );
  }

  return usage.join("\n\n");
};

const parseStep = (step: string[]): Result<Step> => {
  if (!Array.isArray(step)) {
    return { error: "Step must be an array" };
  }

  const commandName = step[0];

  if (typeof commandName !== "string") {
    return { error: "Command name must be a string" };
  }

  const commandArgs = step.slice(1);

  if (!(commandName in COMMAND_DETAILS)) {
    return { error: `Unknown command: ${commandName}` };
  }

  const commandParser = getArrayParserForArgs(
    commandName,
    COMMAND_DETAILS[commandName].args
  );

  const commandRes = commandParser(commandArgs);

  if (!commandRes.data) {
    return { error: commandRes.error };
  }

  return {
    data: {
      type: commandName,
      ...commandRes.data,
    } as Step,
  };
};

export const parseResponse = (response: unknown): Result<ValidatedResponse> => {
  if (typeof response !== "object" || response === null) {
    return { error: "Response is not an object" };
  }

  const { description, steps } = response as any;

  if (typeof description !== "string") {
    return { error: "description must be a string" };
  }

  if (!Array.isArray(steps)) {
    return { error: "steps is not an array" };
  }

  const validatedResponse: ValidatedResponse = {
    description,
    steps: [],
  };
  for (const step of steps) {
    const stepRes = parseStep(step);

    if (!stepRes.data) {
      return { error: stepRes.error };
    }

    validatedResponse.steps.push(stepRes.data);
  }

  return { data: validatedResponse };
};
