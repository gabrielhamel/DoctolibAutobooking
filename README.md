# Doctolib autobooking

This bot will refresh Doctolib to find an available vaccination slot for people under 50's.
After the program will try to book the slot for yourself.
He will notify you via Discord

It only work in France

## Installation
```bash
npm i
```

## Configuration

This program requires a `discord bot` and a `Doctolib account` verified.

> You need absolutely share a server with your bot (for sending private messages)

Fill environment variables in a `.env` file. A template named `.env.sample` can be found.

**Example:**
```bash
DISCORD_BOT_TOKEN=23456787654 # Retrieve on Discord developper plaform
DISCORD_USER_ID=23456788654 # Get him on Discord with developper parameters
DOCTOLIB_USER=account@gmail.com # Email or Phone number
DOCTOLIB_PASSWORD=strongPassword # Your Doctolib password
VACCINATION_CITY=Paris # Your vaccination ciy wanted
```

## Run
```bash
npm src/index.js
```
