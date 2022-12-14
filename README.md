# Arv

Arv

## How it works

1. You make a plain english request to Arv by typing a command like `arv "Create a new Next.js project"`
2. Arv generates a list of proposed commands:

```
Arv will:
- open a shell
- ...

Type "YES" to confirm, or ask to modify the plan.
```

3. You can either confirm or modify the proposed plan.

Arv is fully modular and extensible, so new abilities can be added.

Because the plan/apply is structured, security is greatly increased.

## Examples

- `arv "Create a new Next.js project"`
- `arv "Ask John on Slack to send the Twilio auth key"`
- `arv "Generate a 200-word product description of a taco and save it to Desktop/product-description.txt"`
