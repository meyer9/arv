import dotenv from "dotenv";
dotenv.config();

import { Command } from "commander";
import fs from "fs";
import fetch from "node-fetch";
import chalk from "chalk";
import {
  FullResponse,
  generateUsage,
  parseResponse,
  SubStep,
} from "./schema.mjs";
import { COMMAND_DETAILS } from "./commands.mjs";

const program = new Command();
const DEBUG = process.env.DEBUG === "true";

async function fetchCompleteions(prompt: string) {
  const response = await fetch(
    "https://api.textsynth.com/v1/engines/gptj_6B/completions",
    {
      headers: {
        Authorization: `Bearer ${process.env.TEXTSYNTH_API_KEY}`,
      },
      method: "POST",
      body: JSON.stringify({
        prompt,
        max_tokens: 512,
        stop: "</response>",
      }),
    }
  );

  const responseData = (await response.json()) as any;

  if (DEBUG) console.log("\n\n", chalk.white(responseData.text));

  return responseData.text as string;
}

async function generateValidPlan(message: string, maxAttempts = 5) {
  let attempts = 0;
  let outputResponse = null;

  const prompt = `${fs
    .readFileSync("prompts/action-prologue.txt")
    .toString("utf-8")
    .replace("{{USAGE}}", generateUsage(COMMAND_DETAILS))}

<request>
${message}
</request>

<response>`;

  if (DEBUG) console.log(chalk.gray(prompt));

  while (attempts < maxAttempts) {
    let response = await fetchCompleteions(prompt);

    try {
      const possibleResponse = JSON.parse(response);
      const parsedResponse = parseResponse(possibleResponse);
      if (parsedResponse.data) {
        outputResponse = parsedResponse.data;
        break;
      }
      console.log(chalk.red(parsedResponse.error));
      attempts++;
    } catch (e) {
      console.log(chalk.red(e));
      attempts++;
    }
  }

  if (outputResponse === null) {
    throw new Error("Could not generate a valid plan");
  }

  return outputResponse;
}

const generateFullPlan = async (message: string): Promise<FullResponse> => {
  console.log(chalk.green("Generating plan..."));
  const response = await generateValidPlan(message);

  return response;
};

program
  .name("arv")
  .version(process.env.NPM_VERSION ?? "")
  .description("arv is an AI-powered task runner")
  .argument("<message>", "Message to pass to arv")
  .parse(process.argv);

const [message] = program.args;

const response = await generateFullPlan(message);

console.log(
  chalk.green(`Successfully generated plan for: `),
  chalk.bold.white(message),
  "\n"
);

console.log(chalk.gray(response.description));

for (let stepIdx = 0; stepIdx < response.steps.length; stepIdx++) {
  const { type, ...args } = response.steps[stepIdx];
  console.log(
    chalk.gray(`  ${stepIdx + 1}. `),
    chalk.yellow(type),
    chalk.white(
      Object.entries(args)
        .map(([key, value]) => `${key}: ${value}`)
        .join(", ")
    )
  );
}
