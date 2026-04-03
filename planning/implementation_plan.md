# Karoo Leeu Automation Project Implementation Plan

This plan formalizes the setup of the Booking.com extranet scraper using n8n + Puppeteer, along with the Google Cloud Function needed to process the information in Firestore.

## User Review Required

> [!IMPORTANT]
> The GitHub CLI (`gh`) is not installed on your system. I have initialized a local git repository. Please create a new empty repository directly on GitHub and provide me with the clone URL (e.g., `https://github.com/your-username/repo-name.git`). I will then connect our local directory to it! Alternatively, you can let me know if you would like me to assist with installing the GitHub CLI.

> [!IMPORTANT]
> We will generate the foundational structure for n8n + Puppeteer and the Cloud Function. Since this scraper relies on Booking.com DOM structure (`admin.booking.com`), the selectors may occasionally break if Booking.com updates their Extranet interface.

## Proposed Changes

### Docker & n8n Environment

We will create a Docker Compose setup that spins up n8n with the necessary Puppeteer dependencies included in a custom Dockerfile.

#### [NEW] [docker-compose.yml](file:///c:/Users/Mouton/source/repos/karoo-leeu-workflow/docker-compose.yml)
- Defines the `n8n` service using a custom build.
- Binds local data volumes to persist scraping workflows and credentials.

#### [NEW] [Dockerfile](file:///c:/Users/Mouton/source/repos/karoo-leeu-workflow/Dockerfile)
- Extends the official n8n image.
- Installs Puppeteer dependencies (Chromium, required OS libs).
- Enables the n8n community node for Puppeteer.

### Scraping Scripts

#### [NEW] [scraper/navigation.ts](file:///c:/Users/Mouton/source/repos/karoo-leeu-workflow/scraper/navigation.ts)
- A TypeScript reference script demonstrating the required Puppeteer interactions to navigate the Booking.com UI.
- Implements: Inputting start date (1st of month), end date (30 days out), and clicking search.
- Waits for the `networkidle2` command ensuring search results have rendered.

#### [NEW] [scraper/extraction.ts](file:///c:/Users/Mouton/source/repos/karoo-leeu-workflow/scraper/extraction.ts)
- Implements the table scanning logic.
- Takes `targetResId` and traverses `.reservation-table__wrapper table tbody tr`.
- Extracts Guest Name, Gross Amount, and Platform Fee (Commission) upon row match.

***

### Cloud Function Backend

The Cloud Function will calculate final metrics based on raw numbers added to Firestore.

#### [NEW] [cloud-function/package.json](file:///c:/Users/Mouton/source/repos/karoo-leeu-workflow/cloud-function/package.json)
- Configures entry point, `firebase-functions`, `firebase-admin` dependencies, and TypeScript compilation scripts.

#### [NEW] [cloud-function/tsconfig.json](file:///c:/Users/Mouton/source/repos/karoo-leeu-workflow/cloud-function/tsconfig.json)
- TypeScript configuration for the Cloud Function.

#### [NEW] [cloud-function/src/index.ts](file:///c:/Users/Mouton/source/repos/karoo-leeu-workflow/cloud-function/src/index.ts)
- Triggers on `document.onCreate` or `onUpdate` for the `bookings/{bookingId}` path.
- Reads `financials.gross_amount` and `financials.platform_fee`.
- Calculates `mot_net_amount` (gross - platform_fee).
- Calculates `manager_commission` (15% of mot_net_amount).
- Updates the original document with the calculated fields in `financials`.

## Open Questions

1. **GitHub Setup**: Please send me the GitHub URL of your newly created repository (or ask me to install the `gh` command-line tool, or manually run the `git remote add origin` command).
2. **Cloud Functions Deployment**: Do you have the Firebase CLI installed, or will we walk through logging in and setting up the Firebase Project after we are done writing the code?

## Verification Plan

### Automated Tests
- Build and spin up `docker-compose up -d`.
- Connect to n8n at `localhost:5678` and verify the Puppeteer node operates via a test snippet.

### Manual Verification
- Deploy the Cloud Function to a Firebase project, push a dummy document simulating scraped data, and confirm it outputs the correct calculations.
