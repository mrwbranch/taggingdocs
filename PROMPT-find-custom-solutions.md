# How to Find Your Custom GTM/GA4 Solutions in Claude.ai

## The Problem
Your custom GTM/GA4 solutions (templates, dataLayer implementations, BigQuery queries, tracking scripts) live in old Claude.ai chat history, which can't be searched programmatically.

## Step-by-Step Recovery Process

### Step 1: Browse your Claude.ai chat history manually
Go to https://claude.ai and scroll through your conversation list. Look for chats with titles or topics related to:
- GTM custom templates
- DataLayer implementations
- BigQuery SQL queries for GA4
- Tracking scripts or recipes
- Consent mode implementations
- Ecommerce tracking
- Server-side GTM solutions
- Cookie management

### Step 2: Export/copy solutions you find
When you find a relevant chat, copy the custom code or solution into a text file. Save it to a folder on your computer — for example:
```
~/Documents/gtm-solutions/
  ├── custom-templates/
  ├── datalayer-implementations/
  ├── bigquery-queries/
  └── tracking-scripts/
```

### Step 3: Come back to Cowork with that folder
Once you've collected the solutions, start a new Cowork session, mount that folder, and use this prompt:

---

**Prompt to paste into a new Cowork session:**

```
I have a folder of custom GTM and GA4 solutions that I've built over time.
These include custom GTM templates, dataLayer implementations, BigQuery SQL
queries, and tracking scripts/recipes.

I also have a documentation site at [mount your taggingdocs folder].

Please:
1. Read through all the solutions in my gtm-solutions folder
2. Read through the existing articles in src/content/docs/
3. For each custom solution, determine whether it should become:
   - A new standalone article (if it covers a topic not yet in the docs)
   - An enhancement to an existing article (add as a code example or technique)
   - A new recipe in the recipes/ section
4. Create or update the articles accordingly, matching the existing .mdx style
5. Give me a summary of what was added
```

---

## Alternative: Quick Memory Dump
If you don't want to dig through old chats, you can also just describe from memory what custom solutions you've built. Start a Cowork session with the taggingdocs folder mounted and say something like:

"I've built these custom GTM/GA4 solutions over time: [describe them]. Please turn them into articles or enhance existing ones in my docs site."

Even rough descriptions are enough — Claude can flesh out the implementations.
