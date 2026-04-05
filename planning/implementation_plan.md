# Karoo Leeu Automation Project Implementation Plan

This plan formalizes the setup of the Booking.com extranet scraper using n8n + Puppeteer, along with the Google Cloud Function needed to process the information in Firestore.

## Status & Progress

> [!NOTE]
> All foundational files, Docker configurations, and scraper logic have been generated and committed to the `origin/master` repository.
> The local environment is fully configured: Node.js v20 (LTS), Java 21 JDK, and the Firebase CLI.

> [!IMPORTANT]
> The **Firebase Local Emulator** is currently running. This allows us to test the Cloud Function calculations and Firestore data storage locally (at `localhost:4000`) before deploying to the cloud.

> [!IMPORTANT]
> Since this scraper relies on Booking.com DOM structure (`admin.booking.com`), the selectors may occasionally break if Booking.com updates their Extranet interface.

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

## Resolved Questions

1. **GitHub Setup**: ~Resolved.~ The repository was verified to be connected to `origin/master` and all local changes have been committed and pushed.
2. **Cloud Functions Deployment**: ~Resolved.~ Node.js v20.20.2 was installed to fix environment corruption, and the Firebase CLI (`firebase-tools`) was successfully installed globally.

## Next Execution Steps

### 1. Integrate Scraper with Local Backend
- **Connect:** Open n8n at `http://localhost:5678`.
- **Configure:** In your n8n workflow, set your Firestore/Firebase node to target the **Local Emulator** (`localhost:8080`) instead of the production cloud project.
- **Import Scripts:** Copy the logic from `scraper/navigation.ts` and `scraper/extraction.ts` into a Puppeteer Code node.

### 2. Run Test Verification
- **Run:** Trigger the n8n workflow.
- **Verify Backend:** Check the Emulator UI at `http://localhost:4000` to confirm:
    1. The raw booking data was saved to Firestore.
    2. The Cloud Function automatically triggered.
    3. The `mot_net_amount` and `manager_commission` were correctly calculated and updated.

### 3. Production Deployment
- **Upgrade:** Ensure your Firebase Project is on the **Blaze** plan.
- **Deploy:** Run `firebase deploy --only functions`.
- **Sync n8n:** Update the n8n workflow to point to your live Firebase project ID.
