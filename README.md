# Nero - for personal finance

## Project structure

This project is a Next.js project with a Prisma postgress database.

The ORM used is Prisma with some zod-schema validation for the API.
The API-routes talk with the respective service layers that handle business logic. The zod schemas can be found in the /schemas folder.

## Features:


As a user you can login with a Google account. From there you need to create a Ledger to track all expenses and incomes. There are two types of financial transactions:

- Recurring: These are recurring expenses/incomes (Salary or Rent).
- Transactions: These are the variable expenses (Doing groceries or going to a festival).

## Run the project:

1. Get a postgress (Prisma) database and set the URL in the .env (see .env.example)
2. Create a google client in Google Cloud Console and get the ID and secret of the project (this is for auth).
3. Set all env vars
4. 'npm i'
5. 'npm run dev'

For migrations:

1. npx prisma migrate dev --name [name]

For backups:
npm run backup
