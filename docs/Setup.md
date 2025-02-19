# Overview

This document provides insight into fine-tuning the CRDC Submission Portal project.

## React Environment Variables

The provided [.env.example](./.env.example) file contains the environment variables used by the React app. To use these variables, create a `.env` file in the root of the project and copy the contents of `.env.example` into it.

An explanation of each variable is provided below.

> [!Warning]
> After modifying the .env file, you must completely restart the React app for the changes to take effect.

### Required Variables

| Variable | Description |
| --- | --- |
| REACT_APP_NIH_AUTHORIZE_URL | The URL for the NIH authorization endpoint. |
| REACT_APP_NIH_CLIENT_ID | The unique CLIENT_ID for the NIH SSO application. |
| REACT_APP_NIH_REDIRECT_URL | The URL that NIH SSO should redirect back to. Usually `http://localhost:4010` for local development |
| REACT_APP_BACKEND_API | The GraphQL API endpoint for the app to use. |
| REACT_APP_DEV_TIER | The current tier where the app is running. e.g. `dev2` |
| REACT_APP_UPLOADER_CLI_VERSION | The raw version number from the uploader CLI. e.g. `3.2.1-dev1` |
| REACT_APP_UPLOADER_CLI | The fully-qualified URL to the Uploader CLI GitHub release. |
| REACT_APP_UPLOADER_CLI_WINDOWS | See above – Windows Binary |
| REACT_APP_UPLOADER_CLI_MAC_X64 | See above – Mac Intel Binary |
| REACT_APP_UPLOADER_CLI_MAC_ARM | See above – Mac ARM Binary |
| REACT_APP_HIDDEN_MODELS | A comma separated list of Data Models that should be hidden from the UI. |
| REACT_APP_FE_VERSION | The current frontend build tag |

### Optional Variables

| Variable | Description |
| --- | --- |
| PORT | The default port to run the DEV server (usually `3010`) |
| BROWSER | Whether the DEV server should open the browser. (boolean) |
| DEBUG_PRINT_LIMIT | The Jest debug CLI output limit. |
